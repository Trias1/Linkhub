"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { PlatformIcon } from "@/components/platform-icon";
import { formatRupiah } from "@/lib/rupiah";
import { commercePlatforms, detectPlatform, platformColor, platformLabel } from "@/lib/commerce-platforms";
import { extractLink } from "@/lib/link-platform";
import { dateInputValue, formatEndDate, formatStartDate, productStatus, type Product, type ProductStatus } from "@/lib/products";
import type { ProductDetails } from "@/lib/product-details";
import { MAX_UPLOAD, shrinkImage } from "@/lib/shrink-image";
import { RupiahInput } from "./rupiah-input";
import { shopeeAffiliateLink, addProduct, addProductsBulk, importProductsCsv, addShopCollection, deleteProduct, fetchProductDetails, deleteShopCollection, moveProduct, moveShopCollection, setProductActive, updateProduct, updateShopCollection } from "../actions";
import { cssUrl } from "@/lib/css-url";
import { QrCode } from "@/components/qr-code";

type Category = { id: string; title: string; position: number };
const statusLabel: Record<ProductStatus, string> = { live: "Live", scheduled: "Scheduled", ended: "Ended", hidden: "Hidden" };

function Chevron({ up }: { up?: boolean }) { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={up ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} /></svg>; }

function ProductForm({ categories, product, onCancel, sharedLink = "", affiliateReady = false }: { categories: Category[]; product?: Product; onCancel?: () => void; sharedLink?: string; affiliateReady?: boolean }) {
  const [url, setUrl] = useState(product?.url ?? sharedLink);
  const detected = url ? detectPlatform(url) : null;
  const [open, setOpen] = useState(Boolean(product || sharedLink));
  // Isi otomatis dari link: field di-remount (key) supaya nilai baru masuk ke input yang tidak dikontrol.
  const [filled, setFilled] = useState<ProductDetails | null>(null);
  const [fillKey, setFillKey] = useState(0);
  const [lookup, setLookup] = useState<{ busy: boolean; text: string }>({ busy: false, text: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Foto dikecilkan di browser dulu (batas upload Vercel 4,5 MB); pratinjaunya dari file yang dipilih.
  const [photo, setPhoto] = useState<{ url: string | null; busy: boolean; note: string }>({ url: null, busy: false, note: "" });
  async function pickPhoto(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;
    setPhoto((current) => ({ ...current, busy: true, note: "Preparing photo…" }));
    const small = await shrinkImage(file);
    if (small.size > MAX_UPLOAD) { input.value = ""; setPhoto({ url: null, busy: false, note: "This photo is too big. Pick a smaller one." }); return; }
    if (small !== file) { const list = new DataTransfer(); list.items.add(small); input.files = list.files; }
    setPhoto((current) => { if (current.url) URL.revokeObjectURL(current.url); return { url: URL.createObjectURL(small), busy: false, note: "" }; });
  }
  const preview = photo.url || filled?.image || product?.image_url;
  const lastLookup = useRef("");
  async function fillFromLink(link: string) {
    lastLookup.current = link;
    setLookup({ busy: true, text: "Reading the product details…" });
    const result = await fetchProductDetails(link).catch(() => ({ details: null, error: "Could not read the details from this link. Fill them in by hand." }));
    if (lastLookup.current !== link) return;
    if (result.details) { setFilled(result.details); setFillKey((key) => key + 1); setOpen(true); }
    setLookup({ busy: false, text: !result.details ? result.error ?? "" : result.details.pricesSkipped ? "Name and photo filled in. Enter the price by hand: this store shows LinkHub a different price than buyers see." : "Filled in from the link. Check the details before saving." });
  }
  function changeUrl(raw: string) {
    // Teks share dari aplikasi marketplace ("Cek produk ini... https://...") -> ambil link-nya saja.
    const value = /\s/.test(raw.trim()) ? extractLink(raw) : raw;
    setUrl(value); if (value) setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    const store = /^https:\/\/\S+$/.test(value) ? detectPlatform(value) : "website";
    // Produk baru: langsung coba isi begitu link toko ditempel.
    if (!product && store !== "website" && value !== lastLookup.current) timer.current = setTimeout(() => void fillFromLink(value), 500);
  }
  // Link yang dibagikan dari aplikasi marketplace: langsung coba isi otomatis sekali.
  useEffect(() => {
    if (!sharedLink || product) return;
    const start = setTimeout(() => void fillFromLink(sharedLink), 0);
    return () => clearTimeout(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya sekali untuk link yang dibagikan
  }, [sharedLink]);
  const canFill = /^https:\/\/\S+$/.test(url) && detected !== "website";
  const [affiliate, setAffiliate] = useState<{ busy: boolean; text: string }>({ busy: false, text: "" });
  async function applyAffiliateLink() {
    setAffiliate({ busy: true, text: "" });
    const result = await shopeeAffiliateLink(url).catch(() => ({ link: null, error: "Could not reach Shopee. Try again." }));
    if (result.link) { lastLookup.current = result.link; setUrl(result.link); }
    setAffiliate({ busy: false, text: result.link ? "Link changed to your Shopee affiliate link." : result.error ?? "" });
  }
  return <form action={product ? updateProduct : addProduct} className="lh-product-form">
    {product ? <input type="hidden" name="id" value={product.id} /> : null}
    <div className="lh-paste">
      <label className="lh-field">{product ? "Product link" : "Paste a product link"}<input name="url" type="url" inputMode="url" required value={url} onChange={(event) => changeUrl(event.target.value)} placeholder="https://shopee.co.id/..." /></label>
      {!open ? <button type="button" className="lh-btn" onClick={() => setOpen(true)}>Continue</button> : null}
    </div>
    <p className="lh-detect" aria-live="polite">{detected ? detected === "website" ? "Other store. The button will say “View product”." : <><i style={{ background: platformColor(detected) }} /><b>{platformLabel(detected)}</b> detected. The button will say &ldquo;Buy on {platformLabel(detected)}&rdquo;.</> : "Supports Shopee, Tokopedia, TikTok Shop, Lazada, Facebook and more."}</p>
    {affiliateReady && detected === "shopee" && /^https:\/\/\S+$/.test(url) ? <p className="lh-fill" aria-live="polite"><span>{affiliate.text}</span><button type="button" className="lh-linkbtn" disabled={affiliate.busy} onClick={() => void applyAffiliateLink()}>{affiliate.busy ? "Getting link…" : "Use my affiliate link"}</button></p> : null}
    {canFill ? <p className="lh-fill" aria-live="polite"><span>{lookup.text}</span><button type="button" className="lh-linkbtn" disabled={lookup.busy} onClick={() => void fillFromLink(url)}>{lookup.busy ? "Reading…" : "Fill in from link"}</button></p> : null}
    {open ? <div className="lh-form-grid">
      <label className="lh-photo">{preview ? <span style={{ backgroundImage: cssUrl(preview) }} /> : <span>Photo<br />JPG, PNG, WebP<br />resized for you</span>}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Product photo" onChange={(event) => void pickPhoto(event.currentTarget)} />{filled?.image && !photo.url ? <input type="hidden" name="image_source" value={filled.image} /> : null}{photo.note ? <small className="lh-photo-note" role="status">{photo.note}</small> : null}</label>
      <label className="lh-field lh-wide">Product name<input key={`title-${fillKey}`} name="title" required maxLength={100} defaultValue={filled?.title || product?.title} placeholder="e.g. 2-tier rotating spice rack" /></label>
      <label className="lh-field lh-wide">Your note <small>Optional. One line on why you like it, shown on the product card.</small><input name="note" maxLength={140} defaultValue={product?.note} placeholder="e.g. I use this every day and the lid really seals" /></label>
      <RupiahInput key={`price-${fillKey}`} defaultValue={filled?.price || product?.price} />
      <RupiahInput key={`compare-${fillKey}`} name="compare_price" label="Original price" hint="Optional, shown crossed out" defaultValue={filled ? filled.comparePrice : product?.compare_price} />
      <label className="lh-field">Category<select name="collection_id" defaultValue={product?.collection_id ?? categories[0]?.id}>{categories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></label>
      <label className="lh-field">Store<select name="platform" defaultValue={product ? product.platform : "auto"}><option value="auto">Detect from link</option><option value="website">Other / website</option>{Object.entries(commercePlatforms).map(([value, item]) => <option value={value} key={value}>{item.label}</option>)}</select></label>
      <label className="lh-field lh-from">Show from <small>Optional</small><input name="starts_at" type="date" defaultValue={dateInputValue(product?.starts_at ?? null)} /></label>
      <label className="lh-field">Until <small>Hidden automatically after</small><input name="ends_at" type="date" defaultValue={dateInputValue(product?.ends_at ?? null, true)} /></label>
      <label className="lh-check"><input type="checkbox" name="is_featured" defaultChecked={product?.is_featured} /> Show in &ldquo;On sale&rdquo;</label>
      {product ? <label className="lh-check"><input type="checkbox" name="is_active" defaultChecked={product.is_active} /> Visible on my page</label> : null}
      <div className="lh-form-actions">
        {product ? <button className="lh-btn secondary small lh-danger" formAction={deleteProduct} formNoValidate onClick={(event) => { if (!confirm("Delete this product?")) event.preventDefault(); }}>Delete</button> : null}
        <span />
        <button type="button" className="lh-btn secondary small" onClick={() => { if (onCancel) onCancel(); else { setOpen(false); setUrl(""); setFilled(null); setLookup({ busy: false, text: "" }); lastLookup.current = ""; } }}>Cancel</button>
        <button className="lh-btn small" disabled={photo.busy}>{product ? "Save" : "Save product"}</button>
      </div>
    </div> : null}
  </form>;
}

// Link khusus satu produk (/slug/p/12) dengan gambar pratinjau sendiri saat dibagikan.
function ProductShare({ product, pageUrl }: { product: Product; pageUrl: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${pageUrl}/p/${product.number}`;
  async function copy() { await navigator.clipboard.writeText(url).catch(() => undefined); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <details className="lh-product-share">
    <summary>Share this product</summary>
    <p className="lh-hint">A link to just this product, with its photo and price in the preview. Handy for WhatsApp and comments.</p>
    <div className="lh-copy"><input readOnly value={url} aria-label={`Link to ${product.title}`} onFocus={(event) => event.target.select()} /><button type="button" className="lh-btn small" onClick={copy}>{copied ? "Copied" : "Copy"}</button></div>
    <div className="lh-share-row"><a className="lh-btn small secondary" href={`https://wa.me/?text=${encodeURIComponent(`${product.title} ${url}`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a><a className="lh-btn small secondary" href={url} target="_blank" rel="noopener noreferrer">Open</a></div>
    <QrCode value={url} filename={`product-${product.number}-qr`} size={120} />
  </details>;
}

function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return <button className="lh-btn small" disabled={pending}>{pending ? busy : label}</button>;
}

// Tempel beberapa link sekaligus: jadi draf tersembunyi, lalu nama/harga dicek di daftar.
function BulkAdd({ categories }: { categories: Category[] }) {
  const [count, setCount] = useState(0);
  return <details className="lh-bulk">
    <summary>Add several links at once</summary>
    <form action={addProductsBulk} className="lh-bulk-form">
      <label className="lh-field lh-wide">Product links, one per line <small>Up to 10. Each one becomes a hidden draft with its name and photo filled in where the store allows it.</small><textarea name="links" rows={5} required onChange={(event) => setCount(event.target.value.split(/\s+/).filter((value) => /^https?:\/\//.test(value)).length)} placeholder={"https://www.tokopedia.com/...\nhttps://shopee.co.id/..."} /></label>
      <label className="lh-field">Category<select name="collection_id" defaultValue={categories[0]?.id}>{categories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></label>
      <div className="lh-form-actions"><span className="lh-hint">{count > 10 ? `${count} links: only the first 10 are added.` : count ? `${count} ${count === 1 ? "link" : "links"}` : ""}</span><Submit label="Add as drafts" busy="Reading links…" /></div>
    </form>
  </details>;
}

function ProductRow({ product, categories, clicks, first, last, shareUrl, affiliateReady }: { product: Product; categories: Category[]; clicks: number | null; first: boolean; last: boolean; shareUrl: string | null; affiliateReady: boolean }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const status = productStatus(product);
  const when = status === "scheduled" && product.starts_at ? `from ${formatStartDate(product.starts_at, "en")}` : product.ends_at ? `${status === "ended" ? "ended" : "until"} ${formatEndDate(product.ends_at, "en")}` : "";
  return <li className={`lh-item${pending ? " pending" : ""}`}>
    <div className="lh-item-row">
      <div className="lh-order"><button type="button" aria-label={`Move ${product.title} up`} disabled={first || pending} onClick={() => startTransition(() => moveProduct(product.id, -1))}><Chevron up /></button><button type="button" aria-label={`Move ${product.title} down`} disabled={last || pending} onClick={() => startTransition(() => moveProduct(product.id, 1))}><Chevron /></button></div>
      {product.image_url ? <span className="lh-item-thumb" style={{ backgroundImage: cssUrl(product.image_url) }} /> : <span className="lh-item-thumb"><PlatformIcon platform={product.platform} /></span>}
      <button type="button" className="lh-item-main" onClick={() => setEditing(!editing)} aria-expanded={editing}>
        <b>{product.number ? <span className="lh-item-no">No. {product.number}</span> : null}{product.title}</b>
        <span><i style={{ background: platformColor(product.platform) }} />{platformLabel(product.platform)}{product.price ? ` · ${formatRupiah(product.price)}` : ""}{when ? ` · ${when}` : ""}</span>
      </button>
      <span className={`lh-status ${product.is_featured && status === "live" ? "promo" : status}`}>{product.is_featured && status === "live" ? "On sale" : statusLabel[status]}</span>
      <span className="lh-clicks">{clicks === null ? "–" : <><b>{clicks}</b>clicks</>}</span>
      <button type="button" className="lh-switch" role="switch" aria-checked={product.is_active} aria-label={`Show ${product.title} on my page`} disabled={pending} onClick={() => startTransition(() => setProductActive(product.id, !product.is_active))} />
    </div>
    {editing ? <ProductForm categories={categories} product={product} onCancel={() => setEditing(false)} affiliateReady={affiliateReady} /> : null}
    {editing && shareUrl && product.number && status === "live" ? <ProductShare product={product} pageUrl={shareUrl} /> : null}
  </li>;
}

export function ProductsWorkspace({ slug, origin = "", affiliateReady = false, sharedLink = "", error, message, collections, products, clicksByProduct, clicksByPlatform, statsReady }: { slug: string | null; origin?: string; affiliateReady?: boolean; sharedLink?: string; error?: string; message?: string; collections: Category[]; products: Product[]; clicksByProduct: Record<string, number>; clicksByPlatform: Record<string, number>; statsReady: boolean }) {
  const [filter, setFilter] = useState<"all" | ProductStatus>("all");
  const [movingCategory, startCategoryMove] = useTransition();
  // Pratinjau dimuat ulang setiap isi produk/kategori berubah (bukan hanya jumlahnya).
  const previewKey = JSON.stringify([products, collections]).length + ":" + [...JSON.stringify([products, collections])].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0);
  const statuses = products.map((item) => productStatus(item));
  const count = (status: ProductStatus) => statuses.filter((item) => item === status).length;
  const totalClicks = Object.values(clicksByPlatform).reduce((sum, value) => sum + value, 0);
  const platforms = Object.entries(clicksByPlatform).sort((a, b) => b[1] - a[1]);
  const top = platforms[0]?.[1] ?? 0;
  const sorted = collections.flatMap((category) => products.filter((item) => item.collection_id === category.id));
  const pageUrl = slug ? `/en/${slug}` : null;

  return <div className="lh-dash">
    <div className="lh-dash-main">
      <header className="lh-dash-top">
        <div><h1>Products</h1><p>{products.length} products · {count("live")} live{count("scheduled") ? ` · ${count("scheduled")} scheduled` : ""}</p></div>
        {pageUrl ? <a className="lh-btn secondary small" href={pageUrl} target="_blank" rel="noopener noreferrer">View page</a> : null}
      </header>
      <nav className="lh-subnav" aria-label="Products"><Link href="/en/dashboard/shops" aria-current="page">All products</Link><Link href="/en/dashboard/shops/lists">Video lists</Link></nav>
      {error ? <p className="lh-alert" role="alert">{error}</p> : null}
      {message ? <p className="lh-ok" role="status">{message}</p> : null}

      <div className="lh-stats">
        <div><small>Buy clicks, 7 days</small><b>{statsReady ? totalClicks : "–"}</b></div>
        <div><small>Live products</small><b>{count("live")}</b></div>
        <div><small>On sale</small><b>{products.filter((item, index) => item.is_featured && statuses[index] === "live").length}</b></div>
      </div>

      <section className="lh-box">
        <h2>Add a product</h2>
        {collections.length ? <><ProductForm categories={collections} sharedLink={sharedLink} affiliateReady={affiliateReady} /><BulkAdd categories={collections} /></> : <div className="lh-empty-box"><p>Create a category first, for example &ldquo;Kitchen&rdquo; or &ldquo;Fashion&rdquo;. Shoppers can filter by category on your page.</p><form action={addShopCollection}><button className="lh-btn small">Create first category</button></form></div>}
      </section>

      <section className="lh-box">
        <h2>Buy clicks by store <span className="lh-hint">· 7 days</span></h2>
        {!statsReady ? <p className="lh-hint">Run SQL file 018 in Supabase to start counting clicks per product and store.</p> : platforms.length ? <div className="lh-bars">{platforms.map(([platform, value]) => <div className="lh-bar" key={platform}><span>{platformLabel(platform)}</span><div><i style={{ width: `${Math.max(4, (value / top) * 100)}%`, background: platformColor(platform) }} /></div><b>{value}</b></div>)}</div> : <p className="lh-hint">No clicks yet. Clicks show up here when shoppers tap a Buy button.</p>}
      </section>

      <section className="lh-box">
        <div className="lh-list-head">
          <h2>Your products</h2>
          <div className="lh-filter" role="group" aria-label="Filter by status">{(["all", "live", "scheduled", "ended", "hidden"] as const).map((key) => key === "all" || count(key) ? <button type="button" key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{key === "all" ? `All ${products.length}` : `${statusLabel[key]} ${count(key)}`}</button> : null)}</div>
        </div>
        {collections.map((category) => { const items = sorted.filter((item) => item.collection_id === category.id); const shown = items.filter((item) => filter === "all" || productStatus(item) === filter); return filter !== "all" && !shown.length ? null : <div className="lh-group" key={category.id}>
          <h3>{category.title} <span>{items.length}</span></h3>
          {shown.length ? <ul className="lh-items">{shown.map((item) => <ProductRow key={JSON.stringify(item)} product={item} categories={collections} clicks={statsReady ? clicksByProduct[item.id] ?? 0 : null} first={filter !== "all" || items[0].id === item.id} last={filter !== "all" || items[items.length - 1].id === item.id} shareUrl={slug && origin ? `${origin}/${slug}` : null} affiliateReady={affiliateReady} />)}</ul> : <p className="lh-hint">No products in this category yet.</p>}
        </div>; })}
        {!products.length && collections.length ? <p className="lh-hint">Paste your first product link above.</p> : null}
      </section>

      {collections.length ? <section className="lh-box">
        <h2>Categories</h2>
        <p className="lh-hint">Shown as filter buttons on your page when you have more than one.</p>
        <ul className="lh-categories">{collections.map((category, index) => <li key={category.id}><div className="lh-order"><button type="button" aria-label={`Move ${category.title} up`} disabled={index === 0 || movingCategory} onClick={() => startCategoryMove(() => moveShopCollection(category.id, -1))}><Chevron up /></button><button type="button" aria-label={`Move ${category.title} down`} disabled={index === collections.length - 1 || movingCategory} onClick={() => startCategoryMove(() => moveShopCollection(category.id, 1))}><Chevron /></button></div><form action={updateShopCollection}><input type="hidden" name="id" value={category.id} /><input name="title" defaultValue={category.title} maxLength={80} aria-label="Category name" required /><button className="lh-btn secondary small">Rename</button></form><form action={deleteShopCollection} onSubmit={(event) => { if (!confirm("Delete this category and all of its products?")) event.preventDefault(); }}><input type="hidden" name="id" value={category.id} /><button className="lh-btn secondary small lh-danger">Delete</button></form></li>)}</ul>
        <form action={addShopCollection}><button className="lh-btn secondary small">+ Add category</button></form>
      </section> : null}
      <section className="lh-box">
        <h2>Backup and import</h2>
        <p className="lh-hint">Download your products as a CSV file to keep a copy or edit them in a spreadsheet. Import the same format to add products, for example to another page.</p>
        <div className="lh-backup">
          {products.length ? <a className="lh-btn secondary small" href="/api/export/products" download>Export CSV</a> : null}
          <form action={importProductsCsv} className="lh-import"><label className="lh-file">CSV file<input name="file" type="file" accept=".csv,text/csv" required /></label><Submit label="Import" busy="Importing…" /></form>
        </div>
      </section>
    </div>

    <aside className="lh-dash-aside">
      {pageUrl ? <><div className="lh-phone"><iframe key={previewKey} src={`${pageUrl}?preview=1`} title="Preview of your public page" tabIndex={-1} loading="lazy" /></div><p className="lh-hint lh-center">Live preview. Refreshes after you save.</p></> : <p className="lh-hint">Set a page address in Account to see a preview.</p>}
    </aside>
  </div>;
}
