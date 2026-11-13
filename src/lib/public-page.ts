import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { endsSoon, fetchProducts, liveProducts, type Product } from "@/lib/products";

// Data dasar halaman publik (nama, foto, gaya) untuk halaman per produk dan daftar per video.
export async function loadPublicPage(supabase: SupabaseClient, slug: string) {
  const columns = "id,name,bio,avatar_url,background_color,text_color,button_color,title_style,title_color,wallpaper_style,button_style,button_roundness,button_text_color,page_font,custom_footer";
  // affiliate_notice dari SQL 022; kalau kolomnya belum ada, halaman tetap tampil.
  const first = await supabase.from("linktrees").select(`${columns},affiliate_notice`).eq("slug", slug).maybeSingle();
  const fallback = first.error ? (await supabase.from("linktrees").select(columns).eq("slug", slug).maybeSingle()).data : null;
  const profile = first.error ? fallback && { ...fallback, affiliate_notice: false } : first.data;
  if (!profile) return null;
  const { data: header } = await supabase.from("linktree_headers").select("title,bio").eq("linktree_id", profile.id).maybeSingle();
  return { profile, name: (header?.title || profile.name) as string, bio: (header?.bio ?? profile.bio ?? "") as string };
}

// Produk yang sedang tayang dengan nomor tertentu (nomor tetap, lihat SQL 021).
export async function liveProductByNumber(supabase: SupabaseClient, linktreeId: string, number: string) {
  if (!/^\d{1,6}$/.test(number)) return null;
  return liveProducts(await fetchProducts(supabase, linktreeId, true)).find((item) => item.number === Number(number)) ?? null;
}

// Hanya kolom yang dibutuhkan kartu produk di browser (link toko tidak ikut; tombol Buy lewat /api/product/[id]).
export const publicProduct = ({ id, collection_id, platform, title, price, image_url, compare_price, is_featured, ends_at, number, note }: Product) =>
  ({ id, collection_id, platform, title, price, image_url, compare_price, is_featured, ends_at, number, note, ends: endsSoon(ends_at) });
