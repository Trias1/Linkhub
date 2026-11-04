type Props = { platform?: string | null; size?: number };

export function PlatformIcon({ platform, size = 18 }: Props) {
  const commerceMarks: Record<string, string> = { shopee:"S", tokopedia:"T", lazada:"L", blibli:"B", bukalapak:"Bk", "tiktok-shop":"TS", amazon:"a", ebay:"e", etsy:"E", shopify:"S", woocommerce:"W", gumroad:"G", facebook:"f" };
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
    case "github":
      return <svg {...common}><path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" /></svg>;
    case "linkedin":
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></svg>;
    case "x":
      return <svg {...common}><path d="M4 4l16 16M20 4 4 20" /></svg>;
    case "threads":
      return <svg {...common}><path d="M16.5 11.5c-.4-2.6-2.1-3.8-4.4-3.8-2.6 0-4.1 1.8-4.1 4.3 0 2.6 1.6 4.3 4.2 4.3 2.4 0 3.9-1.4 3.9-3.3 0-2.2-2-3.3-4.4-2.9-1.8.3-2.6 1.4-2.4 2.5.2 1.2 1.5 1.8 2.9 1.6 2-.3 3.2-2.3 3-5.4" /><path d="M20 12a8 8 0 1 1-2.3-5.7" /></svg>;
    case "telegram":
      return <svg {...common}><path d="m21 4-18 7 6 2 2 7 3-4 5 4Z" /><path d="m9 13 12-9" /></svg>;
    case "spotify":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M7.5 9.5c3-1 6.5-.7 9 .8M8 12.6c2.5-.7 5.2-.4 7.2.8M8.5 15.5c1.9-.5 3.8-.3 5.4.6" /></svg>;
    case "discord":
      return <svg {...common}><path d="M8 7c2.7-1 5.3-1 8 0l1.5 1.5c1 2.5 1.5 5 1.5 8l-3 1.5-1-2c-2 .6-4 .6-6 0l-1 2L5 16.5c0-3 .5-5.5 1.5-8Z" /><path d="M9.5 12.5v.01M14.5 12.5v.01" /></svg>;
    case "pinterest":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M11 8.5c2.5-.7 4.5.6 4.5 2.8 0 2.2-1.4 3.7-3.2 3.7-1 0-1.6-.6-1.6-.6L9.5 20M11.5 11.5l-1 4" /></svg>;
    case "line":
      return <svg {...common}><path d="M12 4c4.7 0 8.5 3 8.5 6.7 0 3.3-3.1 6-7.2 6.6L10 20v-2.8c-3.8-.6-6.5-3.2-6.5-6.5C3.5 7 7.3 4 12 4Z" /></svg>;
    case "maps":
      return <svg {...common}><path d="M12 21s-6-5.4-6-11a6 6 0 0 1 12 0c0 5.6-6 11-6 11Z" /><circle cx="12" cy="10" r="2.2" /></svg>;
    case "email":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
    case "website":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></svg>;
    default:
      return <svg {...common}><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></svg>;
  }
}