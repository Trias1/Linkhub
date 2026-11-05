"use client";

import { useEffect } from "react";

// Kalau sesuatu di dashboard gagal (mis. upload terlalu besar), tampilkan pesan di dalam dashboard,
// bukan halaman error penuh yang membuang seluruh tampilan.
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="lh-page-wrap">
    <section className="lh-box">
      <h2>Something went wrong</h2>
      <p className="lh-hint">Your last change may not have been saved. Try again. If you were uploading a photo, try a smaller one.</p>
      <div className="lh-row"><button type="button" className="lh-btn small" onClick={reset}>Try again</button><a className="lh-btn secondary small" href="/en/dashboard">Back to dashboard</a></div>
    </section>
  </div>;
}
