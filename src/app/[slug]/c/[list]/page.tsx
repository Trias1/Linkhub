import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileStyle } from "@/lib/profile-style";
import { loadPublicPage, publicProduct } from "@/lib/public-page";
import { fetchProducts, liveProducts } from "@/lib/products";
import { cssUrl } from "@/lib/css-url";
import { AffiliateNote, ProductCard, TrackView } from "../../public-profile-content";

type Params = { params: Promise<{ slug: string; list: string }> };

async function loadList(slug: string, listSlug: string) {
  const supabase = await createClient();
  const page = await loadPublicPage(supabase, slug);
  if (!page || !/^[a-z0-9-]{1,40}$/.test(listSlug)) return null;
  const { data: list } = await supabase.from("product_lists").select("title,product_ids").eq("linktree_id", page.profile.id).eq("slug", listSlug).maybeSingle();
  if (!list) return null;
  const live = new Map(liveProducts(await fetchProducts(supabase, page.profile.id, true)).map((item) => [item.id, item]));
  const products = ((list.product_ids ?? []) as string[]).map((id) => live.get(id)).filter((item) => item !== undefined);
  return { ...page, title: String(list.title), products };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, list } = await params;
  const data = await loadList(slug, list);
  if (!data) return {};
  const title = `${data.title} · ${data.name}`;
  const description = `${data.products.length} ${data.products.length === 1 ? "product" : "products"} from ${data.name}, with links to buy.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

// Daftar produk untuk satu video atau postingan ("Haul 12.12"): satu video = satu link.
export default async function ProductListPage({ params, searchParams }: Params & { searchParams: Promise<{ preview?: string }> }) {
  const [{ slug, list }, { preview }] = await Promise.all([params, searchParams]);
  const data = await loadList(slug, list);
  if (!data) notFound();
  const { profile, name, title, products } = data;
  const home = `/en/${slug}`;
  return <main className={`lh-profile font-${profile.page_font}`} style={profileStyle(profile)}>
    <div className="lh-page">
      <TrackView id={profile.id} track={preview !== "1"} />
      <Link className="lh-solo-head" href={home}>
        {profile.avatar_url ? <span className="lh-avatar" aria-hidden="true" style={{ backgroundImage: cssUrl(profile.avatar_url) }} /> : <span className="lh-avatar" aria-hidden="true">{name.slice(0, 1).toUpperCase() || "L"}</span>}
        <b>{name}</b>
      </Link>
      <section aria-labelledby="lh-list-title" className="lh-list-page">
        <div className="lh-section-title"><h1 id="lh-list-title">{title}</h1><span>{products.length} {products.length === 1 ? "product" : "products"}</span></div>
        {products.length ? <div className="lh-grid">{products.map((item) => <ProductCard key={item.id} en item={publicProduct(item)} />)}</div> : <p className="lh-empty">The products in this list are not available any more.</p>}
      </section>
      <Link className="lh-link button-outline radius-pill lh-solo-more" href={home}><span>See all products from {name}</span></Link>
      {products.length ? <p className="lh-note">Prices and stock follow the destination store.</p> : null}
      {products.length && profile.affiliate_notice ? <AffiliateNote /> : null}
      <Link className="lh-made" href="/">LinkHub by Trias</Link>
    </div>
  </main>;
}
