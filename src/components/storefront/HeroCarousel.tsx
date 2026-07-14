import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

type Banner = {
  id: string;
  image_url: string | null;
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

  const fallbackImages = theme.hero_grid_images.length > 0 ? theme.hero_grid_images : [""];
  const slides: Banner[] = banners.length > 0
    ? banners
    : fallbackImages.map((url, i) => ({
        id: `fb-${i}`,
        image_url: url || null,
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

  const title = current.title ?? "الوادي الأخضر";
  const subtitle = current.subtitle ?? "طبيعة تروي تفاصيل الفخامة";
  const ctaText = current.cta_text ?? "تسوّق الآن";

  return (
    <div className="relative px-3 pt-6 sm:px-6">
      <div
        className="relative mx-auto max-w-6xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(4,120,87,0.35)] transition-all duration-500"
        style={{ borderRadius: (theme.card_radius_px || 16) + 12 }}
      >
        <div
          className="relative aspect-[4/5] w-full overflow-hidden bg-[#032414] sm:aspect-[16/9] md:aspect-[21/9]"
          dir="rtl"
        >
          {/* SVG background: layered emerald waves */}
          <svg
            viewBox="0 0 1440 800"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="hc-bg" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#02180c" />
                <stop offset="45%" stopColor="#053b21" />
                <stop offset="100%" stopColor="#01100a" />
              </linearGradient>
              <linearGradient id="hc-w1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0c4a28" />
                <stop offset="100%" stopColor="#03200f" />
              </linearGradient>
              <linearGradient id="hc-w2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#116a3a" />
                <stop offset="100%" stopColor="#052e18" />
              </linearGradient>
              <linearGradient id="hc-w3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e8a4d" />
                <stop offset="100%" stopColor="#0a3d21" />
              </linearGradient>
              <radialGradient id="hc-glow" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                <stop offset="70%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width="1440" height="800" fill="url(#hc-bg)" />
            <rect width="1440" height="800" fill="url(#hc-glow)" />

            <path
              d="M0 800V300C250 250 350 460 600 400C850 340 950 150 1440 100V800H0Z"
              fill="url(#hc-w1)"
              opacity="0.55"
            />
            <path
              d="M1440 800V250C1200 200 1100 430 850 380C600 330 500 120 0 80V800H1440Z"
              fill="url(#hc-w2)"
              opacity="0.45"
            />
            <path
              d="M0 800V490C300 425 450 610 720 545C990 480 1140 400 1440 380V800H0Z"
              fill="url(#hc-w3)"
              opacity="0.7"
            />
            <path
              d="M1440 800V560C1140 505 990 690 720 625C450 560 300 505 0 490V800H1440Z"
              fill="#022613"
              opacity="0.92"
            />
          </svg>

          {/* Optional overlay image (very soft) */}
          {slides.map((s, i) =>
            s.image_url ? (
              <img
                key={s.id}
                src={`${s.image_url}${s.image_url.includes("?") ? "&" : "?"}w=1400&q=80&fm=webp`}
                alt={s.title ?? "الوادي الأخضر"}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                className={`absolute inset-0 h-full w-full object-cover mix-blend-overlay transition-opacity duration-1000 ${
                  i === idx ? "opacity-25" : "opacity-0"
                }`}
              />
            ) : null,
          )}

          {/* Center content */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-5 text-center sm:gap-4 sm:p-10 md:p-16">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold text-white/95 shadow-sm backdrop-blur-md sm:text-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#FFD27A]" />
              جودة أصيلة وتوصيل سريع
              <Truck className="h-3.5 w-3.5" />
            </div>

            <h2 className="font-display text-3xl font-black leading-tight tracking-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)] sm:text-5xl md:text-7xl">
              {title}
            </h2>

            <p className="max-w-md text-sm font-medium leading-relaxed tracking-wide text-emerald-50/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] sm:max-w-xl sm:text-lg md:text-xl">
              {subtitle}
            </p>

            <button
              onClick={() =>
                document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" })
              }
              className="mt-3 rounded-full px-8 py-3 text-sm font-black tracking-wide text-white shadow-[0_6px_28px_rgba(255,138,0,0.5)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_38px_rgba(255,138,0,0.7)] active:scale-95 sm:mt-4 sm:px-10 sm:py-3.5 sm:text-base"
              style={{ background: "linear-gradient(135deg, #ff9a1f, #ff6a00)" }}
            >
              {ctaText}
            </button>
          </div>

          {/* Nav */}
          {slides.length > 1 && (
            <>
              <button
                aria-label="السابق"
                onClick={() => goTo(idx - 1)}
                className="absolute end-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/25 sm:end-4"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                aria-label="التالي"
                onClick={() => goTo(idx + 1)}
                className="absolute start-3 top-1/2 z-20 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/25 sm:start-4"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`الشريحة ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="pointer-events-none absolute bottom-4 left-4 select-none text-xl text-white/10">
            ✦
          </div>
        </div>
      </div>
    </div>
  );
}
