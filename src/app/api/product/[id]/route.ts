import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid, rateLimit } from "@/lib/security";
import { clickSource } from "@/lib/traffic-source";

// Tombol "Beli di ..." lewat sini supaya klik per produk, per marketplace dan per sumber tercatat.
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const supabase=createAdminClient(); const fallback=new URL("/",process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000");
  if(!supabase||!isUuid(id)) return NextResponse.redirect(fallback);
  const cookieName=`buy_${id}`;
  const record=!request.cookies.has(cookieName)&&await rateLimit("product",60,60,request.headers);
  let url:string|null=null;
  if(record){
    const {data:product}=await supabase.from("products").select("linktree_id").eq("id",id).maybeSingle();
    const first=await supabase.rpc("record_product_click",{p_product_id:id,p_source:clickSource(request,product?.linktree_id??null)});
    // Sebelum SQL 022 fungsi belum menerima sumber; kalau RPC tetap gagal, pembeli tetap diarahkan ke toko.
    const recorded=first.error?await supabase.rpc("record_product_click",{p_product_id:id}):first;
    url=recorded.error?null:recorded.data;
  }
  url??=(await supabase.from("products").select("url").eq("id",id).eq("is_active",true).maybeSingle()).data?.url??null;
  const response=NextResponse.redirect(url??fallback);
  if(url&&!request.cookies.has(cookieName)) response.cookies.set(cookieName,"1",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:5,path:"/"});
  return response;
}
