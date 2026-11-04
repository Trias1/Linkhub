"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { needsMfaCode } from "@/lib/active-linktree";
import { rateLimit, verifyTurnstile } from "@/lib/security";
import { normalizeSlug, slugProblem } from "@/lib/slug";

const fail=(path:string,message:string):never=>redirect(`${path}?error=${encodeURIComponent(message)}`);
async function guard(formData:FormData,path:string,bucket:string,limit:number,windowSeconds:number){
  if(formData.get("website")) redirect(path);
  if(!(await rateLimit(bucket,limit,windowSeconds))) fail(path,"Too many attempts. Try again in a few minutes.");
  if(!(await verifyTurnstile(formData.get("cf-turnstile-response")))) fail(path,"Captcha check failed. Please try again.");
}
function credentials(formData:FormData,errorPath="/login"){
  const email=String(formData.get("email")??"").trim(); const password=String(formData.get("password")??"");
  if(!email||password.length<8) fail(errorPath,"Enter a valid email and a password of at least 8 characters");
  return {email,password};
}
export async function login(formData:FormData){await guard(formData,"/login","login",10,900);const supabase=await createClient();const {data,error}=await supabase.auth.signInWithPassword(credentials(formData));if(error||!data.user)return fail("/login",error?.code==="email_not_confirmed"?"Email not confirmed yet. Check your inbox.":"Wrong email or password");redirect(await needsMfaCode(supabase,data.user.id)?"/login/mfa":"/dashboard");}
// Pesan sukses yang sama untuk email baru maupun yang sudah terdaftar, supaya daftar email tidak bisa ditebak.
export async function signup(formData:FormData){
  await guard(formData,"/signup","signup",5,3600);
  const name=String(formData.get("name")??"").trim().slice(0,60); const slug=normalizeSlug(String(formData.get("slug")??""));
  if(!name) fail("/signup","Enter your name or shop name");
  const slugError=slugProblem(slug); if(slugError) fail("/signup",slugError);
  const supabase=await createClient();
  const {data:taken}=await supabase.from("linktrees").select("id").eq("slug",slug).maybeSingle();
  if(taken) fail("/signup","That page address is taken. Try another one.");
  // Nama dan alamat dipakai trigger handle_new_user (SQL 019) saat membuat halaman pertama.
  const {error}=await supabase.auth.signUp({...credentials(formData,"/signup"),options:{data:{name,slug}}});
  if(error&&error.code!=="user_already_exists")fail("/signup",error.code==="weak_password"?"Password is too weak. Use at least 8 characters with letters and numbers.":"Sign up failed. Please try again shortly."); redirect("/login?message=Check your email to confirm your account");
}
export async function requestPasswordReset(formData:FormData){const done="/forgot-password?message=If the email is registered, a reset link is on its way";const email=String(formData.get("email")??"").trim();if(!email)redirect(done);await guard(formData,"/forgot-password","reset",5,3600);const supabase=await createClient();const siteUrl=process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000";await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${siteUrl}/auth/callback?next=/reset-password`});redirect(done);}
export async function updatePassword(formData:FormData){const password=String(formData.get("password")??"");const confirmation=String(formData.get("confirmation")??"");if(password.length<8||password!==confirmation)redirect("/reset-password?error=Passwords must match and be at least 8 characters");const supabase=await createClient();const {error}=await supabase.auth.updateUser({password});if(error)fail("/reset-password",error.code==="same_password"?"The new password must be different from the old one":"Could not update the password. Request a new reset link.");redirect("/login?message=Password updated");}
export async function logout(){const supabase=await createClient();await supabase.auth.signOut();redirect("/");}
