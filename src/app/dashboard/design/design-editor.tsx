"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/platform-icon";
import { themes } from "@/lib/themes";
import { saveCustomDesign } from "../actions";

export type Design = {
  title: string; bio: string; avatar_url: string | null;
  title_style: string; title_color: string; wallpaper_style: string; background_color: string;
  button_style: string; button_roundness: string; button_color: string; button_text_color: string;
  page_font: string; text_color: string; custom_footer: string;
};

const fonts = [["geist", "Geist"], ["inter", "Inter"], ["poppins", "Poppins"], ["dm-sans", "DM Sans"], ["nunito", "Nunito"], ["montserrat", "Montserrat"], ["space", "Space Grotesk"], ["playfair", "Playfair Display"], ["lora", "Lora"], ["merriweather", "Merriweather"], ["bebas-neue", "Bebas Neue"], ["caveat", "Caveat"]];
// Tema siap pakai: warna latar, teks, tombol, teks tombol.
const presets = [
  ...Object.values(themes).map((theme) => ({ label: theme.label, background: theme.background, text: theme.text, button: theme.button, buttonText: theme.text })),
  { label: "Paper", background: "#F5F4EC", text: "#171712", button: "#171712", buttonText: "#FFFFFF" },
  { label: "Night", background: "#171712", text: "#F5F4EC", button: "#DFFF55", buttonText: "#171712" },
];

function Choice({ name, value, options, onChange }: { name: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return <div className="lh-seg" role="radiogroup">{options.map(([option, label]) => <label key={option}><input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{label}</span></label>)}</div>;
}

function Color({ label, name, value, onChange }: { label: string; name?: string; value: string; onChange: (value: string) => void }) {
  return <label className="lh-swatch"><input type="color" name={name} value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} /><span>{label}<small>{value.toUpperCase()}</small></span></label>;
}

export function DesignEditor({ initial, error, message }: { initial: Design; error?: string; message?: string }) {
  const [design, setDesign] = useState(initial);
  const set = (key: keyof Design) => (value: string) => setDesign((current) => ({ ...current, [key]: value }));
  const wallpaper = design.wallpaper_style === "gradient" ? `linear-gradient(135deg, ${design.background_color}, ${design.button_color})` : design.wallpaper_style === "soft" ? `radial-gradient(circle at top, ${design.button_color}, ${design.background_color} 58%)` : design.background_color;
  const vars = { background: wallpaper, "--profile-bg": design.background_color, "--profile-text": design.text_color, "--profile-button": design.button_color, "--profile-button-text": design.button_text_color, "--profile-title": design.title_color } as React.CSSProperties;
  const changed = JSON.stringify(design) !== JSON.stringify(initial);

  return <form action={saveCustomDesign} className="lh-dash lh-design">
    <div className="lh-dash-main">
      <header className="lh-dash-top"><div><h1>Design</h1><p>Colours, buttons and fonts for your public page.</p></div></header>
      {error ? <p className="lh-alert" role="alert">{error}</p> : null}
      {message ? <p className="lh-ok" role="status">{message}</p> : null}

      <section className="lh-box"><h2>Themes</h2>
        <div className="lh-themes">{presets.map((preset) => <button type="button" key={preset.label} onClick={() => setDesign((current) => ({ ...current, background_color: preset.background, text_color: preset.text, title_color: preset.text, button_color: preset.button, button_text_color: preset.buttonText }))} aria-pressed={design.background_color === preset.background && design.button_color === preset.button}><span style={{ background: preset.background, color: preset.text }}><i style={{ background: preset.button }} /></span>{preset.label}</button>)}</div>
        <p className="lh-hint">Pick a starting point, then fine-tune the colours below.</p>
      </section>

      <section className="lh-box lh-design-fields"><h2>Profile</h2>
        <label className="lh-field">Name on page<input name="title" required maxLength={60} value={design.title} onChange={(event) => set("title")(event.target.value)} /></label>
        <label className="lh-field">Bio<small>Up to 160 characters</small><textarea name="bio" maxLength={160} rows={3} value={design.bio} onChange={(event) => set("bio")(event.target.value)} placeholder="e.g. Home and kitchen finds, updated every week" /></label>
        <div className="lh-field">Name style<Choice name="title_style" value={design.title_style} onChange={set("title_style")} options={[["normal", "Normal"], ["uppercase", "UPPERCASE"], ["italic", "Italic"], ["serif", "Serif"]]} /></div>
        <Color label="Name colour" name="title_color" value={design.title_color} onChange={set("title_color")} />
      </section>

      <section className="lh-box lh-design-fields"><h2>Background</h2>
        <div className="lh-field">Style<Choice name="wallpaper_style" value={design.wallpaper_style} onChange={set("wallpaper_style")} options={[["solid", "Solid"], ["gradient", "Gradient"], ["soft", "Soft fade"]]} /></div>
        <div className="lh-swatches"><Color label="Background" name="background_color" value={design.background_color} onChange={set("background_color")} /><Color label="Text" name="text_color" value={design.text_color} onChange={set("text_color")} /></div>
      </section>

      <section className="lh-box lh-design-fields"><h2>Buttons</h2>
        <div className="lh-field">Style<Choice name="button_style" value={design.button_style} onChange={set("button_style")} options={[["solid", "Solid"], ["glass", "Light"], ["outline", "Outline"]]} /></div>
        <div className="lh-field">Corners<Choice name="button_roundness" value={design.button_roundness} onChange={set("button_roundness")} options={[["square", "Square"], ["soft", "Soft"], ["rounded", "Rounded"], ["pill", "Pill"]]} /></div>
        <div className="lh-swatches"><Color label="Button" name="button_color" value={design.button_color} onChange={set("button_color")} /><Color label="Button text" name="button_text_color" value={design.button_text_color} onChange={set("button_text_color")} /></div>
      </section>

      <section className="lh-box lh-design-fields"><h2>Font and footer</h2>
        <label className="lh-field">Font<select name="page_font" value={design.page_font} onChange={(event) => set("page_font")(event.target.value)}>{fonts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="lh-field">Footer note<small>Optional, shown at the bottom of your page</small><input name="custom_footer" maxLength={120} value={design.custom_footer} onChange={(event) => set("custom_footer")(event.target.value)} placeholder="e.g. Thanks for stopping by" /></label>
      </section>

      <div className="lh-savebar"><span className="lh-hint">{changed ? "You have unsaved changes." : "All changes saved."}</span>{changed ? <button type="button" className="lh-btn secondary small" onClick={() => setDesign(initial)}>Reset</button> : null}<button className="lh-btn small" disabled={!changed}>Save design</button></div>
    </div>

    <aside className="lh-dash-aside">
      <div className="lh-phone"><div className={`lh-profile lh-mini font-${design.page_font}`} style={vars}><div className="lh-page">
        <header className="lh-head">{design.avatar_url ? <span className="lh-avatar" style={{ backgroundImage: `url(${design.avatar_url})` }} /> : <span className="lh-avatar">{design.title.slice(0, 1).toUpperCase() || "L"}</span>}<h1 className={`title-${design.title_style}`}>{design.title || "Your name"}</h1>{design.bio ? <p>{design.bio}</p> : null}</header>
        <div className="lh-stores"><span className="lh-store"><span className="lh-mark" style={{ background: "#ee4d2d" }}><PlatformIcon platform="shopee" size={18} /></span><span><b>Shopee</b><small>My store</small></span></span><span className="lh-store"><span className="lh-mark" style={{ background: "#03ac0e" }}><PlatformIcon platform="tokopedia" size={18} /></span><span><b>Tokopedia</b><small>My store</small></span></span></div>
        <div className="lh-section-title"><h2>Products</h2></div>
        <div className="lh-grid">{["Product name", "Another product"].map((name) => <div className="lh-card" key={name}><span className="lh-thumb" /><h3>{name}</h3><div className="lh-meta"><span className="lh-price">Rp99.000</span></div><span className="lh-buy" style={{ background: "#ee4d2d" }}>Buy on Shopee</span></div>)}</div>
        <div className="lh-links"><div className="lh-link-group"><h2>Contact</h2>{[["whatsapp", "Order on WhatsApp"], ["instagram", "Instagram"]].map(([platform, label]) => <span className={`lh-link button-${design.button_style} radius-${design.button_roundness}`} key={platform}><PlatformIcon platform={platform} /><span>{label}</span></span>)}</div></div>
        {design.custom_footer ? <p className="lh-note">{design.custom_footer}</p> : null}
      </div></div></div>
      <p className="lh-hint lh-center">Preview with sample products. Your real page updates after you save.</p>
    </aside>
  </form>;
}
