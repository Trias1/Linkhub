import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { liveProductByNumber, loadPublicPage } from "@/lib/public-page";
import { formatRupiah } from "@/lib/rupiah";
import { isCommercePlatform, platformLabel } from "@/lib/commerce-platforms";

export const alt = "Product preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Foto diambil dulu sebagai data URL: kalau gagal atau formatnya tidak didukung, gambar tetap jadi tanpa foto.
async function photoData(url: string | null | undefined) {
  // Hanya foto dari Storage Supabase milik LinkHub (foto produk selalu disimpan di sana).
  const storage = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host : "";
  if (!url || !storage || !url.startsWith(`https://${storage}/storage/v1/object/public/`)) return null;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const type = response.headers.get("content-type")?.split(";")[0] ?? "";
    if (!response.ok || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(type)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    return bytes.length > 4_000_000 ? null : `data:${type};base64,${bytes.toString("base64")}`;
  } catch { return null; }
}

// Gambar pratinjau saat link produk dibagikan (WhatsApp, Facebook, X): foto, nama, harga, toko.
export default async function ProductImage({ params }: { params: Promise<{ slug: string; no: string }> }) {
  const { slug, no } = await params; const supabase = await createClient();
  const page = await loadPublicPage(supabase, slug);
  const product = page ? await liveProductByNumber(supabase, page.profile.id, no) : null;
  const title = (product?.title ?? page?.name ?? "LinkHub").slice(0, 90);
  const price = product?.price ? formatRupiah(product.price) : "";
  const before = product && Number(product.compare_price) > Number(product.price) ? formatRupiah(product.compare_price) : "";
  const store = product && isCommercePlatform(product.platform) ? `Buy on ${platformLabel(product.platform)}` : "View product";
  const photo = await photoData(product?.image_url);
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", background: "#f5f4ec", color: "#171712", fontFamily: "Arial, sans-serif" }}>
    {photo ? <div style={{ display: "flex", width: 630, height: 630, flex: "none", background: "#e7e5da" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/og hanya mengenal <img> */}
      <img src={photo} width={630} height={630} alt="" style={{ objectFit: "cover" }} />
    </div> : null}
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "56px 56px 52px" }}>
      <div style={{ display: "flex", fontSize: 26, fontWeight: 700, opacity: .6 }}>{page?.name ?? "LinkHub"}{product?.number ? ` · No. ${product.number}` : ""}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", fontSize: photo ? 50 : 72, lineHeight: 1.08, fontWeight: 800, letterSpacing: -1.5 }}>{title}</div>
        {price ? <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}><span style={{ fontSize: 46, fontWeight: 800 }}>{price}</span>{before ? <span style={{ fontSize: 30, opacity: .5, textDecoration: "line-through" }}>{before}</span> : null}</div> : null}
      </div>
      <div style={{ display: "flex", alignSelf: "flex-start", padding: "14px 26px", borderRadius: 999, background: "#171712", color: "#f5f4ec", fontSize: 26, fontWeight: 700 }}>{store}</div>
    </div>
  </div>, size);
}
