import Link from "next/link";
import { getDashboardContext } from "@/lib/active-linktree";
import { siteOrigin } from "@/lib/site-url";
import { QrCode } from "@/components/qr-code";
import { ShareSettingsForm } from "./share-settings-form";
import { ShareTools } from "./share-tools";

export const metadata = { title: "Share & QR · LinkHub" };

export default async function SharePage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { supabase, linktree } = await getDashboardContext();
  const [{ data: profile }, origin, query] = await Promise.all([
    supabase.from("linktrees").select("name,slug,seo_title,seo_description,share_image_color").eq("id", linktree.id).single(),
    siteOrigin(),
    searchParams,
  ]);
  const name = profile?.name || "My page";
  const url = profile?.slug ? `${origin}/${profile.slug}` : null;

  return <div className="lh-page-wrap">
    <header className="lh-dash-top"><div><h1>Share &amp; QR</h1><p>Send your page to buyers, print the QR on packaging, and control how the link looks when shared.</p></div></header>
    {query.error ? <p className="lh-alert" role="alert">{query.error}</p> : null}
    {query.message ? <p className="lh-ok" role="status">{query.message}</p> : null}
    {url ? <div className="lh-share-grid">
      <section className="lh-box"><h2>Your link</h2><ShareTools url={url} name={name} /></section>
      <section className="lh-box lh-qr-box"><h2>QR code</h2><QrCode value={url} filename={`linkhub-${profile?.slug}-qr`} /><p className="lh-hint">For stickers, packaging, flyers or your shop counter. Scanning opens your page.</p></section>
    </div> : <section className="lh-box lh-empty-box"><p>Your page needs an address before you can share it.</p><Link className="lh-btn small" href="/dashboard/account">Set page address</Link></section>}
    <section className="lh-box"><h2>Link preview</h2><ShareSettingsForm name={name} url={url} initial={{ title: profile?.seo_title || "", description: profile?.seo_description || "", color: profile?.share_image_color || "#171712" }} /></section>
  </div>;
}
