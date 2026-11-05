const DAY_MS = 86_400_000;
const WIB_MS = 7 * 3_600_000;

// Hari dihitung dalam WIB (UTC+7), sama dengan tanggal promo dan fungsi insights_summary di database.
const wibKey = (time: number) => new Date(time + WIB_MS).toISOString().slice(0, 10);
const startOf = (key: string) => new Date(`${key}T00:00:00.000+07:00`).toISOString();
const endOf = (key: string) => new Date(`${key}T23:59:59.999+07:00`).toISOString();
const isDate = (value: string | undefined): value is string => /^\d{4}-\d{2}-\d{2}$/.test(value ?? "") && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export function insightRange(range: string | undefined, from: string | undefined, to: string | undefined, now = new Date()) {
  const selected = ["1", "7", "30", "90", "custom"].includes(range ?? "") ? range! : "7";
  if (selected === "custom" && isDate(from) && isDate(to) && from <= to && (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS <= 365) {
    return { selected, from: startOf(from), to: endOf(to), customFrom: from, customTo: to };
  }
  const today = wibKey(now.getTime());
  const days = Number(selected === "custom" ? "7" : selected);
  const first = new Date(Date.parse(`${today}T00:00:00Z`) - (days - 1) * DAY_MS).toISOString().slice(0, 10);
  return { selected: selected === "custom" ? "7" : selected, from: startOf(first), to: endOf(today), customFrom: "", customTo: "" };
}

// Daftar hari (kunci YYYY-MM-DD dalam WIB) dari awal sampai akhir periode.
export function insightDays(from: string, to: string) {
  const last = wibKey(Date.parse(to));
  const days = [];
  for (let time = Date.parse(`${wibKey(Date.parse(from))}T00:00:00Z`); days.length <= 400; time += DAY_MS) {
    const key = new Date(time).toISOString().slice(0, 10);
    days.push({ key, label: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(time)), views: 0, clicks: 0 });
    if (key >= last) break;
  }
  return days;
}
