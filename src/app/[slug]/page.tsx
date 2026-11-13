import { profileStyle } from "@/lib/profile-style";
import { iconPlatform, linkDomain } from "@/lib/link-platform";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { daysAgoIso, endsSoon, fetchProducts, liveProducts, productBadges } from "@/lib/products";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicProfileContent } from "./public-profile-content";
import { getLocale } from "@/lib/i18n-server";

export async function generateMetadata({ params }: { params:Promise<{ slug:string }> }):Promise<Metadata> {
  const { slug }=await params; const supabase=await createClient(); const locale=await getLocale();
  const { data:profile }=await supabase.from("linktrees").select("id,name,bio,seo_title,seo_description").eq("slug",slug).single();
  if(!profile) return {};
  const { data:header }=await supabase.from("linktree_headers").select("title,bio").eq("linktree_id",profile.id).maybeSingle();
  const publicTitle=header?.title||profile.name; const publicBio=header?.bio??profile.bio;
  const title=profile.seo_title||publicTitle; const description=profile.seo_description||publicBio||(locale==="en"?`Visit ${publicTitle} on LinkHub`:`Kunjungi ${publicTitle} di LinkHub`);
  return {title,description,openGraph:{title,description,type:"website"},twitter:{card:"summary_large_image",title,description}};
}

export default async function PublicProfile({ params, searchParams }: { params:Promise<{ slug:string }>; searchParams:Promise<{ preview?:string; no?:string }> }) {
  const { slug }=await params; const { preview, no }=await searchParams; const supabase=await createClient(); const locale=await getLocale();
  const { data:profile }=await supabase.from("linktrees").select("id,name,bio,avatar_url,background_color,text_color,button_color,title_style,title_color,wallpaper_style,button_style,button_roundness,button_text_color,page_font,custom_footer").eq("slug",slug).single();
  if(!profile) notFound();
  const [{data:header},{data:linkCollections},{data:links},{data:shopCollections},products]=await Promise.all([
    supabase.from("linktree_headers").select("title,bio").eq("linktree_id",profile.id).maybeSingle(),
    supabase.from("link_collections").select("id,title").eq("linktree_id",profile.id).order("position").order("created_at"),
    supabase.from("links").select("id,collection_id,title,platform,url").eq("linktree_id",profile.id).eq("is_active",true).order("position").order("created_at"),
    supabase.from("shop_collections").select("id,title").eq("linktree_id",profile.id).order("position").order("created_at"),
    fetchProducts(supabase,profile.id,true),
  ]);
  // Pemilik bisa membaca produk terjadwal lewat RLS, jadi saring juga di sini.
  // Urutan di halaman publik sama dengan dashboard: per kategori (urutan kategori), lalu urutan produk di dalamnya.
  const categoryOrder=new Map((shopCollections??[]).map((item,index)=>[item.id,index]));
  const visible=liveProducts(products).sort((a,b)=>(categoryOrder.get(a.collection_id)??0)-(categoryOrder.get(b.collection_id)??0));
  // Klik Buy hanya bisa dibaca pemilik (RLS); label "Popular" dihitung di server dengan service role.
  const admin=createAdminClient();
  const {data:clicks}=admin?await admin.from("product_clicks").select("product_id").eq("linktree_id",profile.id).gte("created_at",daysAgoIso(7)).order("created_at",{ascending:false}).limit(5000):{data:null};
  const badges=productBadges(visible,(clicks??[]).map((row)=>row.product_id as string));
  const style=profileStyle(profile);
  return <main className={`lh-profile font-${profile.page_font}`} style={style}><PublicProfileContent track={preview!=="1"} locale={locale} profile={{id:profile.id,name:header?.title||profile.name,bio:header?.bio??profile.bio,avatar_url:profile.avatar_url,title_style:profile.title_style,button_style:profile.button_style,button_roundness:profile.button_roundness,custom_footer:profile.custom_footer}} linkCollections={linkCollections??[]} links={(links??[]).map(({url,...link})=>{const platform=iconPlatform({platform:link.platform,url});return {...link,platform,domain:platform==="website"?linkDomain(url):null};})} shopCollections={shopCollections??[]} initialSearch={/^\d{1,6}$/.test(no??"")?no!:""} products={visible.map(({id,collection_id,platform,title,price,image_url,compare_price,is_featured,ends_at,number})=>({id,collection_id,platform,title,price,image_url,compare_price,is_featured,ends_at,number,badge:badges.get(id)??null,ends:endsSoon(ends_at)}))}/></main>;
}
