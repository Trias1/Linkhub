"use client";
import { usePathname } from "next/navigation";
import { withoutLocale } from "@/lib/i18n";
export function LanguageSwitcher(){const raw=usePathname();const locale=raw.startsWith("/en")?"en":"id";const pathname=withoutLocale(raw);const target=pathname==="/"?"":pathname;return <div className="language-switch" aria-label="Language"><a className={locale==="id"?"active":""} href={`/id${target}`}>ID</a><a className={locale==="en"?"active":""} href={`/en${target}`}>EN</a></div>;}
