import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const turnstile = "https://challenges.cloudflare.com";
const isDev = process.env.NODE_ENV === "development";

// Tanpa nonce supaya halaman tetap bisa di-cache; yang paling penting di sini frame-ancestors (anti clickjacking),
// object-src, base-uri, form-action, dan daftar origin yang boleh dihubungi browser.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${turnstile}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseUrl} ${supabaseUrl.replace(/^https:/, "wss:")}`.trim(),
  `frame-src ${turnstile}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
