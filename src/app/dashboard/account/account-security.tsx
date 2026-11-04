"use client";

import Image from "next/image";
import { useState } from "react";
import { PasswordInput } from "@/components/password-input";
import { changePassword, deleteAccount, deleteLinktreeAccount } from "../actions";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; factor_type: string; friendly_name?: string; status: string };

export function AccountSecurity({ slug, canDeleteLinktree, initialFactors }: { slug: string; canDeleteLinktree: boolean; initialFactors: Factor[] }) {
  const [factors, setFactors] = useState<Factor[]>(initialFactors);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [totp, setTotp] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const verified = factors.find((item) => item.factor_type === "totp" && item.status === "verified");

  async function loadFactors() {
    const { data } = await createClient().auth.mfa.listFactors();
    setFactors((data?.all ?? []) as Factor[]);
  }
  async function enrollTotp() {
    setMessage(null);
    const supabase = createClient();
    const stale = factors.find((item) => item.factor_type === "totp" && item.status !== "verified");
    if (stale) await supabase.auth.mfa.unenroll({ factorId: stale.id });
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "LinkHub Authenticator" });
    if (error) return setMessage({ ok: false, text: "Could not start set-up. Please try again." });
    setTotp({ id: data.id, qr: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(data.totp.qr_code.slice(data.totp.qr_code.indexOf(",") + 1))}`, secret: data.totp.secret });
  }
  async function verifyTotp(formData: FormData) {
    if (!totp) return;
    const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: totp.id, code: String(formData.get("code") ?? "") });
    if (error) return setMessage({ ok: false, text: "That code did not work. Check the time on your phone and try the newest code." });
    setTotp(null); setMessage({ ok: true, text: "Authenticator app is on. You will be asked for a code when you sign in." }); await loadFactors();
  }
  async function removeFactor(id: string) {
    if (!confirm("Turn off the authenticator app? Your account will only be protected by your password.")) return;
    const { error } = await createClient().auth.mfa.unenroll({ factorId: id });
    setMessage(error ? { ok: false, text: "Could not turn it off. Sign in again and retry." } : { ok: true, text: "Authenticator app turned off." });
    if (!error) await loadFactors();
  }

  return <>
    {message ? <p className={message.ok ? "lh-ok" : "lh-alert"} role="status">{message.text}</p> : null}

    <section className="lh-box"><h2>Security</h2>
      <div className="lh-setting"><div><b>Authenticator app</b><p>Ask for a 6-digit code from an app like Google Authenticator when you sign in.</p></div>{verified ? <><span className="lh-status live">On</span><button type="button" className="lh-btn secondary small" onClick={() => void removeFactor(verified.id)}>Turn off</button></> : <button type="button" className="lh-btn small" onClick={() => void enrollTotp()}>Set up</button>}</div>
      {totp ? <form action={verifyTotp} className="lh-totp"><Image alt="Authenticator QR code" height={160} src={totp.qr} unoptimized width={160} /><div><p>Scan this QR code with your authenticator app, or enter the key by hand:</p><code>{totp.secret}</code><label className="lh-field">6-digit code<input name="code" inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} required /></label><div className="lh-row"><button className="lh-btn small">Verify and turn on</button><button type="button" className="lh-btn secondary small" onClick={() => setTotp(null)}>Cancel</button></div></div></form> : null}
    </section>

    <section className="lh-box"><h2>Password</h2>
      <form action={changePassword} className="lh-password-form"><PasswordInput name="password" autoComplete="new-password" label="New password" hint="At least 8 characters." /><PasswordInput name="confirmation" autoComplete="new-password" label="Repeat new password" /><div><button className="lh-btn small">Change password</button></div></form>
    </section>

    <section className="lh-box lh-danger-box"><h2>Delete</h2><p className="lh-hint">Deleting is permanent and cannot be undone.</p>
      <form action={deleteLinktreeAccount} className="lh-setting"><div><b>Delete this page</b><p>{canDeleteLinktree ? <>Removes /{slug} with its links and products. Type <code>{slug}</code> to confirm.</> : "You need at least one page. Create another page first if you want to delete this one."}</p>{canDeleteLinktree ? <input name="confirmation" placeholder={slug} required aria-label="Type the page address to confirm" /> : null}</div><button className="lh-btn secondary small lh-danger" disabled={!canDeleteLinktree}>Delete page</button></form>
      <form action={deleteAccount} className="lh-setting"><div><b>Delete account</b><p>Removes your account and every page you own. Type <code>DELETE</code> to confirm.</p><input name="confirmation" pattern="DELETE" placeholder="DELETE" required aria-label="Type DELETE to confirm" /></div><button className="lh-btn secondary small lh-danger">Delete account</button></form>
    </section>
  </>;
}
