import React, { useRef } from "react";
import { ChevronLeft, ChevronRight, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url?: string | null;
  badge?: string | null;
};

interface CategoryGridProps {
  categories: Category[];
  active: string | null;
  onSelect: (id: string | null) => void;
  productsCountByCategory?: Record<string, number>;
  totalProductsCount?: number;
}

export function CategoryGrid({
  categories,
  active,
  onSelect,
  productsCountByCategory = {},
  totalProductsCount = 0,
}: CategoryGridProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-3 pt-4 sm:px-6">
      {/* رأس قسم التصنيفات مع أزرار التحريك الأفقي */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-1.5 rounded-full bg-[#036233]" />
          <h2 className="text-base font-black text-foreground sm:text-lg tracking-wide flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#036233]" />
            <span>تسوّق حسب الأقسام الرئيسية 🛒</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {active && active !== "all" && (
            <button
              onClick={() => onSelect(null)}
              className="rounded-full bg-[#036233]/10 px-4 py-1.5 text-xs font-black text-[#036233] hover:bg-[#036233] hover:text-white transition-all cursor-pointer shadow-sm"
            >
              عرض كل المنتجات
            </button>
          )}

          {/* أزرار التحريك اليدوي يميناً ويساراً */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll("right")}
              className="h-8 w-8 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center text-foreground transition-all cursor-pointer shadow-2xs"
              title="التمرير لليمين"
              aria-label="التمرير لليمين"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("left")}
              className="h-8 w-8 rounded-xl border border-border bg-card hover:bg-secondary flex items-center justify-center text-foreground transition-all cursor-pointer shadow-2xs"
              title="التمرير لليسار"
              aria-label="التمرير لليسار"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* شريط التصنيفات ذو الصور البارزة مع التحريك الأفقي السلس */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar"
        dir="rtl"
      >
        {/* بطاقة "كل المنتجات" البارزة */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={cn(
            "group relative flex flex-col justify-between shrink-0 w-36 sm:w-44 h-36 sm:h-40 overflow-hidden rounded-3xl border text-start transition-all duration-300 snap-start cursor-pointer",
            !active || active === "all"
              ? "border-[#036233]/50 bg-[#036233]/5 ring-2 ring-[#036233]/20 shadow-[0_8px_30px_rgb(3,98,51,0.1)] scale-[1.02]"
              : "border-border/40 bg-card hover:border-[#036233]/30 hover:shadow-lg hover:-translate-y-0.5",
          )}
        >
          {/* الصورة الخلفية البارزة */}
          <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-secondary">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80"
              alt="كل الأقسام"
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <span className="absolute top-2 start-2 text-xl drop-shadow-md">🛒</span>
            {totalProductsCount > 0 && (
              <span className="absolute bottom-2 start-2 text-[10px] font-black text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full">
                {totalProductsCount} صنف
              </span>
            )}
          </div>

          {/* العنوان والحالة */}
          <div className="flex flex-1 items-center justify-between px-3 py-2 bg-card">
            <span
              className={cn(
                "text-xs font-black truncate transition-colors",
                !active || active === "all"
                  ? "text-[#036233]"
                  : "text-foreground group-hover:text-[#036233]",
              )}
            >
              كل الأقسام
            </span>
            <div
              className={cn(
                "h-2 w-2 rounded-full transition-all shrink-0",
                !active || active === "all"
                  ? "bg-[#036233] scale-125 ring-2 ring-[#036233]/30"
                  : "bg-border group-hover:bg-[#036233]/50",
              )}
            />
          </div>
        </button>

        {/* بطاقات باقي الأقسام مع صورها البارزة */}
        {categories.map((c) => {
          const isActive = active === c.id || active === c.slug;
          const count = productsCountByCategory[c.id] ?? productsCountByCategory[c.slug] ?? 0;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(isActive ? null : c.id)}
              className={cn(
                "group relative flex flex-col justify-between shrink-0 w-36 sm:w-44 h-36 sm:h-40 overflow-hidden rounded-3xl border text-start transition-all duration-300 snap-start cursor-pointer",
                isActive
                  ? "border-[#036233]/50 bg-[#036233]/5 ring-2 ring-[#036233]/20 shadow-[0_8px_30px_rgb(3,98,51,0.1)] scale-[1.02]"
                  : "border-border/40 bg-card hover:border-[#036233]/30 hover:shadow-lg hover:-translate-y-0.5",
              )}
            >
              {/* شارة التمييز الأخضر */}
              {c.badge && (
                <span className="absolute start-2 top-2 z-10 rounded-full bg-[#036233] text-white px-2.5 py-1 text-[10px] font-black shadow-md border border-white/20">
                  {c.badge}
                </span>
              )}
              {/* الصورة الفوتوغرافية البارزة للقسم */}
              <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-secondary">
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-[#036233]/10 text-3xl">
                    {c.icon ?? "🌿"}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <span className="absolute bottom-2 start-2 text-base drop-shadow-md">
                  {c.icon ?? "🌿"}
                </span>
                {count > 0 && (
                  <span className="absolute bottom-2 end-2 text-[10px] font-black text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full">
                    {count} صنف
                  </span>
                )}
              </div>

              {/* اسم القسم واختيار الفئة */}
              <div className="flex flex-1 items-center justify-between px-3 py-2 bg-card">
                <span
                  className={cn(
                    "text-xs font-black truncate transition-colors",
                    isActive
                      ? "text-[#036233]"
                      : "text-foreground group-hover:text-[#036233]",
                  )}
                >
                  {c.name}
                </span>
                <div
                  className={cn(
                    "h-2 w-2 rounded-full transition-all shrink-0",
                    isActive
                      ? "bg-[#036233] scale-125 ring-2 ring-[#036233]/30"
                      : "bg-border group-hover:bg-[#036233]/50",
                  )}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
