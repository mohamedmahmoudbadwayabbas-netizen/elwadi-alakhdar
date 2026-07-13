import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

type Banner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  link_url: string | null;
};

export function HeroCarousel() {
  const theme = useTheme();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("hero_banners")
        .select("id,image_url,title,subtitle,cta_text,link_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setBanners((data ?? []) as Banner[]);
    };
    load();
    const ch = supabase
      .channel("hero-banners-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "hero_banners" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // fallback شرائح من صور الثيم إذا لا توجد بانرات
  const slides: Banner[] = banners.length > 0 ? banners : (theme.hero_grid_images.length > 0 ? theme.hero_grid_images : [
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1200&q=80",
    "https://images.unsplash.com/photo-1452251889946-8ff5ea7b27ab?w=1200&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
  ]).map((url, i) => ({
    id: `fb-${i}`, image_url: url, title: theme.hero_title, subtitle: theme.hero_subtitle,
    cta_text: theme.hero_cta_text, link_url: "#all-products",
  }));

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const current = slides[idx];
  const goTo = (i: number) => setIdx(((i % slides.length) + slides.length) % slides.length);

  const handleClick = () => {
    const href = current.link_url || "#all-products";
    if (href.startsWith("#")) {
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = href;
    }
  };

  return (
    <div className="px-3 pt-4 sm:px-6">
      <div
        className="relative mx-auto max-w-6xl overflow-hidden shadow-elegant"
        style={{ borderRadius: theme.card_radius_px + 4 }}
      >
        {/* الشرائح */}
        <div className="relative aspect-[16/9] w-full bg-[#036233] sm:aspect-[21/9]">
          {slides.map((s, i) => (
            <img
              key={s.id}
              src={s.image_url}
              alt={s.title ?? ""}
              loading={i === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/70 via-black/30 to-transparent" />

          {/* المحتوى */}
          {(current.title || current.subtitle || current.cta_text) && (
            <div className="absolute inset-0 flex flex-col items-end justify-center gap-3 p-6 text-right text-white sm:p-10">
              {current.title && (
                <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-[#FFD27A]" />
                  توصيل سريع
                  <Truck className="h-3.5 w-3.5" />
                </div>
              )}
              {current.title && (
                <h2 className="font-display text-2xl font-bold leading-tight drop-shadow sm:text-5xl">{current.title}</h2>
              )}
              {current.subtitle && (
                <p className="max-w-xs text-xs leading-relaxed opacity-95 sm:max-w-md sm:text-sm">{current.subtitle}</p>
              )}
              {current.cta_text && (
                <button
                  onClick={handleClick}
                  className="mt-2 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-lift transition-all hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: theme.accent_hex }}
                >
                  {current.cta_text}
                </button>
              )}
            </div>
          )}

          {/* أزرار التنقل */}
          {slides.length > 1 && (
            <>
              <button aria-label="السابق" onClick={() => goTo(idx - 1)} className="absolute end-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-foreground shadow hover:bg-white">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button aria-label="التالي" onClick={() => goTo(idx + 1)} className="absolute start-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-foreground shadow hover:bg-white">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} aria-label={`الشريحة ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
