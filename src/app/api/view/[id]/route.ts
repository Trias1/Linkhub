import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid, rateLimit } from "@/lib/security";
import { trafficSource } from "@/lib/traffic-source";

// Kunjungan halaman: sekali per pengunjung per hari. Sumbernya (mis. "tiktok") disimpan di cookie supaya klik
// berikutnya dari kunjungan yang sama ikut tercatat dengan sumber yang sama.
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const cookieName=`view_${id}`;
  if(!isUuid(id)) return new NextResponse(null,{status:204});
  const body=await request.json().catch(()=>({})) as {src?:unknown;ref?:unknown};
  const source=trafficSource({tag:typeof body.src==="string"?body.src:null,referrer:typeof body.ref==="string"?body.ref.slice(0,500):null,userAgent:request.headers.get("user-agent"),ownHost:request.nextUrl.hostname});
  const secure=process.env.NODE_ENV==="production";
  const response=new NextResponse(null,{status:204});
  response.cookies.set(`src_${id}`,source,{httpOnly:true,sameSite:"lax",secure,maxAge:86400,path:"/api"});
  if(request.cookies.has(cookieName)) return response;
  const supabase=createAdminClient(); if(!supabase) return response;
  if(!(await rateLimit("view",30,60,request.headers))) return response;
  const token=randomUUID();
  let {error}=await supabase.rpc("record_page_view",{p_linktree_id:id,p_visitor_token:token,p_source:source});
  // Sebelum SQL 022 fungsi belum menerima sumber: catat tanpa sumber.
  if(error) ({error}=await supabase.rpc("record_page_view",{p_linktree_id:id,p_visitor_token:token}));
  if(error) return NextResponse.json({error:"Unable to record view"},{status:400});
  response.cookies.set(cookieName,token,{httpOnly:true,sameSite:"lax",secure,maxAge:86400,path:"/"}); return response;
}
