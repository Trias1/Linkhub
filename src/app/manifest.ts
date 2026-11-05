import type { MetadataRoute } from "next";

// Aplikasi yang dipasang di HP langsung membuka dashboard (yang mengarahkan ke Sign in kalau belum login).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LinkHub",
    short_name: "LinkHub",
    description: "A free shop page for your Shopee, Tokopedia and TikTok Shop products.",
    id: "/en/dashboard",
    start_url: "/en/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f5f4ec",
    theme_color: "#f5f4ec",
    // Share dari aplikasi Shopee/Tokopedia/TikTok -> form Add product dengan link terisi.
    share_target: { action: "/en/dashboard/shops", method: "GET", params: { title: "title", text: "text", url: "url" } },
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
