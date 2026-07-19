import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const supabase=createAdminClient(); const fallback=new URL("/",process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000");
  if(!supabase) return NextResponse.redirect(fallback);
  const cookieName=`click_${id}`;
  const {data:url}=request.cookies.has(cookieName)?await supabase.from("links").select("url").eq("id",id).eq("is_active",true).single().then(({data})=>({data:data?.url??null})):await supabase.rpc("record_link_click",{p_link_id:id});
  const response=NextResponse.redirect(url??fallback);
  if(url&&!request.cookies.has(cookieName)) response.cookies.set(cookieName,"1",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:5,path:"/"});
  return response;
}
