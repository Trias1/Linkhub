"use client";

import { useState } from "react";
import { themes, type ThemePreset } from "@/lib/themes";

type Colors = { background: string; text: string; button: string };

export function ThemeFields({ preset: initialPreset, colors: initialColors }: { preset: ThemePreset; colors: Colors }) {
  const [preset, setPreset] = useState<ThemePreset>(initialPreset);
  const [colors, setColors] = useState(initialColors);

  function selectPreset(value: ThemePreset) {
    setPreset(value);
    if (value !== "custom") setColors(themes[value]);
  }

  function changeColor(key: keyof Colors, value: string) {
    setPreset("custom");
    setColors((current) => ({ ...current, [key]: value }));
  }

  return (
    <>
      <label>Tema<select name="theme_preset" value={preset} onChange={(event) => selectPreset(event.target.value as ThemePreset)}>{Object.entries(themes).map(([value, theme]) => <option value={value} key={value}>{theme.label}</option>)}<option value="custom">Custom</option></select></label>
      <div className="color-grid">
        <label>Background<input name="background_color" type="color" value={colors.background} onChange={(event) => changeColor("background", event.target.value)} /></label>
        <label>Teks<input name="text_color" type="color" value={colors.text} onChange={(event) => changeColor("text", event.target.value)} /></label>
        <label>Tombol<input name="button_color" type="color" value={colors.button} onChange={(event) => changeColor("button", event.target.value)} /></label>
      </div>
      <div className="theme-preview" style={{ background: colors.background, color: colors.text }}><strong>Preview tema</strong><span style={{ background: colors.button }}>Contoh tombol</span></div>
    </>
  );
}