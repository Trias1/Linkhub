"use client";

import { useState } from "react";

const targets = {
  whatsapp: { label: "WhatsApp", url: (text: string, link: string) => `https://wa.me/?text=${text}%20${link}` },
  facebook: { label: "Facebook", url: (_text: string, link: string) => `https://www.facebook.com/sharer/sharer.php?u=${link}` },
  telegram: { label: "Telegram", url: (text: string, link: string) => `https://t.me/share/url?url=${link}&text=${text}` },
  x: { label: "X", url: (text: string, link: string) => `https://x.com/intent/post?text=${text}&url=${link}` },
  email: { label: "Email", url: (text: string, link: string) => `mailto:?subject=${text}&body=${link}` },
};

export function ShareTools({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function nativeShare() {
    if (navigator.share) await navigator.share({ title: name, url }).catch(() => undefined);
    else await copy();
  }

  return <div className="lh-share-tools">
    <div className="lh-copy"><input readOnly value={url} aria-label="Your page link" onFocus={(event) => event.target.select()} /><button type="button" className="lh-btn small" onClick={copy}>{copied ? "Copied" : "Copy link"}</button></div>
    <div className="lh-share-row">
      <button type="button" className="lh-btn small secondary" onClick={nativeShare}>Share…</button>
      {Object.entries(targets).map(([key, item]) => <a key={key} className="lh-btn small secondary" href={item.url(encodeURIComponent(`${name} on LinkHub`), encodeURIComponent(url))} target="_blank" rel="noopener noreferrer">{item.label}</a>)}
    </div>
  </div>;
}

// Link bio per aplikasi (?src=tiktok): Insights bisa memisahkan pengunjung dari TikTok, Instagram, dan lainnya.
const bioApps = [["tiktok", "TikTok"], ["instagram", "Instagram"], ["whatsapp", "WhatsApp"], ["facebook", "Facebook"], ["youtube", "YouTube"], ["x", "X"], ["threads", "Threads"]] as const;

export function BioLinks({ url }: { url: string }) {
  const [copied, setCopied] = useState("");
  async function copy(key: string, value: string) {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(key);
    window.setTimeout(() => setCopied(""), 1800);
  }
  return <ul className="lh-bio-links">{bioApps.map(([key, label]) => { const value = `${url}?src=${key}`; return <li key={key}>
    <b>{label}</b>
    <input readOnly value={value} aria-label={`Link for your ${label} bio`} onFocus={(event) => event.target.select()} />
    <button type="button" className="lh-btn small secondary" onClick={() => void copy(key, value)}>{copied === key ? "Copied" : "Copy"}</button>
  </li>; })}</ul>;
}
