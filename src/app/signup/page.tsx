import Link from "next/link";
import { LoginDialog } from "@/app/login/login-dialog";
import { withLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export default async function SignupPage({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){const query=await searchParams;const locale=await getLocale();return <main className="relative min-h-screen overflow-hidden bg-[#f5f4ec] p-6"><div className="absolute -left-24 -top-24 size-80 rounded-full bg-[#ffd9e5] blur-3xl"/><div className="absolute -bottom-32 -right-24 size-96 rounded-full bg-[#dfff55] blur-3xl"/><nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between"><Link className="brand" href={withLocale("/",locale)}>LinkHub</Link><div className="header-actions"><Link className="text-sm font-semibold text-[#68685f] hover:text-[#171712]" href={withLocale("/",locale)}>{locale==="en"?"Back to home":"Kembali ke beranda"}</Link></div></nav><LoginDialog error={query.error} message={query.message} signupMode locale={locale}/></main>;}


