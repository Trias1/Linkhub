"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: TurnstileApi } }

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const scriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript() {
  if (window.turnstile) return Promise.resolve();
  let script = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);
  if (!script) { script = document.createElement("script"); script.src = scriptSrc; script.async = true; document.head.appendChild(script); }
  return new Promise<void>((resolve) => script.addEventListener("load", () => resolve(), { once: true }));
}

// Menambahkan input tersembunyi "cf-turnstile-response" ke form tempat komponen ini berada.
export function Turnstile({ locale = "id" }: { locale?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!siteKey) return;
    let id: string | undefined; let cancelled = false;
    loadScript().then(() => { if (!cancelled && ref.current && window.turnstile) id = window.turnstile.render(ref.current, { sitekey: siteKey, language: locale, theme: "light" }); });
    return () => { cancelled = true; if (id) window.turnstile?.remove(id); };
  }, [locale]);
  if (!siteKey) return null;
  return <div className="turnstile" ref={ref} />;
}
