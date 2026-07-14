import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
    subtitle: theme.hero_subtitle || "طبيعة تروي تفاصيل الفخامة",
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
    <div className="relative px-3 pt-6 sm:px-6">
      <div
        className="relative mx-auto max-w-6xl overflow-hidden shadow-[0_20px_50px_rgba(4,120,87,0.15)] transition-all duration-500"
        style={{
          borderRadius: (theme.card_radius_px || 16) + 12,
        }}
      >
        <div className="relative aspect-[16/9] w-full bg-[#05321b] sm:aspect-[21/9] overflow-hidden" dir="rtl">

          {/* 1. خلفية الـ SVG الاحترافية المعاد رسمها لتطابق منحنيات وأمواج التصميم الأصلي بدقة */}
          <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none">
            <svg viewBox="0 0 1440 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
              <defs>
                {/* تدرج الخلفية العميقة */}
                <linearGradient id="bg-grad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#021d0f" />
                  <stop offset="50%" stopColor="#05351c" />
                  <stop offset="100%" stopColor="#01140a" />
                </linearGradient>

                {/* التدرج اللوني للطبقات الجانبية */}
                <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0b4626" />
                  <stop offset="100%" stopColor="#042211" />
                </linearGradient>

                <linearGradient id="wave-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0f5c32" />
                  <stop offset="100%" stopColor="#06321b" />
                </linearGradient>

                <linearGradient id="wave-grad-3" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1b7a43" />
                  <stop offset="100%" stopColor="#0b4122" />
                </linearGradient>
              </defs>

              {/* طبقة الخلفية الأساسية */}
              <rect width="1440" height="800" fill="url(#bg-grad)" />

              {/* المنحنى الانسيابي الأيسر الأنيق (تدرج ناعم) */}
              <path d="M0 800V300C250 250 350 450 600 400C850 350 950 150 1440 100V800H0Z" 
                fill="url(#wave-grad-1)" 
                opacity="0.5" />

              {/* المنحنى الانسيابي الأيمن المتداخل (يعطي عمق للوادي) */}
              <path d="M1440 800V250C1200 200 1100 420 850 380C600 340 500 120 0 80V800H1440Z" 
                fill="url(#wave-grad-2)" 
                opacity="0.4" />

              {/* الأمواج السفلية الناعمة والمنسابة من الطرفين نحو المنتصف */}
              <path d="M0 800V480C300 420 450 600 720 540C990 480 1140 400 1440 380V800H0Z" 
                fill="url(#wave-grad-3)" 
                opacity="0.65" />

              <path d="M1440 800V550C1140 500 990 680 720 620C450 560 300 500 0 480V800H1440Z" 
                fill="#032714" 
                opacity="0.9" />
            </svg>
          </div>

          {/* تمازج ذكي ومخفف للصور الخارجية لو وجدت حتى لا تغطي على جمال المنحنيات */}
          {slides.map((s, i) => s.image_url && (
            <img
              key={s.id}
              src={`${s.image_url}${s.image_url.includes('?') ? '&' : '?'}w=1200&q=80&fm=webp`}
              alt={s.title ?? "منتجات الوادي الأخضر"}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover mix-blend-overlay transition-opacity duration-1000 ${i === idx ? "opacity-20" : "opacity-0"}`}
            />
          ))}

          {/* التدرج الدائري المصلح لزيادة العمق */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />

          {/* 2. المحتوى المتمركز في المنتصف تماماً متوافق مع العرض الفخم */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 sm:p-12 md:p-16 gap-3 sm:gap-4">

            {/* الشارة العلوية الأنيقة */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[10px] sm:text-xs font-bold text-white/90 backdrop-blur-md shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#FFD27A]" />
              جودة أصيلة وتوصيل سريع
              <Truck className="h-3.5 w-3.5" />
            </div>

            {/* العنوان الرئيسي بخط Tajawal الفخم العريض جداً */}
            <h2 className="font-display text-4xl font-black text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] sm:text-6xl md:text-7xl leading-tight">
              {current.title}
            </h2>

            {/* العنوان الفرعي بخط Cairo المريح للعين */}
            <p className="text-sm font-medium text-emerald-100/90 max-w-md sm:max-w-xl sm:text-lg md:text-xl leading-relaxed tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
              {current.subtitle}
            </p>

            {/* 3. الزر البرتقالي المتوهج (المطابق للتصميم الأصلي) */}
            <button
              onClick={() => document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-4 rounded-full px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base font-black text-white tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_4px_25px_rgba(255,138,0,0.45)] hover:shadow-[0_10px_35px_rgba(255,138,0,0.65)]"
              style={{
                background: "linear-gradient(135deg, #ff9100, #ff6a00)",
              }}
            >
              {current.cta_text}
            </button>
          </div>

          {/* أزرار التنقل الأنيقة */}
          {slides.length > 1 && (
            <>
              <button aria-label="السابق" onClick={() => goTo(idx - 1)} className="absolute end-4 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/5 text-white backdrop-blur-md hover:bg-white/20 transition border border-white/10">
                <ChevronRight className="h-5 w-5" />
              </button>
              <button aria-label="التالي" onClick={() => goTo(idx + 1)} className="absolute start-4 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/5 text-white backdrop-blur-md hover:bg-white/20 transition border border-white/10">
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-1.5">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} aria-label={`الشريحة ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />
                ))}
              </div>
            </>
          )}

          {/* النجمة الديكورية متموضعة بشكل آمن داخل الكاروسيل وبشفافية مثالية */}
          <div className="absolute bottom-4 left-4 text-white/10 text-xl pointer-events-none animate-pulse select-none">✦</div>
        </div>
      </div>
    </div>
  );
}
