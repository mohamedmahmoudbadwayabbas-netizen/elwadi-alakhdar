/**
 * Central brand configuration for this store template.
 * Change these values once and the whole storefront (SEO, header, defaults,
 * structured data, sitemap) follows. Values stored in the database
 * (`store_settings`) always win over these fallbacks at runtime.
 */
export const BRAND_NAME_AR = "سمارت ستور";
export const BRAND_NAME_EN = "Smart Store";
export const BRAND_NAME = `${BRAND_NAME_AR} — ${BRAND_NAME_EN}`;

export const BRAND_TAGLINE_AR = "متجر إلكتروني متكامل — تسوّق سهل وتوصيل سريع";
export const BRAND_DESCRIPTION_AR =
  "قالب متجر إلكتروني عربي متكامل: بقالة، لحوم، خضار وفاكهة ومنتجات منزلية مع سلة ذكية ودفع مرن وتوصيل سريع.";

/** Public site origin, used for canonical URLs, Open Graph and the sitemap. */
export const SITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  "https://elwadi-alakhdar.lovable.app";
