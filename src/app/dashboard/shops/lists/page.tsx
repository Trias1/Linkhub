import Link from "next/link";
import { getDashboardContext } from "@/lib/active-linktree";
import { fetchProducts, productStatus } from "@/lib/products";
import { siteOrigin } from "@/lib/site-url";
import { ListsWorkspace } from "./lists-workspace";

export const metadata = { title: "Video lists · LinkHub" };

export default async function ListsPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { supabase, linktree } = await getDashboardContext();
  const [{ data: lists, error: listError }, products, { data: categories }, origin, query] = await Promise.all([
    supabase.from("product_lists").select("id,title,slug,product_ids").eq("linktree_id", linktree.id).order("created_at", { ascending: false }),
    fetchProducts(supabase, linktree.id),
    supabase.from("shop_collections").select("id").eq("linktree_id", linktree.id).order("position"),
    siteOrigin(),
    searchParams,
  ]);
  const order = new Map((categories ?? []).map((item, index) => [item.id as string, index]));
  const sorted = [...products].sort((a, b) => (order.get(a.collection_id) ?? 0) - (order.get(b.collection_id) ?? 0));
  return <div className="lh-page-wrap">
    <header className="lh-dash-top"><div><h1>Products</h1><p>Lists of products for one video or post, each with its own link.</p></div></header>
    <nav className="lh-subnav" aria-label="Products"><Link href="/dashboard/shops">All products</Link><Link href="/dashboard/shops/lists" aria-current="page">Video lists</Link></nav>
    {listError ? <p className="lh-alert" role="alert">Video lists are not set up yet. Run SQL file 022 in Supabase.</p> : <ListsWorkspace
      lists={(lists ?? []).map((list) => ({ id: list.id as string, title: String(list.title), slug: String(list.slug), product_ids: (list.product_ids ?? []) as string[] }))}
      products={sorted.map((item) => ({ id: item.id, title: item.title, number: item.number, image_url: item.image_url, platform: item.platform, live: productStatus(item) === "live" }))}
      pageUrl={linktree.slug ? `${origin}/${linktree.slug}` : null}
      error={query.error}
      message={query.message}
    />}
  </div>;
}
