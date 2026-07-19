"use client";
import { useEffect } from "react";
export default function GlobalError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){useEffect(()=>{console.error(error);},[error]);return <html lang="id"><body><main className="auth-shell"><section className="auth-card"><h1>Terjadi kesalahan</h1><p>Silakan coba lagi. Jika masalah berlanjut, muat ulang halaman.</p><button onClick={reset}>Coba lagi</button></section></main></body></html>;}
