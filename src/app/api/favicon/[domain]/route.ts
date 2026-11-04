import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/security";

// Ikon situs untuk link "website" biasa. Diambil dari layanan ikon DuckDuckGo (bukan langsung dari situsnya),
// jadi server hanya menghubungi satu host tetap. Hasilnya di-cache CDN seminggu.
const DOMAIN = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const MAX_ICON = 100 * 1024;
const cache = "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400";

export async function GET(request: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const domain = decodeURIComponent((await params).domain).toLowerCase();
  if (!DOMAIN.test(domain)) return new NextResponse(null, { status: 400 });
  if (!(await rateLimit("favicon", 120, 60, request.headers))) return new NextResponse(null, { status: 429 });
  const response = await fetch(`https://icons.duckduckgo.com/ip3/${domain}.ico`, { redirect: "error", signal: AbortSignal.timeout(5000) }).catch(() => null);
  const type = response?.headers.get("content-type") ?? "";
  if (!response?.ok || !/^image\/(x-icon|vnd\.microsoft\.icon|png|jpeg|gif|webp)$/.test(type)) {
    // Tidak ada ikon: cache sebentar supaya tidak terus ditanyakan, halaman memakai ikon globe.
    return new NextResponse(null, { status: 404, headers: { "cache-control": "public, max-age=86400, s-maxage=86400" } });
  }
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > MAX_ICON) return new NextResponse(null, { status: 404 });
  return new NextResponse(bytes, { headers: { "content-type": type, "cache-control": cache, "x-content-type-options": "nosniff" } });
}
