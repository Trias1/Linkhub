import { getDashboardContext } from "@/lib/active-linktree";
import { daysAgoIso, fetchProducts } from "@/lib/products";
import { extractLink } from "@/lib/link-platform";
import { siteOrigin } from "@/lib/site-url";
import { shopeeConfigured } from "@/lib/shopee-affiliate";
import { ProductsWorkspace } from "./shop-workspace";

export const metadata = { title: "Products · LinkHub" };
// Tambah banyak link dan import CSV bisa makan waktu lebih dari 10 detik.
export const maxDuration = 60;

export default async function ShopsPage({ searchParams }: { searchParams:Promise<{ error?:string; message?:string; url?:string; text?:string; title?:string }> }) {
  const { supabase, linktree, isAdmin } = await getDashboardContext();
  const since = daysAgoIso(7);
  const [{ data: collections }, products, { data: clicks }] = await Promise.all([
    supabase.from("shop_collections").select("id,title,position").eq("linktree_id",linktree.id).order("position"),
    fetchProducts(supabase, linktree.id),
    // Tabel dari SQL 018; kalau belum ada hasilnya kosong.
    supabase.from("product_clicks").select("product_id,platform").eq("linktree_id",linktree.id).gte("created_at",since).limit(20000),
  ]);
  const [query, origin]=await Promise.all([searchParams, siteOrigin()]);
  // Dari menu Share HP (manifest share_target): link bisa datang di "url" atau di dalam "text".
  const shared = [query.url, query.text, query.title].map((value) => extractLink(String(value ?? "").slice(0, 2000))).find((value) => /^https:\/\//.test(value)) ?? "";
  const byProduct: Record<string, number> = {}; const byPlatform: Record<string, number> = {};
  for (const click of clicks ?? []) { byProduct[click.product_id] = (byProduct[click.product_id] ?? 0) + 1; byPlatform[click.platform] = (byPlatform[click.platform] ?? 0) + 1; }
  return <ProductsWorkspace key={`${products.length}:${(collections??[]).length}:${shared}`} sharedLink={shared} origin={origin} affiliateReady={isAdmin && shopeeConfigured()} slug={linktree.slug} error={query.error} message={query.message} collections={collections??[]} products={products} clicksByProduct={byProduct} clicksByPlatform={byPlatform} statsReady={clicks !== null}/>;
}
