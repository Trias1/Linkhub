import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Level MFA sesi ini. Access token WAJIB dikirim: tanpa token, Supabase membaca daftar faktor MFA dari cookie,
// yang bisa diubah di browser (faktor dikosongkan -> MFA terlewati). Dengan token, faktor diambil dari server.
export async function assuranceLevel(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel(session.access_token);
  return data;
}

// True kalau akun punya MFA tapi sesi ini belum memasukkan kode (belum aal2). Database (SQL 020) memakai aturan
// yang sama. Kalau pengecekan gagal, anggap kode masih perlu (fail-closed).
export async function needsMfaCode(supabase: Awaited<ReturnType<typeof createClient>>) {
  const aal = await assuranceLevel(supabase);
  return !aal || (aal.nextLevel === "aal2" && aal.currentLevel !== "aal2");
}

// Dipakai semua halaman dashboard, server action, export, dan admin: user wajib login, dan kalau MFA aktif
// sesi harus sudah aal2.
export const getDashboardContext = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const cookieStore = await cookies();
  if (await needsMfaCode(supabase)) redirect("/login/mfa");
  const [{ data: linktrees }, { data: account }] = await Promise.all([
    supabase.from("linktrees").select("id,name,slug,avatar_url,created_at").eq("owner_id", user.id).order("created_at"),
    supabase.from("profiles").select("is_admin").eq("id", user.id).single(),
  ]);
  if (!linktrees?.length) redirect("/login?error=Your first page has not been created yet");
  const activeId = cookieStore.get("active_linktree_id")?.value;
  const linktree = linktrees.find((item) => item.id === activeId) ?? linktrees[0];
  return { supabase, user, linktree, linktrees, isAdmin: Boolean(account?.is_admin) };
});
