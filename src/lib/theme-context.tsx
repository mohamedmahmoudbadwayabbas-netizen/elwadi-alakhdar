import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeSettings = {
  id?: string;
  marble_bg_url: string | null;
  dark_marble_bg_url: string | null;
  primary_hex: string;
  accent_hex: string;
  card_radius_px: number;
  hero_grid_images: string[];
  hero_title: string;
  hero_subtitle: string;
  hero_cta_text: string;
  auth_bg_url: string | null;
  cart_empty_bg_url: string | null;
};

const DEFAULTS: ThemeSettings = {
  marble_bg_url: null,
  dark_marble_bg_url: null,
  primary_hex: "#036233",
  accent_hex: "#E85D2F",
  card_radius_px: 24,
  hero_grid_images: [],
  hero_title: "الوادي الأخضر",
  hero_subtitle: "سوبر ماركت وعطارة - أفضل أنواع الاختيارات وتوصيل سريع مباشر لباب بيتك",
  hero_cta_text: "تسوّق الآن",
  auth_bg_url: null,
  cart_empty_bg_url: null,
};

function hexToHsl(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
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

function applyTokens(t: ThemeSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", hexToHsl(t.primary_hex));
  root.style.setProperty("--ring", hexToHsl(t.primary_hex));
  root.style.setProperty("--accent", hexToHsl(t.accent_hex));
  root.style.setProperty("--sale", hexToHsl(t.accent_hex));
  root.style.setProperty("--radius", `${t.card_radius_px}px`);
  if (t.marble_bg_url) {
    document.body.style.backgroundImage = `url(${t.marble_bg_url})`;
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundSize = "cover";
  }
}

const ThemeContext = createContext<ThemeSettings>(DEFAULTS);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULTS);

  useEffect(() => {
    let mounted = true;
    (globalThis as any).__themeEffectRuns = ((globalThis as any).__themeEffectRuns || 0) + 1;
    const runId = (globalThis as any).__themeEffectRuns;
    console.log(`[ThemeProvider] useEffect run #${runId} — fetching theme_settings`);
    if (runId > 2) {
      console.error("[ThemeProvider] ⚠️ Potential infinite loop — useEffect ran more than twice");
    }
    (async () => {
      const t0 = performance.now();
      const { data, error } = await supabase.from("theme_settings").select("*").limit(1).maybeSingle();
      console.log(`[ThemeProvider] fetch done in ${(performance.now() - t0).toFixed(0)}ms`, { hasData: !!data, error });
      if (!mounted) return;
      if (!data) { applyTokens(DEFAULTS); return; }
      const d = data as any;
      const merged: ThemeSettings = {
        ...DEFAULTS,
        ...d,
        hero_title: d.hero_title ?? DEFAULTS.hero_title,
        hero_subtitle: d.hero_subtitle ?? DEFAULTS.hero_subtitle,
        hero_cta_text: d.hero_cta_text ?? DEFAULTS.hero_cta_text,
        hero_grid_images: Array.isArray(d.hero_grid_images) ? (d.hero_grid_images as string[]) : [],
      };
      setTheme(merged);
      applyTokens(merged);
    })();
    return () => { mounted = false; };
  }, []);

  const value = useMemo(() => theme, [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
