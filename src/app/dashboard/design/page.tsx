import Link from "next/link";
import { getDashboardContext } from "@/lib/active-linktree";
import type { ThemePreset } from "@/lib/themes";
import { saveTheme } from "../actions";
import { ThemeFields } from "../theme-fields";

export default async function DesignPage({ searchParams }: { searchParams:Promise<{ error?:string;message?:string }> }) {
  const { supabase,linktree }=await getDashboardContext();
  const { data:profile }=await supabase.from("linktrees").select("theme_preset,background_color,text_color,button_color").eq("id",linktree.id).single();
  const query=await searchParams;
  return <><header className="dashboard-topbar"><div><p className="section-label">My Linktree</p><h1>Design</h1></div><Link className="button-link" href="/dashboard/design/customize">Theme custom →</Link></header>{query.error?<p className="notice error">{query.error}</p>:null}{query.message?<p className="notice">{query.message}</p>:null}<form action={saveTheme} className="panel stack"><p className="section-label">Theme</p><h2>Warna halaman</h2><ThemeFields preset={(profile?.theme_preset??"peach") as ThemePreset} colors={{background:profile?.background_color??"#FFF1E6",text:profile?.text_color??"#3D2C2A",button:profile?.button_color??"#FFB4A2"}}/><button>Simpan tema</button></form></>;
}