// Sumber kunjungan untuk Insights. Hanya kategorinya yang disimpan (mis. "tiktok"), bukan URL referrer,
// IP atau user agent. Nilainya sama dengan daftar di fungsi public.clean_source (SQL 022).
export const trafficSources = {
  instagram: "Instagram",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  youtube: "YouTube",
  x: "X",
  threads: "Threads",
  telegram: "Telegram",
  google: "Google",
  other: "Other websites",
  direct: "Direct or unknown",
} as const;
export type TrafficSource = keyof typeof trafficSources;

// Tag ?src= yang dipakai di link bio (lihat Share & QR), plus singkatan yang umum.
const aliases: Record<string, TrafficSource> = { ig: "instagram", tt: "tiktok", wa: "whatsapp", fb: "facebook", yt: "youtube", twitter: "x", tg: "telegram" };
export const isTrafficSource = (value: string): value is TrafficSource => Object.hasOwn(trafficSources, value);

const hosts: [RegExp, TrafficSource][] = [
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(tiktok\.com|tiktokv\.com)$/, "tiktok"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|messenger\.com)$/, "facebook"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, "x"],
  [/(^|\.)threads\.(net|com)$/, "threads"],
  [/(^|\.)(t\.me|telegram\.org|telegram\.me)$/, "telegram"],
  [/(^|\.)google\.[a-z.]+$/, "google"],
];

// Browser di dalam aplikasi sering tidak mengirim referrer, tapi user agent-nya menyebut aplikasinya.
const apps: [RegExp, TrafficSource][] = [
  [/Instagram/i, "instagram"],
  [/musical_ly|BytedanceWebview|TikTok|trill_/i, "tiktok"],
  [/FBAN|FBAV|FB_IAB|FBIOS/i, "facebook"],
  [/WhatsApp/i, "whatsapp"],
  [/Telegram/i, "telegram"],
  [/Barcelona/i, "threads"],
];

export function trafficSource({ tag, referrer, userAgent, ownHost }: { tag?: string | null; referrer?: string | null; userAgent?: string | null; ownHost?: string | null }): TrafficSource {
  const cleanTag = String(tag ?? "").trim().toLowerCase().slice(0, 20);
  if (cleanTag && cleanTag !== "direct") return aliases[cleanTag] ?? (isTrafficSource(cleanTag) ? cleanTag : "other");
  let host = "";
  try { host = referrer ? new URL(referrer).hostname.toLowerCase() : ""; } catch { host = ""; }
  if (host && host !== ownHost) {
    const match = hosts.find(([pattern]) => pattern.test(host));
    if (match) return match[1];
  }
  const app = apps.find(([pattern]) => pattern.test(userAgent ?? ""));
  if (app) return app[1];
  return host && host !== ownHost ? "other" : "direct";
}

// Sumber klik: dari kunjungan halaman (cookie src_<halaman>), kalau tidak ada dari user agent.
export function clickSource(request: Request & { cookies: { get(name: string): { value: string } | undefined } }, linktreeId: string | null) {
  const saved = linktreeId ? request.cookies.get(`src_${linktreeId}`)?.value : undefined;
  return saved && isTrafficSource(saved) ? saved : trafficSource({ userAgent: request.headers.get("user-agent") });
}
