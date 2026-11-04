import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid, rateLimit } from "@/lib/security";

// Tombol "Beli di ..." lewat sini supaya klik per produk dan per marketplace tercatat.
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const supabase=createAdminClient(); const fallback=new URL("/",process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000");
  if(!supabase||!isUuid(id)) return NextResponse.redirect(fallback);
  const cookieName=`buy_${id}`;
  const record=!request.cookies.has(cookieName)&&await rateLimit("product",60,60,request.headers);
  const recorded=record?await supabase.rpc("record_product_click",{p_product_id:id}):null;
  // Kalau SQL 018 belum dijalankan, RPC gagal: tetap arahkan pembeli ke toko.
  const url:string|null=recorded&&!recorded.error?recorded.data:(await supabase.from("products").select("url").eq("id",id).eq("is_active",true).maybeSingle()).data?.url??null;
  const response=NextResponse.redirect(url??fallback);
  if(url&&!request.cookies.has(cookieName)) response.cookies.set(cookieName,"1",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:5,path:"/"});
  return response;
}
