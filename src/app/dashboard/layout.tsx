import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDashboardContext } from "@/lib/active-linktree";
import { hashTrustedToken } from "@/lib/trusted-device";
import { DashboardSidebar } from "./sidebar";
import { getLocale } from "@/lib/i18n-server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, linktree, linktrees, isAdmin, supabase } = await getDashboardContext();
  const locale=await getLocale();
  const { data:aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
    const token = (await cookies()).get("trusted_device")?.value;
    const { data:trusted } = token ? await supabase.from("trusted_devices").select("id").eq("user_id",user.id).eq("token_hash",await hashTrustedToken(token)).gt("expires_at",new Date().toISOString()).maybeSingle() : { data:null };
    if (!trusted) redirect("/login/mfa");
  }
  return <main className="dashboard-app"><DashboardSidebar name={linktree.name} avatarUrl={linktree.avatar_url} email={user.email || ""} slug={linktree.slug} isAdmin={isAdmin} activeId={linktree.id} linktrees={linktrees} locale={locale} /><div className="dashboard-content">{children}</div></main>;
}


