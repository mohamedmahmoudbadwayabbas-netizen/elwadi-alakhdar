import { SITE_URL, BRAND_NAME_AR } from "@/lib/brand";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, type Product } from "@/lib/cart-context";
import { useSettings } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth-context";
import { useSearch } from "@/lib/search-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Sparkles,
  SearchX,
  PackageOpen,
  ArrowLeft,
  Flame,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  Store,
  Lightbulb,
  Heart,
  Scale,
} from "lucide-react";
import { HomePageSkeleton } from "@/components/storefront/Skeletons";
import { EmptyState } from "@/components/storefront/EmptyState";
import { SmartSearchBar } from "@/components/storefront/SmartSearchBar";
import { searchProductsFuzzy } from "@/lib/fuzzy-search";
import {
  useStoreProducts,
  useStoreCategories,
  type Category,
} from "@/lib/store-data-hooks";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductModal } from "@/components/storefront/ProductModal";
import { CategoryGrid } from "@/components/storefront/CategoryGrid";
import HomeProductShelves from "@/components/storefront/HomeProductShelves";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سوبرماركت الوادي الأخضر — تسوق البقالة والتموين واللحوم والأجبان 🛒" },
      {
        name: "description",
        content:
          "تسوّق جميع سلع السوبرماركت، المواد التموينية، اللحوم البلدية الطازجة، والأجبان والمنظفات بأسعار الجملة وتوصيل فوري لباب منزلك.",
      },
      { property: "og:title", content: "سوبرماركت الوادي الأخضر — سوبرماركت عائلتك" },
      {
        property: "og:description",
        content: "أجود السلع التموينية، لحوم بلدي، أجبان، ومستلزمات المنزل بأعلى جودة وتوصيل سريع.",
      },
      { property: "og:url", content: `${SITE_URL}/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),

  component: HomePage,
});

export function HomePage() {
  const navigate = useNavigate();
  const settings = useSettings();
  const { user } = useAuth();
  const { query: searchQuery, setQuery: setSearchQuery } = useSearch();

  // Instant cached data queries
  const { data: productsData, isLoading: isProductsLoading } = useStoreProducts();
  const { data: categoriesData, isLoading: isCategoriesLoading } = useStoreCategories();

  const products = useMemo(() => productsData ?? [], [productsData]);
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);
  const loading = isProductsLoading && (!productsData || (productsData as Product[]).length === 0);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Realistic branch & delivery indicators (not fabricated fixed names)
  const currentBranch = settings.store_address?.trim() || "الفرع الأقرب لعنوانك";
  const deliveryEstimate = "توصيل سريع لباب بيتك";

  // Read URL params & Delivery Estimations
  useEffect(() => {
    const checkUrlCat = () => {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) setSelectedCategory(cat);
    };
    checkUrlCat();
    window.addEventListener("popstate", checkUrlCat);

    return () => {
      window.removeEventListener("popstate", checkUrlCat);
    };
  }, []);

  // Single static Supermarket Hero slide based on curated base
  const heroSlide = useMemo(
    () => ({
      title: settings.hero_title || "الوادي الأخضر — سوبرماركت عائلتك 🛒",
      subtitle:
        settings.hero_subtitle ||
        "أجود السلع التموينية والبقالة واللحوم والألبان بأفضل الأسعار وتوصيل فوري ⚡",
      image_url:
        settings.hero_bg_image ||
        settings.hero_image_url ||
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85",
      cta_text: settings.hero_cta_text || "تسوّق الآن 🛒",
      badge: "عروض السوبرماركت اليومية 🛒",
    }),
    [settings],
  );

  const handleSelectCategory = (catId: string | null) => {
    const target = catId ?? "all";
    setSelectedCategory(target);
    const url = new URL(window.location.href);
    if (target && target !== "all") {
      url.searchParams.set("category", target);
    } else {
      url.searchParams.delete("category");
    }
    window.history.pushState({}, "", url.toString());

    // Scroll smoothly to products area if a category was clicked
    if (target !== "all") {
      const el = document.getElementById("supermarket-shelves");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Main Categories Rail
  const mainCategories = useMemo(() => categories, [categories]);

  // Product count map per category
  const productsCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.category_id) {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  // Filtered Products (by category + search)
  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory !== "all") {
      const matchedCat = categories.find(
        (c) => c.id === selectedCategory || c.slug === selectedCategory,
      );
      const targetId = matchedCat ? matchedCat.id : selectedCategory;
      const targetSlug = matchedCat ? matchedCat.slug : selectedCategory;
      list = list.filter(
        (p) =>
          p.category_id === targetId ||
          p.category_id === targetSlug ||
          p.category_id === selectedCategory,
      );
    }

    if (searchQuery.trim()) {
      list = searchProductsFuzzy(list, searchQuery, 0.35);
    }

    return list;
  }, [products, selectedCategory, searchQuery, categories]);

  // 1. Hot Deals Shelf (Items with real discounts)
  const discountedDeals = useMemo(() => {
    return products
.filter((p) => Boolean(p.old_price && p.old_price > p.price_per_unit))
      .slice(0, 8);
  }, [products]);

  // 2. Best Sellers in Your Area Shelf
  const bestSellersInArea = useMemo(() => {
    return products
      .filter((p) => p.is_featured)
      .slice(0, 8);
  }, [products]);

  // 3. Daily Fresh Shelf (Meat & Dairy)
  const freshProduceShelf = useMemo(() => {
    return products
      .filter((p) => {
        const cat = categories.find((c) => c.id === p.category_id);
        const slug = cat?.slug || "";
        return slug === "meat-poultry" || slug === "dairy-cheese";
      })
      .slice(0, 8);
  }, [products, categories]);

  // 4. Pantry & Staples Shelf (Rice, Oil, Canned, Pasta, excluding meat & dairy)
  const pantryStaplesShelf = useMemo(() => {
    return products
      .filter((p) => {
        const slug = categories.find((c) => c.id === p.category_id)?.slug || "";
        return slug !== "vegetables-fruits" && slug !== "meat-poultry" && slug !== "dairy-cheese";
      })
      .slice(0, 8);
  }, [products, categories]);

  // Structured Shelves for Storefront Discovery
  const shelves = useMemo(() => [
    {
      id: "shelf-deals",
      title: "عروض وتخفيضات السوبرماركت اليومية 🔥",
      description: "أقوى الخصومات والأسعار المخفضة المباشرة على سلع التموين والمنزل",
      products: discountedDeals,
      icon: "deals" as const,
    },
    {
      id: "shelf-popular",
      title: "الأكثر طلباً في منطقتك ⭐",
      description: "السلع والمنتجات الأكثر شراءً وتقييماً من عملائنا",
      products: bestSellersInArea,
      icon: "popular" as const,
    },
    {
      id: "shelf-fresh",
      title: "قسم اللحوم البلدية والأجبان الطازجة 🥩🧀",
      description: "تُجهز وتُقطع طازجة يومياً فور طلبك مع رقابة جودة متكاملة",
      products: freshProduceShelf,
      icon: "fresh" as const,
    },
    {
      id: "shelf-pantry",
      title: "مستلزمات البقالة والتموين والمنظفات 🥫🍚",
      description: "الزيوت، الأرز، السكر، المكرونة والمنظفات الأساسية لبيتك",
      products: pantryStaplesShelf,
      icon: "pantry" as const,
    },
  ], [discountedDeals, bestSellersInArea, freshProduceShelf, pantryStaplesShelf]);

  if (loading) {
    return <HomePageSkeleton />;
  }

  const isFiltered = selectedCategory !== "all" || Boolean(searchQuery.trim());
  const selectedCategoryObj = categories.find(
    (c) => c.id === selectedCategory || c.slug === selectedCategory,
  );

  return (
    <div className="min-h-screen bg-background pb-24 text-right font-sans" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-3 space-y-6">
        {/* ─── 1. FAST PROMINENT SEARCH BAR (Mobile-First Priority) ─── */}
        <section aria-label="بحث المنتجات السريع" className="w-full">
          <SmartSearchBar
            className="w-full shadow-xs"
            placeholder="ابحث عن منتج بالاسم.. مثل: طماطم، أرز، لحم بلدي، جبن رومي، زيت ذرة"
          />
        </section>

        {/* ─── 2. STORE BRANCH & TRUST VALUE STRIP ─── */}
        <section aria-label="مؤشرات الثقة والخدمة" className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-2xl bg-card border border-border/80 p-3 flex items-center gap-2.5 text-xs text-foreground shadow-xs">
            <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs text-foreground truncate">توصيل سريع ⚡</div>
              <div className="text-[10px] text-muted-foreground truncate">{deliveryEstimate}</div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/80 p-3 flex items-center gap-2.5 text-xs text-foreground shadow-xs">
            <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Store className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs text-foreground truncate">فرع المتجر 🏬</div>
              <div className="text-[10px] text-muted-foreground truncate">{currentBranch}</div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/80 p-3 flex items-center gap-2.5 text-xs text-foreground shadow-xs">
            <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs text-foreground truncate">جودة معتمدة 🥩</div>
              <div className="text-[10px] text-muted-foreground truncate">إشراف بيطري وطازج يومياً</div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/80 p-3 flex items-center gap-2.5 text-xs text-foreground shadow-xs">
            <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-xs text-foreground truncate">دفع عند الاستلام 💳</div>
              <div className="text-[10px] text-muted-foreground truncate">كاش أو بطاقة بنكية</div>
            </div>
          </div>
        </section>

        {/* ─── 3. SUPERMARKET HERO BANNER (Single Static Slide) ─── */}
        <section
          aria-label="عروض السوبرماركت الرئيسية"
          className="relative overflow-hidden rounded-3xl border border-border/80 shadow-md bg-card"
        >
          {/* Static Background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${heroSlide.image_url})`,
              }}
            />
            {/* High-Legibility Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-4 sm:p-8 lg:p-10 gap-4 sm:gap-6 min-h-[170px] sm:min-h-[280px]">
            <div className="space-y-2 sm:space-y-3.5 max-w-2xl text-white">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/25 px-3 py-0.5 text-[11px] sm:text-xs font-black text-white border border-primary/40 backdrop-blur-md">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                <span>{heroSlide.badge}</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-snug">
                {heroSlide.title}
              </h1>

              {/* Subtitle */}
              <p className="text-[11px] sm:text-xs text-muted-foreground sm:text-white/80 leading-relaxed font-semibold max-w-xl line-clamp-2 sm:line-clamp-none">
                {heroSlide.subtitle}
              </p>

              {/* Action Buttons */}
              <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectCategory("all");
                    const el = document.getElementById("supermarket-shelves");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group inline-flex items-center gap-1.5 rounded-xl sm:rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-black shadow-sm transition-colors cursor-pointer"
                >
                  <span>{heroSlide.cta_text}</span>
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-1" />
                </button>

                <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-card/60 px-3 py-2 rounded-xl backdrop-blur-sm border border-border/60">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>ضمان الجودة والدفع عند الاستلام 🛡️</span>
                </div>
              </div>
            </div>

            {/* Quick Supermarket Guarantee Badges on Desktop */}
            <div className="hidden lg:flex flex-col gap-2.5 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-xs text-white max-w-xs shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/20 text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-black text-xs">سلع تموينية ولحوم طازجة</div>
                  <div className="text-[10px] text-muted-foreground">أصناف مختارة بعناية يومياً</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/20 text-accent">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-black text-xs">توصيل سريع لباب بيتك</div>
                  <div className="text-[10px] text-muted-foreground">{deliveryEstimate}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. SUPERMARKET CATEGORIES GRID ─── */}
        <section aria-label="أقسام السوبرماركت" id="supermarket-categories">
          <CategoryGrid
            categories={mainCategories}
            active={selectedCategory}
            onSelect={handleSelectCategory}
            productsCountByCategory={productsCountByCategory}
            totalProductsCount={products.length}
          />
        </section>

        {/* ─── 5. ACTIVE SEARCH FILTER INDICATOR ─── */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between rounded-2xl bg-primary/10 border border-primary/20 p-3 text-xs">
            <span className="font-bold text-foreground">
              نتائج البحث عن: <strong className="font-black">"{searchQuery}"</strong> ({filteredProducts.length} منتج)
            </span>
            <button
              onClick={() => setSearchQuery("")}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              إلغاء البحث ✕
            </button>
          </div>
        )}

        {/* ─── 6. SUPERMARKET PRODUCT SHELVES (DISCOVERY) ─── */}
        <div id="supermarket-shelves" className="pt-2">
          <HomeProductShelves
            filteredProducts={filteredProducts}
            shelves={shelves}
            isFiltered={isFiltered}
            searchQuery={searchQuery}
            selectedCategoryName={selectedCategoryObj?.name_ar || selectedCategoryObj?.name}
            onOpenProduct={(product) => setSelectedProductForModal(product)}
            onResetFilters={() => {
              handleSelectCategory("all");
              setSearchQuery("");
            }}
          />
        </div>

        {/* ─── 7. STORE MANAGER EXPERT ADVISORY (Practical Supermarket Advice) ─── */}
        <section
          aria-label="إرشادات السوبرماركت للتسوق وحفظ الأغذية"
          className="rounded-3xl border border-border bg-card p-5 sm:p-7 space-y-4 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground font-display leading-tight">
                إرشادات مدير الفرع للتسوق الذكي وحفظ الأغذية 💡
              </h3>
              <p className="text-xs text-muted-foreground font-bold mt-0.5">
                نصائح عملية معتمدة لضمان أقصى جودة وتوفير حقيقي في ميزانية منزلك
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
              <div className="text-xs font-black text-primary flex items-center gap-1.5">
                <span>🧀 حفظ الأجبان والألبان:</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                تُحفظ الأجبان الطبيعية مغلفة بورق زبدة داخل علبة محكمة لمنع جفافها والحفاظ على نكهتها الطازجة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
              <div className="text-xs font-black text-accent flex items-center gap-1.5">
                <span>🥩 طزاجة اللحوم البلدية:</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                لحومنا البلدية تُذبح وتُجهز يومياً بإشراف بيطري. ننصح بحفظها فوراً في درجة حرارة -18 مئوية للحفاظ على قيمتها.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
              <div className="text-xs font-black text-primary flex items-center gap-1.5">
                <span>🥫 التوفير في التموين:</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                شراء العبوات العائلية من الأرز، الزيت، والمنظفات يمنحك توفيراً يصل إلى 15% مقارنة بالعبوات الفردية الصغيرة.
              </p>
            </div>
          </div>
        </section>

        {/* ─── 8. STORE FOOTER ─── */}
        <footer className="border-t border-border/70 pt-8 pb-4 text-center space-y-2">
          <div className="text-sm font-black text-foreground font-display">
            {settings.site_name || BRAND_NAME_AR} — سوبرماركت عائلتك 🛒
          </div>
          <p className="text-xs text-muted-foreground font-bold max-w-md mx-auto">
            توصيل فوري لجميع الفروع والمناطق • جودة مضمونة وسلع تموينية ولحوم طازجة.
          </p>
          <div className="text-[10px] text-muted-foreground/70 pt-2" dir="ltr">
            © 2026 Al-Wadi Supermarket. All rights reserved.
          </div>
        </footer>
      </div>

      {/* Quick View Product Modal */}
      <ProductModal
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
      />
    </div>
  );
}
