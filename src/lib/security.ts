import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function clientIp(source: Headers) {
  return source.get("x-forwarded-for")?.split(",")[0]?.trim() || source.get("x-real-ip") || "unknown";
}

// Penghitung per IP (di-hash) di Postgres. Kalau service role atau migrasi 017 belum ada, jangan blokir user.
export async function rateLimit(bucket: string, limit: number, windowSeconds: number, source?: Headers) {
  const admin = createAdminClient();
  if (!admin) return true;
  const ip = clientIp(source ?? (await headers()));
  const key = createHash("sha256").update(`${bucket}:${ip}`).digest("hex");
  const { data, error } = await admin.rpc("hit_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
  return error ? true : data !== false;
}

// Cloudflare Turnstile. Nonaktif kalau TURNSTILE_SECRET_KEY belum dipasang (mis. di lokal).
export async function verifyTurnstile(token: FormDataEntryValue | string | null | undefined, source?: Headers) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || !token) return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: clientIp(source ?? (await headers())) });
  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body }).then((response) => response.json()).catch(() => null) as { success?: boolean } | null;
  return result?.success === true;
}

// Hanya path internal: "/x" boleh; "//evil.com", "/\evil.com" dan karakter kontrol (tab/newline, dibuang oleh
// parser URL sehingga "/\t/evil.com" jadi "//evil.com") tidak.
export const safeNextPath = (value: string | null | undefined, fallback = "/dashboard") => value && /^\/(?![/\\])[^\u0000-\u001f\\]*$/.test(value) ? value : fallback;

// Nilai CSV yang diawali = + - @ tab/CR dianggap formula oleh Excel/Sheets.
export const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  return `"${(/^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
};
