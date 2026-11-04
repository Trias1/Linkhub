import { detectPlatform, platformLabel } from "./commerce-platforms";

// Ikon link ditentukan dari alamatnya. Link marketplace (Shopee, Tokopedia, ...) jadi tombol toko di halaman publik.
const social: [string, string[]][] = [
  ["instagram", ["instagram.com", "instagr.am"]],
  ["youtube", ["youtube.com", "youtu.be"]],
  ["whatsapp", ["wa.me", "whatsapp.com", "chat.whatsapp.com"]],
];

export function linkPlatform(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { return "website"; }
  if (url.protocol === "mailto:") return "email";
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const match = social.find(([, hosts]) => hosts.some((domain) => host === domain || host.endsWith(`.${domain}`)));
  if (match) return match[0];
  // tiktok.com/@nama = profil TikTok; shop.tiktok.com atau /view/product = TikTok Shop.
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return host.startsWith("shop.") || /\/(view\/product|shop)\b/.test(url.pathname) ? "tiktok-shop" : "tiktok";
  return detectPlatform(value);
}

export const quickLinks = [
  { platform: "instagram", title: "Instagram", url: "https://instagram.com/" },
  { platform: "tiktok", title: "TikTok", url: "https://tiktok.com/@" },
  { platform: "whatsapp", title: "WhatsApp", url: "https://wa.me/62" },
  { platform: "youtube", title: "YouTube", url: "https://youtube.com/@" },
  { platform: "shopee", title: "Shopee store", url: "https://shopee.co.id/" },
  { platform: "tokopedia", title: "Tokopedia store", url: "https://www.tokopedia.com/" },
  { platform: "tiktok-shop", title: "TikTok Shop", url: "https://shop.tiktok.com/" },
  { platform: "lazada", title: "Lazada store", url: "https://www.lazada.co.id/shop/" },
  { platform: "email", title: "Email", url: "mailto:" },
] as const;

const socialLabels: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", whatsapp: "WhatsApp", email: "Email" };
export const linkLabel = (platform: string | null) => socialLabels[platform ?? ""] ?? platformLabel(platform);
