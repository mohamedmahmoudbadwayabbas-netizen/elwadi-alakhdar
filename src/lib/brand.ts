/**
 * Central brand configuration for Al-Wadi Al-Akhdar (Green Valley Supermarket Chain).
 * 3 Distinct Branches:
 * 1. Main Branch: فرع الدقي والمهندسين (الرئيسي)
 * 2. East Branch: فرع مدينة نصر والتجمع
 * 3. South Branch: فرع المعادي والشيخ زايد
 */
export const BRAND_NAME_AR = "سوبرماركت الوادي الأخضر";
export const BRAND_NAME_EN = "Al-Wadi Al-Akhdar Supermarket";
export const BRAND_NAME = `${BRAND_NAME_AR} — ${BRAND_NAME_EN}`;

export const BRAND_TAGLINE_AR = "سلسلة فروع الوادي الأخضر — جودة طازجة، أسعار الجملة، وتوصيل فوري";
export const BRAND_DESCRIPTION_AR =
  "سلسلة سوبرماركت الوادي الأخضر عبر 3 فروع رئيسية: الدقي، مدينة نصر، والمعادي. خضار وفواكه طازجة، ألبان وأجبان، لحوم بلدية، ومنتجات منزلية بأعلى معايير الجودة.";

export const ADMIN_PRIMARY_EMAIL = "adminstoresupermarketinvo@gmail.com";

/** Public site origin, used for canonical URLs, Open Graph and the sitemap. */
export const SITE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  "https://elwadi-alakhdar.lovable.app";

