import { getDashboardContext } from "@/lib/active-linktree";
import { LinksWorkspace } from "./links-workspace";

export const metadata = { title: "Links · LinkHub" };

export default async function LinksPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { supabase, linktree } = await getDashboardContext();
  const [{ data: collections }, { data: links }, query] = await Promise.all([
    supabase.from("link_collections").select("id,title,position").eq("linktree_id", linktree.id).order("position"),
    supabase.from("links").select("id,collection_id,title,url,platform,is_active").eq("linktree_id", linktree.id).order("position").order("created_at"),
    searchParams,
  ]);
  return <LinksWorkspace key={JSON.stringify([collections, links])} slug={linktree.slug} error={query.error} message={query.message} collections={collections ?? []} links={links ?? []} />;
}
