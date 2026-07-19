type Props = { name: "links" | "shop" | "design" | "insights" | "views" | "clicks" | "contacts" | "rate" | "account"; size?: number };

export function DashboardIcon({ name, size = 19 }: Props) {
  const props = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:2, strokeLinecap:"round" as const, strokeLinejoin:"round" as const, "aria-hidden":true };
  const paths = {
    links: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2A5 5 0 0 0 12 4l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></>,
    shop: <><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    design: <><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4a5 5 0 0 0-4-10Z"/><circle cx="7.5" cy="10" r=".7" fill="currentColor"/><circle cx="9" cy="6.5" r=".7" fill="currentColor"/><circle cx="14" cy="6.5" r=".7" fill="currentColor"/></>,
    insights: <><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/><path d="M2 19h22"/></>,
    views: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    clicks: <><path d="m5 3 6.5 16 2.1-5.4L19 11.5 5 3Z"/><path d="m14 14 4 4"/></>,
    contacts: <><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 8h5M19.5 5.5v5"/></>,
    rate: <><path d="M4 19 19 4"/><circle cx="7" cy="7" r="3"/><circle cx="17" cy="17" r="3"/></>,
    account: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
}