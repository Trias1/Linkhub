"use client";

import { useState } from "react";
import { formatRupiah, priceDigits } from "@/lib/rupiah";

export function RupiahInput({ defaultValue = "" }: { defaultValue?: string }) {
  const [digits, setDigits] = useState(() => priceDigits(defaultValue));
  return <label className="rupiah-input"><span>Harga</span><input type="text" inputMode="numeric" value={formatRupiah(digits)} placeholder="Rp99.000" onChange={(event) => setDigits(priceDigits(event.target.value))} /><input type="hidden" name="price" value={digits} /></label>;
}