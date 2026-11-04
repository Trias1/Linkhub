"use client";

import { useState, useTransition } from "react";
import { PlatformIcon } from "@/components/platform-icon";
import { isCommercePlatform } from "@/lib/commerce-platforms";
import { linkLabel, linkPlatform, quickLinks } from "@/lib/link-platform";
import { addCollection, addLink, deleteCollection, deleteLink, moveLink, reorderCollections, setLinkActive, updateCollection, updateLink } from "../actions";

type Group = { id: string; title: string; position: number };
type LinkItem = { id: string; collection_id: string | null; title: string; url: string; platform: string | null; is_active: boolean };

function Chevron({ up }: { up?: boolean }) { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={up ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"} /></svg>; }
const shortUrl = (url: string) => url.replace(/^(https?:\/\/|mailto:)(www\.)?/, "").replace(/\/$/, "");

function AddLinkForm({ groups }: { groups: Group[] }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const detected = url ? linkPlatform(url) : null;
  return <form action={addLink} className="lh-link-form">
    <div className="lh-quick" role="group" aria-label="Quick add">{quickLinks.map((item) => <button type="button" key={item.platform} onClick={() => { setTitle(item.title); setUrl(item.url); document.getElementById("new-link-url")?.focus(); }}><PlatformIcon platform={item.platform} size={16} />{item.title}</button>)}</div>
    <div className="lh-link-grid">
      <label className="lh-field">Title<input name="title" required maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Order on WhatsApp" /></label>
      <label className="lh-field">Link<input id="new-link-url" name="url" required inputMode="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /></label>
      {groups.length ? <label className="lh-field">Group<select name="collection_id" defaultValue={groups[0].id}>{groups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}<option value="">No group</option></select></label> : null}
      <div className="lh-link-submit"><button className="lh-btn small">Add link</button></div>
    </div>
    <p className="lh-detect" aria-live="polite">{detected && isCommercePlatform(detected) ? <><b>{linkLabel(detected)}</b> store link. It shows as a store button at the top of your page.</> : detected ? <>Shows as a <b>{linkLabel(detected)}</b> link.</> : "Store links (Shopee, Tokopedia, TikTok Shop, ...) become store buttons at the top of your page."}</p>
  </form>;
}

function LinkRow({ link, first, last }: { link: LinkItem; first: boolean; last: boolean }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  return <li className={`lh-item${pending ? " pending" : ""}`}>
    <div className="lh-link-row">
      <div className="lh-order"><button type="button" aria-label="Move up" disabled={first || pending} onClick={() => startTransition(() => moveLink(link.id, -1))}><Chevron up /></button><button type="button" aria-label="Move down" disabled={last || pending} onClick={() => startTransition(() => moveLink(link.id, 1))}><Chevron /></button></div>
      <span className="lh-item-thumb lh-link-icon"><PlatformIcon platform={link.platform} size={20} /></span>
      <button type="button" className="lh-item-main" onClick={() => setEditing(!editing)} aria-expanded={editing}>
        <b>{link.title}</b>
        <span>{isCommercePlatform(link.platform) ? <em className="lh-tag">Store button</em> : null}{shortUrl(link.url)}</span>
      </button>
      <button type="button" className="lh-switch" role="switch" aria-checked={link.is_active} aria-label="Visible on my page" disabled={pending} onClick={() => startTransition(() => setLinkActive(link.id, !link.is_active))} />
    </div>
    {editing ? <form action={updateLink} className="lh-link-edit">
      <input type="hidden" name="id" value={link.id} />
      <label className="lh-field">Title<input name="title" required maxLength={80} defaultValue={link.title} /></label>
      <label className="lh-field">Link<input name="url" required inputMode="url" defaultValue={link.url} /></label>
      <div className="lh-form-actions">
        <button className="lh-btn secondary small lh-danger" formAction={deleteLink} formNoValidate onClick={(event) => { if (!confirm("Delete this link?")) event.preventDefault(); }}>Delete</button>
        <span />
        <button type="button" className="lh-btn secondary small" onClick={() => setEditing(false)}>Cancel</button>
        <button className="lh-btn small">Save</button>
      </div>
    </form> : null}
  </li>;
}

function LinkList({ links }: { links: LinkItem[] }) {
  return links.length ? <ul className="lh-items">{links.map((link, index) => <LinkRow key={JSON.stringify(link)} link={link} first={index === 0} last={index === links.length - 1} />)}</ul> : <p className="lh-hint">No links in this group yet.</p>;
}

export function LinksWorkspace({ slug, error, message, collections, links }: { slug: string | null; error?: string; message?: string; collections: Group[]; links: LinkItem[] }) {
  const [groups, setGroups] = useState(collections);
  const [pending, startTransition] = useTransition();
  const ungrouped = links.filter((link) => !link.collection_id || !groups.some((group) => group.id === link.collection_id));
  const pageUrl = slug ? `/en/${slug}` : null;
  const stores = links.filter((link) => isCommercePlatform(link.platform)).length;

  function moveGroup(index: number, direction: -1 | 1) {
    const next = [...groups];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setGroups(next);
    startTransition(() => reorderCollections(next.map((group) => group.id)));
  }

  return <div className="lh-dash">
    <div className="lh-dash-main">
      <header className="lh-dash-top">
        <div><h1>Links</h1><p>{links.length} links{stores ? ` · ${stores} store buttons` : ""} · {links.filter((link) => link.is_active).length} visible</p></div>
        {pageUrl ? <a className="lh-btn secondary small" href={pageUrl} target="_blank" rel="noopener noreferrer">View page</a> : null}
      </header>
      {error ? <p className="lh-alert" role="alert">{error}</p> : null}
      {message ? <p className="lh-ok" role="status">{message}</p> : null}

      <section className="lh-box"><h2>Add a link</h2><AddLinkForm groups={groups} /></section>

      {groups.map((group, index) => { const items = links.filter((link) => link.collection_id === group.id); return <section className={`lh-box lh-group-box${pending ? " pending" : ""}`} key={group.id}>
        <div className="lh-group-head">
          <div className="lh-order"><button type="button" aria-label="Move group up" disabled={index === 0 || pending} onClick={() => moveGroup(index, -1)}><Chevron up /></button><button type="button" aria-label="Move group down" disabled={index === groups.length - 1 || pending} onClick={() => moveGroup(index, 1)}><Chevron /></button></div>
          <form action={updateCollection} className="lh-rename"><input type="hidden" name="id" value={group.id} /><input name="title" defaultValue={group.title} maxLength={80} required aria-label="Group name" /><button className="lh-btn secondary small">Rename</button></form>
          <form action={deleteCollection} onSubmit={(event) => { if (!confirm("Delete this group? Its links are kept and move to Ungrouped.")) event.preventDefault(); }}><input type="hidden" name="id" value={group.id} /><button className="lh-btn secondary small lh-danger">Delete</button></form>
        </div>
        <LinkList links={items} />
      </section>; })}

      {ungrouped.length ? <section className="lh-box lh-group-box"><div className="lh-group-head"><h2>{groups.length ? "Ungrouped" : "Your links"}</h2></div><LinkList links={ungrouped} /></section> : null}
      {!links.length ? <p className="lh-hint lh-center">Add your Instagram, WhatsApp or store links above. Shoppers see them under your products.</p> : null}

      <form action={addCollection} className="lh-add-group"><button className="lh-btn secondary small">+ Add group</button><span className="lh-hint">Groups show as headings on your page, e.g. &ldquo;Contact&rdquo; or &ldquo;Social media&rdquo;.</span></form>
    </div>

    <aside className="lh-dash-aside">
      {pageUrl ? <><div className="lh-phone"><iframe src={`${pageUrl}?preview=1`} title="Preview of your public page" tabIndex={-1} loading="lazy" /></div><p className="lh-hint lh-center">Live preview. Refreshes after you save.</p></> : <p className="lh-hint">Set a page address in Account to see a preview.</p>}
    </aside>
  </div>;
}
