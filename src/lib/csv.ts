// CSV sederhana (RFC 4180): koma, tanda kutip ganda, baris baru di dalam kutip. Juga menerima titik koma
// (Excel dengan setelan Indonesia menyimpan CSV dengan ";").
export function parseCsv(text: string, maxRows = 1000) {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.slice(0, source.search(/\r?\n|$/));
  const separator = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < source.length && rows.length <= maxRows; index++) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') { cell += '"'; index++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === separator) { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[index + 1] === "\n") index++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  // Export LinkHub menambahkan ' di depan nilai yang diawali = + - @ (pengaman rumus spreadsheet).
  return rows.filter((cells) => cells.some((value) => value.trim())).map((cells) => cells.map((value) => value.trim().replace(/^'(?=[=+\-@])/, "")));
}
