"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { PlatformIcon } from "@/components/platform-icon";
import { cssUrl } from "@/lib/css-url";
import { createProductList, deleteProductList, updateProductList } from "../../actions";

type ListProduct = { id: string; title: string; number: number | null; image_url: string | null; platform: string; live: boolean };
type ProductList = { id: string; title: string; slug: string; product_ids: string[] };

function Save({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="lh-btn small" disabled={pending}>{pending ? "Saving…" : label}</button>;
}

function ListEditor({ list, products, pageUrl }: { list: ProductList; products: ListProduct[]; pageUrl: string | null }) {
  const [picked, setPicked] = useState(() => new Set(list.product_ids));
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const url = pageUrl ? `${pageUrl}/c/${list.slug}` : null;
  const shown = products.filter((item) => { const term = query.trim().toLowerCase(); return !term || item.title.toLowerCase().includes(term) || String(item.number ?? "") === term.replace(/^#/, ""); });
  async function copy() { if (!url) return; await navigator.clipboard.writeText(url).catch(() => undefined); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  function toggle(id: string) { setPicked((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }

  return <section className="lh-box lh-list-box">
    <form action={updateProductList} className="lh-list-form">
      <input type="hidden" name="id" value={list.id} />
      <div className="lh-list-title"><label className="lh-field">List name<input name="title" defaultValue={list.title} maxLength={60} required /></label><Save label="Save list" /></div>
      {url ? <div className="lh-copy"><input readOnly value={url} aria-label={`Link to ${list.title}`} onFocus={(event) => event.target.select()} /><button type="button" className="lh-btn small secondary" onClick={copy}>{copied ? "Copied" : "Copy link"}</button></div> : <p className="lh-hint">Set a page address in Account to get a link for this list.</p>}
      <div className="lh-list-pick-head"><b>{picked.size} of {products.length} products</b>{products.length > 8 ? <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find by name or number" aria-label="Find a product" /> : null}</div>
      <ul className="lh-list-pick">{shown.map((item) => <li key={item.id}><label>
        <input type="checkbox" name="product_ids" value={item.id} checked={picked.has(item.id)} onChange={() => toggle(item.id)} />
        {item.image_url ? <span className="lh-item-thumb" style={{ backgroundImage: cssUrl(item.image_url) }} /> : <span className="lh-item-thumb"><PlatformIcon platform={item.platform} /></span>}
        <span className="lh-list-name">{item.number ? <span className="lh-item-no">No. {item.number}</span> : null}{item.title}{!item.live ? <small> · not live</small> : null}</span>
      </label></li>)}</ul>
      {/* Produk yang tersaring pencarian tetap ikut tersimpan. */}
      {[...picked].filter((id) => !shown.some((item) => item.id === id)).map((id) => <input type="hidden" name="product_ids" value={id} key={id} />)}
    </form>
    <form action={deleteProductList} onSubmit={(event) => { if (!confirm(`Delete the list "${list.title}"? The products stay on your page.`)) event.preventDefault(); }}><input type="hidden" name="id" value={list.id} /><button className="lh-linkbtn lh-danger">Delete list</button></form>
  </section>;
}

export function ListsWorkspace({ lists, products, pageUrl, error, message }: { lists: ProductList[]; products: ListProduct[]; pageUrl: string | null; error?: string; message?: string }) {
  return <>
    {error ? <p className="lh-alert" role="alert">{error}</p> : null}
    {message ? <p className="lh-ok" role="status">{message}</p> : null}
    <section className="lh-box">
      <h2>New list</h2>
      <p className="lh-hint">Make one list per video or post, for example &ldquo;Haul 12.12&rdquo;, and put its link in the caption or pinned comment. Viewers see only those products.</p>
      <form action={createProductList} className="lh-list-new"><label className="lh-field">List name<input name="title" maxLength={60} required placeholder="e.g. Haul 12.12" /></label><Save label="Create list" /></form>
    </section>
    {lists.map((list) => <ListEditor key={`${list.id}:${list.title}:${list.product_ids.join()}`} list={list} products={products} pageUrl={pageUrl} />)}
    {!lists.length ? <p className="lh-hint">No lists yet.</p> : null}
  </>;
}
