import { getDashboardContext } from "@/lib/active-linktree";
import { insightDays, insightRange } from "@/lib/insights-range";
import { InsightsDashboard } from "./insights-dashboard";

export const metadata = { title: "Insights · LinkHub" };

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ range?: string; from?: string; to?: string }> }) {
  const query = await searchParams;
  const period = insightRange(query.range, query.from, query.to);
  const { supabase, linktree } = await getDashboardContext();
  const inPeriod = <T extends { gte: (column: string, value: string) => T; lte: (column: string, value: string) => T }>(builder: T) => builder.gte("created_at", period.from).lte("created_at", period.to);
  const [{ count: lifetimeViews }, { count: lifetimeClicks }, { data: viewEvents }, { data: clickEvents }, { data: productEvents }, { data: links }, { data: products }] = await Promise.all([
    supabase.from("page_views").select("id", { count: "exact", head: true }).eq("linktree_id", linktree.id),
    supabase.from("link_clicks").select("id", { count: "exact", head: true }).eq("linktree_id", linktree.id),
    inPeriod(supabase.from("page_views").select("created_at").eq("linktree_id", linktree.id)).order("created_at").limit(10000),
    inPeriod(supabase.from("link_clicks").select("link_id,created_at").eq("linktree_id", linktree.id)).order("created_at").limit(10000),
    // Tabel dari SQL 018; kalau belum ada hasilnya null.
    inPeriod(supabase.from("product_clicks").select("product_id,platform,created_at").eq("linktree_id", linktree.id)).order("created_at").limit(10000),
    supabase.from("links").select("id,title,platform").eq("linktree_id", linktree.id),
    supabase.from("products").select("id,title,platform").eq("linktree_id", linktree.id),
  ]);
  // Grafik dihitung dari event mentah (maks 10 ribu per jenis); ganti ke agregasi SQL kalau volumenya sudah sebesar itu.
  const days = insightDays(period.from, period.to).map((day) => ({ ...day, buys: 0 }));
  const dayMap = new Map(days.map((day) => [day.key, day]));
  viewEvents?.forEach((event) => { const day = dayMap.get(event.created_at.slice(0, 10)); if (day) day.views += 1; });
  clickEvents?.forEach((event) => { const day = dayMap.get(event.created_at.slice(0, 10)); if (day) day.clicks += 1; });
  productEvents?.forEach((event) => { const day = dayMap.get(event.created_at.slice(0, 10)); if (day) day.buys += 1; });
  const rank = <T extends { id: string; title: string; platform: string | null }>(items: T[] | null, ids: string[], fallback: string) => {
    const counts = new Map<string, number>(); ids.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    const byId = new Map((items ?? []).map((item) => [item.id, item]));
    return [...counts].map(([id, clicks]) => ({ title: byId.get(id)?.title || fallback, platform: byId.get(id)?.platform ?? null, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
  };
  const stores = new Map<string, number>(); productEvents?.forEach((event) => stores.set(event.platform, (stores.get(event.platform) ?? 0) + 1));
  return <InsightsDashboard
    period={period}
    days={days}
    totals={{ views: viewEvents?.length ?? 0, clicks: clickEvents?.length ?? 0, buys: productEvents?.length ?? 0, lifetimeViews: lifetimeViews ?? 0, lifetimeClicks: lifetimeClicks ?? 0 }}
    productsReady={productEvents !== null}
    topLinks={rank(links, (clickEvents ?? []).map((event) => event.link_id), "Deleted link")}
    topProducts={rank(products, (productEvents ?? []).map((event) => event.product_id), "Deleted product")}
    stores={[...stores].sort((a, b) => b[1] - a[1])}
  />;
}
