import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { login } from "@/app/auth/actions";
import { AuthLayout } from "@/components/auth-layout";
import { PasswordInput } from "@/components/password-input";
import { Turnstile } from "@/components/turnstile";

export const metadata = { title: "Sign in · LinkHub" };

export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}) {
  const query=await searchParams;
  // Sudah login (mis. dari aplikasi di HP): langsung ke dashboard. Tidak kalau ada error, karena dashboard
  // sendiri bisa mengarahkan ke sini dengan error (mis. halaman pertama belum ada) dan itu akan berputar.
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (user && !query.error) redirect("/dashboard");
  return <AuthLayout tab="login" title="Sign in to your page" subtitle="Manage your products, links and promos." error={query.error} message={query.message}><form action={login} className="lh-form"><input name="website" type="hidden"/><label className="lh-field">Email<input autoComplete="email" name="email" required type="email"/></label><PasswordInput autoComplete="current-password"/><Link className="lh-text-link lh-right" href="/en/forgot-password">Forgot password?</Link><Turnstile locale="en"/><button className="lh-btn">Sign in</button></form></AuthLayout>;
}
