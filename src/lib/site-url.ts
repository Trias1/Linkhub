import "server-only";
import { headers } from "next/headers";

// Alamat publik situs untuk link share dan QR. Pakai NEXT_PUBLIC_SITE_URL kalau ada, kalau tidak dari header Host.
export async function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const host = (await headers()).get("host") ?? "localhost:3000";
  return `${/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? "http" : "https"}://${host}`;
}
