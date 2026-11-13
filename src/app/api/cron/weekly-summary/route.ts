import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteOrigin } from "@/lib/site-url";

// Ringkasan mingguan (Senin 08:00 WIB, lihat vercel.json). Hanya untuk akun yang menyalakannya di Account.
// Butuh CRON_SECRET (dikirim Vercel Cron), RESEND_API_KEY dan EMAIL_FROM di env; kalau belum ada, tidak mengirim apa pun.
export const maxDuration = 60;

type Summary = { days?: { views: number; clicks: number; buys: number }[]; products?: { id: string; count: number }[] };
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const apiKey = process.env.RESEND_API_KEY; const from = process.env.EMAIL_FROM;
  const supabase = createAdminClient();
  if (!apiKey || !from || !supabase) return NextResponse.json({ sent: 0, skipped: "email service not configured" });
  const origin = await siteOrigin();
  const to = new Date(); const since = new Date(to.getTime() - 7 * 86_400_000);
  const { data: owners } = await supabase.from("profiles").select("id").eq("weekly_email", true).limit(200);
  let sent = 0; let failed = 0;
  for (const owner of owners ?? []) {
    const [{ data: account }, { data: pages }] = await Promise.all([
      supabase.auth.admin.getUserById(owner.id),
      supabase.from("linktrees").select("id,name,slug").eq("owner_id", owner.id).order("created_at"),
    ]);
    const email = account?.user?.email;
    if (!email || !pages?.length) continue;
    const blocks: string[] = []; const lines: string[] = [];
    for (const page of pages) {
      const { data } = await supabase.rpc("insights_summary", { p_linktree_id: page.id, p_from: since.toISOString(), p_to: to.toISOString() });
      const summary = (data ?? {}) as Summary;
      const total = (key: "views" | "clicks" | "buys") => (summary.days ?? []).reduce((sum, day) => sum + day[key], 0);
      const ids = (summary.products ?? []).slice(0, 3);
      const { data: names } = ids.length ? await supabase.from("products").select("id,title").in("id", ids.map((item) => item.id)) : { data: [] };
      const top = ids.map((item) => `${(names ?? []).find((row) => row.id === item.id)?.title ?? "Deleted product"} (${item.count})`);
      const name = String(page.name || page.slug || "Your page");
      lines.push(`${name}: ${total("views")} visitors, ${total("buys")} buy clicks, ${total("clicks")} link clicks${top.length ? `. Top: ${top.join(", ")}` : ""}`);
      blocks.push(`<h2 style="margin:24px 0 8px;font-size:18px">${escape(name)}</h2><p style="margin:0 0 8px"><b>${total("views")}</b> visitors &middot; <b>${total("buys")}</b> buy clicks &middot; <b>${total("clicks")}</b> link clicks</p>${top.length ? `<p style="margin:0;color:#555">Top products: ${top.map(escape).join(", ")}</p>` : ""}`);
    }
    const html = `<div style="font-family:Arial,sans-serif;color:#171712;max-width:560px"><p style="margin:0;color:#555">Your LinkHub week</p>${blocks.join("")}<p style="margin:28px 0 0"><a href="${origin}/en/dashboard/insights" style="color:#171712">Open Insights</a></p><p style="margin:24px 0 0;font-size:12px;color:#777">You get this email because you turned on the weekly summary. Turn it off in Account &amp; security: ${origin}/en/dashboard/account</p></div>`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(10_000),
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject: "Your LinkHub week", html, text: `Your LinkHub week\n\n${lines.join("\n")}\n\nOpen Insights: ${origin}/en/dashboard/insights\nTurn this email off in Account & security.` }),
    }).catch(() => null);
    if (response?.ok) sent++; else failed++;
  }
  return NextResponse.json({ sent, failed });
}
