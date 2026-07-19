import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: linktrees }, { data: account }] = await Promise.all([
    supabase.from("linktrees").select("id,name,slug,avatar_url,created_at").eq("owner_id", user.id).order("created_at"),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);
  if (!linktrees?.length) redirect("/login?error=Linktree awal belum dibuat");
  const activeId = (await cookies()).get("active_linktree_id")?.value;
  const linktree = linktrees.find((item) => item.id === activeId) ?? linktrees[0];
  return { supabase, user, linktree, linktrees, isAdmin:Boolean(account?.is_admin) };
}