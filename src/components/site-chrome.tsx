import Link from "next/link";
import { AccountLinks } from "@/components/account-links";

// Header dan footer halaman publik LinkHub (landing, privacy, terms).
export function SiteHeader() {
  return <header className="lh-land-nav lh-land-wrap">
    <Link className="lh-brand" href="/en">Link<b>Hub</b></Link>
    <nav aria-label="Account"><AccountLinks /></nav>
  </header>;
}

export function SiteFooter() {
  return <footer className="lh-land-foot">
    <div className="lh-land-wrap">
      <nav aria-label="Footer"><Link className="lh-brand" href="/en">Link<b>Hub</b></Link><Link href="/en/privacy">Privacy</Link><Link href="/en/terms">Terms</Link><Link href="/en/login">Sign in</Link></nav>
      <Link className="lh-btn small" href="/en/signup">Create a page</Link>
    </div>
  </footer>;
}
