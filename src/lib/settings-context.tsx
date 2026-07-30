import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StoreSettings = {
  id?: string;
  site_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  background_color: string;
  foreground_color: string;
  font_family: string;
  announcement_text: string;
  announcement_enabled: boolean;
  announcement_bg_color: string;
  whatsapp_number: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_cta_text: string | null;
  hero_bg_image: string | null;
  login_bg_pattern: string | null;
  cart_empty_bg: string | null;
  floating_element_image: string | null;
  store_address: string | null;
  store_lat: number | null;
  store_lng: number | null;
  ga4_id: string | null;
  meta_pixel_id: string | null;
  min_order_amount: number;
  default_delivery_fee: number;
  free_shipping_threshold: number;
  first_order_coupon_enabled: boolean;
  first_order_coupon_code: string | null;
  first_order_discount_percent: number;
};

// ⚠️ القيم دي بقت HSL نصي زي "142 76% 24%" مش Hex — لازم تتطابق مع admin.settings.tsx
const DEFAULTS: StoreSettings = {
  site_name: "الوادي الأخضر",
  logo_url: null,
  favicon_url: null,
  primary_color: "142 76% 24%",
  accent_color: "18 85% 55%",
  background_color: "48 33% 97%",
  foreground_color: "120 18% 12%",
  font_family: "Tajawal",
  announcement_text: "شحن مجاني فوق ٣٠٠ ج.م | توصيل سريع خلال ٤٥ دقيقة ⚡ | الدفع عند الاستلام ✓",
  announcement_enabled: true,
  announcement_bg_color: "142 76% 24%",
  whatsapp_number: null,
  hero_title: null,
  hero_subtitle: null,
  hero_image_url: null,
  hero_cta_text: null,
  hero_bg_image: null,
  login_bg_pattern: null,
  cart_empty_bg: null,
  floating_element_image: null,
  store_address: null,
  store_lat: null,
  store_lng: null,
  ga4_id: null,
  meta_pixel_id: null,
  min_order_amount: 0,
  default_delivery_fee: 0,
  free_shipping_threshold: 0,
  first_order_coupon_enabled: false,
  first_order_coupon_code: null,
  first_order_discount_percent: 10,
};

const SettingsContext = createContext<StoreSettings>(DEFAULTS);

// ── القيم جايه من الداتابيز HSL زي ما هي، مفيش تحويل هنا خالص ──
function applyTheme(s: StoreSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const setHsl = (name: string, value: string | null | undefined) => {
    if (value) root.style.setProperty(name, `hsl(${value})`);
  };
  setHsl("--primary", s.primary_color);
  setHsl("--accent", s.accent_color);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from("store_settings_public" as any)
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("[SettingsProvider] failed to load store_settings_public", error);
      }

      if (data) {
        const merged = { ...DEFAULTS, ...(data as any) } as StoreSettings;
        setSettings(merged);
        applyTheme(merged);
      } else {
        applyTheme(DEFAULTS);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const value = useMemo(() => settings, [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}