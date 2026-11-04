"use client";
import { useEffect } from "react";

// Menggantikan root layout, jadi CSS dari layout tidak ikut: gaya ditulis inline.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <html lang="en"><body style={{ margin: 0, background: "#f5f4ec", color: "#171712", fontFamily: "system-ui, sans-serif" }}>
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "72px 20px" }}>
      <h1 style={{ margin: "0 0 .4rem", fontSize: "1.5rem" }}>Something went wrong</h1>
      <p style={{ margin: "0 0 1.2rem", color: "#66655b" }}>Please try again. If it keeps happening, reload the page.</p>
      <button onClick={reset} style={{ minHeight: 44, padding: "0 1.1rem", border: 0, borderRadius: 999, background: "#171712", color: "#fff", font: "inherit", fontWeight: 650, cursor: "pointer" }}>Try again</button>
    </main>
  </body></html>;
}
