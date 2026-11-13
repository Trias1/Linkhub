import Link from "next/link";
import { platformColor, platformLabel } from "@/lib/commerce-platforms";
import { linkLabel } from "@/lib/link-platform";
import { isTrafficSource, trafficSources } from "@/lib/traffic-source";

type Day = { key: string; label: string; views: number; clicks: number; buys: number };
type Ranked = { title: string; platform: string | null; clicks: number };
type Period = { selected: string; customFrom: string; customTo: string };

const ranges = [["1", "Today"], ["7", "7 days"], ["30", "30 days"], ["90", "90 days"]];
const percent = (part: number, whole: number) => whole ? `${Math.round((part / whole) * 100)}%` : "–";

function RankList({ items, empty, label }: { items: Ranked[]; empty: string; label: (item: Ranked) => string }) {
  if (!items.length) return <p className="lh-hint">{empty}</p>;
  const top = items[0].clicks;
  return <ol className="lh-rank">{items.map((item, index) => <li key={`${item.title}-${index}`}>
    <span className="lh-rank-name"><b>{item.title}</b><small><i style={{ background: platformColor(item.platform) }} />{label(item)}</small></span>
    <span className="lh-rank-bar"><i style={{ width: `${Math.max(4, (item.clicks / top) * 100)}%` }} /></span>
    <b>{item.clicks}</b>
  </li>)}</ol>;
}

type Source = { source: string; views: number; taps: number };
type Hour = { hour: number; views: number; taps: number };
const sourceName = (value: string) => isTrafficSource(value) ? trafficSources[value] : "Other websites";

// Dari mana pengunjung datang: kunjungan dan tap per sumber (TikTok, Instagram, ...).
function Sources({ items }: { items: Source[] }) {
  const top = Math.max(1, ...items.map((item) => item.views));
  return <table className="lh-source-table">
    <thead><tr><th>Source</th><th>Visitors</th><th>Taps</th><th>Tap rate</th></tr></thead>
    <tbody>{items.map((item) => <tr key={item.source}>
      <td><span className="lh-source-name">{sourceName(item.source)}</span><span className="lh-rank-bar" aria-hidden="true"><i style={{ width: `${Math.max(3, (item.views / top) * 100)}%` }} /></span></td>
      <td>{item.views}</td><td>{item.taps}</td><td>{percent(item.taps, item.views)}</td>
    </tr>)}</tbody>
  </table>;
}

// Jam ramai (WIB): kapan pengunjung datang, untuk memilih jam posting.
function Hours({ items }: { items: Hour[] }) {
  const top = Math.max(1, ...items.map((item) => item.views));
  const busiest = [...items].sort((a, b) => b.views - a.views)[0];
  const label = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
  return <>
    {busiest?.views ? <p className="lh-hint">Most visitors came around <b>{label(busiest.hour)}–{label((busiest.hour + 1) % 24)} WIB</b>.</p> : null}
    <div className="lh-hours" role="img" aria-label={`Visitors per hour, busiest at ${label(busiest?.hour ?? 0)} WIB`}>
      {items.map((item) => <div className="lh-hour" key={item.hour} title={`${label(item.hour)} WIB: ${item.views} visitors, ${item.taps} taps`}>
        <span><i style={{ height: `${(item.views / top) * 100}%` }} className={item.views === busiest?.views && item.views ? "top" : undefined} /></span>
        <small>{item.hour % 3 === 0 ? String(item.hour).padStart(2, "0") : ""}</small>
      </div>)}
    </div>
    <details className="lh-table"><summary>Show as table</summary><table><thead><tr><th>Hour (WIB)</th><th>Visitors</th><th>Taps</th></tr></thead><tbody>{items.filter((item) => item.views || item.taps).map((item) => <tr key={item.hour}><td>{label(item.hour)}</td><td>{item.views}</td><td>{item.taps}</td></tr>)}</tbody></table></details>
  </>;
}

export function InsightsDashboard({ totals, days, period, topLinks, topProducts, stores, productsReady, sources = null, hours = null }: {
  totals: { views: number; clicks: number; buys: number; lifetimeViews: number; lifetimeClicks: number };
  days: Day[]; period: Period; topLinks: Ranked[]; topProducts: Ranked[]; stores: [string, number][]; productsReady: boolean;
  sources?: Source[] | null; hours?: Hour[] | null;
}) {
  const maximum = Math.max(1, ...days.map((day) => Math.max(day.views, day.clicks + day.buys)));
  const active = days.some((day) => day.views || day.clicks || day.buys);
  const storeTop = stores[0]?.[1] ?? 1;

  return <div className="lh-page-wrap lh-insights">
    <header className="lh-dash-top"><div><h1>Insights</h1><p>Who visits your page and what they tap.</p></div><Link className="lh-btn secondary small" href="/api/export/insights" prefetch={false}>Export CSV</Link></header>

    <div className="lh-range">
      <div className="lh-filter" role="group" aria-label="Date range">{ranges.map(([value, label]) => <Link key={value} href={`/dashboard/insights?range=${value}`} aria-current={period.selected === value && !period.customFrom ? "true" : undefined}>{label}</Link>)}</div>
      <details className="lh-custom-range" open={Boolean(period.customFrom)}>
        <summary>{period.customFrom ? `${period.customFrom} to ${period.customTo}` : "Custom range"}</summary>
        <form><input name="range" type="hidden" value="custom" /><label className="lh-field">From<input name="from" type="date" defaultValue={period.customFrom} required /></label><label className="lh-field">To<input name="to" type="date" defaultValue={period.customTo} required /></label><button className="lh-btn small">Apply</button></form>
      </details>
    </div>

    <div className="lh-stats lh-stats-4">
      <div><small>Visitors</small><b>{totals.views}</b></div>
      <div><small>Buy clicks</small><b>{productsReady ? totals.buys : "–"}</b></div>
      <div><small>Link clicks</small><b>{totals.clicks}</b></div>
      <div><small>Tap rate</small><b>{percent(totals.buys + totals.clicks, totals.views)}</b></div>
    </div>

    <section className="lh-box">
      <div className="lh-list-head"><h2>Activity</h2><div className="lh-legend"><span><i className="views" />Visitors</span><span><i className="taps" />Taps (buy + link)</span></div></div>
      {active ? <div className="lh-chart" style={{ "--days": days.length } as React.CSSProperties} role="img" aria-label={`Visitors and taps per day, ${days[0]?.label} to ${days[days.length - 1]?.label}`}>
        {days.map((day) => <div className="lh-chart-day" key={day.key} title={`${day.label}: ${day.views} visitors, ${day.buys} buy clicks, ${day.clicks} link clicks`}>
          <div className="lh-chart-bars"><i className="views" style={{ height: `${(day.views / maximum) * 100}%` }} /><i className="taps" style={{ height: `${((day.clicks + day.buys) / maximum) * 100}%` }} /></div>
          <small>{day.label}</small>
        </div>)}
      </div> : <p className="lh-hint">No visits in this period yet. Share your page link or QR to start seeing activity.</p>}
      {active ? <details className="lh-table"><summary>Show as table</summary><table><thead><tr><th>Day</th><th>Visitors</th><th>Buy clicks</th><th>Link clicks</th></tr></thead><tbody>{days.map((day) => <tr key={day.key}><td>{day.label}</td><td>{day.views}</td><td>{day.buys}</td><td>{day.clicks}</td></tr>)}</tbody></table></details> : null}
    </section>

    {sources ? <div className="lh-two">
      <section className="lh-box"><h2>Where visitors come from</h2>{sources.length ? <Sources items={sources} /> : <p className="lh-hint">No visits in this period yet.</p>}<p className="lh-hint lh-source-tip">Tip: use the links for TikTok, Instagram and others in <Link href="/dashboard/share">Share &amp; QR</Link> so each app is counted separately.</p></section>
      <section className="lh-box"><h2>Busiest hours</h2>{hours && hours.some((item) => item.views || item.taps) ? <Hours items={hours} /> : <p className="lh-hint">No visits in this period yet.</p>}</section>
    </div> : null}

    <div className="lh-two">
      <section className="lh-box"><h2>Top products</h2>{productsReady ? <RankList items={topProducts} empty="No buy clicks in this period." label={(item) => platformLabel(item.platform)} /> : <p className="lh-hint">Product clicks are not set up yet.</p>}</section>
      <section className="lh-box"><h2>Top links</h2><RankList items={topLinks} empty="No link clicks in this period." label={(item) => linkLabel(item.platform)} /></section>
    </div>

    {stores.length ? <section className="lh-box"><h2>Buy clicks by store</h2><div className="lh-bars">{stores.map(([platform, value]) => <div className="lh-bar" key={platform}><span>{platformLabel(platform)}</span><div><i style={{ width: `${Math.max(4, (value / storeTop) * 100)}%`, background: platformColor(platform) }} /></div><b>{value}</b></div>)}</div></section> : null}

    <p className="lh-hint lh-lifetime">All time: <b>{totals.lifetimeViews}</b> visitors · <b>{totals.lifetimeClicks}</b> link clicks</p>
  </div>;
}
