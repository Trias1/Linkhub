"use client";

import qrcode from "qrcode-generator";
import { useMemo } from "react";

// QR digambar sendiri dari modul (tanpa layanan luar), lalu bisa diunduh sebagai PNG atau SVG.
function matrix(value: string) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const size = qr.getModuleCount();
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => qr.isDark(row, col)));
}

function svgMarkup(cells: boolean[][], margin = 4) {
  const size = cells.length + margin * 2;
  const path = cells.flatMap((row, y) => row.map((dark, x) => dark ? `M${x + margin} ${y + margin}h1v1h-1z` : "")).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#171712"/></svg>`;
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function QrCode({ value, filename, size = 160 }: { value: string; filename: string; size?: number }) {
  const cells = useMemo(() => matrix(value), [value]);
  const markup = useMemo(() => svgMarkup(cells), [cells]);

  function downloadPng() {
    const scale = 16; const margin = 4; const total = (cells.length + margin * 2) * scale;
    const canvas = document.createElement("canvas");
    canvas.width = total; canvas.height = total;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#fff"; context.fillRect(0, 0, total, total);
    context.fillStyle = "#171712";
    cells.forEach((row, y) => row.forEach((dark, x) => { if (dark) context.fillRect((x + margin) * scale, (y + margin) * scale, scale, scale); }));
    canvas.toBlob((blob) => { if (blob) save(blob, `${filename}.png`); }, "image/png");
  }

  return <div className="lh-qr">
    <span className="lh-qr-img" style={{ width: size, height: size }} role="img" aria-label={`QR code for ${value}`} dangerouslySetInnerHTML={{ __html: markup }} />
    <div className="lh-qr-actions">
      <button type="button" className="lh-btn small" onClick={downloadPng}>Download PNG</button>
      <button type="button" className="lh-btn small secondary" onClick={() => save(new Blob([markup], { type: "image/svg+xml" }), `${filename}.svg`)}>SVG</button>
    </div>
  </div>;
}
