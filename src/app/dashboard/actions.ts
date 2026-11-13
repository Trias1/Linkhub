"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDashboardContext, needsMfaCode } from "@/lib/active-linktree";
import { createClient } from "@/lib/supabase/server";
import { priceDigits } from "@/lib/rupiah";
import { detectPlatform, isCommercePlatform, platformLabel } from "@/lib/commerce-platforms";
import { extractLink, linkPlatform } from "@/lib/link-platform";
import { normalizeSlug, slugProblem } from "@/lib/slug";
import { isUuid, rateLimit } from "@/lib/security";
import { downloadProductImage, readProductDetails, type LookupFailure, type ProductDetails } from "@/lib/product-details";
import { parseCsv } from "@/lib/csv";
import { isShopeeHost, shopeeConfigured, shopeeShortLink } from "@/lib/shopee-affiliate";

async function authenticatedClient() {
  return getDashboardContext();
}

function validUrl(value: FormDataEntryValue | null) {
  const url = new URL(String(value ?? ""));
  if (!["http:", "https:", "mailto:"].includes(url.protocol)) throw new Error("Invalid URL");
  return url.toString();
}



// Jenis file ditentukan dari isi (magic bytes), bukan dari File.type yang dikirim browser.
function imageType(bytes: Uint8Array) {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { type: "image/jpeg", extension: "jpg" };
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return { type: "image/png", extension: "png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { type: "image/webp", extension: "webp" };
  return null;
}

async function uploadProductImage(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return null;
  const image = value.size <= 5 * 1024 * 1024 ? imageType(new Uint8Array(await value.slice(0, 12).arrayBuffer())) : null;
  if (!image) redirect("/dashboard/shops?error=Image must be JPG, PNG or WebP, up to 5 MB");
  const path = `${userId}/${crypto.randomUUID()}.${image.extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, value, { contentType: image.type, upsert: false });
  if (error) redirect(`/dashboard/shops?error=${encodeURIComponent("Image upload failed. Please try again.")}`);
  return { path, url: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl };
}
// Foto dari link produk (diisi otomatis): diunduh dari CDN marketplace lalu disimpan di storage kita.
// Kalau gagal, produk tetap tersimpan tanpa foto.
async function importProductImage(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return null;
  const bytes = await downloadProductImage(value);
  const image = bytes ? imageType(bytes.slice(0, 12)) : null;
  if (!bytes || !image) return null;
  const path = `${userId}/${crypto.randomUUID()}.${image.extension}`;
  const { error } = await supabase.storage.from("product-images").upload(path, bytes, { contentType: image.type, upsert: false });
  return error ? null : { path, url: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl };
}

// Isi form produk dari link marketplace (nama, harga, harga coret, foto).
export async function fetchProductDetails(url: string): Promise<{ details: ProductDetails | null; error?: string }> {
  await authenticatedClient();
  if (!(await rateLimit("product-details", 20, 300))) return { details: null, error: "Too many lookups. Wait a few minutes, or fill the details in by hand." };
  const result = await readProductDetails(String(url).slice(0, 2048)).catch((): LookupFailure => "unreachable");
  if (typeof result !== "string") return { details: result };
  const reasons: Record<LookupFailure, string> = {
    unsupported: "Auto-fill does not work for this link. Fill the details in by hand.",
    blocked: "The store asked for a security check, so LinkHub could not read this page. Try again in a minute, or fill the details in by hand.",
    unreachable: "Could not reach the store. Try again, or fill the details in by hand.",
    "no-data": "Could not find product details on this page. Fill them in by hand.",
  };
  return { details: null, error: reasons[result] };
}

// Posisi item baru = posisi tertinggi + 1 (bukan jumlah item: setelah ada yang dihapus, jumlah bisa kembar).
async function nextPosition(supabase: Awaited<ReturnType<typeof createClient>>, table: "links" | "link_collections" | "shop_collections" | "products", column: "linktree_id" | "collection_id", value: string) {
  const { data } = await supabase.from(table).select("position").eq(column, value).order("position", { ascending: false }).limit(1).maybeSingle();
  return (data?.position ?? -1) + 1;
}

// Pesan database mentah tidak ditampilkan ke user.
function friendlyError(error: { code?: string; message: string }) {
  if (error.code === "23505") return "That is already taken. Try another page address.";
  if (error.code === "42501") return "You do not have access to change this.";
  if (error.code === "PGRST204" || error.code === "42703") return "The database is not up to date. Run the latest SQL file in Supabase.";
  if (error.code === "23514") return "Invalid input. Check the text length or link format.";
  return "Could not save. Please try again shortly.";
}

function validColor(value: FormDataEntryValue | null) {
  const color = String(value ?? "").toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(color)) redirect("/dashboard/design?error=Invalid colour");
  return color;
}

export async function saveAccount(formData: FormData) {
  const { supabase, user, linktree } = await authenticatedClient();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const slugError = slugProblem(slug);
  if (slugError) redirect(`/dashboard/account?error=${encodeURIComponent(slugError)}`);
  // Foto: hanya https, disimpan dalam bentuk yang sudah dinormalisasi (tidak ada spasi/tanda kurung mentah).
  const rawPhoto = String(formData.get("avatar_url") ?? "").trim();
  let photo = "";
  if (rawPhoto) {
    try { const url = new URL(rawPhoto); if (url.protocol !== "https:" || url.href.length > 1000) throw new Error(); photo = url.href; }
    catch { redirect("/dashboard/account?error=Photo URL must be a full https:// link"); }
  }
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const { error } = await supabase.from("linktrees").update({ name, slug, avatar_url: photo || null }).eq("id", linktree.id).eq("owner_id", user.id);
  // Satu nama halaman: judul di halaman publik (Design) ikut nama ini.
  if (!error && name) await supabase.from("linktree_headers").upsert({ linktree_id: linktree.id, title: name });
  if (error) redirect(`/dashboard/account?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/${slug}`);
  redirect("/dashboard/account?message=Profile saved");
}

function linkUrl(value: FormDataEntryValue | null) {
  try { return validUrl(extractLink(String(value ?? ""))); } catch { redirect("/dashboard/links?error=Enter a full link, e.g. https://github.com/name, or an email address"); }
}

export async function addLink(formData: FormData) {
  const { supabase, user, linktree } = await authenticatedClient();
  const collectionId = String(formData.get("collection_id") ?? "") || null;
  if (collectionId) {
    const { data: collection } = isUuid(collectionId) ? await supabase.from("link_collections").select("id").eq("id", collectionId).eq("linktree_id", linktree.id).maybeSingle() : { data: null };
    if (!collection) redirect("/dashboard/links?error=Invalid group");
  }
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  if (!title) redirect("/dashboard/links?error=Give the link a title");
  const url = linkUrl(formData.get("url"));
  const position = await nextPosition(supabase, "links", "linktree_id", linktree.id);
  const { error } = await supabase.from("links").insert({ user_id: user.id, linktree_id: linktree.id, collection_id: collectionId, title, url, platform: linkPlatform(url), position });
  if (error) redirect(`/dashboard/links?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/dashboard/links");
  redirect("/dashboard/links?message=Link added");
}

export async function updateLink(formData: FormData) {
  const { supabase, linktree } = await authenticatedClient();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  if (!isUuid(id) || !title) redirect("/dashboard/links?error=Give the link a title");
  const url = linkUrl(formData.get("url"));
  const { error } = await supabase.from("links").update({ title, url, platform: linkPlatform(url) }).eq("id", id).eq("linktree_id", linktree.id);
  if (error) redirect(`/dashboard/links?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/dashboard/links");
  redirect("/dashboard/links?message=Link saved");
}

export async function setLinkActive(id: string, active: boolean) {
  const { supabase, linktree } = await authenticatedClient();
  if (!isUuid(id)) return;
  await supabase.from("links").update({ is_active: active }).eq("id", id).eq("linktree_id", linktree.id);
  revalidatePath("/dashboard/links");
}

// Naik/turun satu langkah di dalam grupnya (atau di antara link tanpa grup).
export async function moveLink(id: string, direction: -1 | 1) {
  const { supabase, linktree } = await authenticatedClient();
  if (!isUuid(id)) return;
  const { data: link } = await supabase.from("links").select("collection_id").eq("id", id).eq("linktree_id", linktree.id).maybeSingle();
  if (!link) return;
  const siblings = supabase.from("links").select("id").eq("linktree_id", linktree.id);
  const { data } = await (link.collection_id ? siblings.eq("collection_id", link.collection_id) : siblings.is("collection_id", null)).order("position").order("created_at");
  const order = (data ?? []).map((item) => item.id);
  const from = order.indexOf(id); const to = from + direction;
  if (from < 0 || to < 0 || to >= order.length) return;
  [order[from], order[to]] = [order[to], order[from]];
  await Promise.all(order.map((itemId, position) => supabase.from("links").update({ position }).eq("id", itemId).eq("linktree_id", linktree.id)));
  revalidatePath("/dashboard/links");
}

export async function deleteLink(formData: FormData) {
  const { supabase, linktree } = await authenticatedClient();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return;
  await supabase.from("links").delete().eq("id", id).eq("linktree_id", linktree.id);
  revalidatePath("/dashboard/links");
  redirect("/dashboard/links?message=Link deleted");
}
export async function addCollection() {
  const { supabase, user, linktree } = await authenticatedClient();
  const position = await nextPosition(supabase, "link_collections", "linktree_id", linktree.id);
  const { error } = await supabase.from("link_collections").insert({ user_id: user.id, linktree_id: linktree.id, title: "New group", position });
  if (error) redirect(`/dashboard/links?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/dashboard/links");
  redirect("/dashboard/links?message=Group added. Rename it below.");
}

export async function updateCollection(formData: FormData) {
  const { supabase, linktree } = await authenticatedClient();
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  if (!title) redirect("/dashboard/links?error=Group name is required");
  const { error } = await supabase.from("link_collections").update({ title }).eq("id", String(formData.get("id") ?? "")).eq("linktree_id", linktree.id);
  if (error) redirect(`/dashboard/links?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/dashboard/links");
}

export async function deleteCollection(formData: FormData) {
  const { supabase, linktree } = await authenticatedClient();
  await supabase.from("link_collections").delete().eq("id", String(formData.get("id") ?? "")).eq("linktree_id", linktree.id);
  revalidatePath("/dashboard/links");
}

export async function reorderCollections(ids: string[]) {
  const { supabase, linktree } = await authenticatedClient();
  await Promise.all(ids.map((id, position) => supabase.from("link_collections").update({ position }).eq("id", id).eq("linktree_id", linktree.id)));
  revalidatePath("/dashboard/links");
}
export async function addShopCollection() {
  const { supabase, user, linktree } = await authenticatedClient();
  const position = await nextPosition(supabase, "shop_collections", "linktree_id", linktree.id);
  const { error } = await supabase.from("shop_collections").insert({ user_id: user.id, linktree_id: linktree.id, title: "My Products", position });
  if (error) redirect(`/dashboard/shops?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/dashboard/shops");
  redirect("/dashboard/shops");
}

export async function updateShopCollection(formData: FormData) {
  const { supabase, linktree } = await authenticatedClient();
  const title = String(formData.get("title") ?? "").trim().slice(0, 80);
  if (!title) redirect("/dashboard/shops?error=Category name is required");
  const { error } = await supabase.from("shop_collections").update({ title }).eq("id", String(formData.get("id") ?? "")).eq("linktree_id", linktree.id);
  if (error) redirect(`/dashboard/shops?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/dashboard/shops");
}

export async function deleteShopCollection(formData: FormData) {
  const { supabase, linktree } = await authenticatedClient();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return;
  // Produknya ikut terhapus (cascade); fotonya harus dihapus sendiri dari storage.
  const { data: products } = await supabase.from("products").select("image_path").eq("collection_id", id).eq("linktree_id", linktree.id);
  const { error } = await supabase.from("shop_collections").delete().eq("id", id).eq("linktree_id", linktree.id);
  const paths = (products ?? []).map((item) => item.image_path).filter((path): path is string => Boolean(path));
  if (!error && paths.length) await supabase.storage.from("product-images").remove(paths);
  revalidatePath("/dashboard/shops");
}

// Kategori naik/turun satu langkah; urutan ini juga dipakai di halaman publik.
export async function moveShopCollection(id: string, direction: -1 | 1) {
  const { supabase, linktree } = await authenticatedClient();
  if (!isUuid(id)) return;
  const { data: rows } = await supabase.from("shop_collections").select("id").eq("linktree_id", linktree.id).order("position").order("created_at");
  const order = (rows ?? []).map((item) => item.id);
  const from = order.indexOf(id); const to = from + direction;
  if (from < 0 || to < 0 || to >= order.length) return;
  [order[from], order[to]] = [order[to], order[from]];
  await Promise.all(order.map((itemId, position) => supabase.from("shop_collections").update({ position }).eq("id", itemId).eq("linktree_id", linktree.id)));
  revalidatePath("/dashboard/shops");
}

// Tanggal dari <input type="date"> dihitung dalam WIB: tayang mulai 00:00, berakhir setelah 23:59 hari itu.
function wibDate(value: FormDataEntryValue | null, endOfDay = false) {
  const text = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString();
}

function productFields(formData: FormData) {
  let url = "";
  try { url = validUrl(extractLink(String(formData.get("url") ?? ""))); } catch { redirect("/dashboard/shops?error=Enter a product link that starts with https://"); }
  const chosen = String(formData.get("platform") ?? "auto");
  const platform = chosen === "auto" ? detectPlatform(url) : chosen === "website" || isCommercePlatform(chosen) ? chosen : "website";
  const startsAt = wibDate(formData.get("starts_at"));
  const endsAt = wibDate(formData.get("ends_at"), true);
  if (startsAt && endsAt && endsAt <= startsAt) redirect("/dashboard/shops?error=End date must be after the start date");
  const title = String(formData.get("title") ?? "").trim().slice(0, 100);
  if (!title) redirect("/dashboard/shops?error=Product name is required");
  const note = String(formData.get("note") ?? "").replace(/\s+/g, " ").trim().slice(0, 140);
  return { platform, title, url, note, price: priceDigits(String(formData.get("price") ?? "")), compare_price: priceDigits(String(formData.get("compare_price") ?? "")), is_featured: formData.get("is_featured") === "on", starts_at: startsAt, ends_at: endsAt };
}

async function ownedShopCollection(supabase: Awaited<ReturnType<typeof createClient>>, linktreeId: string, value: FormDataEntryValue | null) {
  const id = String(value ?? "");
  const { data } = isUuid(id) ? await supabase.from("shop_collections").select("id").eq("id", id).eq("linktree_id", linktreeId).maybeSingle() : { data: null };
  if (!data) redirect("/dashboard/shops?error=Invalid category");
  return data.id;
}

export async function addProduct(formData: FormData) {
  const { supabase, user, linktree } = await authenticatedClient();
  const collectionId = await ownedShopCollection(supabase, linktree.id, formData.get("collection_id"));
  const fields = productFields(formData);
  const image = (await uploadProductImage(supabase, user.id, formData.get("image"))) ?? (await importProductImage(supabase, user.id, formData.get("image_source")));
  const position = await nextPosition(supabase, "products", "collection_id", collectionId);
  const { error } = await supabase.from("products").insert({ user_id: user.id, linktree_id: linktree.id, collection_id: collectionId, ...fields, image_path: image?.path ?? null, image_url: image?.url ?? null, position });
  if (error) {
    if (image) await supabase.storage.from("product-images").remove([image.path]);
    redirect(`/dashboard/shops?error=${encodeURIComponent(friendlyError(error))}`);
  }
  revalidatePath("/dashboard/shops");
  redirect("/dashboard/shops?message=Product added");
}

// Beberapa link sekaligus (satu per baris) -> draf produk tersembunyi; nama dan foto diisi dari link kalau bisa.
// Ubah link Shopee biasa jadi link affiliate milik akun Shopee Affiliate yang kredensialnya ada di env.
// Hanya untuk admin (pemilik kredensial), supaya komisi tidak tercatat atas nama orang lain.
export async function shopeeAffiliateLink(link: string): Promise<{ link: string | null; error?: string }> {
  const { supabase, user } = await authenticatedClient();
  const { data: account } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!account?.is_admin || !shopeeConfigured()) return { link: null, error: "Affiliate links are not available for this account." };
  let url: URL;
  try { url = new URL(extractLink(String(link).slice(0, 2048))); } catch { return { link: null, error: "Paste a Shopee product link first." }; }
  if (url.protocol !== "https:" || !isShopeeHost(url.hostname)) return { link: null, error: "This only works for Shopee links." };
  if (!(await rateLimit("shopee-link", 30, 300))) return { link: null, error: "Too many requests. Wait a few minutes." };
  const short = await shopeeShortLink(url.toString()).catch(() => null);
  return short ? { link: short } : { link: null, error: "Shopee did not return an affiliate link. Check the App ID and Secret, or try again." };
}

export async function addProductsBulk(formData: FormData) {
  const { supabase, user, linktree } = await authenticatedClient();
  const collectionId = await ownedShopCollection(supabase, linktree.id, formData.get("collection_id"));
  const links = [...new Set(String(formData.get("links") ?? "").slice(0, 20000).split(/\s+/).map((value) => extractLink(value)).filter((value) => /^https:\/\/\S+$/.test(value) && value.length <= 2048))].slice(0, 10);
  if (!links.length) redirect("/dashboard/shops?error=Paste at least one product link that starts with https://");
  if (!(await rateLimit("product-bulk", 5, 600))) redirect("/dashboard/shops?error=Too many bulk adds. Wait a few minutes and try again.");
  const results: { url: string; details: ProductDetails | null }[] = [];
  for (let index = 0; index < links.length; index += 3) {
    results.push(...await Promise.all(links.slice(index, index + 3).map(async (url) => {
      const found = await readProductDetails(url).catch((): LookupFailure => "unreachable");
      return { url, details: typeof found === "string" ? null : found };
    })));
  }
  let position = await nextPosition(supabase, "products", "collection_id", collectionId);
  let added = 0; let filled = 0;
  for (const { url, details } of results) {
    const platform = detectPlatform(url);
    const image = details?.image ? await importProductImage(supabase, user.id, details.image) : null;
    const title = (details?.title || `${isCommercePlatform(platform) ? platformLabel(platform) : "New"} product ${added + 1}`).slice(0, 100);
    const { error } = await supabase.from("products").insert({
      user_id: user.id, linktree_id: linktree.id, collection_id: collectionId, platform, title, url,
      price: details && !details.pricesSkipped ? priceDigits(details.price) : "", compare_price: details && !details.pricesSkipped ? priceDigits(details.comparePrice) : "",
      image_path: image?.path ?? null, image_url: image?.url ?? null, position: position++, is_active: false,
    });
    if (error) { if (image) await supabase.storage.from("product-images").remove([image.path]); continue; }
    added++; if (details) filled++;
  }
  revalidatePath("/dashboard/shops");
  if (!added) redirect("/dashboard/shops?error=Could not add these links. Try adding them one by one.");
  redirect(`/dashboard/shops?message=${encodeURIComponent(`Added ${added} hidden ${added === 1 ? "draft" : "drafts"}${filled < added ? ` (${added - filled} without details)` : ""}. Check names and prices, then switch them on.`)}`);
}

// Import CSV (format sama dengan Export CSV). Kategori yang belum ada dibuat; foto hanya disalin dari Storage LinkHub.
export async function importProductsCsv(formData: FormData) {
  const { supabase, user, linktree } = await authenticatedClient();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) redirect("/dashboard/shops?error=Choose a CSV file to import");
  if (file.size > 1_000_000) redirect("/dashboard/shops?error=This file is too big. The limit is 1 MB.");
  if (!(await rateLimit("product-import", 5, 600))) redirect("/dashboard/shops?error=Too many imports. Wait a few minutes and try again.");
  const [head = [], ...rows] = parseCsv(await file.text(), 501);
  const column = (...names: string[]) => head.findIndex((value) => names.includes(value.toLowerCase()));
  const at = { note: column("note", "your note"), title: column("name", "title", "product name"), url: column("link", "url", "product link"), price: column("price"), compare: column("original price", "compare price"), category: column("category"), store: column("store", "platform"), visible: column("visible"), sale: column("on sale", "featured"), from: column("show from", "starts"), until: column("until", "ends"), photo: column("photo", "image") };
  if (at.title < 0 || at.url < 0) redirect("/dashboard/shops?error=The CSV needs at least a Name and a Link column. Export your products to see the format.");
  if (rows.length > 500) redirect("/dashboard/shops?error=Import up to 500 products at a time");
  const cell = (row: string[], index: number) => (index >= 0 ? row[index] ?? "" : "").trim();
  const yes = (value: string, fallback: boolean) => value ? /^(yes|y|true|1|ya)$/i.test(value) : fallback;
  const { data: existing } = await supabase.from("shop_collections").select("id,title").eq("linktree_id", linktree.id);
  const categories = new Map((existing ?? []).map((item) => [String(item.title).toLowerCase(), item.id as string]));
  let categoryPosition = await nextPosition(supabase, "shop_collections", "linktree_id", linktree.id);
  async function categoryId(name: string) {
    const title = (name || "Imported").slice(0, 80);
    const known = categories.get(title.toLowerCase());
    if (known) return known;
    const { data } = await supabase.from("shop_collections").insert({ user_id: user.id, linktree_id: linktree.id, title, position: categoryPosition++ }).select("id").single();
    if (data) categories.set(title.toLowerCase(), data.id);
    return (data?.id as string | undefined) ?? null;
  }
  const storage = process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/product-images/` : null;
  async function copyPhoto(url: string) {
    if (!storage || !url.startsWith(storage)) return null;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const bytes = response.ok ? new Uint8Array(await response.arrayBuffer()) : null;
      const image = bytes && bytes.length <= 5_000_000 ? imageType(bytes.slice(0, 12)) : null;
      if (!bytes || !image) return null;
      const path = `${user.id}/${crypto.randomUUID()}.${image.extension}`;
      const { error } = await supabase.storage.from("product-images").upload(path, bytes, { contentType: image.type, upsert: false });
      return error ? null : { path, url: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl };
    } catch { return null; }
  }
  // Kategori dibuat berurutan (bukan paralel) supaya nama yang sama tidak jadi dua kategori.
  const parsed = [];
  for (const row of rows) {
    let url = "";
    try { url = validUrl(extractLink(cell(row, at.url))); } catch { parsed.push(null); continue; }
    const title = cell(row, at.title).slice(0, 100);
    if (!title || !/^https?:/.test(url)) { parsed.push(null); continue; }
    const collection = await categoryId(cell(row, at.category));
    if (!collection) { parsed.push(null); continue; }
    const store = cell(row, at.store).toLowerCase().replace(/\s+/g, "");
    const platform = isCommercePlatform(store) || store === "website" ? store : detectPlatform(url);
    const startsAt = wibDate(cell(row, at.from)); const endsAt = wibDate(cell(row, at.until), true);
    parsed.push({ collection, photo: cell(row, at.photo), row: { platform, title, url, note: cell(row, at.note).replace(/\s+/g, " ").slice(0, 140), price: priceDigits(cell(row, at.price)), compare_price: priceDigits(cell(row, at.compare)), is_active: yes(cell(row, at.visible), true), is_featured: yes(cell(row, at.sale), false), starts_at: startsAt, ends_at: startsAt && endsAt && endsAt <= startsAt ? null : endsAt } });
  }
  const positions = new Map<string, number>();
  let added = 0; let skipped = 0;
  for (let index = 0; index < parsed.length; index += 5) {
    const batch = parsed.slice(index, index + 5);
    const photos = await Promise.all(batch.map((item) => item?.photo ? copyPhoto(item.photo) : null));
    for (const [offset, item] of batch.entries()) {
      if (!item) { skipped++; continue; }
      if (!positions.has(item.collection)) positions.set(item.collection, await nextPosition(supabase, "products", "collection_id", item.collection));
      const position = positions.get(item.collection)!; positions.set(item.collection, position + 1);
      const image = photos[offset];
      const { error } = await supabase.from("products").insert({ user_id: user.id, linktree_id: linktree.id, collection_id: item.collection, ...item.row, image_path: image?.path ?? null, image_url: image?.url ?? null, position });
      if (error) { skipped++; if (image) await supabase.storage.from("product-images").remove([image.path]); } else added++;
    }
  }
  revalidatePath("/dashboard/shops");
  if (!added) redirect("/dashboard/shops?error=No products were imported. Check that each row has a name and a link.");
  redirect(`/dashboard/shops?message=${encodeURIComponent(`Imported ${added} ${added === 1 ? "product" : "products"}${skipped ? `, skipped ${skipped} ${skipped === 1 ? "row" : "rows"}` : ""}.`)}`);
}

export async function updateProduct(formData: FormData) {
  const { supabase, user, linktree } = await authenticatedClient();
  const id = String(formData.get("id") ?? "");
  const { data: current } = isUuid(id) ? await supabase.from("products").select("image_path,collection_id").eq("id", id).eq("linktree_id", linktree.id).maybeSingle() : { data: null };
  if (!current) redirect("/dashboard/shops?error=Product not found");
  const collectionId = await ownedShopCollection(supabase, linktree.id, formData.get("collection_id"));
  const fields = productFields(formData);
  const image = (await uploadProductImage(supabase, user.id, formData.get("image"))) ?? (await importProductImage(supabase, user.id, formData.get("image_source")));
  const changes: Record<string, string | number | boolean | null> = { ...fields, collection_id: collectionId, is_active: formData.get("is_active") === "on" };
  // Pindah kategori: taruh di urutan terakhir kategori barunya.
  if (collectionId !== current.collection_id) changes.position = await nextPosition(supabase, "products", "collection_id", collectionId);
  if (image) { changes.image_path = image.path; changes.image_url = image.url; }
  const { error } = await supabase.from("products").update(changes).eq("id", id).eq("linktree_id", linktree.id);
  if (error) {
    if (image) await supabase.storage.from("product-images").remove([image.path]);
    redirect(`/dashboard/shops?error=${encodeURIComponent(friendlyError(error))}`);
  }
  if (image && current.image_path) await supabase.storage.from("product-images").remove([current.image_path]);
  revalidatePath("/dashboard/shops");
  redirect("/dashboard/shops?message=Product saved");
}

export async function setProductActive(id: string, active: boolean) {
  const { supabase, linktree } = await authenticatedClient();
  if (!isUuid(id)) return;
  await supabase.from("products").update({ is_active: active }).eq("id", id).eq("linktree_id", linktree.id);
  revalidatePath("/dashboard/shops");
}

// Naik/turun satu langkah di dalam kategorinya; posisi dinomori ulang supaya tidak ada yang kembar.
export async function moveProduct(id: string, direction: -1 | 1) {
  const { supabase, linktree } = await authenticatedClient();
  if (!isUuid(id)) return;
  const { data: product } = await supabase.from("products").select("collection_id").eq("id", id).eq("linktree_id", linktree.id).maybeSingle();
  if (!product) return;
  const { data: siblings } = await supabase.from("products").select("id").eq("collection_id", product.collection_id).eq("linktree_id", linktree.id).order("position").order("created_at");
  const order = (siblings ?? []).map((item) => item.id);
  const from = order.indexOf(id); const to = from + direction;
  if (from < 0 || to < 0 || to >= order.length) return;
  [order[from], order[to]] = [order[to], order[from]];
  await Promise.all(order.map((itemId, position) => supabase.from("products").update({ position }).eq("id", itemId).eq("linktree_id", linktree.id)));
  revalidatePath("/dashboard/shops");
}

export async function deleteProduct(formData: FormData) {
  const { supabase, linktree } = await authenticatedClient();
  const id = String(formData.get("id") ?? "");
  const { data: product } = await supabase.from("products").select("image_path").eq("id", id).eq("linktree_id", linktree.id).single();
  await supabase.from("products").delete().eq("id", id).eq("linktree_id", linktree.id);
  if (product?.image_path) await supabase.storage.from("product-images").remove([product.image_path]);
  revalidatePath("/dashboard/shops");
}

// Daftar produk per video (/slug/c/haul-1212). Alamat dibuat dari nama; kalau sudah dipakai diberi angka.
export async function createProductList(formData: FormData) {
  const { supabase, user, linktree } = await authenticatedClient();
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  if (!title) redirect("/dashboard/shops/lists?error=List name is required");
  const base = normalizeSlug(title).slice(0, 34).replace(/-+$/, "") || "list";
  const { data: taken } = await supabase.from("product_lists").select("slug").eq("linktree_id", linktree.id);
  const used = new Set((taken ?? []).map((item) => item.slug as string));
  if (used.size >= 50) redirect("/dashboard/shops/lists?error=You can have up to 50 lists. Delete an old one first.");
  let slug = base;
  for (let count = 2; used.has(slug); count++) slug = `${base}-${count}`;
  const { error } = await supabase.from("product_lists").insert({ linktree_id: linktree.id, user_id: user.id, title, slug });
  if (error) redirect(`/dashboard/shops/lists?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/dashboard/shops/lists");
  redirect("/dashboard/shops/lists?message=List created. Pick its products below.");
}

export async function updateProductList(formData: FormData) {
  const { supabase, linktree } = await authenticatedClient();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  if (!isUuid(id) || !title) redirect("/dashboard/shops/lists?error=List name is required");
  const wanted = [...new Set(formData.getAll("product_ids").map(String).filter(isUuid))];
  // Hanya produk milik halaman ini; urutan mengikuti urutan produk di dashboard.
  const { data: owned } = wanted.length ? await supabase.from("products").select("id").eq("linktree_id", linktree.id).in("id", wanted) : { data: [] };
  const ids = new Set((owned ?? []).map((item) => item.id as string));
  const productIds = wanted.filter((value) => ids.has(value)).slice(0, 60);
  const { data: list, error } = await supabase.from("product_lists").update({ title, product_ids: productIds }).eq("id", id).eq("linktree_id", linktree.id).select("slug").maybeSingle();
  if (error || !list) redirect(`/dashboard/shops/lists?error=${encodeURIComponent(error ? friendlyError(error) : "List not found")}`);
  revalidatePath("/dashboard/shops/lists");
  if (linktree.slug) revalidatePath(`/${linktree.slug}/c/${list.slug}`);
  redirect(`/dashboard/shops/lists?message=${encodeURIComponent(`Saved "${title}" with ${productIds.length} ${productIds.length === 1 ? "product" : "products"}${wanted.length > 60 ? " (the limit is 60)" : ""}`)}`);
}

export async function deleteProductList(formData: FormData) {
  const { supabase, linktree } = await authenticatedClient();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) redirect("/dashboard/shops/lists?error=List not found");
  const { error } = await supabase.from("product_lists").delete().eq("id", id).eq("linktree_id", linktree.id);
  if (error) redirect(`/dashboard/shops/lists?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/dashboard/shops/lists");
  redirect("/dashboard/shops/lists?message=List deleted");
}

export async function reorderShopCollections(ids: string[]) {
  const { supabase, linktree } = await authenticatedClient();
  await Promise.all(ids.map((id, position) => supabase.from("shop_collections").update({ position }).eq("id", id).eq("linktree_id", linktree.id)));
  revalidatePath("/dashboard/shops");
}
export async function saveCustomDesign(formData: FormData) {
  const { supabase, user, linktree } = await authenticatedClient();
  const allowed = {
    title_style: ["normal", "uppercase", "italic", "serif"],
    wallpaper_style: ["solid", "gradient", "soft"],
    button_style: ["solid", "glass", "outline"],
    button_roundness: ["square", "soft", "rounded", "pill"],
    page_font: ["geist", "inter", "poppins", "playfair", "space", "dm-sans", "lora", "merriweather", "nunito", "montserrat", "bebas-neue", "caveat"],
  } as const;
  const values = Object.fromEntries(Object.keys(allowed).map((key) => [key, String(formData.get(key) ?? "")]));
  for (const [key, options] of Object.entries(allowed)) if (!(options as readonly string[]).includes(values[key])) redirect("/dashboard/design?error=Invalid design option");
  const { data: current } = await supabase.from("linktrees").select("slug").eq("id", linktree.id).eq("owner_id", user.id).single();
  const changes: Record<string, string> = {
    title_style: values.title_style,
    title_color: validColor(formData.get("title_color")),
    wallpaper_style: values.wallpaper_style,
    background_color: validColor(formData.get("background_color")),
    button_style: values.button_style,
    button_roundness: values.button_roundness,
    button_color: validColor(formData.get("button_color")),
    button_text_color: validColor(formData.get("button_text_color")),
    page_font: values.page_font,
    text_color: validColor(formData.get("text_color")),
    custom_footer: String(formData.get("custom_footer") ?? "").trim().slice(0, 120),
    theme_preset: "custom",
  };
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  if (!title) redirect("/dashboard/design?error=Title is required");
  const [{ error }, { error: headerError }] = await Promise.all([
    supabase.from("linktrees").update({ ...changes, name: title, affiliate_notice: formData.get("affiliate_notice") === "on" }).eq("id", linktree.id).eq("owner_id", user.id),
    supabase.from("linktree_headers").upsert({ linktree_id: linktree.id, title, bio: String(formData.get("bio") ?? "").trim().slice(0, 160) }),
  ]);
  if (error || headerError) redirect(`/dashboard/design?error=${encodeURIComponent(friendlyError((error || headerError)!))}`);
  revalidatePath("/dashboard", "layout");
  if (current?.slug) revalidatePath(`/${current.slug}`);
  redirect("/dashboard/design?message=Design saved");
}
export async function saveShareSettings(formData: FormData) {
  const { supabase, user, linktree } = await authenticatedClient();
  const { data: profile } = await supabase.from("linktrees").select("slug").eq("id", linktree.id).eq("owner_id", user.id).single();
  const { error } = await supabase.from("linktrees").update({
    seo_title: String(formData.get("seo_title") ?? "").trim().slice(0, 70),
    seo_description: String(formData.get("seo_description") ?? "").trim().slice(0, 160),
    share_image_color: validColor(formData.get("share_image_color")),
  }).eq("id", linktree.id).eq("owner_id", user.id);
  if (error) redirect(`/dashboard/share?error=${encodeURIComponent(friendlyError(error))}`);
  if (profile?.slug) revalidatePath(`/${profile.slug}`);
  redirect("/dashboard/share?message=Share settings saved");
}
export async function switchLinktree(formData: FormData) {
  const { user, supabase } = await getDashboardContext();
  const id = String(formData.get("linktree_id") ?? "");
  const { data } = await supabase.from("linktrees").select("id").eq("id", id).eq("owner_id", user.id).single();
  if (!data) redirect("/dashboard/shops?error=Invalid page");
  (await cookies()).set("active_linktree_id", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 31536000 });
  redirect("/dashboard/shops");
}

export async function createLinktree(formData: FormData) {
  const { user, supabase, linktrees } = await getDashboardContext();
  if (linktrees.length >= 3) redirect("/dashboard/new?error=You can have up to 3 pages");
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const slugError = slugProblem(slug);
  if (slugError) redirect(`/dashboard/new?error=${encodeURIComponent(slugError)}`);
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 160);
  const { data, error } = await supabase.from("linktrees").insert({ owner_id: user.id, name, bio, slug }).select("id").single();
  if (error) redirect(`/dashboard/new?error=${encodeURIComponent(friendlyError(error))}`);
  (await cookies()).set("active_linktree_id", data.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 31536000 });
  redirect("/dashboard/shops");
}
function accountError(message: string): never {
  redirect(`/dashboard/account?error=${encodeURIComponent(message)}`);
}

async function requireSensitiveAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (await needsMfaCode(supabase)) redirect("/login/mfa?next=/dashboard/account");
}

// Ringkasan mingguan lewat email (opt-in). Dikirim cron /api/cron/weekly-summary tiap Senin pagi.
export async function saveWeeklyEmail(formData: FormData) {
  const { supabase, user } = await authenticatedClient();
  const { error } = await supabase.from("profiles").update({ weekly_email: formData.get("weekly_email") === "on" }).eq("id", user.id);
  if (error) redirect(`/dashboard/account?error=${encodeURIComponent(friendlyError(error))}`);
  revalidatePath("/dashboard/account");
  redirect(`/dashboard/account?message=${formData.get("weekly_email") === "on" ? "Weekly email turned on" : "Weekly email turned off"}`);
}

export async function changePassword(formData: FormData) {
  const { supabase } = await authenticatedClient();
  await requireSensitiveAuth(supabase);
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8) accountError("Password must be at least 8 characters");
  if (password !== confirmation) accountError("Passwords do not match");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) accountError(friendlyError(error));
  redirect("/dashboard/account?message=Password updated");
}

export async function deleteLinktreeAccount(formData: FormData) {
  const { supabase, user, linktree, linktrees } = await authenticatedClient();
  await requireSensitiveAuth(supabase);
  if (linktrees.length <= 1) accountError("You cannot delete your last page. Delete the account to remove everything.");
  if (String(formData.get("confirmation") ?? "") !== linktree.slug) accountError("Type the page address exactly to delete it");
  const { data: products } = await supabase.from("products").select("image_path").eq("linktree_id", linktree.id);
  const { error } = await supabase.from("linktrees").delete().eq("id", linktree.id).eq("owner_id", user.id);
  if (error) accountError(friendlyError(error));
  const paths = (products ?? []).map((item) => item.image_path).filter((path): path is string => Boolean(path));
  if (paths.length) await supabase.storage.from("product-images").remove(paths);
  (await cookies()).delete("active_linktree_id");
  redirect("/dashboard/links");
}

export async function deleteAccount(formData: FormData) {
  const { user, supabase } = await authenticatedClient();
  await requireSensitiveAuth(supabase);
  if (String(formData.get("confirmation") ?? "") !== "DELETE") accountError("Type DELETE to delete the account");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  if (!admin) accountError("SUPABASE_SERVICE_ROLE_KEY is not set on the server");
  for (const bucket of ["profile-images", "product-images"]) {
    // Selalu ambil dari awal: file yang sudah dihapus hilang dari daftar, jadi offset akan melompati file.
    for (let round = 0; round < 100; round++) {
      const { data, error: listError } = await admin.storage.from(bucket).list(user.id, { limit: 1000 });
      if (listError) accountError("Could not delete files. Please try again.");
      if (!data?.length) break;
      const { error: removeError } = await admin.storage.from(bucket).remove(data.map((item) => `${user.id}/${item.name}`));
      if (removeError) accountError("Could not delete files. Please try again.");
      if (data.length < 1000) break;
    }
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) accountError(friendlyError(error));
  const cookieStore = await cookies();
  cookieStore.getAll().forEach((cookie) => cookieStore.delete(cookie.name));
  redirect("/");
}





