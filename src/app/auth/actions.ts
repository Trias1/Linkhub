"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function credentials(formData:FormData,errorPath="/login"){
  const email=String(formData.get("email")??"").trim(); const password=String(formData.get("password")??"");
  if(formData.get("website")) redirect(errorPath);
  if(!email||password.length<8) redirect(`${errorPath}?error=Email atau password tidak valid`);
  return {email,password};
}
export async function login(formData:FormData){const supabase=await createClient();const {error}=await supabase.auth.signInWithPassword(credentials(formData));if(error)redirect(`/login?error=${encodeURIComponent(error.message)}`);const {data:aal}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();redirect(aal?.nextLevel==="aal2"&&aal.currentLevel!=="aal2"?"/login/mfa":"/dashboard");}
export async function signup(formData:FormData){const supabase=await createClient();const data=credentials(formData,"/signup");const name=String(formData.get("name")??"").trim().slice(0,60);const {error}=await supabase.auth.signUp({...data,options:{data:{name}}});if(error)redirect(`/signup?error=${encodeURIComponent(error.message)}`);redirect("/login?message=Cek email untuk konfirmasi akun");}
export async function requestPasswordReset(formData:FormData){const email=String(formData.get("email")??"").trim();if(!email||formData.get("website"))redirect("/forgot-password?message=Jika email terdaftar, link reset akan dikirim");const supabase=await createClient();const siteUrl=process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000";await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${siteUrl}/auth/callback?next=/reset-password`});redirect("/forgot-password?message=Jika email terdaftar, link reset akan dikirim");}
export async function updatePassword(formData:FormData){const password=String(formData.get("password")??"");const confirmation=String(formData.get("confirmation")??"");if(password.length<8||password!==confirmation)redirect("/reset-password?error=Password minimal 8 karakter dan harus sama");const supabase=await createClient();const {error}=await supabase.auth.updateUser({password});if(error)redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);redirect("/login?message=Password berhasil diperbarui");}
export async function logout(){const supabase=await createClient();await supabase.auth.signOut();redirect("/");}
