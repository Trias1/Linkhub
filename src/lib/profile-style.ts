// Warna halaman publik dari pilihan di Design. Dipakai halaman publik dan pratinjau Design supaya hasilnya sama persis.
type Colors = { wallpaper_style: string; background_color: string; text_color: string; button_color: string; button_text_color: string; title_color: string };

// Terang atau gelap menurut luminans relatif (#RGB atau #RRGGBB). Warna yang tidak terbaca dianggap terang.
export function isDark(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((char) => char + char).join("") : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return false;
  const [r, g, b] = [0, 2, 4].map((start) => { const c = parseInt(full.slice(start, start + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18;
}

export function profileStyle(colors: Colors) {
  const { background_color: bg, button_color: button } = colors;
  // Warna tombol hanya sebagai tint, supaya tulisan di atas latar tetap terbaca.
  const background = colors.wallpaper_style === "gradient" ? `linear-gradient(135deg, ${bg}, color-mix(in srgb, ${button} 35%, ${bg}))`
    : colors.wallpaper_style === "soft" ? `radial-gradient(circle at top, color-mix(in srgb, ${button} 30%, ${bg}), ${bg} 60%)`
    : bg;
  // Kartu sedikit lebih terang dari latar: hampir putih di tema terang, abu tipis di tema gelap.
  const card = `color-mix(in srgb, ${bg}, white ${isDark(bg) ? 8 : 72}%)`;
  return { background, "--profile-bg": bg, "--profile-text": colors.text_color, "--profile-button": button, "--profile-button-text": colors.button_text_color, "--profile-title": colors.title_color, "--lh-card": card } as React.CSSProperties;
}
