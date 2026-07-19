import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const cookieName=`contact_${id}`;
  if(request.cookies.has(cookieName))return NextResponse.json({error:"Tunggu sebentar sebelum mengirim lagi"},{status:429});
  const body=await request.json().catch(()=>null) as {name?:string;email?:string;company?:string}|null;
  const name=body?.name?.trim().slice(0,80)??""; const email=body?.email?.trim().slice(0,254)??"";
  if(body?.company||!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({error:"Data kontak tidak valid"},{status:400});
  const supabase=createAdminClient(); if(!supabase)return NextResponse.json({error:"Contact service belum dikonfigurasi"},{status:503});
  const {data:tree}=await supabase.from("linktrees").select("owner_id").eq("id",id).single(); if(!tree)return NextResponse.json({error:"Linktree tidak ditemukan"},{status:404});
  const {error}=await supabase.from("contacts").insert({profile_id:tree.owner_id,linktree_id:id,name,email}); if(error)return NextResponse.json({error:"Kontak gagal dikirim"},{status:400});
  const response=NextResponse.json({message:"Kontak berhasil dikirim"});response.cookies.set(cookieName,"1",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:60,path:"/"});return response;
}
