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

  const slides: Banner[] = banners.length > 0 ? banners : (theme.hero_grid_images.length > 0 ? theme.hero_grid_images : [
    "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1200&q=80",
    "https://images.unsplash.com/photo-1452251889946-8ff5ea7b27ab?w=1200&q=80",
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
  
  // دالة التنقل الصحيحة لتجنب المشاكل البرمجية
  const goTo = (i: number) => setIdx(((i % slides.length) + slides.length) % slides.length);

  return (
    <div className="px-3 pt-6 sm:px-6">
      <div
        className="relative mx-auto max-w-6xl overflow-hidden shadow-2xl transition-all duration-500"
        style={{ 
            borderRadius: theme.card_radius_px + 10,
            clipPath: "ellipse(150% 100% at 50% 0%)"
        }}
      >
        <div className="relative aspect-[16/10] w-full bg-[#047857] sm:aspect-[21/9]">
          {/* عرض الصور مع تطبيق تحسينات الأداء الفائقة وصيغة WebP */}
          {slides.map((s, i) => (
            <img
              key={s.id}
              src={`${s.image_url}${s.image_url.includes('?') ? '&' : '?'}w=1200&q=80&fm=webp`}
              alt={s.title ?? "منتجات الوادي الأخضر"}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === idx ? "opacity-60" : "opacity-0"}`}
            />
          ))}
          
          {/* طبقة لون الوادي الأخضر الغامق المتدرج */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#065f46] via-[#036233]/85 to-transparent" />

          {/* محتوى الشريحة المعروضة حالياً */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center text-white z-10">
            <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-[#FFD27A]" />
              جودة الوادي الطبيعية
              <Truck className="h-4 w-4" />
            </div>
            <h2 className="font-display text-3xl font-black drop-shadow-lg sm:text-6xl">{current.title}</h2>
            <p className="max-w-lg text-sm font-medium opacity-90 sm:text-lg">{current.subtitle}</p>
            <button
              onClick={() => document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-4 rounded-full px-8 py-3 text-sm font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: theme.accent_hex, color: "white" }}
            >
              {current.cta_text}
            </button>
          </div>

          {/* أزرار التنقل اليدوية (الأسهم والنقاط) */}
          {slides.length > 1 && (
            <>
              <button aria-label="السابق" onClick={() => goTo(idx - 1)} className="absolute end-4 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/40 transition">
                <ChevronRight className="h-5 w-5" />
              </button>
              <button aria-label="التالي" onClick={() => goTo(idx + 1)} className="absolute start-4 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/40 transition">
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-1.5">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} aria-label={`الشريحة ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-white" : "w-2 bg-white/40"}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
