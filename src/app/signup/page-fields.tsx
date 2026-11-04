"use client";

import { useState } from "react";
import { normalizeSlug } from "@/lib/slug";

// Alamat halaman ikut nama sampai user mengubahnya sendiri.
export function PageFields() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [edited, setEdited] = useState(false);
  const shown = edited ? slug : normalizeSlug(name);
  return <>
    <label className="lh-field">Name or shop name<input name="name" required maxLength={60} autoComplete="organization" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Zulf Studio" /></label>
    <label className="lh-field">Page address<small>Letters, numbers and dashes. You can change it later.</small><span className="lh-prefix"><span>linkhub/</span><input name="slug" required minLength={3} maxLength={40} pattern="[a-z0-9-]{3,40}" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={shown} onChange={(event) => { setEdited(true); setSlug(normalizeSlug(event.target.value) + (event.target.value.endsWith("-") ? "-" : "")); }} placeholder="zulf-studio" /></span></label>
  </>;
}
