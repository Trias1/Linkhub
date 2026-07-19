import type { Metadata } from "next";
import { DM_Sans, Geist, Inter, Playfair_Display, Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "600", "700"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const space = Space_Grotesk({ variable: "--font-space", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = { title: "LinkHub — Satu link untuk semuanya", description: "Buat halaman bio untuk semua tautan pentingmu." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={`${geist.variable} ${inter.variable} ${poppins.variable} ${playfair.variable} ${space.variable} ${dmSans.variable}`}>{children}</body></html>;
}