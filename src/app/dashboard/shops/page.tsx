import { getDashboardContext } from "@/lib/active-linktree";
import { getLocale } from "@/lib/i18n-server";
import { ShopWorkspace } from "./shop-workspace";

export default async function ShopsPage({ searchParams }: { searchParams:Promise<{ error?:string }> }) {
  const { supabase, linktree } = await getDashboardContext();
  const locale=await getLocale();
  const [{ data: profile }, { data: collections }, { data: products }, { data: linkCollections }, { data: links }] = await Promise.all([
    supabase.from("linktrees").select("name,bio,slug,avatar_url,background_color,text_color,button_color").eq("id",linktree.id).single(),
    supabase.from("shop_collections").select("id,title,position").eq("linktree_id",linktree.id).order("position"),
    supabase.from("products").select("id,collection_id,platform,title,url,price,image_url,is_active").eq("linktree_id",linktree.id).order("position"),
    supabase.from("link_collections").select("id,title").eq("linktree_id",linktree.id).order("position"),
    supabase.from("links").select("id,collection_id,title,platform,is_active").eq("linktree_id",linktree.id).order("position"),
  ]);
  const query=await searchParams;
  return <>{query.error?<p className="notice error workspace-notice">{query.error}</p>:null}<ShopWorkspace locale={locale} key={(collections??[]).map((item)=>item.id).join(":")} initialCollections={collections??[]} products={products??[]} linkCollections={linkCollections??[]} links={links??[]} profile={{name:profile?.name||"Linktree",slug:profile?.slug??null,bio:profile?.bio||"",avatar_url:profile?.avatar_url??null,background_color:profile?.background_color||"#FFF1E6",text_color:profile?.text_color||"#3D2C2A",button_color:profile?.button_color||"#FFB4A2"}}/></>;
}
