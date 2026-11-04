"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/platform-icon";

// Link website biasa memakai ikon situsnya sendiri (favicon); kalau tidak ada, kembali ke ikon globe.
export function LinkIcon({ platform, domain, size = 18 }: { platform: string | null; domain?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (platform !== "website" || !domain || failed) return <PlatformIcon platform={platform} size={size} />;
  // eslint-disable-next-line @next/next/no-img-element -- ikon kecil dari route kita sendiri, tidak perlu next/image
  return <img className="lh-favicon" src={`/api/favicon/${encodeURIComponent(domain)}`} width={size} height={size} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

