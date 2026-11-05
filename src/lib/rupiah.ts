const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

// "Rp150.000,00" atau "150000.00": buang dua angka desimal di belakang dulu, kalau tidak harganya jadi 100x.
export function priceDigits(value: string) {
  return value.trim().replace(/[.,]\d{2}$/, "").replace(/\D/g, "").slice(0, 15);
}

export function formatRupiah(value: string) {
  const digits = priceDigits(value);
  return digits ? rupiah.format(Number(digits)).replace(/\s/g, "") : "";
}