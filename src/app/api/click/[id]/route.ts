import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid, rateLimit } from "@/lib/security";

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const supabase=createAdminClient(); const fallback=new URL("/",process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000");
  if(!supabase||!isUuid(id)) return NextResponse.redirect(fallback);
  const cookieName=`click_${id}`;
  // Cookie mencegah klik ganda; rate limit per IP mencegah bot tanpa cookie menggelembungkan statistik.
  const record=!request.cookies.has(cookieName)&&await rateLimit("click",60,60,request.headers);
  const {data:url}=record?await supabase.rpc("record_link_click",{p_link_id:id}):await supabase.from("links").select("url").eq("id",id).eq("is_active",true).single().then(({data})=>({data:data?.url??null}));
  const response=NextResponse.redirect(url??fallback);
  if(url&&!request.cookies.has(cookieName)) response.cookies.set(cookieName,"1",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:5,path:"/"});
  return response;
}
