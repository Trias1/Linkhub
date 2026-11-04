"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

// Landing page statis tidak tahu siapa yang login. Cookie sesi Supabase (sb-…-auth-token) bisa dibaca di
// browser, jadi kalau ada, tampilkan jalan ke dashboard. Kalau sesinya ternyata tidak berlaku, dashboard
// sendiri yang mengarahkan ke Sign in.
const subscribe = () => () => {};
const hasSession = () => /(^|;\s*)sb-[^=]+-auth-token(\.0)?=/.test(document.cookie);
export const useSignedIn = () => useSyncExternalStore(subscribe, hasSession, () => false);

export function AccountLinks() {
  const signedIn = useSignedIn();
  if (signedIn) return <Link className="lh-btn small" href="/en/dashboard">Open dashboard</Link>;
  return <><Link href="/en/login">Sign in</Link><Link className="lh-btn small" href="/en/signup">Create a page</Link></>;
}

export function HeroSecondaryLink() {
  return useSignedIn() ? <Link href="/en/dashboard">Open your dashboard</Link> : <Link href="/en/login">I already have a page</Link>;
}
