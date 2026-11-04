"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; factor_type: string; friendly_name?: string };

export function MfaChallenge({ next }: { next: string }) {
  const router = useRouter();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [factorId, setFactorId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { void (async () => { const { data } = await createClient().auth.mfa.listFactors(); const verified = (data?.all ?? []).filter((item) => item.status === "verified") as Factor[]; setFactors(verified); setFactorId(verified[0]?.id ?? ""); })(); }, []);

  async function verify(formData: FormData) {
    const factor = factors.find((item) => item.id === factorId);
    if (!factor) return setError("No authenticator found for this account. Sign in again.");
    setBusy(true); setError("");
    const supabase = createClient(); const code = String(formData.get("code") ?? "").replace(/\s/g, "");
    const failed = () => { setBusy(false); setError("That code did not work. Try the newest code from your app."); };
    if (factor.factor_type === "phone") { const challenge = await supabase.auth.mfa.challenge({ factorId, channel: "sms" }); if (challenge.error) return failed(); const result = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code }); if (result.error) return failed(); }
    else { const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code }); if (result.error) return failed(); }
    router.push(next); router.refresh();
  }

  return <form action={verify} className="lh-form">
    {error ? <p className="lh-alert" role="alert">{error}</p> : null}
    {factors.length > 1 ? <label className="lh-field">Method<select value={factorId} onChange={(event) => setFactorId(event.target.value)}>{factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.friendly_name || factor.factor_type}</option>)}</select></label> : null}
    <label className="lh-field">6-digit code<input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus /></label>
    <button className="lh-btn" disabled={!factorId || busy}>{busy ? "Checking…" : "Continue"}</button>
  </form>;
}
