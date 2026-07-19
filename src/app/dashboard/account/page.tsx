import { DashboardIcon } from "@/components/dashboard-icon";
import { getDashboardContext } from "@/lib/active-linktree";
import { AccountSecurity } from "./account-security";
import { saveAccount } from "../actions";
import { getLocale } from "@/lib/i18n-server";

export default async function AccountPage({ searchParams }: { searchParams:Promise<{ error?:string;message?:string }> }) {
  const { supabase,user,linktree,linktrees }=await getDashboardContext();
  const locale=await getLocale(); const en=locale==="en";
  const [{ data:profile },{ data:devices },{ data:mfaFactors }]=await Promise.all([
    supabase.from("linktrees").select("name,bio,slug").eq("id",linktree.id).single(),
    supabase.from("trusted_devices").select("id,label,expires_at,created_at").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}),
    supabase.auth.mfa.listFactors(),
  ]);
  const { data:account }=await supabase.from("profiles").select("allow_data_sharing").eq("id",user.id).single();
  const query=await searchParams;

  return <div className="account-page">
    <header className="dashboard-topbar"><div><p className="section-label">Account</p><h1>{en?"Account settings":"Pengaturan akun"}</h1></div></header>
    {query.error?<p className="notice error">{query.error}</p>:null}{query.message?<p className="notice">{query.message}</p>:null}
    <section className="account-section"><div className="account-section-heading"><span className="metric-icon"><DashboardIcon name="account"/></span><div><h2>{en?"My information":"Informasi saya"}</h2><p>{en?"Update your personal and Linktree profile information.":"Perbarui informasi pribadi dan profil Linktree kamu."}</p></div></div><form action={saveAccount} className="account-form stack"><label>{en?"Name":"Nama"}<input name="name" required defaultValue={profile?.name??""}/></label><label>{en?"Owner email":"Email pemilik"}<input value={user.email??""} disabled/></label><label>Bio<textarea name="bio" maxLength={160} defaultValue={profile?.bio??""}/></label><label>Slug<input name="slug" required pattern="[a-z0-9-]{3,40}" defaultValue={profile?.slug??""}/></label><button>{en?"Save profile":"Simpan profil"}</button></form></section>
    <AccountSecurity locale={locale} allowDataSharing={account?.allow_data_sharing??true} devices={devices??[]} slug={profile?.slug??""} canDeleteLinktree={linktrees.length>1} initialFactors={(mfaFactors?.all??[]) as {id:string;factor_type:string;friendly_name?:string;status:string}[]}/>
    <section className="account-section"><div className="account-subsection"><div><h2>{en?"Linktrees you own":"Linktree milikmu"}</h2><p>{en?"Profiles currently owned by this account.":"Profil yang dimiliki akun ini."}</p></div></div><div className="owned-linktrees">{linktrees.map((item)=><div key={item.id}><span>{item.name}</span><small>/{item.slug}{item.id===linktree.id?en?" · Active":" · Aktif":""}</small></div>)}</div></section>
  </div>;
}


