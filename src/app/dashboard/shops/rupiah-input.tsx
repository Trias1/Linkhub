"use client";

import { useState } from "react";
import { formatRupiah, priceDigits } from "@/lib/rupiah";

export function RupiahInput({ defaultValue = "", name = "price", label = "Price", hint }: { defaultValue?: string; name?: string; label?: string; hint?: string }) {
  const [digits, setDigits] = useState(() => priceDigits(defaultValue));
  return <label className="lh-field">{label}{hint ? <small>{hint}</small> : null}<input type="text" inputMode="numeric" value={formatRupiah(digits)} placeholder="Rp99.000" onChange={(event) => setDigits(priceDigits(event.target.value))} /><input type="hidden" name={name} value={digits} /></label>;
}
