"use client";

import { useState } from "react";
import Link from "next/link";

export function ShareProfileButton({ slug, name }: { slug?: string | null; name: string }) {
  const [copied, setCopied] = useState(false);

  function profileUrl() {
    return `${window.location.origin}/${slug}`;
  }

  async function copy() {
    if (!slug) return;
    await navigator.clipboard.writeText(profileUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function nativeShare() {
    if (!slug) return;
    if (navigator.share) await navigator.share({ title: `${name} on LinkHub`, url: profileUrl() }).catch(() => undefined);
    else await copy();
  }

  function platform(type: "whatsapp" | "facebook" | "x" | "telegram" | "email") {
    if (!slug) return;
    const url = encodeURIComponent(profileUrl());
    const text = encodeURIComponent(`Lihat Linktree ${name}`);
    const targets = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://x.com/intent/post?text=${text}&url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      email: `mailto:?subject=${text}&body=${url}`,
    };
    window.open(targets[type], "_blank", "noopener,noreferrer");
  }

  return <details className="share-menu"><summary className="share-profile-button"><span>↗</span><strong>{slug ? `linkhub/${slug}` : "Atur username"}</strong><small>Share</small></summary><div className="share-popover"><div className="share-url"><span>/{slug || "username"}</span><button type="button" onClick={copy} disabled={!slug}>{copied ? "Copied" : "Copy link"}</button></div><div className="share-platforms"><button type="button" onClick={nativeShare}>↗<small>Share</small></button><button type="button" onClick={() => platform("whatsapp")}>WA<small>WhatsApp</small></button><button type="button" onClick={() => platform("facebook")}>f<small>Facebook</small></button><button type="button" onClick={() => platform("x")}>X<small>X</small></button><button type="button" onClick={() => platform("telegram")}>TG<small>Telegram</small></button><button type="button" onClick={() => platform("email")}>@<small>Email</small></button></div><Link className="share-settings-link" href="/dashboard/share">⚙ Share settings</Link></div></details>;
}