import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Perbarui sesi Supabase sekali per request. Cookie hasil refresh harus diteruskan ke halaman/server action
// lewat header request yang sama (termasuk salinan header untuk rewrite /en), kalau tidak server memakai
// refresh token lama dan Supabase bisa membatalkan seluruh sesi (user harus login lagi).
export async function updateSession(request: NextRequest, rewriteUrl?: URL, requestHeaders?: Headers) {
  const headers = requestHeaders ?? request.headers;
  const makeResponse = () => rewriteUrl ? NextResponse.rewrite(rewriteUrl, { request: { headers } }) : NextResponse.next({ request: { headers } });
  let response = makeResponse();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        if (requestHeaders) requestHeaders.set("cookie", request.headers.get("cookie") ?? "");
        response = makeResponse();
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Respons yang membawa cookie sesi tidak boleh di-cache CDN (token bisa terkirim ke user lain).
        Object.entries(cacheHeaders ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}
