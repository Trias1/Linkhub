"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { formatRupiah } from "@/lib/rupiah";
import { isCommercePlatform, platformColor, platformLabel } from "@/lib/commerce-platforms";
import { formatEndDate } from "@/lib/products";
import type { Locale } from "@/lib/i18n";

type LinkCollection = { id: string; title: string };
type LinkItem = { id: string; collection_id: string | null; title: string; platform: string | null };
type ShopCollection = { id: string; title: string };
type Product = { id: string; collection_id: string; platform: string; title: string; price: string; image_url: string | null; compare_price: string; is_featured: boolean; ends_at: string | null };
type Profile = { id:string; name: string; bio: string; avatar_url: string | null; title_style: string; button_style: string; button_roundness: string; custom_footer: string };

const buyLabel = (platform: string, en: boolean) => isCommercePlatform(platform) ? `${en ? "Buy on" : "Beli di"} ${platformLabel(platform)}` : en ? "View product" : "Lihat produk";
const discount = (item: Product) => { const price = Number(item.price); const before = Number(item.compare_price); return price && before > price ? Math.round((1 - price / before) * 100) : 0; };

function Arrow() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>; }

function BuyButton({ item, en }: { item: Product; en: boolean }) {
  return <a className="lh-buy" href={`/api/product/${item.id}`} target="_blank" rel="noopener noreferrer sponsored" style={{ background: platformColor(item.platform) }}>{buyLabel(item.platform, en)}<Arrow /></a>;
}

function Price({ item }: { item: Product }) {
  if (!item.price) return null;
  return <span className="lh-price">{formatRupiah(item.price)}{discount(item) ? <s>{formatRupiah(item.compare_price)}</s> : null}</span>;
}

function Thumb({ item }: { item: Product }) {
  return item.image_url ? <span className="lh-thumb" role="img" aria-label={item.title} style={{ backgroundImage: `url(${item.image_url})` }} /> : <span className="lh-thumb lh-thumb-empty"><PlatformIcon platform={item.platform} size={28} /></span>;
}

export function PublicProfileContent({ profile, linkCollections, links, shopCollections, products, locale, track = true }: { locale:Locale; track?: boolean; profile: Profile; linkCollections: LinkCollection[]; links: LinkItem[]; shopCollections: ShopCollection[]; products: Product[] }) {
  const en = locale === "en";
  const [category, setCategory] = useState("all");
  const [term, setTerm] = useState("");
  // Pratinjau di dashboard (?preview=1) tidak dihitung sebagai kunjungan.
  useEffect(() => { if (track) void fetch(`/api/view/${profile.id}`, { method: "POST" }); }, [profile.id, track]);

  const stores = links.filter((item) => isCommercePlatform(item.platform));
  const otherLinks = links.filter((item) => !isCommercePlatform(item.platform));
  const featured = products.filter((item) => item.is_featured).slice(0, 3);
  const categories = shopCollections.filter((collection) => products.some((item) => item.collection_id === collection.id));
  const shown = useMemo(() => { const query = term.trim().toLowerCase(); return products.filter((item) => (category === "all" || item.collection_id === category) && (!query || item.title.toLowerCase().includes(query))); }, [products, category, term]);
  const linkGroups = [...linkCollections.map((collection) => ({ ...collection, items: otherLinks.filter((item) => item.collection_id === collection.id) })), { id: "none", title: "", items: otherLinks.filter((item) => !item.collection_id || !linkCollections.some((collection) => collection.id === item.collection_id)) }].filter((group) => group.items.length);
  const buttonClass = `lh-link button-${profile.button_style} radius-${profile.button_roundness}`;

  return <div className="lh-page">
    <header className="lh-head">
      {profile.avatar_url ? <span className="lh-avatar" role="img" aria-label={profile.name} style={{ backgroundImage: `url(${profile.avatar_url})` }} /> : <span className="lh-avatar" aria-hidden="true">{profile.name.slice(0, 1).toUpperCase() || "L"}</span>}
      <h1 className={`title-${profile.title_style}`}>{profile.name}</h1>
      {profile.bio ? <p>{profile.bio}</p> : null}
    </header>

    {stores.length ? <nav className="lh-stores" aria-label={en ? "My stores" : "Toko saya"}>{stores.map((item) => <a className="lh-store" href={`/api/click/${item.id}`} target="_blank" rel="noopener noreferrer" key={item.id}><span className="lh-mark" style={{ background: platformColor(item.platform) }}><PlatformIcon platform={item.platform} size={18} /></span><span><b>{platformLabel(item.platform)}</b><small>{item.title}</small></span></a>)}</nav> : null}

    {featured.length ? <section aria-labelledby="lh-promo"><div className="lh-section-title"><h2 id="lh-promo">{en ? "On sale" : "Lagi promo"}</h2></div>{featured.map((item) => <article className="lh-featured" key={item.id}>
      <Thumb item={item} />
      <div>
        {discount(item) ? <span className="lh-flag">-{discount(item)}%</span> : <span className="lh-flag">{en ? "Pick" : "Pilihan"}</span>}
        <h3>{item.title}</h3>
        <Price item={item} />
        {item.ends_at ? <p className="lh-until">{en ? "Until" : "Promo sampai"} {formatEndDate(item.ends_at, locale)}</p> : null}
        <BuyButton item={item} en={en} />
      </div>
    </article>)}</section> : null}

    {products.length ? <section aria-labelledby="lh-products">
      <div className="lh-section-title"><h2 id="lh-products">{en ? "Products" : "Semua produk"}</h2><span>{shown.length} {en ? "products" : "produk"}</span></div>
      {products.length > 4 || categories.length > 1 ? <div className="lh-tools">
        {products.length > 4 ? <label className="lh-search"><span className="sr-only">{en ? "Search products" : "Cari produk"}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg><input type="search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder={en ? "Search products" : "Cari produk"} /></label> : null}
        {categories.length > 1 ? <div className="lh-chips" role="group" aria-label={en ? "Categories" : "Kategori"}><button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>{en ? "All" : "Semua"}</button>{categories.map((collection) => <button type="button" aria-pressed={category === collection.id} onClick={() => setCategory(collection.id)} key={collection.id}>{collection.title}</button>)}</div> : null}
      </div> : null}
      <div className="lh-grid">{shown.map((item) => <article className="lh-card" key={item.id}>
        <Thumb item={item} />
        <h3>{item.title}</h3>
        <div className="lh-meta"><Price item={item} />{discount(item) ? <span className="lh-off">-{discount(item)}%</span> : null}</div>
        <BuyButton item={item} en={en} />
      </article>)}</div>
      {!shown.length ? <p className="lh-empty">{en ? "No products found. Try another word." : "Produk tidak ditemukan. Coba kata lain atau pilih \"Semua\"."}</p> : null}
    </section> : null}

    {linkGroups.length ? <section className="lh-links" aria-label={en ? "Links" : "Tautan"}>{linkGroups.map((group) => <div className="lh-link-group" key={group.id}>{group.title ? <h2>{group.title}</h2> : null}{group.items.map((item) => <a className={buttonClass} href={`/api/click/${item.id}`} key={item.id} rel="noopener noreferrer" target="_blank"><PlatformIcon platform={item.platform} /><span>{item.title}</span><Arrow /></a>)}</div>)}</section> : null}

    {!links.length && !products.length ? <p className="lh-empty">{en ? "Nothing here yet." : "Belum ada isi di halaman ini."}</p> : null}
    {products.length ? <p className="lh-note">{en ? "Prices and stock follow the destination store." : "Harga dan stok mengikuti toko tujuan."}</p> : null}
    {profile.custom_footer ? <p className="lh-note">{profile.custom_footer}</p> : null}
    <Link className="lh-made" href="/">LinkHub by Trias</Link>
  </div>;
}
