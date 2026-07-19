export type Locale="id"|"en";
export function withoutLocale(pathname:string){return pathname.replace(/^\/(id|en)(?=\/|$)/,"")||"/";}
export function withLocale(pathname:string,locale:Locale){const clean=withoutLocale(pathname);return `/${locale}${clean==="/"?"":clean}`;}
