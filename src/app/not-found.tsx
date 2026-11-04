import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

// Dipakai untuk alamat halaman yang tidak ada (mis. salah ketik linkhub/nama-toko) dan notFound() lainnya.
export default function NotFound() {
  return <div className="lh-landing">
    <SiteHeader />
    <main className="lh-land-wrap">
      <article className="lh-doc">
        <h1>Page not found</h1>
        <p className="lh-doc-intro">There is no LinkHub page at this address. Check the spelling of the link, or ask the shop for their current link.</p>
        <div className="lh-land-actions"><Link className="lh-btn" href="/en">Go to LinkHub</Link><Link href="/en/signup">Make your own page</Link></div>
      </article>
    </main>
    <SiteFooter />
  </div>;
}
