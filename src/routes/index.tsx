import { SITE_URL } from "@/lib/brand";
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
  Plus,
  Heart,
  MapPin,
  Truck,
  Sparkles,
  SearchX,
  PackageOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Star,
  ShoppingCart,
  Flame,
  ShieldCheck,
  Zap,
  ArrowRight,
} from "lucide-react";
import { HomePageSkeleton } from "@/components/storefront/Skeletons";
import { EmptyState } from "@/components/storefront/EmptyState";
import { flyToCart } from "@/lib/fly-to-cart";
import {
  COMPREHENSIVE_CATEGORIES,
  MOCK_PRODUCTS,
  getMergedCategories,
} from "@/lib/categories-data";
import { autoSeedDatabaseIfNeeded } from "@/lib/auto-seed";
import { SmartSearchBar } from "@/components/storefront/SmartSearchBar";
import { searchProductsFuzzy } from "@/lib/fuzzy-search";
import { motion, AnimatePresence } from "motion/react";
import {
  useStoreProducts,
  useStoreCategories,
  useHeroBanners,
  type Category,
  type HeroBanner,
} from "@/lib/store-data-hooks";
import { useLayoutConfig } from "@/lib/layout-config-context";
import { DynamicMiniAdsGrid } from "@/components/storefront/DynamicMiniAdsGrid";
import { DynamicFlashSaleTimer } from "@/components/storefront/DynamicFlashSaleTimer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سمارت ستور — سوبر ماركت أونلاين وتوصيل سريع لباب بيتك 🌿" },
      {
        name: "description",
        content:
          "تسوّق البقالة، اللحوم البلدي الطازجة، الخضار والفاكهة والأجبان من سمارت ستور مع توصيل فورى وأعلى جودة.",
      },
      { property: "og:title", content: "سمارت ستور — سوبر ماركت أونلاين وتوصيل سريع" },
      {
        property: "og:description",
        content: "تسوّق البقالة، اللحوم البلدي، الخضار والأجبان بأسعار مناسبة مع توصيل فورى.",
      },
      { property: "og:url", content: `${SITE_URL}/` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "سمارت ستور",
          url: `${SITE_URL}/`,
          inLanguage: "ar",
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
          publisher: {
            "@type": "Organization",
            name: "سمارت ستور",
            url: `${SITE_URL}/`,
          },
        }),
      },
    ],
  }),

  component: HomePage,
});

const HOME_PRODUCT_COLUMNS =
  "id,name,price_per_unit,old_price,image_url,category_id,stock_quantity,description,unit_label,is_by_weight,is_popular,is_on_sale,created_at";
const HOME_PRODUCTS_LIMIT = 150;

function HomePage() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const settings = useSettings();
  const { user } = useAuth();
  const { query: searchQuery } = useSearch();
  const { config: layoutConfig } = useLayoutConfig();

  // Instant cached data queries
  const { data: productsData, isLoading: isProductsLoading } = useStoreProducts();
  const { data: categoriesData, isLoading: isCategoriesLoading } = useStoreCategories();
  const { data: bannersData } = useHeroBanners();

  const products = productsData ?? (MOCK_PRODUCTS as unknown as Product[]);
  const categories = categoriesData ?? (COMPREHENSIVE_CATEGORIES as Category[]);
  const heroBanners = useMemo(() => bannersData ?? [], [bannersData]);
  const loading = isProductsLoading && (!productsData || productsData.length === 0);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [wishlist, setWishlist] = useState<Record<string, string>>({});
  const [savedDeliveryTime, setSavedDeliveryTime] = useState("30 - 45 دقيقة ⚡");

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Read category URL param
    const checkUrlCat = () => {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat) setSelectedCategory(cat);
    };
    checkUrlCat();
    window.addEventListener("popstate", checkUrlCat);

    // Calculate delivery time indicator
    const method = localStorage.getItem("delivery_method");
    if (method === "gps") {
      const dist = parseFloat(localStorage.getItem("calculated_distance") || "0");
      if (dist <= 3) setSavedDeliveryTime("20 - 30 دقيقة ⚡ (قريب منك جداً)");
      else if (dist <= 7) setSavedDeliveryTime("40 - 50 دقيقة 🚗");
      else if (dist <= 15) setSavedDeliveryTime("60 - 80 دقيقة 🏎️");
      else setSavedDeliveryTime("90 - 120 دقيقة 🚚");
    } else {
      const zone = localStorage.getItem("user_delivery_zone");
      if (zone === "medium") setSavedDeliveryTime("60 - 90 دقيقة 🚗");
      if (zone === "far") setSavedDeliveryTime("2 - 3 ساعات 🚚");
    }

    return () => {
      window.removeEventListener("popstate", checkUrlCat);
    };
  }, []);

  // Combined slides for the Auto-Slider
  const heroSlides = useMemo(() => {
    const mainSlide = {
      id: "main-store-hero",
      title: settings.hero_title || settings.site_name || "سمارت ستور — هايبر ماركت أونلاين",
      subtitle:
        settings.hero_subtitle ||
        "تسوّق جميع سلع البقالة، اللحوم البلدية الطازجة، الأجبان والمنظفات بأسعار الجملة التنافسية وتوصيل سريع لباب المنزل.",
      image_url:
        settings.hero_bg_image ||
        settings.hero_image_url ||
        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=85",
      cta_text: settings.hero_cta_text || "تصفح العروض والمنتجات 🛒",
      link_url: "#selective-category-grid",
      badge: "تجربة تسوق الهايبر ماركت الحديثة — تغطية شاملة وتوصيل فوري 🛒⚡",
    };

    if (heroBanners.length === 0) return [mainSlide];

    return [
      mainSlide,
      ...heroBanners.map((b) => ({
        id: b.id,
        title: b.title || settings.site_name || "عروض سمارت ستور 🌟",
        subtitle:
          b.subtitle || "تخفيضات وعروض حصرية لفترة محدودة على أفضل السلع والمنتجات الطازجة.",
        image_url: b.image_url,
        cta_text: b.cta_text || "تسوّق العرض الآن 🛒",
        link_url: b.link_url || "#selective-category-grid",
        badge: "عرض ترويجي مميز 🔥",
      })),
    ];
  }, [heroBanners, settings]);

  // Auto-slide effect every 5 seconds
  useEffect(() => {
    if (isPaused || heroSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, heroSlides.length]);

  const handleHeroCtaClick = (slide: (typeof heroSlides)[0]) => {
    if (slide.link_url && slide.link_url.startsWith("#")) {
      handleSelectCategory("all");
      const element = document.getElementById(slide.link_url.slice(1));
      element?.scrollIntoView({ behavior: "smooth" });
    } else if (slide.link_url && slide.link_url.startsWith("/")) {
      navigate({ to: slide.link_url });
    } else {
      handleSelectCategory("all");
      const element = document.getElementById("selective-category-grid");
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Fetch Wishlist
  useEffect(() => {
    if (!user) {
      setWishlist({});
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("wishlists")
        .select("id,product_id")
        .eq("user_id", user.id);
      const map: Record<string, string> = {};
      for (const w of data ?? []) map[w.product_id] = w.id;
      setWishlist(map);
    })();
  }, [user]);

  const toggleWish = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error("يرجى تسجيل الدخول لإضافة المنتج لقائمة المفضلة");
      navigate({ to: "/auth", search: { next: undefined } });
      return;
    }
    const existing = wishlist[productId];
    if (existing) {
      const { error } = await supabase.from("wishlists").delete().eq("id", existing);
      if (error) return toast.error(error.message);
      setWishlist((p) => {
        const c = { ...p };
        delete c[productId];
        return c;
      });
      toast.info("تمت إزالة المنتج من المفضلة");
    } else {
      const { data, error } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id, product_id: productId })
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      setWishlist((p) => ({ ...p, [productId]: data!.id }));
      toast.success("تمت الإضافة للمفضلة ❤️");
    }
  };

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
  };

  // 1. SELECTIVE CATEGORIES ONLY (Top 4 main categories on homepage; full catalog on /categories)
  const selectiveCategories = useMemo(() => {
    const mainCats = categories.filter((c) => !c.parent_id);
    if (mainCats.length > 0) return mainCats.slice(0, 4);
    return categories.slice(0, 4);
  }, [categories]);

  // 2. FILTERED PRODUCTS (using category filter + fuzzy search with typo tolerance)
  const filteredProducts = useMemo(() => {
    let list = products;

    // Apply Category Filter
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

    // Apply Smart Fuzzy Search if query is active
    if (searchQuery.trim()) {
      list = searchProductsFuzzy(list, searchQuery, 0.4);
    }

    return list;
  }, [products, selectedCategory, searchQuery, categories]);

  const bestSellers = useMemo(() => filteredProducts.slice(0, 5), [filteredProducts]);
  const latestProducts = useMemo(() => filteredProducts.slice(5, 15), [filteredProducts]);

  return (
    <div className="min-h-screen bg-background pb-20 text-right font-sans" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 space-y-8">
        {/* ─── 1. DYNAMIC AUTO-SLIDING DUAL-MODE HERO CAROUSEL ─── */}
        <div
          className="relative overflow-hidden rounded-3xl border border-border/80 shadow-2xl bg-card group/hero"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Animated Slide Background Image with Smooth Crossfade */}
          <AnimatePresence mode="wait">
            <motion.div
              key={heroSlides[currentSlideIndex]?.id || currentSlideIndex}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute inset-0 z-0 overflow-hidden"
            >
              <div
                className="h-full w-full bg-cover bg-center transition-transform duration-[10000ms] ease-out hover:scale-110"
                style={{
                  backgroundImage: `url(${heroSlides[currentSlideIndex]?.image_url})`,
                }}
              />
              {/* Dark Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35 backdrop-blur-[1px]" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-6 sm:p-10 lg:p-12 gap-8 min-h-[350px]">
            {/* Animated Content per slide */}
            <AnimatePresence mode="wait">
              <motion.div
                key={heroSlides[currentSlideIndex]?.id || currentSlideIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="space-y-4 max-w-2xl text-white"
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-black text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span>{heroSlides[currentSlideIndex]?.badge}</span>
                </div>

                {/* Main Headline */}
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                  {heroSlides[currentSlideIndex]?.title}
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-bold max-w-xl">
                  {heroSlides[currentSlideIndex]?.subtitle}
                </p>

                {/* CTA Button with HSL Glow effect & smooth hover transition */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => handleHeroCtaClick(heroSlides[currentSlideIndex])}
                    className="group relative inline-flex items-center gap-2 rounded-2xl hero-gradient px-7 py-3.5 text-sm font-black text-primary-foreground shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 border border-primary/40"
                    style={{
                      boxShadow: "0 0 25px rgba(var(--primary), 0.4)",
                    }}
                  >
                    <span>{heroSlides[currentSlideIndex]?.cta_text}</span>
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  </button>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-white/10 px-3.5 py-2 rounded-2xl backdrop-blur-sm border border-white/10">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>ضمان الجودة الفائقة والدفع عند الاستلام 🛡️</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Floating Visual Accent */}
            <div className="hidden lg:grid h-36 w-36 shrink-0 place-items-center rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <img
                src={
                  settings.floating_element_image ||
                  "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=300&q=80"
                }
                alt=""
                className="h-full w-full object-cover rounded-2xl shadow-inner"
              />
            </div>
          </div>

          {/* Slider Controls & Navigation Dots Overlay */}
          {heroSlides.length > 1 && (
            <div className="relative z-20 px-6 pb-4 flex items-center justify-between">
              {/* Left / Right Arrow Buttons */}
              <div className="flex items-center gap-2 opacity-90 transition-opacity">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : heroSlides.length - 1))
                  }
                  className="h-9 w-9 rounded-xl bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-105"
                  title="السلايد السابق"
                  aria-label="السلايد السابق"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length)}
                  className="h-9 w-9 rounded-xl bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-105"
                  title="السلايد التالي"
                  aria-label="السلايد التالي"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </div>

              {/* Dots Indicators */}
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={slide.id || idx}
                    type="button"
                    onClick={() => setCurrentSlideIndex(idx)}
                    aria-label={`الانتقال للسلايد ${idx + 1}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentSlideIndex
                        ? "w-7 bg-emerald-400 shadow-md"
                        : "w-2.5 bg-white/40 hover:bg-white/70"
                    }`}
                    title={`انتقل إلى السلايد ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── DYNAMIC FLASH SALE TIMER (JSON-DRIVEN ENGINE) ─── */}
        {layoutConfig.flashSaleTimer?.enabled && (
          <DynamicFlashSaleTimer config={layoutConfig.flashSaleTimer} />
        )}

        {/* ─── 2. SMART CLASSICAL SEARCH BAR ─── */}
        <div className="mx-auto max-w-3xl">
          <SmartSearchBar placeholder="ابحث عن منتجك هنا.. (مثلاً: طماطم، أرز، لحم بلدي، لبن طازج)" />
        </div>

        {/* Dynamic Delivery Estimate Bar */}
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-xs">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            <span>وقت التوصيل المتوقع إلى موقعك الحالي:</span>
          </div>
          <span className="bg-card px-3 py-1 rounded-xl text-emerald-700 dark:text-emerald-300 shadow-xs font-black border border-emerald-500/20">
            {savedDeliveryTime}
          </span>
        </div>

        {/* ─── DYNAMIC MINI-ADS GRID (JSON-DRIVEN ENGINE) ─── */}
        {layoutConfig.miniAdsGrid?.enabled && (
          <DynamicMiniAdsGrid config={layoutConfig.miniAdsGrid} />
        )}

        {/* ─── 3. SELECTIVE CATEGORY GRID (Top-Level Major Categories Only) ─── */}
        <div id="selective-category-grid" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-1.5 rounded-full hero-gradient" />
              <h2 className="text-lg sm:text-xl font-black text-foreground font-display tracking-tight">
                التصنيفات الأساسية الكبرى 🏷️
              </h2>
            </div>
            {selectedCategory !== "all" && (
              <button
                onClick={() => handleSelectCategory("all")}
                className="rounded-xl bg-secondary px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
              >
                عرض كل الكتالوج
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {selectiveCategories.map((cat) => {
              const isActive = selectedCategory === cat.id || selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(isActive ? "all" : cat.id)}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border text-right transition-all duration-300 ${
                    isActive
                      ? "border-emerald-600 bg-emerald-500/10 shadow-md ring-2 ring-emerald-600/40 scale-[1.02]"
                      : "border-border/70 bg-card hover:border-emerald-500/60 hover:shadow-lg hover:-translate-y-1"
                  }`}
                >
                  {cat.badge && (
                    <span className="absolute start-2 top-2 z-10 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-white shadow-xs">
                      {cat.badge}
                    </span>
                  )}

                  <div className="relative h-28 w-full overflow-hidden bg-secondary">
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center bg-emerald-500/10 text-3xl">
                        {cat.icon ?? "🌿"}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                  </div>

                  <div className="p-3 bg-card flex items-center justify-between">
                    <span
                      className={`text-xs font-black truncate ${
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground group-hover:text-emerald-600"
                      }`}
                    >
                      {cat.name}
                    </span>
                    <div
                      className={`h-2 w-2 rounded-full transition-all ${
                        isActive
                          ? "bg-emerald-600 scale-125"
                          : "bg-border group-hover:bg-emerald-500"
                      }`}
                    />
                  </div>
                </button>
              );
            })}

            {/* View all categories card */}
            <Link
              to="/categories"
              aria-label="عرض كل الأقسام"
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card text-right transition-all duration-300 hover:border-emerald-500/60 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="relative h-28 w-full overflow-hidden bg-secondary">
                <div className="grid h-full w-full place-items-center bg-emerald-500/10 text-3xl">
                  🛒
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              </div>
              <div className="p-3 bg-card flex flex-1 items-center justify-between">
                <span className="text-xs font-black text-foreground group-hover:text-emerald-600 truncate">
                  عرض كل الأقسام
                </span>
                <ArrowLeft className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-emerald-600" />
              </div>
            </Link>
          </div>
        </div>

        {/* ─── 4. STAGGERED PRODUCTS DISPLAY (Fluid UX Animations & Cards) ─── */}
        <div key={selectedCategory + searchQuery} className="space-y-8 pt-4">
          {filteredProducts.length === 0 && (
            <EmptyState
              icon={
                searchQuery ? (
                  <SearchX className="h-8 w-8 text-emerald-600" />
                ) : (
                  <PackageOpen className="h-8 w-8 text-emerald-600" />
                )
              }
              title={searchQuery ? "لم نجد نتائج مطابقة" : "لا توجد منتجات في هذا القسم حالياً"}
              description={
                searchQuery
                  ? `لم نجد منتجات تطابق "${searchQuery}" — جرّب البحث بكلمات أخرى أو اختر قسم آخر.`
                  : "هنضيف منتجات جديدة في هذا القسم قريباً جداً 🌿"
              }
              action={
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="rounded-full hero-gradient px-6 py-2.5 text-xs font-black text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
                >
                  تصفّح كل المنتجات
                </button>
              }
            />
          )}

          {/* Section 1: Best Sellers (الأكثر مبيعاً) */}
          {bestSellers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-foreground flex items-center gap-2 font-display">
                  <Flame className="h-5 w-5 text-amber-500 fill-amber-500 animate-bounce" />
                  <span>المنتجات الأكثر مبيعاً وعروضاً 🔥</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {bestSellers.map((product, idx) => {
                  const isWished = !!wishlist[product.id];
                  const hasDiscount =
                    product.old_price && product.old_price > product.price_per_unit;
                  const discountPercent = hasDiscount
                    ? Math.round(
                        ((product.old_price! - product.price_per_unit) / product.old_price!) * 100,
                      )
                    : 0;

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      onClick={() =>
                        navigate({ to: "/products/$productId", params: { productId: product.id } })
                      }
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    >
                      {/* Badges */}
                      <div className="absolute start-2 top-2 z-10 flex flex-col gap-1">
                        <span className="rounded-xl bg-amber-500 px-2 py-0.5 text-[9px] font-black text-white flex items-center gap-0.5 shadow-xs">
                          🔥 الأكثر مبيعاً
                        </span>
                        {hasDiscount && (
                          <span className="w-fit rounded-xl bg-red-600 px-2 py-0.5 text-[9px] font-black text-white shadow-xs animate-pulse">
                            خصم {discountPercent}%
                          </span>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleWish(e, product.id)}
                        className="absolute end-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-2xl bg-card/80 backdrop-blur-md shadow-xs transition-transform active:scale-125 hover:bg-card"
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isWished ? "fill-red-500 text-red-500" : "text-muted-foreground",
                          )}
                        />
                      </button>

                      {/* Product Image */}
                      <div className="aspect-square w-full bg-secondary overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            loading={idx === 0 ? "eager" : "lazy"}
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-3xl">🌿</div>
                        )}
                      </div>

                      {/* Content & Direct Add */}
                      <div className="flex flex-1 flex-col p-3.5 text-right justify-between space-y-2">
                        <div className="space-y-1">
                          <h4 className="line-clamp-1 text-xs sm:text-sm font-black text-foreground group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground font-bold">
                            {product.is_by_weight
                              ? "وزن تقريبي 500 جرام"
                              : product.unit_label || "1 قطعة"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/40">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              {product.price_per_unit.toFixed(2)}{" "}
                              <span className="text-[10px] font-bold text-muted-foreground">
                                ج.م
                              </span>
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-muted-foreground line-through font-bold">
                                {product.old_price!.toFixed(2)} ج.م
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addItem(product, product.is_by_weight ? 0.5 : 1);
                              const card = e.currentTarget.closest(".group") as HTMLElement | null;
                              flyToCart(card?.querySelector("img") ?? null);
                              toast.success(`تمت إضافة "${product.name}" للسلة 🛒`);
                            }}
                            className="grid h-9 w-9 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-md hover:opacity-90 active:scale-90 transition-transform"
                            aria-label="أضف للسلة"
                          >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Catalog Products Grid */}
          {latestProducts.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-base font-black text-foreground flex items-center gap-2 font-display">
                  <Zap className="h-5 w-5 text-emerald-500" />
                  <span>تصفح باقي المنتجات الطازجة 🛒</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {latestProducts.map((product, idx) => {
                  const isWished = !!wishlist[product.id];
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.04 }}
                      onClick={() =>
                        navigate({ to: "/products/$productId", params: { productId: product.id } })
                      }
                      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    >
                      <button
                        type="button"
                        onClick={(e) => toggleWish(e, product.id)}
                        className="absolute end-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-2xl bg-card/80 backdrop-blur-md shadow-xs"
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4",
                            isWished ? "fill-red-500 text-red-500" : "text-muted-foreground",
                          )}
                        />
                      </button>

                      <div className="aspect-square w-full bg-secondary overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-3xl">🌿</div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-3.5 justify-between space-y-2">
                        <div className="space-y-1">
                          <h4 className="line-clamp-1 text-xs sm:text-sm font-black text-foreground group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground font-bold">
                            {product.unit_label || "1 عبوة"}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/40">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {product.price_per_unit.toFixed(2)}{" "}
                            <span className="text-[10px] font-bold text-muted-foreground">ج.م</span>
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addItem(product, 1);
                              const card = e.currentTarget.closest(".group") as HTMLElement | null;
                              flyToCart(card?.querySelector("img") ?? null);
                              toast.success("أضيف للسلة 🛒");
                            }}
                            className="grid h-9 w-9 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-md hover:opacity-90 active:scale-90 transition-all"
                          >
                            <Plus className="h-4 w-4" strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 pt-8 pb-6 text-center space-y-2">
          <div className="text-sm font-black text-foreground font-display">
            سمارت ستور — Smart Store 🛍️
          </div>
          <p className="text-xs text-muted-foreground font-bold max-w-md mx-auto">
            سوبر ماركت، عطارة، لحوم ومخبوزات طازجة — جودة عالية وتوصيل سريع لباب المنزل.
          </p>
          <div className="text-[10px] text-muted-foreground/70 pt-2" dir="ltr">
            © 2026 جميع الحقوق محفوظة.
          </div>
        </div>
      </div>
    </div>
  );
}
