import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileStyle } from "@/lib/profile-style";
import { liveProductByNumber, loadPublicPage, publicProduct } from "@/lib/public-page";
import { formatRupiah } from "@/lib/rupiah";
import { isCommercePlatform, platformLabel } from "@/lib/commerce-platforms";
import { cssUrl } from "@/lib/css-url";
import { BuyButton, Price, Thumb, TrackView, discount } from "../../public-profile-content";

type Params = { params: Promise<{ slug: string; no: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, no } = await params; const supabase = await createClient();
  const page = await loadPublicPage(supabase, slug);
  const product = page ? await liveProductByNumber(supabase, page.profile.id, no) : null;
  if (!page || !product) return {};
  const title = `${product.title} · ${page.name}`;
  const store = isCommercePlatform(product.platform) ? ` on ${platformLabel(product.platform)}` : "";
  const description = `${product.price ? `${formatRupiah(product.price)}. ` : ""}Number ${product.number} on ${page.name}'s page. Tap to buy${store}.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

// Link khusus satu produk ("/zulf/p/12") untuk dibagikan di WhatsApp atau komentar.
export default async function ProductPage({ params, searchParams }: Params & { searchParams: Promise<{ preview?: string }> }) {
  const [{ slug, no }, { preview }] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const page = await loadPublicPage(supabase, slug);
  if (!page) notFound();
  const found = await liveProductByNumber(supabase, page.profile.id, no);
  const product = found ? publicProduct(found) : null;
  const { profile, name } = page;
  const home = `/en/${slug}`;

  return <main className={`lh-profile font-${profile.page_font}`} style={profileStyle(profile)}>
    <div className="lh-page lh-solo">
      <TrackView id={profile.id} track={preview !== "1"} />
      <Link className="lh-solo-head" href={home}>
        {profile.avatar_url ? <span className="lh-avatar" aria-hidden="true" style={{ backgroundImage: cssUrl(profile.avatar_url) }} /> : <span className="lh-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase() || "L"}</span>}
        <b>{name}</b>
      </Link>
      {product ? <article className="lh-solo-card">
        <span className="lh-thumb-wrap"><Thumb item={product} />{product.number ? <span className="lh-no">{product.number}</span> : null}</span>
        <div>
          <h1>{product.title}</h1>
          <div className="lh-meta"><Price item={product} />{discount(product) ? <span className="lh-off">-{discount(product)}%</span> : null}</div>
          {product.ends ? <p className="lh-ends">{product.ends}</p> : null}
          <BuyButton item={product} en />
        </div>
      </article> : <p className="lh-empty">This product is not available any more.</p>}
      <Link className="lh-link button-outline radius-pill lh-solo-more" href={home}><span>See all products from {name}</span></Link>
      {product ? <p className="lh-note">Prices and stock follow the destination store.</p> : null}
      <Link className="lh-made" href="/">LinkHub by Trias</Link>
    </div>
  </main>;
}
