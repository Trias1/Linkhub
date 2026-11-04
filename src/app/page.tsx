import type { Metadata } from "next";
import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { platformColor, platformLabel } from "@/lib/commerce-platforms";

export const metadata: Metadata = {
  title: "LinkHub — a free shop page for Shopee, Tokopedia and TikTok Shop sellers",
  description: "Put your marketplace products, prices and promos on one page with buy buttons, and see which products get the taps. Free, with no paid plan.",
};

// Contoh halaman di bingkai HP: data contoh statis, dirender dengan kelas halaman publik yang asli.
const stores = [["shopee", "Rani Home Official"], ["tokopedia", "ranihome"], ["tiktok-shop", "@rani.rumah"], ["facebook", "Marketplace"]];
const products = [
  { title: "Stainless tumbler, 1 litre, keeps cold for 24 hours", price: "Rp65.000", platform: "tokopedia", icon: "M8 3h8l-1 18H9zM8 7h8" },
  { title: "Kitchen knife set, 6 pieces with wooden block", price: "Rp112.000", platform: "shopee", icon: "M5 19 17 7l2 2L7 21zM14 4l6 6" },
  { title: "Motion sensor night light, USB rechargeable", price: "Rp48.500", platform: "lazada", icon: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5V16h8v-2.5A6 6 0 0 0 12 3z" },
  { title: "Clear fridge organiser, set of 4", price: "Rp57.000", platform: "tiktok-shop", icon: "M4 4h16v16H4zM4 12h16M12 4v16" },
];
const profileVars = { background: "#F5F4EC", "--profile-bg": "#F5F4EC", "--profile-text": "#171712", "--profile-button": "#171712", "--profile-button-text": "#FFFFFF", "--profile-title": "#171712" } as React.CSSProperties;

function Icon({ d, size = 28 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

function ExamplePage() {
  return <div className="lh-phone"><div className="lh-profile lh-mini font-geist" style={profileVars}><div className="lh-page">
    <header className="lh-head"><span className="lh-avatar">RA</span><h1>Rani Home &amp; Kitchen</h1><p>Home and kitchen things I use myself. Tap Buy to go straight to the store.</p></header>
    <div className="lh-stores">{stores.map(([platform, name]) => <span className="lh-store" key={platform}><span className="lh-mark" style={{ background: platformColor(platform) }}><PlatformIcon platform={platform} size={18} /></span><span><b>{platformLabel(platform)}</b><small>{name}</small></span></span>)}</div>
    <div className="lh-section-title"><h2>On sale</h2></div>
    <div className="lh-featured"><span className="lh-thumb"><Icon d="M4 3h16v18H4zM4 9h16M4 15h16" size={40} /></span><div>
      <span className="lh-flag">-40%</span><h3>Rotating spice rack, 2 tiers, 16 jars</h3>
      <span className="lh-price">Rp89.000<s>Rp149.000</s></span><p className="lh-until">Until 11 Nov</p>
      <span className="lh-buy" style={{ background: platformColor("shopee") }}>Buy on Shopee</span>
    </div></div>
    <div className="lh-section-title"><h2>Products</h2><span>{products.length} products</span></div>
    <div className="lh-grid">{products.map((item) => <div className="lh-card" key={item.title}><span className="lh-thumb"><Icon d={item.icon} /></span><h3>{item.title}</h3><div className="lh-meta"><span className="lh-price">{item.price}</span></div><span className="lh-buy" style={{ background: platformColor(item.platform) }}>Buy on {platformLabel(item.platform)}</span></div>)}</div>
    <div className="lh-links"><div className="lh-link-group"><h2>Contact</h2><span className="lh-link button-solid radius-rounded"><PlatformIcon platform="whatsapp" /><span>Order on WhatsApp</span></span><span className="lh-link button-solid radius-rounded"><PlatformIcon platform="instagram" /><span>Instagram</span></span></div></div>
    <p className="lh-note">Prices and stock follow the destination store.</p>
  </div></div></div>;
}

const storeBars = [["shopee", 186], ["tiktok-shop", 121], ["tokopedia", 69]] as const;

export default function Home() {
  return <div className="lh-landing">
    <header className="lh-land-nav lh-land-wrap">
      <Link className="lh-brand" href="/en">Link<b>Hub</b></Link>
      <nav aria-label="Account"><Link href="/en/login">Sign in</Link><Link className="lh-btn small" href="/en/signup">Create a page</Link></nav>
    </header>

    <main>
      <section className="lh-land-wrap lh-land-hero">
        <div>
          <h1>A shop page for your Shopee, Tokopedia and TikTok Shop products.</h1>
          <p>Paste your product links, add prices and promos, and put one link in your bio. Buyers tap Buy and check out in the store they already use.</p>
          <p>LinkHub tells you which products get the taps, so you know what to post next.</p>
          <div className="lh-land-actions"><Link className="lh-btn" href="/en/signup">Create a page</Link><Link href="/en/login">I already have a page</Link></div>
          <p className="lh-land-free">It is free. There is no paid plan and nothing is locked. You can have up to three pages, for example one for your own shop and one for affiliate picks.</p>
        </div>
        <figure>
          <ExamplePage />
          <figcaption>An example page, as buyers see it on their phone.</figcaption>
        </figure>
      </section>

      <section className="lh-land-part" aria-labelledby="how">
        <div className="lh-land-wrap lh-land-split">
          <div>
            <h2 id="how">How it works</h2>
            <ol className="lh-land-how">
              <li><b>Paste a product link.</b><span>From Shopee, Tokopedia, TikTok Shop, Lazada, Facebook or any website. The store is recognised and the button says &ldquo;Buy on Shopee&rdquo;.</span></li>
              <li><b>Add the price and a photo.</b><span>Optional: a crossed-out price, a category, and the dates a promo runs. When the promo ends, the product hides itself.</span></li>
              <li><b>Share your link.</b><span>Put it in your Instagram or TikTok bio, send it on WhatsApp, or print the QR code on your packaging.</span></li>
            </ol>
          </div>
          <div className="lh-land-shot" aria-label="Part of the dashboard" role="img">
            <header>Dashboard · Add a product</header>
            <div>
              <span className="lh-land-in">https://shopee.co.id/rak-bumbu-putar-2-tingkat-i.1234.5678</span>
              <span className="lh-land-det"><i style={{ background: platformColor("shopee") }} /><b>Shopee</b>&nbsp;detected. The button will say &ldquo;Buy on Shopee&rdquo;.</span>
              <span className="lh-land-label">Product name<span className="lh-land-in">Rotating spice rack, 2 tiers, 16 jars</span></span>
              <span className="lh-land-two"><span className="lh-land-label">Price<span className="lh-land-in">Rp89.000</span></span><span className="lh-land-label">Original price<span className="lh-land-in"><s>Rp149.000</s></span></span></span>
              <span className="lh-land-two"><span className="lh-land-label">Category<span className="lh-land-in">Kitchen</span></span><span className="lh-land-label">Until<span className="lh-land-in">11 Nov 2026</span></span></span>
            </div>
          </div>
        </div>
      </section>

      <section className="lh-land-part" aria-labelledby="get">
        <div className="lh-land-wrap">
          <h2 id="get">What you get</h2>
          <dl className="lh-land-get">
            <div><dt>Buy buttons per store</dt><dd><p>Every product has its own button in the store&rsquo;s colour, so buyers know where they are going. Your store links sit at the top of the page.</p><span className="lh-buy" style={{ maxWidth: 220, background: platformColor("shopee") }}>Buy on Shopee</span></dd></div>
            <div><dt>Clicks you can act on</dt><dd><p>See taps per product and per store for the last day, week or month. Export them as a spreadsheet if you want.</p>
              <div className="lh-land-bars" role="img" aria-label="Example: Shopee 186 buy clicks, TikTok Shop 121, Tokopedia 69">{storeBars.map(([platform, value]) => <div key={platform}><span>{platformLabel(platform)}</span><i><i style={{ width: `${(value / 240) * 100}%`, background: platformColor(platform) }} /></i><b>{value}</b></div>)}</div></dd></div>
            <div><dt>Promos with an end date</dt><dd><p>Mark a product as on sale with a start and end date. It moves to the top while the promo runs and disappears after.</p>
              <span className="lh-land-mini"><span className="lh-thumb"><Icon d="M4 3h16v18H4zM4 9h16M4 15h16" size={24} /></span><span><span className="lh-off">-40%</span> Rotating spice rack<br /><b>Rp89.000</b> <small>until 11 Nov</small></span></span></dd></div>
            <div><dt>Own products and affiliate links</dt><dd><p>Mix your own items with affiliate links. Categories become filter buttons, and a short note tells buyers that price and stock follow the store.</p></dd></div>
            <div><dt>Your other links too</dt><dd><p>WhatsApp, Instagram, TikTok and any other link, grouped under headings like &ldquo;Contact&rdquo;. Colours, button shape and font are yours to pick.</p></dd></div>
          </dl>
        </div>
      </section>

      <section className="lh-land-part" aria-labelledby="faq">
        <div className="lh-land-wrap">
          <h2 id="faq">Questions</h2>
          <div className="lh-land-faq">
            <details open><summary>Is it really free?</summary><p>Yes. All features are free, and there is no paid plan.</p></details>
            <details><summary>Do buyers pay through LinkHub?</summary><p>No. The Buy button opens the product in the store you linked. Payment, vouchers and shipping stay there.</p></details>
            <details><summary>Can I use affiliate links?</summary><p>Yes. Paste the affiliate link as the product link.</p></details>
            <details><summary>Can other people change my page?</summary><p>No. Only you can change your page. You can also turn on a code from an authenticator app when you sign in.</p></details>
          </div>
        </div>
      </section>
    </main>

    <footer className="lh-land-foot">
      <div className="lh-land-wrap">
        <nav aria-label="Footer"><span className="lh-brand">Link<b>Hub</b></span><Link href="/en/privacy">Privacy</Link><Link href="/en/terms">Terms</Link><Link href="/en/login">Sign in</Link></nav>
        <Link className="lh-btn small" href="/en/signup">Create a page</Link>
      </div>
    </footer>
  </div>;
}
