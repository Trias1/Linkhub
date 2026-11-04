import Link from "next/link";

// Kerangka halaman masuk/daftar/reset: bar atas dengan brand, lalu form di tengah. Sengaja polos.
export function AuthLayout({ tab, title, subtitle, error, message, children }: { tab?: "login" | "signup"; title: string; subtitle?: string; error?: string; message?: string; children: React.ReactNode }) {
  return <main className="lh-auth">
    <header className="lh-auth-bar"><Link className="lh-brand" href="/en">Link<b>Hub</b></Link>{tab ? null : <Link href="/en/login">Sign in</Link>}</header>
    <section className="lh-auth-panel">
      <div className="lh-auth-card">
        {tab ? <nav className="lh-tabs" aria-label="Account"><Link href="/en/login" aria-current={tab === "login" ? "page" : undefined}>Sign in</Link><Link href="/en/signup" aria-current={tab === "signup" ? "page" : undefined}>Sign up</Link></nav> : null}
        <h1>{title}</h1>
        {subtitle ? <p className="lh-auth-sub">{subtitle}</p> : null}
        {error ? <p className="lh-alert" role="alert">{error}</p> : null}
        {message ? <p className="lh-ok" role="status">{message}</p> : null}
        {children}
      </div>
      <p className="lh-auth-about">LinkHub is a free shop page for people who sell on Shopee, Tokopedia and TikTok Shop.</p>
    </section>
  </main>;
}
