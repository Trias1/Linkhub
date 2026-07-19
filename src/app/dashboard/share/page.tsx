import Link from "next/link";
import { getDashboardContext } from "@/lib/active-linktree";
import { ShareSettingsForm } from "./share-settings-form";

export default async function ShareSettingsPage({ searchParams }: { searchParams:Promise<{ error?:string;message?:string }> }) {
  const { supabase,linktree }=await getDashboardContext();
  const { data:profile }=await supabase.from("linktrees").select("name,slug,seo_title,seo_description,share_image_color").eq("id",linktree.id).single();
  const query=await searchParams;
  return <><header className="dashboard-topbar"><div><Link className="back-link" href="/dashboard/links">← Back</Link><p className="section-label">Share</p><h1>Share settings</h1></div></header>{query.error?<p className="notice error">{query.error}</p>:null}{query.message?<p className="notice">{query.message}</p>:null}<ShareSettingsForm name={profile?.name||"Linktree"} slug={profile?.slug??null} initial={{title:profile?.seo_title||"",description:profile?.seo_description||"",color:profile?.share_image_color||"#171712"}}/></>;
}