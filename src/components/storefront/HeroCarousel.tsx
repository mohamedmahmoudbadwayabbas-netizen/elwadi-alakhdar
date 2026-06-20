import { useEffect, useState } from "react";
import { Truck, Tag, Percent, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Settings = {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  hero_cta_text: string;
};

const fallbackSlides = [
  { title: "توصيل سريع", subtitle: "لكل أوردر فوق 300 جنيه", icon: Truck },
  { title: "خصومات الأسبوع", subtitle: "حتى 30% على العطارة", icon: Percent },
  { title: "منتجات أصيلة", subtitle: "بهارات وأعشاب طازجة", icon: Tag },
];

export function HeroCarousel() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("hero_title,hero_subtitle,hero_image_url,hero_cta_text")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSettings(data));
    const ch = supabase
      .channel("store-settings-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_settings" }, async () => {
        const { data } = await supabase
          .from("store_settings")
          .select("hero_title,hero_subtitle,hero_image_url,hero_cta_text")
          .limit(1)
          .maybeSingle();
        setSettings(data);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % fallbackSlides.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-3 pt-4 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl shadow-elegant">
        <div className="hero-gradient relative grid grid-cols-[1fr_auto] items-center gap-4 p-6 sm:p-10">
          {settings?.hero_image_url && (
            <img
              src={settings.hero_image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
            />
          )}
          <div className="relative min-w-0 text-primary-foreground">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest opacity-80">
              <Sparkles className="h-3.5 w-3.5" />
              {fallbackSlides[i].title}
            </div>
            <h2 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
              {settings?.hero_title ?? "الوادي الأخضر"}
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed opacity-95 sm:text-base">
              {settings?.hero_subtitle ?? fallbackSlides[i].subtitle}
            </p>
            <button
              onClick={() => document.getElementById("all-products")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground shadow-lift transition-all hover:brightness-110 active:scale-95"
            >
              {settings?.hero_cta_text ?? "تسوّق الآن"}
            </button>
          </div>
          <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-white/15 backdrop-blur sm:h-36 sm:w-36">
            {(() => {
              const Icon = fallbackSlides[i].icon;
              return <Icon className="h-12 w-12 text-primary-foreground sm:h-16 sm:w-16" />;
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
