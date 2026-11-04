import { createLinktree } from "../actions";
import { getDashboardContext } from "@/lib/active-linktree";

export const metadata = { title: "New page · LinkHub" };

export default async function NewLinktreePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { linktrees } = await getDashboardContext();
  const query = await searchParams;
  const full = linktrees.length >= 3;
  return <div className="lh-page-wrap">
    <header className="lh-dash-top"><div><h1>New page</h1><p>A separate page with its own address, products and links. {linktrees.length} of 3 used.</p></div></header>
    {query.error ? <p className="lh-alert" role="alert">{query.error}</p> : null}
    <section className="lh-box"><form action={createLinktree} className="lh-account-form">
      <label className="lh-field">Page name<input name="name" required maxLength={60} placeholder="e.g. Rani Affiliate Picks" /></label>
      <label className="lh-field">Page address<small>Letters, numbers and dashes.</small><span className="lh-prefix"><span>linkhub/</span><input name="slug" required pattern="[a-z0-9-]{3,40}" autoCapitalize="none" spellCheck={false} placeholder="rani-picks" /></span></label>
      <label className="lh-field">Bio<small>Optional, up to 160 characters</small><textarea name="bio" maxLength={160} rows={3} placeholder="What is this page about?" /></label>
      <div><button className="lh-btn small" disabled={full}>{full ? "You already have 3 pages" : "Create page"}</button></div>
    </form></section>
  </div>;
}
