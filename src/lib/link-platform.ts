import { detectPlatform, platformLabel } from "./commerce-platforms";

// Ikon link ditentukan dari alamatnya. Link marketplace (Shopee, Tokopedia, ...) jadi tombol toko di halaman publik.
const social: [string, string, string[]][] = [
  ["instagram", "Instagram", ["instagram.com", "instagr.am"]],
  ["youtube", "YouTube", ["youtube.com", "youtu.be"]],
  ["whatsapp", "WhatsApp", ["wa.me", "whatsapp.com", "chat.whatsapp.com"]],
  ["github", "GitHub", ["github.com"]],
  ["linkedin", "LinkedIn", ["linkedin.com", "lnkd.in"]],
  ["x", "X", ["x.com", "twitter.com"]],
  ["threads", "Threads", ["threads.net", "threads.com"]],
  ["telegram", "Telegram", ["t.me", "telegram.me", "telegram.org"]],
  ["spotify", "Spotify", ["spotify.com", "spotify.link"]],
  ["discord", "Discord", ["discord.gg", "discord.com"]],
  ["pinterest", "Pinterest", ["pinterest.com", "pin.it"]],
  ["line", "LINE", ["line.me", "lin.ee"]],
  ["maps", "Google Maps", ["maps.app.goo.gl", "maps.google.com"]],
];

const matches = (host: string, domains: string[]) => domains.some((domain) => host === domain || host.endsWith(`.${domain}`));

// Lengkapi input yang diketik tanpa skema: "github.com/nama" -> https://, "nama@gmail.com" -> mailto:.
export function normalizeLink(value: string) {
  const text = value.trim();
  if (!text || /^(https?:|mailto:)/i.test(text)) return text;
  if (/^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/.test(text)) return `mailto:${text}`;
  if (/^[\w-]+(\.[\w-]+)+([/?#]\S*)?$/.test(text)) return `https://${text}`;
  return text;
}

export function linkPlatform(value: string) {
  let url: URL;
  try { url = new URL(normalizeLink(value)); } catch { return "website"; }
  if (url.protocol === "mailto:") return "email";
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if ((host === "google.com" || host.endsWith(".google.com")) && url.pathname.startsWith("/maps")) return "maps";
  if (host === "goo.gl" && url.pathname.startsWith("/maps")) return "maps";
  const match = social.find(([, , hosts]) => matches(host, hosts));
  if (match) return match[0];
  // tiktok.com/@nama = profil TikTok; shop.tiktok.com atau /view/product = TikTok Shop.
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return host.startsWith("shop.") || /\/(view\/product|shop)\b/.test(url.pathname) ? "tiktok-shop" : "tiktok";
  return detectPlatform(url.toString());
}

// Judul usulan untuk link baru: nama platform, atau nama domain untuk website biasa.
export function suggestedTitle(value: string) {
  const platform = linkPlatform(value);
  if (platform !== "website") return linkLabel(platform);
  try { return new URL(normalizeLink(value)).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// Ikon untuk link lama yang tersimpan tanpa platform (atau sebagai website biasa).
export const iconPlatform = (link: { platform: string | null; url: string }) => link.platform && link.platform !== "website" ? link.platform : linkPlatform(link.url);

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

const socialLabels: Record<string, string> = { ...Object.fromEntries(social.map(([key, label]) => [key, label])), tiktok: "TikTok", email: "Email" };
export const linkLabel = (platform: string | null) => socialLabels[platform ?? ""] ?? platformLabel(platform);
