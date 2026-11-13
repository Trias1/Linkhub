import Link from "next/link";
import { getDashboardContext } from "@/lib/active-linktree";
import { AccountSecurity } from "./account-security";
import { saveAccount, saveWeeklyEmail, switchLinktree } from "../actions";

export const metadata = { title: "Account · LinkHub" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const { supabase, user, linktree, linktrees } = await getDashboardContext();
  const [{ data: profile }, { data: mfaFactors }, { data: owner }, query] = await Promise.all([
    supabase.from("linktrees").select("name,slug,avatar_url").eq("id", linktree.id).single(),
    supabase.auth.mfa.listFactors(),
    supabase.from("profiles").select("weekly_email").eq("id", user.id).maybeSingle(),
    searchParams,
  ]);

  return <div className="lh-page-wrap lh-account">
    <header className="lh-dash-top"><div><h1>Account &amp; security</h1><p>Signed in as {user.email}</p></div></header>
    {query.error ? <p className="lh-alert" role="alert">{query.error}</p> : null}
    {query.message ? <p className="lh-ok" role="status">{query.message}</p> : null}

    <section className="lh-box"><h2>This page</h2>
      <form action={saveAccount} className="lh-account-form">
        <label className="lh-field">Page name<input name="name" required maxLength={60} defaultValue={profile?.name ?? ""} /></label>
        <label className="lh-field">Page address<small>Changing it breaks links and QR codes you already shared.</small><span className="lh-prefix"><span>linkhub/</span><input name="slug" required pattern="[a-z0-9-]{3,40}" autoCapitalize="none" spellCheck={false} defaultValue={profile?.slug ?? ""} /></span></label>
        <label className="lh-field">Profile photo URL<small>Optional. A link to a JPG or PNG image.</small><input name="avatar_url" type="url" inputMode="url" placeholder="https://..." defaultValue={profile?.avatar_url ?? ""} /></label>
        <div><button className="lh-btn small">Save</button></div>
      </form>
    </section>

    <section className="lh-box"><h2>Your pages <span className="lh-hint">· {linktrees.length} of 3</span></h2>
      <ul className="lh-devices">{linktrees.map((item) => <li key={item.id}><span><b>{item.name}</b><small>{item.slug ? `/${item.slug}` : "No address yet"}</small></span>{item.id === linktree.id ? <span className="lh-status live">Open now</span> : <form action={switchLinktree}><input type="hidden" name="linktree_id" value={item.id} /><button className="lh-btn secondary small">Open</button></form>}</li>)}</ul>
      {linktrees.length < 3 ? <Link className="lh-btn secondary small lh-mt" href="/dashboard/new">+ New page</Link> : null}
    </section>

    <section className="lh-box"><h2>Weekly email</h2>
      <form action={saveWeeklyEmail} className="lh-weekly">
        <label className="lh-check"><input type="checkbox" name="weekly_email" defaultChecked={Boolean(owner?.weekly_email)} /> Send me a summary every Monday <small>Visitors, buy clicks and your top products from the last 7 days, for each of your pages. Sent to {user.email}.</small></label>
        {!process.env.RESEND_API_KEY ? <p className="lh-hint">Emails start once the email service is set up for LinkHub. Your choice is saved now.</p> : null}
        <div><button className="lh-btn secondary small">Save</button></div>
      </form>
    </section>

    <AccountSecurity slug={profile?.slug ?? ""} canDeleteLinktree={linktrees.length > 1} initialFactors={(mfaFactors?.all ?? []) as { id: string; factor_type: string; friendly_name?: string; status: string }[]} />
  </div>;
}
