import { getDashboardContext } from "@/lib/active-linktree";
import { insightDays, insightRange } from "@/lib/insights-range";
import { InsightsDashboard } from "./insights-dashboard";

export const metadata = { title: "Insights · LinkHub" };

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const query = await searchParams;
  const period = insightRange(query.range, query.from, query.to);
  const { supabase, linktree } = await getDashboardContext();
  const [{ count: lifetimeViews }, { count: lifetimeClicks }, { data: summary, error: summaryError }, { data: links }, { data: products }] = await Promise.all([
    supabase.from("page_views").select("id", { count: "exact", head: true }).eq("linktree_id", linktree.id),
    supabase.from("link_clicks").select("id", { count: "exact", head: true }).eq("linktree_id", linktree.id),
    // Dihitung di database per hari WIB (SQL 021), jadi tidak terpotong di batas baris API.
    supabase.rpc("insights_summary", { p_linktree_id: linktree.id, p_from: period.from, p_to: period.to }),
    supabase.from("links").select("id,title,platform").eq("linktree_id", linktree.id),
    supabase.from("products").select("id,title,platform").eq("linktree_id", linktree.id),
  ]);
  type Summary = { days: { day: string; views: number; clicks: number; buys: number }[]; links: { id: string; count: number }[]; products: { id: string; count: number }[]; stores: { platform: string; count: number }[]; sources?: { source: string; views: number; taps: number }[]; hours?: { hour: number; views: number; taps: number }[] };
  const data: Summary = { days: [], links: [], products: [], stores: [], ...(summary as Partial<Summary> | null) };
  // Per jam (WIB): 24 baris, jam tanpa aktivitas = 0. Kosong kalau SQL 022 belum dijalankan.
  const hours = data.hours ? Array.from({ length: 24 }, (_, hour) => ({ hour, views: 0, taps: 0, ...data.hours!.find((row) => row.hour === hour) })) : null;
  const days = insightDays(period.from, period.to).map((day) => ({ ...day, buys: 0 }));
  const dayMap = new Map(days.map((day) => [day.key, day]));
  data.days.forEach((row) => { const day = dayMap.get(row.day); if (day) { day.views = row.views; day.clicks = row.clicks; day.buys = row.buys; } });
  const sum = (key: "views" | "clicks" | "buys") => data.days.reduce((total, row) => total + row[key], 0);
  const rank = <T extends { id: string; title: string; platform: string | null }>(items: T[] | null, counts: { id: string; count: number }[], fallback: string) => {
    const byId = new Map((items ?? []).map((item) => [item.id, item]));
    return counts.map(({ id, count }) => ({ title: byId.get(id)?.title || fallback, platform: byId.get(id)?.platform ?? null, clicks: count }));
  };
  return <InsightsDashboard
    period={period}
    days={days}
    totals={{ views: sum("views"), clicks: sum("clicks"), buys: sum("buys"), lifetimeViews: lifetimeViews ?? 0, lifetimeClicks: lifetimeClicks ?? 0 }}
    productsReady={!summaryError}
    topLinks={rank(links, data.links, "Deleted link")}
    topProducts={rank(products, data.products, "Deleted product")}
    stores={data.stores.map((row) => [row.platform, row.count] as [string, number])}
    sources={data.sources ?? null}
    hours={hours}
  />;
}
