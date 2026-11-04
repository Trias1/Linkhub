import { getDashboardContext } from "@/lib/active-linktree";
import { DashboardSidebar } from "./sidebar";
import { getLocale } from "@/lib/i18n-server";
import { siteOrigin } from "@/lib/site-url";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, linktree, linktrees, isAdmin } = await getDashboardContext();
  const [locale, origin] = await Promise.all([getLocale(), siteOrigin()]);
  return <div className="lh-app"><DashboardSidebar email={user.email || ""} isAdmin={isAdmin} active={linktree} linktrees={linktrees} locale={locale} pageUrl={linktree.slug ? `${origin}/${linktree.slug}` : null} /><main className="lh-main">{children}</main></div>;
}
