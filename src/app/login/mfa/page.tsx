import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth-layout";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { MfaChallenge } from "./mfa-challenge";

export const metadata = { title: "Verify sign in · LinkHub" };

// Perangkat tepercaya sengaja tidak dilewati di sini: halaman ini juga dipakai untuk aksi sensitif yang butuh aal2.
export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams; const next = query.next?.startsWith("/dashboard") ? query.next : "/dashboard";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel !== "aal2" || aal.currentLevel === "aal2") redirect(next);
  return <AuthLayout title="Enter your code" subtitle="Open your authenticator app and type the 6-digit code for LinkHub."><MfaChallenge next={next} /><form action={logout} className="lh-auth-alt"><button className="lh-linkbtn">Use another account</button></form></AuthLayout>;
}
