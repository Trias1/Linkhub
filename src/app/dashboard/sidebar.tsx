"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logout } from "@/app/auth/actions";
import { DashboardIcon } from "@/components/dashboard-icon";
import { type Locale, withLocale, withoutLocale } from "@/lib/i18n";
import { switchLinktree } from "./actions";
import { cssUrl } from "@/lib/css-url";

type Linktree = { id: string; name: string; slug: string | null; avatar_url?: string | null };
type Icon = Parameters<typeof DashboardIcon>[0]["name"];
const items: { href: string; label: string; short: string; icon: Icon; mobile: boolean }[] = [
  { href: "/dashboard/shops", label: "Products", short: "Products", icon: "shop", mobile: true },
  { href: "/dashboard/links", label: "Links", short: "Links", icon: "links", mobile: true },
  { href: "/dashboard/design", label: "Design", short: "Design", icon: "design", mobile: true },
  { href: "/dashboard/insights", label: "Insights", short: "Insights", icon: "insights", mobile: true },
  { href: "/dashboard/share", label: "Share & QR", short: "Share", icon: "share", mobile: true },
  { href: "/dashboard/account", label: "Account & security", short: "Account", icon: "account", mobile: false },
];

function Avatar({ tree }: { tree: Linktree }) {
  return tree.avatar_url ? <span className="lh-ava" style={{ backgroundImage: cssUrl(tree.avatar_url) }} aria-hidden="true" /> : <span className="lh-ava" aria-hidden="true">{tree.name.slice(0, 1).toUpperCase() || "L"}</span>;
}

// Menu Linktree aktif: ganti Linktree, buat baru, akun, admin, keluar. Dipakai di sidebar desktop dan bar atas HP.
function TreeMenu({ active, linktrees, isAdmin, email, locale }: { active: Linktree; linktrees: Linktree[]; isAdmin: boolean; email: string; locale: Locale }) {
  return <details className="lh-menu">
    <summary><Avatar tree={active} /><span className="lh-menu-copy"><b>{active.name || "My page"}</b><small>{active.slug ? `/${active.slug}` : "No address yet"}</small></span><DashboardIcon name="chevron" size={16} /></summary>
    <div className="lh-menu-pop">
      <p className="lh-menu-label">Your pages</p>
      {linktrees.map((tree) => <form action={switchLinktree} key={tree.id}><input type="hidden" name="linktree_id" value={tree.id} /><button type="submit" aria-current={tree.id === active.id ? "true" : undefined}><Avatar tree={tree} /><span className="lh-menu-copy"><b>{tree.name}</b><small>{tree.slug ? `/${tree.slug}` : "No address yet"}</small></span></button></form>)}
      {linktrees.length < 3 ? <Link href={withLocale("/dashboard/new", locale)}>+ New page</Link> : <span className="lh-menu-note">Up to 3 pages per account</span>}
      <hr />
      <p className="lh-menu-label">{email}</p>
      <Link href={withLocale("/dashboard/account", locale)}>Account &amp; security</Link>
      {isAdmin ? <Link href={withLocale("/admin", locale)}>Admin</Link> : null}
      <form action={logout}><button type="submit">Log out</button></form>
    </div>
  </details>;
}

export function DashboardSidebar({ email, isAdmin, active, linktrees, locale, pageUrl }: { email: string; isAdmin: boolean; active: Linktree; linktrees: Linktree[]; locale: Locale; pageUrl: string | null }) {
  const pathname = withoutLocale(usePathname());
  const current = (href: string) => pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined;
  // Tutup menu saat klik di luar atau setelah pindah halaman.
  useEffect(() => {
    const close = (event: PointerEvent) => document.querySelectorAll("details.lh-menu[open]").forEach((menu) => { if (!menu.contains(event.target as Node)) menu.removeAttribute("open"); });
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  useEffect(() => { document.querySelectorAll("details.lh-menu[open]").forEach((menu) => menu.removeAttribute("open")); }, [pathname]);
  const shortUrl = pageUrl?.replace(/^https?:\/\//, "");

  return <>
    <aside className="lh-side">
      <Link className="lh-brand" href={withLocale("/dashboard/shops", locale)}>Link<b>Hub</b></Link>
      <TreeMenu active={active} linktrees={linktrees} isAdmin={isAdmin} email={email} locale={locale} />
      <nav className="lh-nav" aria-label="Dashboard">{items.map((item) => <Link key={item.href} href={withLocale(item.href, locale)} aria-current={current(item.href)}><DashboardIcon name={item.icon} />{item.label}</Link>)}</nav>
      <div className="lh-pagecard">{pageUrl ? <><span>Your page</span><b>{shortUrl}</b><a className="lh-btn small secondary" href={pageUrl} target="_blank" rel="noopener noreferrer">Open page <DashboardIcon name="external" size={15} /></a></> : <><span>Your page has no address yet.</span><Link className="lh-btn small secondary" href={withLocale("/dashboard/account", locale)}>Set address</Link></>}</div>
    </aside>
    <header className="lh-mtop">
      <Link className="lh-brand" href={withLocale("/dashboard/shops", locale)}>Link<b>Hub</b></Link>
      <TreeMenu active={active} linktrees={linktrees} isAdmin={isAdmin} email={email} locale={locale} />
    </header>
    <nav className="lh-bottomnav" aria-label="Dashboard">{items.filter((item) => item.mobile).map((item) => <Link key={item.href} href={withLocale(item.href, locale)} aria-current={current(item.href)}><DashboardIcon name={item.icon} size={21} />{item.short}</Link>)}</nav>
  </>;
}
