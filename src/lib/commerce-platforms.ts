export const commercePlatforms = {
  shopee: { label: "Shopee", url: "https://shopee.co.id/", color: "#ee4d2d", hosts: ["shopee.co.id", "shopee.com", "shp.ee"] },
  tokopedia: { label: "Tokopedia", url: "https://www.tokopedia.com/", color: "#03ac0e", hosts: ["tokopedia.com", "tokopedia.link", "tkp.me"] },
  lazada: { label: "Lazada", url: "https://www.lazada.co.id/", color: "#0f146d", hosts: ["lazada.co.id", "lazada.com", "s.lazada.co.id"] },
  blibli: { label: "Blibli", url: "https://www.blibli.com/", color: "#0072bc", hosts: ["blibli.com", "bli.bz"] },
  bukalapak: { label: "Bukalapak", url: "https://www.bukalapak.com/", color: "#d71149", hosts: ["bukalapak.com"] },
  "tiktok-shop": { label: "TikTok Shop", url: "https://shop.tiktok.com/", color: "#111111", hosts: ["tiktok.com"] },
  facebook: { label: "Facebook", url: "https://www.facebook.com/marketplace/", color: "#1877f2", hosts: ["facebook.com", "fb.com", "fb.me", "m.me"] },
  amazon: { label: "Amazon", url: "https://www.amazon.com/", color: "#232f3e", hosts: ["amazon.com", "amzn.to", "amzn.asia"] },
  ebay: { label: "eBay", url: "https://www.ebay.com/", color: "#0064d2", hosts: ["ebay.com"] },
  etsy: { label: "Etsy", url: "https://www.etsy.com/", color: "#c7511f", hosts: ["etsy.com"] },
  shopify: { label: "Shopify", url: "https://www.shopify.com/", color: "#3f6b26", hosts: ["myshopify.com", "shopify.com"] },
  woocommerce: { label: "WooCommerce", url: "https://woocommerce.com/", color: "#674399", hosts: [] },
  gumroad: { label: "Gumroad", url: "https://gumroad.com/", color: "#111111", hosts: ["gumroad.com"] },
} as const;

export type CommercePlatform = keyof typeof commercePlatforms;

export const isCommercePlatform = (value: string | null | undefined): value is CommercePlatform => Boolean(value && value in commercePlatforms);

// "shopee.co.id/..." -> "shopee". Dipakai untuk deteksi otomatis saat link ditempel.
export function detectPlatform(value: string): CommercePlatform | "website" {
  let host = "";
  try { host = new URL(value).hostname.toLowerCase(); } catch { return "website"; }
  const match = Object.entries(commercePlatforms).find(([, item]) => item.hosts.some((domain) => host === domain || host.endsWith(`.${domain}`)));
  return (match?.[0] as CommercePlatform | undefined) ?? "website";
}

export const platformLabel = (value: string | null | undefined) => isCommercePlatform(value) ? commercePlatforms[value].label : "Website";
export const platformColor = (value: string | null | undefined) => isCommercePlatform(value) ? commercePlatforms[value].color : "#171712";

// Warna tombol "Buy": warna toko, digelapkan secukupnya supaya teks putih kontrasnya minimal 4,5:1 (WCAG AA).
const channel = (value: number) => { const c = value / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const whiteContrast = (rgb: number[]) => 1.05 / (0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]) + 0.05);
export function buyColor(value: string | null | undefined) {
  let rgb = [1, 3, 5].map((start) => parseInt(platformColor(value).slice(start, start + 2), 16));
  for (let step = 0; step < 20 && whiteContrast(rgb) < 4.6; step++) rgb = rgb.map((part) => Math.round(part * 0.94));
  return `#${rgb.map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}
