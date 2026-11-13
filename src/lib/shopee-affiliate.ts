import "server-only";
import { createHash } from "node:crypto";
import { priceDigits } from "@/lib/rupiah";

// Shopee Affiliate Open API (Indonesia), GraphQL. Kredensial dari dashboard affiliate (Open API):
// SHOPEE_AFFILIATE_APP_ID dan SHOPEE_AFFILIATE_SECRET di env. Tanpa keduanya fitur ini mati.
// Tanda tangan: SHA256(AppId + Timestamp + Payload + Secret), dikirim di header Authorization.
const endpoint = "https://open-api.affiliate.shopee.co.id/graphql";
const shopeeHosts = ["shopee.co.id", "shopee.com", "shp.ee"];

export const shopeeConfigured = () => Boolean(process.env.SHOPEE_AFFILIATE_APP_ID && process.env.SHOPEE_AFFILIATE_SECRET);
export const isShopeeHost = (host: string) => shopeeHosts.some((item) => host === item || host.endsWith(`.${item}`));

async function call<T>(query: string): Promise<T | null> {
  const appId = process.env.SHOPEE_AFFILIATE_APP_ID; const secret = process.env.SHOPEE_AFFILIATE_SECRET;
  if (!appId || !secret) return null;
  const payload = JSON.stringify({ query });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha256").update(`${appId}${timestamp}${payload}${secret}`).digest("hex");
  const response = await fetch(endpoint, {
    method: "POST", body: payload, signal: AbortSignal.timeout(8000),
    headers: { "content-type": "application/json", authorization: `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}` },
  }).catch(() => null);
  if (!response?.ok) return null;
  const json = await response.json().catch(() => null) as { data?: T; errors?: unknown[] } | null;
  return json && !json.errors?.length ? json.data ?? null : null;
}

// "shopee.co.id/Nama-Produk-i.123.456" atau "shopee.co.id/product/123/456" -> { shopId, itemId }.
function idsFrom(url: URL) {
  const match = url.pathname.match(/-i\.(\d{1,15})\.(\d{1,15})/) ?? url.pathname.match(/\/product\/(\d{1,15})\/(\d{1,15})/);
  return match ? { shopId: match[1], itemId: match[2] } : null;
}

// Link pendek (s.shopee.co.id, id.shp.ee) diikuti lewat header Location saja, tanpa membuka halamannya.
async function shopeeIds(start: URL) {
  let url = start;
  for (let hop = 0; hop < 5; hop++) {
    const ids = idsFrom(url);
    if (ids) return ids;
    if (!isShopeeHost(url.hostname)) return null;
    const response = await fetch(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(6000) }).catch(() => null);
    const next = response && response.status >= 300 && response.status < 400 ? response.headers.get("location") : null;
    if (!next) return null;
    try { url = new URL(next, url); } catch { return null; }
    if (url.protocol !== "https:") return null;
  }
  return null;
}

type Offer = { productName?: string; priceMin?: string; priceMax?: string; imageUrl?: string };

export async function shopeeProduct(url: URL) {
  if (!shopeeConfigured() || !isShopeeHost(url.hostname)) return null;
  const ids = await shopeeIds(url);
  if (!ids) return null;
  const data = await call<{ productOfferV2?: { nodes?: Offer[] } }>(`{ productOfferV2(shopId: ${ids.shopId}, itemId: ${ids.itemId}, limit: 1) { nodes { productName priceMin priceMax imageUrl } } }`);
  const offer = data?.productOfferV2?.nodes?.[0];
  if (!offer?.productName) return null;
  const price = priceDigits(String(offer.priceMin ?? "").replace(/[.,]\d{1,2}$/, ""));
  return { title: offer.productName.slice(0, 100), price, comparePrice: "", image: offer.imageUrl && /^https:\/\//.test(offer.imageUrl) ? offer.imageUrl : "", pricesSkipped: false };
}

// Link affiliate milik akun pemilik kredensial (komisi masuk ke akun affiliate tersebut).
export async function shopeeShortLink(originUrl: string) {
  if (!shopeeConfigured()) return null;
  const data = await call<{ generateShortLink?: { shortLink?: string } }>(`mutation { generateShortLink(input: { originUrl: ${JSON.stringify(originUrl)}, subIds: ["linkhub"] }) { shortLink } }`);
  const link = data?.generateShortLink?.shortLink;
  return link && /^https:\/\//.test(link) ? link : null;
}
