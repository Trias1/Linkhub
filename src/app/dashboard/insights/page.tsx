import { getDashboardContext } from "@/lib/active-linktree";
import { insightDays, insightRange } from "@/lib/insights-range";
import { InsightsDashboard } from "./insights-dashboard";
import { getLocale } from "@/lib/i18n-server";

export default async function InsightsPage({ searchParams }: { searchParams:Promise<{ range?:string;from?:string;to?:string }> }) {
  const query=await searchParams;
  const locale=await getLocale();
  const period=insightRange(query.range,query.from,query.to);
  const { supabase,linktree }=await getDashboardContext();
  const [{ count:lifetimeViews },{ count:lifetimeClicks },{ count:lifetimeContacts },{ count:periodViews },{ count:periodClicks },{ count:periodContacts },{ data:viewEvents },{ data:clickEvents },{ data:recentContacts },{ data:links }]=await Promise.all([
    supabase.from("page_views").select("id",{count:"exact",head:true}).eq("linktree_id",linktree.id),
    supabase.from("link_clicks").select("id",{count:"exact",head:true}).eq("linktree_id",linktree.id),
    supabase.from("contacts").select("id",{count:"exact",head:true}).eq("linktree_id",linktree.id),
    supabase.from("page_views").select("id",{count:"exact",head:true}).eq("linktree_id",linktree.id).gte("created_at",period.from).lte("created_at",period.to),
    supabase.from("link_clicks").select("id",{count:"exact",head:true}).eq("linktree_id",linktree.id).gte("created_at",period.from).lte("created_at",period.to),
    supabase.from("contacts").select("id",{count:"exact",head:true}).eq("linktree_id",linktree.id).gte("created_at",period.from).lte("created_at",period.to),
    supabase.from("page_views").select("created_at").eq("linktree_id",linktree.id).gte("created_at",period.from).lte("created_at",period.to).order("created_at").limit(10000),
    supabase.from("link_clicks").select("link_id,created_at").eq("linktree_id",linktree.id).gte("created_at",period.from).lte("created_at",period.to).order("created_at").limit(10000),
    supabase.from("contacts").select("id,name,email,created_at").eq("linktree_id",linktree.id).gte("created_at",period.from).lte("created_at",period.to).order("created_at",{ascending:false}).limit(50),
    supabase.from("links").select("id,title").eq("linktree_id",linktree.id),
  ]);
  // ponytail: raw event charts cap at 10k rows; replace with SQL aggregation when a Linktree reaches that volume.
  const days=insightDays(period.from,period.to); const dayMap=new Map(days.map((day)=>[day.key,day]));
  viewEvents?.forEach((event)=>{const day=dayMap.get(event.created_at.slice(0,10));if(day)day.views+=1;});
  clickEvents?.forEach((event)=>{const day=dayMap.get(event.created_at.slice(0,10));if(day)day.clicks+=1;});
  const titleMap=new Map((links??[]).map((link)=>[link.id,link.title])); const counts=new Map<string,number>();
  clickEvents?.forEach((event)=>counts.set(event.link_id,(counts.get(event.link_id)??0)+1));
  const clickedLinks=[...counts].map(([id,total])=>({title:titleMap.get(id)||"Deleted link",clicks:total})).sort((a,b)=>b.clicks-a.clicks).slice(0,5);
  return <InsightsDashboard locale={locale} period={period} totals={{views:periodViews??0,clicks:periodClicks??0,contacts:lifetimeContacts??0,newContacts:periodContacts??0,lifetimeViews:lifetimeViews??0,lifetimeClicks:lifetimeClicks??0}} recentContacts={recentContacts??[]} days={days} clickedLinks={clickedLinks}/>;
}


