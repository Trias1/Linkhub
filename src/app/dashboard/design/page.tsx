import { getDashboardContext } from "@/lib/active-linktree";
import { DesignEditor } from "./design-editor";

export const metadata = { title: "Design · LinkHub" };

export default async function DesignPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { supabase, linktree } = await getDashboardContext();
  const [{ data: profile }, { data: header }, query] = await Promise.all([
    supabase.from("linktrees").select("name,bio,avatar_url,title_style,title_color,wallpaper_style,background_color,button_style,button_roundness,button_color,button_text_color,page_font,text_color,custom_footer").eq("id", linktree.id).single(),
    supabase.from("linktree_headers").select("title,bio").eq("linktree_id", linktree.id).maybeSingle(),
    searchParams,
  ]);
  const initial = { title: header?.title || profile?.name || "My page", bio: header?.bio ?? profile?.bio ?? "", avatar_url: profile?.avatar_url ?? null, title_style: profile?.title_style || "normal", title_color: (profile?.title_color || "#3D2C2A").toUpperCase(), wallpaper_style: profile?.wallpaper_style || "solid", background_color: (profile?.background_color || "#FFF1E6").toUpperCase(), button_style: profile?.button_style || "solid", button_roundness: profile?.button_roundness || "rounded", button_color: (profile?.button_color || "#FFB4A2").toUpperCase(), button_text_color: (profile?.button_text_color || "#3D2C2A").toUpperCase(), page_font: profile?.page_font || "geist", text_color: (profile?.text_color || "#3D2C2A").toUpperCase(), custom_footer: profile?.custom_footer || "" };
  return <DesignEditor key={JSON.stringify(initial)} initial={initial} error={query.error} message={query.message} />;
}
