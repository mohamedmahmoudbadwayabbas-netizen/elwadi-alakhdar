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

const DEFAULTS: StoreSettings = {
  site_name: "الوادي الأخضر",
  logo_url: null,
  favicon_url: null,
  primary_color: "#166534",
  accent_color: "#ea580c",
  background_color: "#fafaf7",
  foreground_color: "#1a1a1a",
  font_family: "Tajawal",
  announcement_text: "شحن مجاني فوق ٣٠٠ ج.م | توصيل سريع خلال ٤٥ دقيقة ⚡ | الدفع عند الاستلام ✓",
  announcement_enabled: true,
  announcement_bg_color: "#166534",
  whatsapp_number: null,
  hero_title: null,
  hero_subtitle: null,
  hero_image_url: null,
  hero_cta_text: null,
  hero_bg_image: null,
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

function hexToHsl(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyTheme(s: StoreSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", hexToHsl(s.primary_color));
  root.style.setProperty("--accent", hexToHsl(s.accent_color));
  root.style.setProperty("--background", hexToHsl(s.background_color));
  root.style.setProperty("--foreground", hexToHsl(s.foreground_color));
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);

  useEffect(() => {
    let mounted = true;
    (globalThis as any).__settingsEffectRuns = ((globalThis as any).__settingsEffectRuns || 0) + 1;
    const runId = (globalThis as any).__settingsEffectRuns;
    console.log(`[SettingsProvider] useEffect run #${runId} — fetching store_settings`);
    if (runId > 2) {
      console.error("[SettingsProvider] ⚠️ Potential infinite loop — useEffect ran more than twice");
    }
    (async () => {
      const t0 = performance.now();
      const { data, error } = await supabase.from("store_settings").select("*").limit(1).maybeSingle();
      console.log(`[SettingsProvider] fetch done in ${(performance.now() - t0).toFixed(0)}ms`, { hasData: !!data, error });
      if (!mounted) return;
      if (data) {
        const merged = { ...DEFAULTS, ...data } as StoreSettings;
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
