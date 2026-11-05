// Gambar di style inline: selalu sebagai string CSS bertanda kutip, supaya URL dari user tidak bisa menutup url(...)
// lalu menyisipkan aturan CSS lain (mis. overlay penuh layar untuk phishing).
export const cssUrl = (value: string) => `url(${JSON.stringify(value)})`;
