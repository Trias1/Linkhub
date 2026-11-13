import type { SupabaseClient } from "@supabase/supabase-js";

export type Product = {
  id: string; collection_id: string; platform: string; title: string; url: string; price: string; image_url: string | null; is_active: boolean;
  compare_price: string; is_featured: boolean; starts_at: string | null; ends_at: string | null;
  number: number | null; created_at: string; note: string;
};

const legacyColumns = "id,collection_id,platform,title,url,price,image_url,is_active,created_at";
const promoColumns = `${legacyColumns},compare_price,is_featured,starts_at,ends_at`;
const numberColumns = `${promoColumns},number`;
const columns = `${numberColumns},note`;

// Kolom promo/jadwal datang dari SQL 018. Kalau belum dijalankan, pakai kolom lama supaya halaman tetap jalan.
export async function fetchProducts(supabase: SupabaseClient, linktreeId: string, onlyActive = false) {
  const run = (select: string) => { const query = supabase.from("products").select(select).eq("linktree_id", linktreeId); return (onlyActive ? query.eq("is_active", true) : query).order("position").order("created_at"); };
  let { data, error } = await run(columns);
  // Kolom note datang dari SQL 022, number dari 021, promo dari 018.
  if (error) ({ data, error } = await run(numberColumns));
  if (error) ({ data, error } = await run(promoColumns));
  if (error) ({ data, error } = await run(legacyColumns));
  return ((data ?? []) as unknown as Partial<Product>[]).map((item) => ({ compare_price: "", is_featured: false, starts_at: null, ends_at: null, number: null, note: "", ...item }) as Product);
}

export type ProductStatus = "live" | "scheduled" | "ended" | "hidden";
export function productStatus(product: Pick<Product, "is_active" | "starts_at" | "ends_at">, now = Date.now()): ProductStatus {
  if (!product.is_active) return "hidden";
  if (product.starts_at && Date.parse(product.starts_at) > now) return "scheduled";
  if (product.ends_at && Date.parse(product.ends_at) <= now) return "ended";
  return "live";
}

export const liveProducts = <T extends Pick<Product, "is_active" | "starts_at" | "ends_at">>(items: T[]) => { const now = Date.now(); return items.filter((item) => productStatus(item, now) === "live"); };

export const daysAgoIso = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const wib = (locale: string) => new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
// ends_at disimpan sebagai 00:00 WIB hari berikutnya, jadi tanggal yang ditampilkan dikurangi 1 ms.
export const formatEndDate = (value: string, locale = "id") => wib(locale).format(new Date(Date.parse(value) - 1));
export const formatStartDate = (value: string, locale = "id") => wib(locale).format(new Date(value));
// Nilai untuk <input type="date"> dalam WIB.
export function dateInputValue(value: string | null, isEnd = false) {
  if (!value) return "";
  const date = new Date(Date.parse(value) - (isEnd ? 1 : 0));
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(date);
}

const DAY_MS = 86_400_000;
const wibDay = (time: number) => Math.floor((time + 7 * 3_600_000) / DAY_MS);

// "Ends today" / "Ends tomorrow" / "Ends in 3 days" untuk promo yang tinggal beberapa hari (hari dihitung WIB).
export function endsSoon(endsAt: string | null, now = Date.now()) {
  if (!endsAt) return null;
  const days = wibDay(Date.parse(endsAt) - 1) - wibDay(now);
  if (days < 0 || days > 3) return null;
  return days === 0 ? "Ends today" : days === 1 ? "Ends tomorrow" : `Ends in ${days} days`;
}

// Label otomatis di halaman publik: "Popular" = 3 produk dengan klik Buy terbanyak 7 hari terakhir (min. 2 klik),
// "New" = ditambahkan kurang dari 7 hari lalu.
export function productBadges(items: Pick<Product, "id" | "created_at">[], clickedIds: string[], now = Date.now()) {
  const counts = new Map<string, number>();
  clickedIds.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  const shown = new Set(items.map((item) => item.id));
  const popular = new Set([...counts].filter(([id, count]) => shown.has(id) && count >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id));
  return new Map(items.map((item) => [item.id, popular.has(item.id) ? "Popular" : item.created_at && now - Date.parse(item.created_at) < 7 * DAY_MS ? "New" : null] as const));
}
