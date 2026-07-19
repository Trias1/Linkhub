type Props = { platform?: string | null; size?: number };

export function PlatformIcon({ platform, size = 18 }: Props) {
  const commerceMarks: Record<string, string> = { shopee:"S", tokopedia:"T", lazada:"L", blibli:"B", bukalapak:"Bk", "tiktok-shop":"TS", amazon:"a", ebay:"e", etsy:"E", shopify:"S", woocommerce:"W", gumroad:"G" };
  const mark = platform ? commerceMarks[platform] : undefined;
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

  if (mark) return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" /><text x="12" y="12.5" textAnchor="middle" dominantBaseline="middle" fill="currentColor" stroke="none" fontSize={mark.length > 1 ? 7 : 10} fontWeight="800">{mark}</text></svg>;

  switch (platform) {
    case "instagram":
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>;
    case "tiktok":
      return <svg {...common}><path d="M15 4v10.5a4.5 4.5 0 1 1-3.5-4.39" /><path d="M15 4c1 2.4 2.7 3.7 5 4" /></svg>;
    case "youtube":
      return <svg {...common}><path d="M21 12c0 3.5-.4 5.4-1.2 6.2S16.8 19 12 19s-7-.1-7.8-.8S3 15.5 3 12s.4-5.4 1.2-6.2S7.2 5 12 5s7 .1 7.8.8S21 8.5 21 12Z" /><path d="m10 9 5 3-5 3Z" fill="currentColor" /></svg>;
    case "whatsapp":
      return <svg {...common}><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z" /><path d="M9 8.5c.5 2.7 2 4.2 4.8 5l1.2-1.2 2 .8c-.4 1.8-1.6 2.5-3 2.3-3.6-.4-6.7-3.5-7.1-7.1-.2-1.4.5-2.6 2.3-3l.8 2Z" /></svg>;
    case "email":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
    case "website":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>;
    default:
      return <svg {...common}><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></svg>;
  }
}