import Link from "next/link";
import { createLinktree } from "../actions";
import { getDashboardContext } from "@/lib/active-linktree";

export default async function NewLinktreePage({ searchParams }: { searchParams:Promise<{ error?:string }> }) {
  const { linktrees } = await getDashboardContext();
  const query = await searchParams;
  return <><header className="dashboard-topbar"><div><Link className="back-link" href="/dashboard/links">← Back</Link><p className="section-label">Linktrees {linktrees.length}/3</p><h1>Create new Linktree</h1></div></header>{query.error ? <p className="notice error">{query.error}</p> : null}<form action={createLinktree} className="panel stack new-linktree-form"><label>Linktree name<input name="name" required maxLength={60} placeholder="My second Linktree"/></label><label>Username / slug<input name="slug" required pattern="[a-z0-9-]{3,40}" placeholder="my-second-linktree"/></label><label>Bio<textarea name="bio" maxLength={160} placeholder="Tentang Linktree ini"/></label><button disabled={linktrees.length >= 3}>Create Linktree</button></form></>;
}