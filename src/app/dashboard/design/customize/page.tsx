import Link from "next/link";
import { getDashboardContext } from "@/lib/active-linktree";
import { CustomizeForm } from "./customize-form";

export default async function CustomizePage({ searchParams }: { searchParams:Promise<{ error?:string;message?:string }> }) {
  const { supabase,linktree }=await getDashboardContext();
  const { data:profile }=await supabase.from("linktrees").select("name,bio,slug,avatar_url,title_style,title_color,wallpaper_style,background_color,button_style,button_roundness,button_color,button_text_color,page_font,text_color,custom_footer").eq("id",linktree.id).single();
  const query=await searchParams;
  return <><header className="dashboard-topbar"><div><Link className="back-link" href="/dashboard/design">← Back</Link><p className="section-label">Design</p><h1>Customize</h1></div></header>{query.error?<p className="notice error">{query.error}</p>:null}{query.message?<p className="notice">{query.message}</p>:null}<CustomizeForm initial={{name:profile?.name||"Linktree",slug:profile?.slug??null,bio:profile?.bio||"",avatar_url:profile?.avatar_url??null,title_style:profile?.title_style||"normal",title_color:profile?.title_color||"#3D2C2A",wallpaper_style:profile?.wallpaper_style||"solid",background_color:profile?.background_color||"#FFF1E6",button_style:profile?.button_style||"solid",button_roundness:profile?.button_roundness||"rounded",button_color:profile?.button_color||"#FFB4A2",button_text_color:profile?.button_text_color||"#3D2C2A",page_font:profile?.page_font||"geist",text_color:profile?.text_color||"#3D2C2A",custom_footer:profile?.custom_footer||""}}/></>;
}