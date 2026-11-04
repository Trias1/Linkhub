import { SiteFooter, SiteHeader } from "@/components/site-chrome";

// Kerangka halaman Privacy dan Terms: satu kolom teks, tanggal di bawah judul.
export function LegalDoc({ title, updated, intro, children }: { title: string; updated: string; intro: string; children: React.ReactNode }) {
  return <div className="lh-landing">
    <SiteHeader />
    <main className="lh-land-wrap">
      <article className="lh-doc">
        <h1>{title}</h1>
        <p className="lh-doc-date">Last updated {updated}</p>
        <p className="lh-doc-intro">{intro}</p>
        {children}
      </article>
    </main>
    <SiteFooter />
  </div>;
}
