import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const cookieName=`view_${id}`;
  if(request.cookies.has(cookieName)) return new NextResponse(null,{status:204});
  const supabase=createAdminClient(); if(!supabase) return new NextResponse(null,{status:204});
  const token=randomUUID(); const {error}=await supabase.rpc("record_page_view",{p_linktree_id:id,p_visitor_token:token});
  if(error) return NextResponse.json({error:"Unable to record view"},{status:400});
  const response=new NextResponse(null,{status:204}); response.cookies.set(cookieName,token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:86400,path:"/"}); return response;
}
