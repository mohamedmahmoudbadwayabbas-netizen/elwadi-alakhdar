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

  // Visual Customizer Styles
  categories_style?: "grid" | "scroll" | "cards" | "pills";
  products_style?: "modern" | "compact" | "bordered" | "glass";
  card_radius?: "rounded-xl" | "rounded-2xl" | "rounded-3xl";
  hero_style?: "gradient" | "image" | "split";
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
  announcement_text:
    "🛒 سوبرماركت الوادي الأخضر — كل احتياجات بيتك وتموينك بتوصيل فوري لباب بيتك ⚡",
  announcement_enabled: true,
  announcement_bg_color: "142 76% 24%",
  whatsapp_number: null,
  hero_title: "الوادي الأخضر — سوبرماركت عائلتك 🛒",
  hero_subtitle: "أجود السلع التموينية والبقالة واللحوم والألبان بأفضل الأسعار وتوصيل فوري ⚡",
  hero_image_url: null,
  hero_cta_text: "تسوّق الآن 🛒",
  hero_bg_image:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85",
  login_bg_pattern: null,
  cart_empty_bg: null,
  floating_element_image:
    "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=500&q=80",
  store_address: null,
  store_lat: null,
  store_lng: null,
  ga4_id: null,
  meta_pixel_id: null,
  min_order_amount: 100,
  default_delivery_fee: 35,
  free_shipping_threshold: 500,
  first_order_coupon_enabled: false,
  first_order_coupon_code: null,
  first_order_discount_percent: 10,

  categories_style: "grid",
  products_style: "modern",
  card_radius: "rounded-2xl",
  hero_style: "image",
};

const SettingsContext = createContext<{
  settings: StoreSettings;
  updateLocalSettings: (newSettings: Partial<StoreSettings>) => void;
}>({
  settings: DEFAULTS,
  updateLocalSettings: () => {},
});

// ── القيم جايه من الداتابيز HSL زي ما هي، مفيش تحويل هنا خالص ──
function applyTheme(s: StoreSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const setHsl = (name: string, value: string | null | undefined) => {
    if (value) root.style.setProperty(name, `hsl(${value})`);
  };
  setHsl("--primary", s.primary_color);
  setHsl("--accent", s.accent_color);
  if (s.background_color) setHsl("--background", s.background_color);
  if (s.foreground_color) setHsl("--foreground", s.foreground_color);
  if (s.card_radius) {
    const radMap: Record<string, string> = {
      "rounded-xl": "0.75rem",
      "rounded-2xl": "1rem",
      "rounded-3xl": "1.5rem",
    };
    if (radMap[s.card_radius]) {
      root.style.setProperty("--radius", radMap[s.card_radius]);
    }
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Start with DEFAULTS on both server and initial client render to guarantee 100% hydration match
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);

  const updateLocalSettings = (updated: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      applyTheme(next);
      try {
        localStorage.setItem("alwadi_store_settings_cache", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      let localCustomizer = {};
      let localCached = {};
      try {
        const cached = localStorage.getItem("alwadi_store_settings_cache");
        if (cached) localCached = JSON.parse(cached);
        const cust = localStorage.getItem("store_customizer_options");
        if (cust) localCustomizer = JSON.parse(cust);
      } catch {}

      const { data } = await supabase
        .from("store_settings_public" as any)
        .select("*")
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      const merged = {
        ...DEFAULTS,
        ...localCached,
        ...((data as any) ?? {}),
        ...localCustomizer,
      } as StoreSettings;

      for (const key of Object.keys(merged) as (keyof StoreSettings)[]) {
        if (merged[key] === null && DEFAULTS[key] !== null && DEFAULTS[key] !== undefined) {
          (merged as any)[key] = DEFAULTS[key];
        }
      }

      // Sanitize legacy or stale cached strings containing vegetable/produce tags
      if (merged.hero_title && (merged.hero_title.includes("طازج لباب بيتك") || merged.hero_title.includes("خضار"))) {
        merged.hero_title = DEFAULTS.hero_title;
      }
      if (merged.hero_subtitle && (merged.hero_subtitle.includes("الخضار") || merged.hero_subtitle.includes("طازجة يومياً"))) {
        merged.hero_subtitle = DEFAULTS.hero_subtitle;
      }
      if (merged.announcement_text && merged.announcement_text.includes("خضار")) {
        merged.announcement_text = DEFAULTS.announcement_text;
      }

      setSettings(merged);
      applyTheme(merged);
      try {
        localStorage.setItem("alwadi_store_settings_cache", JSON.stringify(merged));
      } catch {}
    };

    void load();

    // Listen to custom event for real-time live preview update across admin & storefront
    const handleCustomUpdate = (e: CustomEvent<Partial<StoreSettings>>) => {
      if (e.detail && mounted) {
        updateLocalSettings(e.detail);
      }
    };

    window.addEventListener("store_settings_updated" as any, handleCustomUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("store_settings_updated" as any, handleCustomUpdate);
    };
  }, []);

  const value = useMemo(() => ({ settings, updateLocalSettings }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  return ctx.settings;
}

export function useSettingsController() {
  return useContext(SettingsContext);
}
