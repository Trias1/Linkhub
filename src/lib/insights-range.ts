const DAY_MS = 86_400_000;

export function insightRange(range: string | undefined, from: string | undefined, to: string | undefined, now = new Date()) {
  const selected = ["1", "7", "30", "90", "custom"].includes(range ?? "") ? range! : "7";
  const customDays=(Date.parse(`${to}T00:00:00.000Z`)-Date.parse(`${from}T00:00:00.000Z`))/DAY_MS;
  if (selected === "custom" && /^\d{4}-\d{2}-\d{2}$/.test(from ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(to ?? "") && from! <= to! && customDays<=365) {
    return { selected, from:`${from}T00:00:00.000Z`, to:`${to}T23:59:59.999Z`, customFrom:from!, customTo:to! };
  }
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const days = Number(selected === "custom" ? "7" : selected);
  const start = new Date(end.getTime() - (days - 1) * DAY_MS); start.setUTCHours(0,0,0,0);
  return { selected:selected === "custom" ? "7" : selected, from:start.toISOString(), to:end.toISOString(), customFrom:"", customTo:"" };
}

export function insightDays(from: string, to: string) {
  const start = new Date(from); const end = new Date(to); const days=[];
  for (let time=start.getTime(); time<=end.getTime(); time+=DAY_MS) {
    const date=new Date(time); days.push({ key:date.toISOString().slice(0,10), label:new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",timeZone:"UTC"}).format(date), views:0, clicks:0 });
  }
  return days;
}

