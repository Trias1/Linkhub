import { AuthLayout } from "@/components/auth-layout";
import { logout } from "@/app/auth/actions";
import { MfaChallenge } from "./mfa-challenge";

export const metadata = { title: "Verify sign in · LinkHub" };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const query = await searchParams; const next = query.next?.startsWith("/dashboard") ? query.next : "/dashboard";
  return <AuthLayout title="Enter your code" subtitle="Open your authenticator app and type the 6-digit code for LinkHub."><MfaChallenge next={next} /><form action={logout} className="lh-auth-alt"><button className="lh-linkbtn">Use another account</button></form></AuthLayout>;
}
