"use client";

import { useState } from "react";
import { saveShareSettings } from "../actions";

export function ShareSettingsForm({ initial, name, url }: { initial: { title: string; description: string; color: string }; name: string; url: string | null }) {
  const [settings, setSettings] = useState(initial);
  return <div className="lh-seo">
    <form action={saveShareSettings} className="lh-seo-form">
      <label className="lh-field">Title<small>Shown when your link is pasted in WhatsApp, Facebook or X. Up to 70 characters.</small><input name="seo_title" maxLength={70} value={settings.title} placeholder={name} onChange={(event) => setSettings((current) => ({ ...current, title: event.target.value }))} /></label>
      <label className="lh-field">Description<small>Up to 160 characters.</small><textarea name="seo_description" maxLength={160} rows={3} value={settings.description} placeholder="All my products and links in one place." onChange={(event) => setSettings((current) => ({ ...current, description: event.target.value }))} /></label>
      <label className="lh-field lh-color">Card colour<input name="share_image_color" type="color" value={settings.color} onChange={(event) => setSettings((current) => ({ ...current, color: event.target.value }))} /></label>
      <div><button className="lh-btn small">Save preview</button></div>
    </form>
    <figure className="lh-seo-card" aria-label="Link preview">
      <div style={{ background: settings.color }}><span>LinkHub</span><strong>{settings.title || name}</strong></div>
      <figcaption><b>{settings.title || name}</b><span>{settings.description || "All my products and links in one place."}</span><small>{url?.replace(/^https?:\/\//, "") ?? "linkhub"}</small></figcaption>
    </figure>
  </div>;
}
