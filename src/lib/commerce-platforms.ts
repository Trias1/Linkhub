export const commercePlatforms = {
  shopee: { label: "Shopee", url: "https://shopee.co.id/" },
  tokopedia: { label: "Tokopedia", url: "https://www.tokopedia.com/" },
  lazada: { label: "Lazada", url: "https://www.lazada.co.id/" },
  blibli: { label: "Blibli", url: "https://www.blibli.com/" },
  bukalapak: { label: "Bukalapak", url: "https://www.bukalapak.com/" },
  "tiktok-shop": { label: "TikTok Shop", url: "https://shop.tiktok.com/" },
  amazon: { label: "Amazon", url: "https://www.amazon.com/" },
  ebay: { label: "eBay", url: "https://www.ebay.com/" },
  etsy: { label: "Etsy", url: "https://www.etsy.com/" },
  shopify: { label: "Shopify", url: "https://www.shopify.com/" },
  woocommerce: { label: "WooCommerce", url: "https://woocommerce.com/" },
  gumroad: { label: "Gumroad", url: "https://gumroad.com/" },
} as const;

export type CommercePlatform = keyof typeof commercePlatforms;