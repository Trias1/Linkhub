import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardContext } from "@/lib/active-linktree";

export default async function AdminPage() {
  const { supabase, isAdmin } = await getDashboardContext();
  if (!isAdmin) notFound();

  const [{ count: users }, { count: links }, { count: views }, { count: clicks }, { data: recentUsers }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("links").select("id", { count: "exact", head: true }),
    supabase.from("page_views").select("id", { count: "exact", head: true }),
    supabase.from("link_clicks").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id,name,slug,created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  const day = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });
  const stats = [["Accounts", users], ["Links", links], ["Page views", views], ["Link clicks", clicks]] as const;

  return <main className="lh-admin">
    <header className="lh-auth-bar"><Link className="lh-brand" href="/en">Link<b>Hub</b></Link><Link href="/dashboard">Back to dashboard</Link></header>
    <div className="lh-admin-body">
      <h1>Admin</h1>
      <div className="lh-stats">{stats.map(([label, value]) => <div key={label}><small>{label}</small><b>{(value ?? 0).toLocaleString("en-GB")}</b></div>)}</div>
      <section className="lh-box"><h2>Newest accounts</h2>
        <div className="lh-table-wrap"><table className="lh-table"><thead><tr><th>Name</th><th>Address</th><th>Joined</th></tr></thead>
          <tbody>{recentUsers?.map((item) => <tr key={item.id}><td>{item.name || "No name"}</td><td>{item.slug ? `/${item.slug}` : "Not set"}</td><td>{day.format(new Date(item.created_at))}</td></tr>)}</tbody></table></div>
      </section>
    </div>
  </main>;
}
