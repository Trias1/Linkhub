import "server-only";
import { commercePlatforms } from "@/lib/commerce-platforms";
import { priceDigits } from "@/lib/rupiah";
import { shopeeProduct } from "@/lib/shopee-affiliate";

// Ambil nama, harga, harga coret dan foto dari halaman produk marketplace, untuk mengisi form otomatis.
// Hanya domain marketplace yang dikenal (bukan alamat bebas) supaya server tidak bisa dipakai untuk SSRF.
// pricesSkipped: halaman memberi harga yang berubah-ubah ke server, jadi harga tidak diisi.
export type ProductDetails = { title: string; price: string; comparePrice: string; image: string; pricesSkipped: boolean };
// Alasan gagal, supaya pesan ke user (dan diagnosis di produksi) jelas.
export type LookupFailure = "unsupported" | "blocked" | "unreachable" | "no-data";

const pageHosts: string[] = Object.values(commercePlatforms).flatMap((platform) => [...platform.hosts]);
// CDN gambar milik marketplace. Gambar hanya diunduh dari sini saat produk disimpan.
const imageHosts = ["tokopedia-static.net", "tokopedia.net", "susercontent.com", "slatic.net", "lazcdn.com", "tiktokcdn.com", "ibyteimg.com", "fbcdn.net", "blibli.com", "bukalapak.com", "bukalapak.net", "media-amazon.com", "ebayimg.com", "etsystatic.com", "shopify.com", "gumroad.com"];
const MAX_PAGE = 3 * 1024 * 1024;
const MAX_IMAGE = 5 * 1024 * 1024;

const matches = (host: string, list: string[]) => list.some((item) => host === item || host.endsWith(`.${item}`));
const httpsUrl = (value: string) => { try { const url = new URL(value); return url.protocol === "https:" ? url : null; } catch { return null; } };
export const isAllowedImage = (value: string) => { const url = httpsUrl(value); return Boolean(url && matches(url.hostname, imageHosts)); };

// Ikuti redirect sendiri (maks. 3), dan setiap lompatan harus tetap ke domain yang diizinkan.
async function fetchAllowed(start: URL, hosts: string[], accept: string): Promise<Response | LookupFailure> {
  let url = start;
  for (let hop = 0; hop < 4; hop++) {
    if (!matches(url.hostname, hosts)) return "unsupported";
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { accept, "accept-language": "id-ID,id;q=0.9,en;q=0.8", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" } }).catch(() => null);
    if (!response) return "unreachable";
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get("location"); const target = next ? httpsUrl(new URL(next, url).toString()) : null;
      if (!target) return "unsupported"; url = target; continue;
    }
    if ([401, 403, 429, 503].includes(response.status)) return "blocked";
    return response.ok ? response : "no-data";
  }
  return "unreachable";
}

async function readLimited(response: Response, limit: number) {
  if (Number(response.headers.get("content-length") ?? 0) > limit || !response.body) return null;
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

const decode = (text: string) => text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x2F;/gi, "/");
function meta(html: string, key: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (name?.toLowerCase() === key) return decode(tag.match(/\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i)?.slice(1).find(Boolean) ?? "");
  }
  return "";
}

type LdProduct = { name?: string; image?: unknown; offers?: unknown };
function jsonLdProduct(html: string): LdProduct | null {
  for (const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const queue: unknown[] = [JSON.parse(block[1])];
      while (queue.length) {
        const item = queue.shift();
        if (Array.isArray(item)) { queue.push(...item); continue; }
        if (!item || typeof item !== "object") continue;
        const record = item as Record<string, unknown>;
        const type = record["@type"];
        if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return record as LdProduct;
        if (record["@graph"]) queue.push(record["@graph"]);
      }
    } catch { /* JSON-LD rusak: lewati */ }
  }
  return null;
}
const firstImage = (value: unknown): string => typeof value === "string" ? value : Array.isArray(value) ? firstImage(value[0]) : value && typeof value === "object" ? String((value as { url?: string }).url ?? "") : "";
const offerPrice = (value: unknown): string => { const offer = Array.isArray(value) ? value[0] : value; if (!offer || typeof offer !== "object") return ""; const record = offer as Record<string, unknown>; return String(record.price ?? record.lowPrice ?? ""); };

// Harga di halaman marketplace bisa "11750000", "11.750.000" atau "11750000.00".
const rupiahDigits = (value: string) => priceDigits(value.replace(/[.,]\d{2}$/, ""));

// Halaman TikTok Shop/Tokopedia menyimpan versi 800px dari foto yang sama; pakai itu kalau ada.
// Dicari dengan indexOf (bukan regex) karena URL-nya bisa ada di dalam JSON yang di-escape.
const BACKSLASH = String.fromCharCode(92);
const endsUrl = (char: string) => char === '"' || char === "'" || char === BACKSLASH || char <= " ";
function largerImage(html: string, image: string) {
  const key = image.match(/[/]([0-9a-f]{32})~/)?.[1];
  if (!key) return image;
  const text = html.split(BACKSLASH + "u002F").join("/");
  for (let at = text.indexOf(key + "~"); at >= 0; at = text.indexOf(key + "~", at + 1)) {
    const start = text.lastIndexOf("https://", at);
    if (start < 0 || [...text.slice(start, at)].some(endsUrl)) continue;
    let end = at;
    while (end < text.length && !endsUrl(text[end])) end++;
    const candidate = decode(text.slice(start, end));
    if (candidate.includes(":800:800") && isAllowedImage(candidate)) return candidate;
  }
  return image;
}

function cleanTitle(title: string, host: string) {
  let clean = title.replace(/\s+/g, " ").trim();
  // "Nama di Toko | Tokopedia": buang nama toko hanya kalau formatnya memang begitu.
  if (host.endsWith("tokopedia.com") && /\|\s*Tokopedia$/i.test(clean)) clean = clean.replace(/\s*\|\s*Tokopedia$/i, "").replace(/\s+di\s+[^|]+$/i, "");
  clean = clean.replace(/\s*[|–-]\s*(Shopee|Lazada|TikTok Shop|Blibli|Bukalapak)( Indonesia)?$/i, "");
  if (clean.length <= 100) return clean;
  const cut = clean.slice(0, 100); return cut.slice(0, cut.lastIndexOf(" ") > 60 ? cut.lastIndexOf(" ") : 100).trim();
}

// www.tokopedia.com memblokir server data center (termasuk Vercel), tapi halaman produk yang sama di
// shop-id.tokopedia.com bisa dibaca. Link www berakhiran "-<id produk>-<id sku>"; pakai id pertama.
function tokopediaShopPage(url: URL) {
  if (!matches(url.hostname, ["tokopedia.com"]) || url.hostname === "shop-id.tokopedia.com") return null;
  const id = url.pathname.match(/-(\d{17,20})(?:-\d{17,20})?\/?$/)?.[1];
  return id ? new URL(`https://shop-id.tokopedia.com/view/product/${id}?_svg=1&chain_key=%7B%22t%22%3A1%7D`) : null;
}

export async function readProductDetails(link: string): Promise<ProductDetails | LookupFailure> {
  const url = httpsUrl(link);
  if (!url) return "unsupported";
  // Shopee memblokir pembacaan halaman; kalau kredensial Shopee Affiliate ada, pakai API resminya.
  const viaShopee = await shopeeProduct(url).catch(() => null);
  if (viaShopee) return viaShopee;
  const shopPage = tokopediaShopPage(url);
  let failure: LookupFailure | null = null;
  for (const candidate of shopPage ? [shopPage, url] : [url]) {
    let result = await readPage(candidate);
    // Halaman verifikasi anti-bot kadang muncul, kadang tidak: coba sekali lagi setelah jeda singkat.
    if (result === "blocked") { await new Promise((resolve) => setTimeout(resolve, 1200)); result = await readPage(candidate); }
    if (typeof result !== "string") return result;
    failure ??= result;
  }
  return failure ?? "no-data";
}

async function readPage(url: URL): Promise<ProductDetails | LookupFailure> {
  const response = await fetchAllowed(url, pageHosts, "text/html");
  if (typeof response === "string") return response;
  const bytes = (response.headers.get("content-type") ?? "").includes("text/html") ? await readLimited(response, MAX_PAGE) : null;
  if (!bytes) return "no-data";
  const html = new TextDecoder().decode(bytes);
  const ld = jsonLdProduct(html);

  // Tokopedia: blok harga utama berisi harga sekarang dan harga coret (kalau sedang diskon).
  const toped = html.match(/"value":(\d+),"currency":"[A-Z]*","priceFmt":"[^"]*","slashPriceFmt":"([^"]*)","discPercentage":"[^"]*","__typename":"pdpContentSnapshotPrice"/);
  // shop-id.tokopedia.com (link pendek vt.tokopedia.com, dan link www yang diarahkan ke sana) memberi harga
  // yang berbeda di setiap permintaan server (bisa selisih >10%). Daripada salah harga, harga tidak diisi.
  const pricesSkipped = url.hostname === "shop-id.tokopedia.com";
  const price = pricesSkipped ? "" : rupiahDigits(toped?.[1] ?? meta(html, "product:price:amount") ?? "") || rupiahDigits(offerPrice(ld?.offers)) || rupiahDigits(meta(html, "og:price:amount"));
  const slash = pricesSkipped ? "" : rupiahDigits(toped?.[2] ?? "");
  const comparePrice = slash && price && Number(slash) > Number(price) ? slash : "";
  const rawTitle = meta(html, "og:title") || ld?.name || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "";
  // Halaman verifikasi anti-bot ("Security Check", captcha) bukan halaman produk.
  if (/^\s*(security check|verify|verification|captcha|access denied|just a moment|attention required)/i.test(rawTitle)) return "blocked";
  const title = cleanTitle(rawTitle, url.hostname);
  const found = [meta(html, "og:image"), firstImage(ld?.image)].find((item) => item && isAllowedImage(item)) ?? "";
  const image = found ? largerImage(html, found) : "";
  if (title || price || image) return { title, price, comparePrice, image, pricesSkipped };
  return /captcha|verify you are human|access denied/i.test(html) ? "blocked" : "no-data";
}

// Unduh foto dari CDN marketplace untuk disimpan di storage kita (URL CDN sering kedaluwarsa).
export async function downloadProductImage(link: string) {
  const url = httpsUrl(link);
  if (!url || !isAllowedImage(link)) return null;
  const response = await fetchAllowed(url, imageHosts, "image/jpeg,image/png,image/webp");
  return typeof response === "string" ? null : readLimited(response, MAX_IMAGE);
}
