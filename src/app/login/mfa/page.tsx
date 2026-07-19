import Link from "next/link";
import { MfaChallenge } from "./mfa-challenge";

export default async function MfaPage({searchParams}:{searchParams:Promise<{next?:string}>}) {
  const query=await searchParams; const next=query.next?.startsWith("/dashboard")?query.next:"/dashboard";
  return <main className="relative min-h-screen overflow-hidden bg-[#f5f4ec] p-6"><div className="absolute -left-24 -top-24 size-80 rounded-full bg-[#dfff55] blur-3xl"/><nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between"><Link className="brand" href="/">LinkHub</Link></nav><MfaChallenge next={next}/></main>;
}
