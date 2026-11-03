import { getDashboardContext } from "@/lib/active-linktree";
import { DashboardSidebar } from "./sidebar";
import { getLocale } from "@/lib/i18n-server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, linktree, linktrees, isAdmin } = await getDashboardContext();
  const locale = await getLocale();
  return <main className="dashboard-app"><DashboardSidebar name={linktree.name} avatarUrl={linktree.avatar_url} email={user.email || ""} slug={linktree.slug} isAdmin={isAdmin} activeId={linktree.id} linktrees={linktrees} locale={locale} /><div className="dashboard-content">{children}</div></main>;
}
