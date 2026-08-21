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
  ChevronLeft,
  ChevronRight,
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
import { COMPREHENSIVE_CATEGORIES } from "@/lib/categories-data";
import { SmartSearchBar } from "@/components/storefront/SmartSearchBar";
import { searchProductsFuzzy } from "@/lib/fuzzy-search";
import { motion, AnimatePresence } from "motion/react";
import {
  useStoreProducts,
  useStoreCategories,
  useHeroBanners,
  type Category,
} from "@/lib/store-data-hooks";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductModal } from "@/components/storefront/ProductModal";
import { CategoryGrid } from "@/components/storefront/CategoryGrid";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سوبرماركت الوادي الأخضر — تسوق البقالة واللحوم والخضار طازج 🌿" },
      {
        name: "description",
        content:
          "تسوّق جميع سلع السوبرماركت، اللحوم البلدية الطازجة، الخضار والفاكهة والأجبان بأسعار الجملة وتوصيل فوري لباب منزلك.",
      },
      { property: "og:title", content: "سوبرماركت الوادي الأخضر — طازج لباب بيتك" },
      {
        property: "og:description",
        content: "خضار وفواكه يومية، لحوم بلدي، أجبان، ومستلزمات التموين بأعلى جودة وتوصيل سريع.",
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
  const { data: bannersData } = useHeroBanners();

  const products = useMemo(() => productsData ?? [], [productsData]);
  const categories = useMemo(() => categoriesData ?? (COMPREHENSIVE_CATEGORIES as Category[]), [categoriesData]);
  const heroBanners = useMemo(() => bannersData ?? [], [bannersData]);
  const loading = isProductsLoading && (!productsData || productsData.length === 0);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [savedDeliveryTime, setSavedDeliveryTime] = useState("30 - 45 دقيقة ⚡");
  const [currentBranch, setCurrentBranch] = useState("فرع الدقي الرئيسي");

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Read URL params & Delivery Estimations
  useEffect(() => {
    const checkUrlCat = () => {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) setSelectedCategory(cat);
    };
    checkUrlCat();
    window.addEventListener("popstate", checkUrlCat);

    const branch = localStorage.getItem("selected_store_branch");
    if (branch) {
      if (branch === "nasr_city") setCurrentBranch("فرع مدينة نصر");
      else if (branch === "maadi") setCurrentBranch("فرع المعادي");
      else setCurrentBranch("فرع الدقي الرئيسي");
    }

    const method = localStorage.getItem("delivery_method");
    if (method === "gps") {
      const dist = parseFloat(localStorage.getItem("calculated_distance") || "0");
      if (dist <= 3) setSavedDeliveryTime("20 - 30 دقيقة ⚡ (أقرب فرع إليك)");
      else if (dist <= 7) setSavedDeliveryTime("35 - 45 دقيقة 🚗");
      else setSavedDeliveryTime("50 - 60 دقيقة 🚚");
    }

    return () => {
      window.removeEventListener("popstate", checkUrlCat);
    };
  }, []);

  // Clean, realistic Supermarket Hero Slides
  const heroSlides = useMemo(() => {
    const defaultSlide = {
      id: "supermarket-main-hero",
      title: settings.hero_title || "طازج يومياً.. من المزرعة والمصنع لباب بيتك 🥬",
      subtitle:
        settings.hero_subtitle ||
        "أجود أنواع الخضار والفاكهة، اللحوم البلدية المضمونة، والأجبان والبقالة بأفضل عروض الأسعار وتوصيل فوري.",
      image_url:
        settings.hero_bg_image ||
        settings.hero_image_url ||
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=85",
      cta_text: "تصفح عروض اليوم 🛒",
      badge: "خصومات وعروض طازجة يومية ⚡",
    };

    if (heroBanners.length === 0) return [defaultSlide];

    return heroBanners.map((b) => ({
      id: b.id,
      title: b.title || "عروض وتخفيضات السوبرماركت الحصرية 🌟",
      subtitle: b.subtitle || "وفر على مشترياتك الأسبوعية والشهرية مع خدمة التوصيل السريع.",
      image_url: b.image_url,
      cta_text: b.cta_text || "تسوق العرض الآن 🛒",
      badge: "عرض خاص ومميز 🔥",
    }));
  }, [heroBanners, settings]);

  // Auto-slide effect every 6 seconds
  useEffect(() => {
    if (isPaused || heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, heroSlides.length]);

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
  const mainCategories = useMemo(() => {
    return categories.filter((c) => !c.parent_id);
  }, [categories]);

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
      .filter((p) => (p.old_price && p.old_price > p.price_per_unit) || p.is_on_sale)
      .slice(0, 8);
  }, [products]);

  // 2. Best Sellers in Your Area Shelf
  const bestSellersInArea = useMemo(() => {
    return products
      .filter((p) => p.is_popular || p.is_top_seller || ((p as any).purchase_count && (p as any).purchase_count > 10))
      .slice(0, 8);
  }, [products]);

  // 3. Daily Fresh Shelf (Vegetables, Fruits, Fresh Meat)
  const freshProduceShelf = useMemo(() => {
    return products
      .filter(
        (p) =>
          p.is_by_weight ||
          p.category_id === "veg-fruits" ||
          p.category_id === "fresh-meat" ||
          p.category_id === "dairy-cheese",
      )
      .slice(0, 8);
  }, [products]);

  // 4. Pantry & Staples Shelf (Rice, Oil, Canned, Pasta)
  const pantryStaplesShelf = useMemo(() => {
    return products
      .filter(
        (p) =>
          !p.is_by_weight &&
          p.category_id !== "veg-fruits" &&
          p.category_id !== "fresh-meat",
      )
      .slice(0, 8);
  }, [products]);

  if (loading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-24 text-right font-sans" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-3 space-y-6">
        {/* ─── 1. CLEAN SUPERMARKET HERO BANNER ─── */}
        <div
          className="relative overflow-hidden rounded-3xl border border-border/80 shadow-lg bg-card group/hero"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Crossfade Background */}
          <AnimatePresence mode="wait">
            <motion.div
              key={heroSlides[currentSlideIndex]?.id || currentSlideIndex}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 z-0 overflow-hidden"
            >
              <div
                className="h-full w-full bg-cover bg-center transition-transform duration-7000 ease-out hover:scale-105"
                style={{
                  backgroundImage: `url(${heroSlides[currentSlideIndex]?.image_url})`,
                }}
              />
              {/* Premium Subtle Gradient Mask */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 lg:p-12 gap-6 min-h-[280px] sm:min-h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlides[currentSlideIndex]?.id || currentSlideIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="space-y-3.5 max-w-2xl text-white"
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/25 px-3.5 py-1 text-xs font-black text-emerald-300 border border-emerald-400/40 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-orange-400 animate-pulse" />
                  <span>{heroSlides[currentSlideIndex]?.badge}</span>
                </div>

                {/* Main Headline */}
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                  {heroSlides[currentSlideIndex]?.title}
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold max-w-xl">
                  {heroSlides[currentSlideIndex]?.subtitle}
                </p>

                {/* Action Buttons with Emerald & Fresh Accents */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      handleSelectCategory("all");
                      const el = document.getElementById("supermarket-shelves");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-6 py-3 text-xs sm:text-sm font-black text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-emerald-600/30"
                  >
                    <span>{heroSlides[currentSlideIndex]?.cta_text}</span>
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  </button>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/10 px-3.5 py-2.5 rounded-2xl backdrop-blur-sm border border-white/10">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>ضمان الجودة والدفع عند الاستلام 🛡️</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Quick Supermarket Guarantee Badges */}
            <div className="hidden lg:flex flex-col gap-2.5 bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/15 text-xs text-white max-w-xs shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-black text-xs">خضار ولحوم طازجة يومياً</div>
                  <div className="text-[10px] text-slate-300">من المزارع مباشرة كل صباح</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-teal-500/20 text-teal-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-black text-xs">توصيل سريع لباب بيتك</div>
                  <div className="text-[10px] text-slate-300">{savedDeliveryTime}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide Navigation Dots */}
          {heroSlides.length > 1 && (
            <div className="relative z-20 px-6 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : heroSlides.length - 1))
                  }
                  className="h-8 w-8 rounded-xl bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all"
                  aria-label="السابق"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length)}
                  className="h-8 w-8 rounded-xl bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all"
                  aria-label="التالي"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide.id || idx}
                    type="button"
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentSlideIndex
                        ? "w-6 bg-emerald-500 shadow-xs"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── 2. STORE BRANCH & DELIVERY STATUS BAR ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
            <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="font-bold">الفرع الحالي: </span>
              <span className="font-black text-emerald-700 dark:text-emerald-300">{currentBranch}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-teal-500/10 border border-teal-500/20 p-3 flex items-center gap-2.5 text-xs text-teal-900 dark:text-teal-300">
            <Clock className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 animate-pulse" />
            <div className="truncate">
              <span className="font-bold">التوصيل المتوقع: </span>
              <span className="font-black text-teal-700 dark:text-teal-300">{savedDeliveryTime}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border/80 p-3 flex items-center justify-between text-xs text-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-bold">تغطية الطلبات:</span>
            </div>
            <span className="font-black text-[11px] text-muted-foreground">متاح الدفع كاش أو بطاقة 💳</span>
          </div>
        </div>

        {/* ─── 3. SUPERMARKET CATEGORIES PROMINENT HORIZONTAL CAROUSEL ─── */}
        <CategoryGrid
          categories={mainCategories}
          active={selectedCategory}
          onSelect={handleSelectCategory}
          productsCountByCategory={productsCountByCategory}
          totalProductsCount={products.length}
        />

        {/* ─── 4. SEARCH FEEDBACK IF ACTIVE ─── */}
        {searchQuery.trim() && (
          <div className="flex items-center justify-between rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs">
            <span className="font-bold text-emerald-900 dark:text-emerald-200">
              نتائج البحث عن: <strong className="font-black">"{searchQuery}"</strong> ({filteredProducts.length} منتج)
            </span>
            <button
              onClick={() => setSearchQuery("")}
              className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline cursor-pointer"
            >
              إلغاء البحث ✕
            </button>
          </div>
        )}

        {/* ─── 5. SUPERMARKET PRODUCT SHELVES ─── */}
        <div id="supermarket-shelves" className="space-y-10 pt-2">
          {filteredProducts.length === 0 ? (
            <EmptyState
              icon={
                searchQuery ? (
                  <SearchX className="h-8 w-8 text-orange-600" />
                ) : (
                  <PackageOpen className="h-8 w-8 text-emerald-600" />
                )
              }
              title={searchQuery ? "لم نجد نتائج مطابقة" : "لا توجد منتجات في هذا القسم"}
              description={
                searchQuery
                  ? `لم نجد منتجات تطابق "${searchQuery}" — جرّب البحث بكلمات أبسط مثل (طماطم، أرز، لحم).`
                  : "هنضيف سلع ومنتجات جديدة في هذا القسم قريباً جداً 🌿"
              }
              action={
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-xs font-black text-white shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                  تصفح كل المنتجات
                </button>
              }
            />
          ) : selectedCategory !== "all" || searchQuery.trim() ? (
            /* Direct Grid View when filtered */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <h3 className="text-base font-black text-foreground flex items-center gap-2 font-display">
                  <ShoppingBag className="h-5 w-5 text-emerald-600" />
                  <span>
                    {selectedCategory !== "all"
                      ? categories.find((c) => c.id === selectedCategory || c.slug === selectedCategory)?.name || "المنتجات"
                      : "نتائج البحث"}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">
                    ({filteredProducts.length} صنف)
                  </span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={(p) => setSelectedProductForModal(p)}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Supermarket Authentic Categorized Shelves */
            <>
              {/* SHELF 1: TODAY'S OFFERS & DISCOUNTS */}
              {discountedDeals.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-orange-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500 text-white shadow-xs">
                        <Flame className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-foreground font-display leading-tight">
                          عروض وتخفيضات السوبرماركت اليومية 🔥
                        </h3>
                        <span className="text-[11px] text-muted-foreground font-bold">
                          أقوى الخصومات والأسعار المخفضة المباشرة
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
                    {discountedDeals.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onOpen={(p) => setSelectedProductForModal(p)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SHELF 2: BEST SELLERS & MOST POPULAR IN AREA */}
              {bestSellersInArea.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
                        <Award className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-foreground font-display leading-tight">
                          الأكثر طلباً في منطقتك ⭐
                        </h3>
                        <span className="text-[11px] text-muted-foreground font-bold">
                          السلع والمنتجات الأكثر شراءً وتقييماً من عملائنا
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
                    {bestSellersInArea.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isTopSeller={true}
                        onOpen={(p) => setSelectedProductForModal(p)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SHELF 3: DAILY FRESH & MEAT (Vegetables, Fruits, Meat) */}
              {freshProduceShelf.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        <Scale className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-foreground font-display leading-tight">
                          قسم الطازج — خضراوات وفواكه ولحوم بلدي 🥦🥩
                        </h3>
                        <span className="text-[11px] text-muted-foreground font-bold">
                          يتم وزنها وتجهيزها طازجة فور طلبك
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
                    {freshProduceShelf.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onOpen={(p) => setSelectedProductForModal(p)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SHELF 4: PANTRY & STAPLES */}
              {pantryStaplesShelf.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-foreground font-display leading-tight">
                          مستلزمات البقالة والتموين المنزلي 🥫🍚
                        </h3>
                        <span className="text-[11px] text-muted-foreground font-bold">
                          الزيوت، الأرز، السكر، المكرونة والمعلبات الأساسية
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
                    {pantryStaplesShelf.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onOpen={(p) => setSelectedProductForModal(p)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── 6. STORE MANAGER EXPERT ADVISORY (Real Practical Grocery Tips) ─── */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-card to-teal-500/5 p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground font-display leading-tight">
                إرشادات مدير الفرع للتسوق الذكي وحفظ الأغذية 💡
              </h3>
              <p className="text-xs text-muted-foreground font-bold mt-0.5">
                نصائح عملية معتمدة لضمان أقصى طزاجة وتوفير حقيقي في ميزانية منزلك
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
              <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span>🥬 حفظ الخضراوات الورقية:</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                لف الخضار الورقي (بقدونس، كزبرة، خس) بمنشفة ورقية جافة داخل علبة محكمة لتبقى طازجة ومقرمشة لأكثر من 10 أيام.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
              <div className="text-xs font-black text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                <span>🥩 طزاجة اللحوم البلدية:</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                لحومنا البلدية تُذبح وتُجهز يومياً بإشراف بيطري. ننصح بحفظها فوراً في درجة حرارة -18 مئوية للحفاظ على قيمتها.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
              <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span>🥫 التوفير في التموين:</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                شراء العبوات العائلية من الأرز، الزيت، والمنظفات يمنحك توفيراً يصل إلى 15% مقارنة بالعبوات الفردية الصغيرة.
              </p>
            </div>
          </div>
        </div>

        {/* ─── 7. FOOTER ─── */}
        <footer className="border-t border-border/70 pt-8 pb-4 text-center space-y-2">
          <div className="text-sm font-black text-foreground font-display">
            {settings.site_name || BRAND_NAME_AR} — سوبرماركت عائلتك 🛒
          </div>
          <p className="text-xs text-muted-foreground font-bold max-w-md mx-auto">
            توصيل فوري لجميع الفروع والمناطق • جودة مضمونة وخضار ولحوم طازجة يومياً.
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
