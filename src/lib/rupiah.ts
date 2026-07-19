const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function priceDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}

export function formatRupiah(value: string) {
  const digits = priceDigits(value);
  return digits ? rupiah.format(Number(digits)).replace(/\s/g, "") : "";
}