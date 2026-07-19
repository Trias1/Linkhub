export const themes = {
  peach: { label: "Peach", background: "#FFF1E6", text: "#3D2C2A", button: "#FFB4A2" },
  lavender: { label: "Lavender", background: "#F3EEFF", text: "#332B52", button: "#C8B6FF" },
  mint: { label: "Mint", background: "#E8F8F0", text: "#193D32", button: "#A8E6CF" },
  sky: { label: "Sky", background: "#EAF5FF", text: "#20364B", button: "#A9D6F5" },
  butter: { label: "Butter", background: "#FFF9DB", text: "#463D1F", button: "#FFE48A" },
} as const;

export type ThemePreset = keyof typeof themes | "custom";