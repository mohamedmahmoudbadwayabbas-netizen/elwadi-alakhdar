import { SITE_URL } from "@/lib/brand";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Leaf,
  ArrowRight,
  LayoutGrid,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { EmptyState } from "@/components/storefront/EmptyState";
import { SkeletonBox } from "@/components/storefront/Skeletons";
import {
  COMPREHENSIVE_CATEGORIES,
  ComprehensiveCategory,
  getMergedCategories,
} from "@/lib/categories-data";
import { cn } from "@/lib/utils";
import { useStoreCategories, type Category } from "@/lib/store-data-hooks";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "دليل الأقسام الشامل — سوبرماركت الوادي الأخضر" },
      {
        name: "description",
        content:
          "تصفّح أقسام متجر سوبرماركت الوادي الأخضر الشاملة بأعلى جودة وصور احترافية: خضروات، بقالة، ألبان، لحوم، عطارة ومكسرات",
      },
      { property: "og:title", content: "دليل الأقسام الشامل — سوبرماركت الوادي الأخضر" },
      {
        property: "og:description",
        content: "كل أقسام متجر سوبرماركت الوادي الأخضر: خضروات، بقالة، ألبان، لحوم، عطارة ومكسرات.",
      },
      { property: "og:url", content: `${SITE_URL}/categories` },
      { name: "twitter:title", content: "دليل الأقسام الشامل — سوبرماركت الوادي الأخضر" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/categories` }],
  }),

  component: CategoriesPage,
});

type Cat = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  badge?: string | null;
  description?: string;
};

export function CategoriesPage() {
  const navigate = useNavigate();
  const { data: cachedCats, isLoading } = useStoreCategories();
  const cats: Cat[] = (cachedCats ?? (COMPREHENSIVE_CATEGORIES as Category[])).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    image_url: c.image_url ?? null,
    parent_id: c.parent_id ?? null,
    sort_order: c.sort_order,
    badge: c.badge,
    description: c.description,
  }));
  const loading = isLoading && (!cachedCats || cachedCats.length === 0);

  const [searchFilter, setSearchFilter] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "horizontal-tabs">("grid");
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const parents = cats.filter((c) => !c.parent_id);
  const childrenOf = (pid: string) => cats.filter((c) => c.parent_id === pid);

  const filteredParents = parents.filter((p) => {
    if (activeTab !== "all" && p.id !== activeTab) return false;
    if (!searchFilter.trim()) return true;
    const q = searchFilter.trim().toLowerCase();
    const kids = childrenOf(p.id);
    const preset = COMPREHENSIVE_CATEGORIES.find((c) => c.id === p.id);
    const presetSubcatMatch = preset?.subcategories?.some((s) => s.name.toLowerCase().includes(q));
    return (
      p.name.toLowerCase().includes(q) ||
      kids.some((k) => k.name.toLowerCase().includes(q)) ||
      Boolean(presetSubcatMatch)
    );
  });

  const activeCategoryObject = COMPREHENSIVE_CATEGORIES.find((c) => c.id === activeTab);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabScrollRef.current) {
      const scrollAmount = direction === "left" ? -250 : 250;
      tabScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background pb-28 text-right">
      <h1 className="sr-only">دليل الأقسام الشامل — كل أقسام متجر سمارت ستور</h1>

      {/* هيدر الصفحة الرئيسي */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Leaf className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="font-display text-base font-black text-foreground block leading-tight">
                سمارت ستور
              </span>
              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                دليل الأقسام الشامل
              </span>
            </div>
          </Link>

          {/* أزرار التبديل وملاحة هيدر */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "horizontal-tabs" : "grid")}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground shadow-xs hover:border-emerald-500 hover:text-emerald-600 transition-colors"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
              <span className="hidden sm:inline">
                {viewMode === "grid" ? "عرض بالتبويبات" : "عرض الشبكة الأفقية"}
              </span>
            </button>

            <Link
              to="/"
              className="flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <span>الرئيسية</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* الشريط الأفقي لتنقل الأقسام — Horizontal Categories Scrollbar */}
        <div className="relative border-t border-border/60 bg-card/60 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center px-2">
            <button
              onClick={() => scrollTabs("right")}
              className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card shadow-xs border border-border text-foreground hover:bg-secondary active:scale-95 transition-transform"
              aria-label="التمرير لليمين"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div
              ref={tabScrollRef}
              className="flex items-center gap-2 overflow-x-auto py-2.5 px-2 scrollbar-none scroll-smooth w-full"
            >
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 shadow-xs",
                  activeTab === "all"
                    ? "bg-emerald-600 text-white shadow-emerald-600/20 shadow-md ring-2 ring-emerald-600/30"
                    : "bg-secondary/80 text-foreground hover:bg-secondary hover:text-emerald-700",
                )}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>جميع الأقسام ({parents.length})</span>
              </button>

              {parents.map((cat) => {
                const isActive = activeTab === cat.id;
                const preset = COMPREHENSIVE_CATEGORIES.find((c) => c.id === cat.id);
                const bgImage = cat.image_url || preset?.image_url;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 border shadow-xs",
                      isActive
                        ? "border-emerald-600 bg-emerald-600 text-white ring-2 ring-emerald-600/30 shadow-md scale-[1.02]"
                        : "border-border/70 bg-card text-foreground hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20",
                    )}
                  >
                    <div className="h-5 w-5 rounded-full overflow-hidden shrink-0 grid place-items-center bg-secondary">
                      {bgImage ? (
                        <img src={bgImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs">{cat.icon ?? "🌿"}</span>
                      )}
                    </div>
                    <span>{cat.name}</span>
                    {cat.badge && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[9px] font-extrabold",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {cat.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollTabs("left")}
              className="z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-card shadow-xs border border-border text-foreground hover:bg-secondary active:scale-95 transition-transform"
              aria-label="التمرير لليصار"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 space-y-6">
        {/* شريط البحث وتصفية الفئات */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card rounded-3xl border border-border/80 p-4 shadow-xs">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute start-3.5 top-3 h-4 w-4 text-emerald-600" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="ابحث في جميع الأقسام (مثل: تموين، أجبان، لحوم، منظفات...)"
              className="h-10 w-full rounded-2xl border border-border/80 bg-background pe-4 ps-10 text-xs font-medium focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 shadow-xs transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-bold text-muted-foreground">
              عرض {filteredParents.length} قسم رئيسي
            </span>
            {activeTab !== "all" && (
              <button
                onClick={() => setActiveTab("all")}
                className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
              >
                إلغاء التصفية (عرض الكل)
              </button>
            )}
          </div>
        </div>

        {filteredParents.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="h-8 w-8 text-emerald-600" />}
            title="لم نجد أقسام تطابق بحثك"
            description="جرّب البحث بكلمة أخرى مثل 'خضروات' أو 'بقالة' أو اضغط لعرض جميع الأقسام"
            action={
              <button
                onClick={() => {
                  setSearchFilter("");
                  setActiveTab("all");
                }}
                className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                عرض جميع الأقسام
              </button>
            }
          />
        ) : (
          /* ─── الترتيب الأفقي للأقسام (Horizontal Grid / Tabs View) ─── */
          <div className="space-y-8">
            {/* العرض الشبكي الأفقي المتطوّر — Horizontal Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredParents.map((p) => {
                const dbKids = childrenOf(p.id);
                const presetObj = COMPREHENSIVE_CATEGORIES.find(
                  (cc) => cc.id === p.id || cc.name === p.name,
                );
                const subcategories =
                  dbKids.length > 0
                    ? dbKids.map((k) => ({
                        id: k.id,
                        name: k.name,
                        icon: k.icon || "✨",
                        image_url: k.image_url || undefined,
                      }))
                    : (presetObj?.subcategories ?? []);

                const coverImage =
                  p.image_url ||
                  presetObj?.image_url ||
                  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";

                return (
                  <div
                    key={p.id}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-xl"
                  >
                    {/* الصورة عالية الجودة والبادج في الأعلى */}
                    <div className="relative h-44 w-full overflow-hidden bg-secondary">
                      <img
                        src={coverImage}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* شارة تمييز القسم */}
                      <div className="absolute start-3 top-3 z-10 flex items-center gap-1">
                        {p.badge && (
                          <span className="rounded-full bg-[#E55300] px-2.5 py-0.5 text-[10px] font-black text-white shadow-md">
                            {p.badge}
                          </span>
                        )}
                      </div>

                      {/* زر تصفح القسم المباشر */}
                      <button
                        onClick={() => navigate({ to: "/", search: { category: p.id } as never })}
                        className="absolute end-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/20 backdrop-blur-md text-white shadow-sm transition-transform active:scale-90 hover:bg-white/40"
                        title={`تصفح قسم ${p.name}`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {/* عنوان القسم والوصف في الجزء السفلي للبروفايل */}
                      <div className="absolute bottom-3 start-3 end-3 z-10 space-y-0.5 text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-xl drop-shadow-sm">{p.icon || "🌿"}</span>
                          <h3 className="font-display text-base font-black tracking-wide leading-snug drop-shadow-md">
                            {p.name}
                          </h3>
                        </div>
                        {presetObj?.description && (
                          <p className="line-clamp-1 text-[11px] text-white/90 font-medium drop-shadow-xs">
                            {presetObj.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* محتوى القسم الأفقي: قائمة الأقسام الفرعية بشكل رقائق أفقية */}
                    <div className="flex flex-1 flex-col justify-between p-3.5 space-y-3 bg-card">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground border-b border-border/50 pb-1.5">
                          <span>الأقسام الفرعية المتوفرة ({subcategories.length})</span>
                          <span className="text-emerald-600 font-extrabold text-[10px]">
                            طازجة وفاخرة
                          </span>
                        </div>

                        {/* الأقسام الفرعية مرصوفة بشكل أزرار/شرائح أفقية مرنة */}
                        <div className="flex flex-wrap gap-1.5">
                          {subcategories.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() =>
                                navigate({ to: "/", search: { category: p.id } as never })
                              }
                              className="group/sub flex items-center gap-1 rounded-xl border border-border/60 bg-secondary/40 px-2.5 py-1 text-[11px] font-bold text-foreground transition-all hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 active:scale-95"
                            >
                              <span className="text-xs group-hover/sub:scale-110 transition-transform">
                                {sub.icon || "✨"}
                              </span>
                              <span className="line-clamp-1">{sub.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* زر تصفح كامل المنتجات في هذا القسم */}
                      <button
                        onClick={() => navigate({ to: "/", search: { category: p.id } as never })}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-emerald-600/10 py-2 text-xs font-black text-emerald-700 dark:text-emerald-300 border border-emerald-600/20 hover:bg-emerald-600 hover:text-white transition-all shadow-xs group-hover:bg-emerald-600 group-hover:text-white"
                      >
                        <span>تصفّح كل منتجات {p.name}</span>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
