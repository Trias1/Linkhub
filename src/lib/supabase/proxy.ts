import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request:NextRequest,rewriteUrl?:URL,requestHeaders?:Headers){
  const makeResponse=()=>rewriteUrl?NextResponse.rewrite(rewriteUrl,{request:{headers:requestHeaders??request.headers}}):NextResponse.next({request:{headers:requestHeaders??request.headers}});
  let response=makeResponse();
  const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>request.cookies.getAll(),setAll(cookiesToSet){cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));response=makeResponse();cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
  await supabase.auth.getClaims();return response;
}
