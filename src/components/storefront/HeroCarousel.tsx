import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, ChevronLeft, ChevronRight } from "lucide-react";
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
    "",
  ]).map((url, i) => ({
    id: `fb-${i}`,
    image_url: url,
    title: theme.hero_title || "الوادي الأخضر",
    subtitle: theme.hero_subtitle || "سوبر ماركت وعطارة - جودة، أصالة وتوصيل سريع مباشر لباب بيتك.",
    cta_text: theme.hero_cta_text || "تسوّق الآن",
    link_url: "#all-products",
  }));

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const current = slides[idx];

  const goTo = (i: number) => setIdx(((i % slides.length) + slides.length) % slides.length);

  return (
    <div className="px-3 pt-6 sm:px-6">
      <div
        className="relative mx-auto max-w-6xl overflow-hidden shadow-2xl transition-all duration-500"
        style={{
          borderRadius: (theme.card_radius_px || 16) + 10,
        }}
      >
        <div className="relative aspect-[16/10] w-full bg-[#0b1f14] sm:aspect-[21/9] overflow-hidden" dir="rtl">

          {/* 1. خلفية الـ SVG ذات الطبقات والمنحنيات المتداخلة (الوادي الأخضر) */}
          <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
            <svg viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
              <defs>
                <linearGradient id="base-valley" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(142, 76%, 6%)" />
                  <stop offset="100%" stopColor="hsl(142, 76%, 16%)" />
                </linearGradient>

                <linearGradient id="mid-valley" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(150, 60%, 10%)" />
                  <stop offset="100%" stopColor="hsl(135, 50%, 18%)" />
                </linearGradient>

                <linearGradient id="top-valley" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(142, 76%, 24%)" />
                  <stop offset="100%" stopColor="hsl(142, 76%, 14%)" />
                </linearGradient>
              </defs>

              <rect width="1440" height="800" fill="url(#base-valley)" />

              <path className="animate-wave-1" d="M0 280C360 200 720 440 1080 380C1260 350 1350 280 1440 240V800H0V280Z"
                fill="url(#mid-valley)"
                opacity="0.8" />

              <path className="animate-wave-2" d="M0 420C240 340 480 560 780 460C1080 360 1260 460 1440 380V800H0V420Z"
                fill="url(#top-valley)"
                opacity="0.6" />

              <path className="animate-wave-3" d="M0 580C360 520 720 680 1080 600C1260 560 1350 580 1440 540V800H0V580Z"
                fill="hsl(142, 76%, 12%)"
                opacity="0.95" />
            </svg>
          </div>

          {slides.map((s, i) => s.image_url && (
            <img
              key={s.id}
              src={`${s.image_url}${s.image_url.includes('?') ? '&' : '?'}w=1200&q=80&fm=webp`}
              alt={s.title ?? "منتجات الوادي الأخضر"}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover mix-blend-overlay transition-opacity duration-1000 ${i === idx ? "opacity-25" : "opacity-0"}`}
            />
          ))}

          <div className="absolute inset-0 z-10 flex items-center justify-between px-6 sm:px-12 md:px-16 gap-4">

            <div className="flex flex-col items-start text-right max-w-[60%] sm:max-w-[55%] gap-2 sm:gap-3">

              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[10px] sm:text-xs font-bold text-white/90 backdrop-blur-md">
                <Truck className="h-3.5 w-3.5 text-[#FF7A00]" />
                أول توصيل سريع
              </div>

              <h2 className="font-display text-2xl font-black text-white drop-shadow-md sm:text-4xl md:text-5xl leading-tight">
                {current.title}
              </h2>

              <p className="text-xs font-medium text-white/85 sm:text-sm md:text-base leading-relaxed max-w-md">
                {current.subtitle}
              </p>

              <button
                onClick={() => document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-2 rounded-full px-6 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 hover:shadow-[0_8px_20px_rgba(255,122,0,0.5)]"
                style={{
                  background: "linear-gradient(135deg, #ff6a00, #e64a00)",
                }}
              >
                {current.cta_text}
              </button>
            </div>

            <div className="flex items-center justify-center w-[30%] sm:w-[25%]">
              <div className="relative flex items-center justify-center w-16 h-16 sm:w-28 sm:h-28 rounded-3xl bg-white/10 border border-white/20 shadow-xl backdrop-blur-lg animate-pulse" style={{ animationDuration: '3s' }}>
                <Truck className="h-8 w-8 sm:h-14 sm:w-14 text-[#34d399]" />
                <div className="absolute inset-0 rounded-3xl bg-[#34d399]/10 blur-xl z-[-10]" />
              </div>
            </div>

          </div>

          {slides.length > 1 && (
            <>
              <button aria-label="السابق" onClick={() => goTo(idx - 1)} className="absolute end-3 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 transition border border-white/10">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button aria-label="التالي" onClick={() => goTo(idx + 1)} className="absolute start-3 top-1/2 z-20 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 transition border border-white/10">
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} aria-label={`الشريحة ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/30"}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
