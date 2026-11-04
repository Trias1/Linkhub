// Alamat halaman publik: /nama-toko. Kata yang dipakai rute aplikasi tidak boleh dipakai.
const reserved = new Set(["admin", "api", "auth", "dashboard", "login", "signup", "logout", "forgot-password", "reset-password", "privacy", "terms", "dev-preview", "en", "id", "www", "app", "help", "support", "settings", "account", "linkhub", "static", "_next"]);

export const normalizeSlug = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

export function slugProblem(slug: string) {
  if (!/^[a-z0-9-]{3,40}$/.test(slug)) return "Page address must be 3-40 characters: a-z, 0-9 and dashes";
  if (reserved.has(slug)) return "That page address is reserved. Try another one.";
  return null;
}
