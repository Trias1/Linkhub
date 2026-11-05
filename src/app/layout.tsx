import type { Metadata } from "next";
import { Bebas_Neue, Caveat, DM_Sans, Geist, Inter, Lora, Merriweather, Montserrat, Nunito, Playfair_Display, Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./ui.css";
import "./ui-dashboard.css";
import "./ui-shell.css";
import "./ui-landing.css";
import { getLocale } from "@/lib/i18n-server";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], preload: false });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "600", "700"], preload: false });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], preload: false });
const space = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], preload: false });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], preload: false });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], preload: false });
const merriweather = Merriweather({ variable: "--font-merriweather", subsets: ["latin"], preload: false });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], preload: false });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], preload: false });
const bebasNeue = Bebas_Neue({ variable: "--font-bebas-neue", subsets: ["latin"], weight: "400", preload: false });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], preload: false });

export const metadata: Metadata = { title: "LinkHub", description: "A free shop page for your Shopee, Tokopedia and TikTok Shop products." };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return <html lang={locale}><body className={`${geist.variable} ${inter.variable} ${poppins.variable} ${playfair.variable} ${space.variable} ${dmSans.variable} ${lora.variable} ${merriweather.variable} ${nunito.variable} ${montserrat.variable} ${bebasNeue.variable} ${caveat.variable}`}>{children}</body></html>;
}
