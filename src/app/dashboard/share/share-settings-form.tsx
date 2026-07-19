"use client";

import { useState } from "react";
import { saveShareSettings } from "../actions";

export function ShareSettingsForm({ initial, name, slug }: { initial: { title: string; description: string; color: string }; name: string; slug: string | null }) {
  const [settings, setSettings] = useState(initial);
  return <div className="share-settings-layout"><form action={saveShareSettings} className="panel stack"><p className="section-label">Customize SEO metadata</p><h2>Share preview</h2><label>SEO title<input name="seo_title" maxLength={70} value={settings.title} placeholder={name} onChange={(event) => setSettings((current) => ({ ...current, title: event.target.value }))} /></label><label>SEO description<textarea name="seo_description" maxLength={160} value={settings.description} placeholder="Jelajahi semua link dan produk saya." onChange={(event) => setSettings((current) => ({ ...current, description: event.target.value }))} /></label><label>Share image color<input name="share_image_color" type="color" value={settings.color} onChange={(event) => setSettings((current) => ({ ...current, color: event.target.value }))} /></label><button>Simpan share settings</button></form><aside><div className="seo-image-preview" style={{ background: settings.color }}><span>LINKHUB</span><strong>{settings.title || name}</strong><p>{settings.description || `Visit ${slug ? `/${slug}` : "my Linktree"}`}</p></div><p className="seo-help">This image may display anywhere you paste your Linktree URL.</p></aside></div>;
}