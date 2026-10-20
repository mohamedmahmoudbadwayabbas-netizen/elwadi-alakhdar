import { SITE_URL, BRAND_NAME_AR } from "@/lib/brand";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { type Product } from "@/lib/cart-context";
import { useSettings } from "@/lib/settings-context";
import { useSearch } from "@/lib/search-context";
import {
  Sparkles,
  SearchX,
  PackageOpen,
  ArrowLeft,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { HomePageSkeleton } from "@/components/storefront/Skeletons";
import { EmptyState } from "@/components/storefront/EmptyState";
import { SmartSearchBar } from "@/components/storefront/SmartSearchBar";
import { searchProductsFuzzy } from "@/lib/fuzzy-search";
import {
  useStoreProducts,
  useStoreCategories,
  useHeroBanners,
} from "@/lib/store-data-hooks";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductModal } from "@/components/storefront/ProductModal";
import { CategoryGrid } from "@/components/storefront/CategoryGrid";
import { StickyCartBar } from "@/components/storefront/StickyCartBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "سوبرماركت الوادي الأخضر — تسوّق احتياجات البيت" },
      {
        name: "description",
        content:
          "تصفّح المنتجات المتاحة في سوبرماركت الوادي الأخضر وابحث عن احتياجاتك اليومية.",
      },
      { property: "og:title", content: "سوبرماركت الوادي الأخضر — احتياجات البيت" },
      {
        property: "og:description",
        content: "ابحث عن المنتجات المتاحة وتصفّح الأقسام والأسعار المسجلة في المتجر.",
      },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),

  component: HomePage,
});

export function HomePage() {
  const settings = useSettings();
  const { query: searchQuery, setQuery: setSearchQuery } = useSearch();

  // Instant cached data queries
  const { data: productsData, isLoading: isProductsLoading } = useStoreProducts();
  const { data: categoriesData } = useStoreCategories();
  const { data: bannersData } = useHeroBanners();

  const products = useMemo(() => productsData ?? [], [productsData]);
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);
  const heroBanners = useMemo(() => bannersData ?? [], [bannersData]);
  const loading = isProductsLoading && (!productsData || (productsData as Product[]).length === 0);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  const [selectedCollection, setSelectedCollection] = useState<"all" | "offers" | "featured">("all");

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

  const heroBanner = heroBanners[0];
  const heroTitle = heroBanner?.title || settings.hero_title || "كل احتياجات البيت في مكان واحد";
  const heroSubtitle = heroBanner?.subtitle || settings.hero_subtitle || "تصفّح المنتجات المتاحة واختر ما يناسب قائمتك.";
  const heroImage = heroBanner?.image_url || settings.hero_bg_image || settings.hero_image_url;

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

  const homeProducts = useMemo(() => {
    if (selectedCategory !== "all" || searchQuery.trim()) return filteredProducts;
    if (selectedCollection === "offers") {
      return filteredProducts.filter((p) => p.old_price != null && p.old_price > p.price_per_unit);
    }
    if (selectedCollection === "featured") return filteredProducts.filter((p) => p.is_featured);
    return filteredProducts;
  }, [filteredProducts, selectedCollection, selectedCategory, searchQuery]);


  if (loading) {
    return <HomePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-24 text-right font-sans" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-3 space-y-6">
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-emerald-500/10 px-5 py-8 sm:px-9 sm:py-10">
          {heroImage && (
            <div
              className="absolute inset-y-0 start-0 -z-10 hidden w-2/5 bg-cover bg-center opacity-15 md:block"
              style={{ backgroundImage: `url(${heroImage})` }}
              aria-hidden="true"
            />
          )}
          <div className="mx-auto max-w-3xl space-y-5 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> تسوّق أسهل، واختيارات أوضح
            </span>
            <h1 className="font-display text-2xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
              {heroTitle}
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {heroSubtitle}
            </p>
            <div className="mx-auto max-w-2xl text-start">
              <SmartSearchBar placeholder="ابحث عن منتج أو اكتب ما تحتاجه…" />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("supermarket-shelves")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <span>{heroBanner?.cta_text || settings.hero_cta_text || "تصفّح المنتجات"}</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>


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
              نتائج البحث عن: <strong className="font-black">"{searchQuery}"</strong> (<bdi dir="ltr" className="tabular-nums">{filteredProducts.length}</bdi> منتج)
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
          <div className="flex flex-col gap-4 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold text-primary">كتالوج المتجر</p>
              <h2 className="font-display text-xl font-black text-foreground sm:text-2xl">
                {searchQuery.trim() ? "نتائج البحث" : selectedCategory !== "all" ? "منتجات القسم" : "تصفّح المنتجات"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">اختيارات مبنية على المنتجات والأسعار المسجلة في المتجر.</p>
            </div>
            {!searchQuery.trim() && selectedCategory === "all" && (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="تصفية المنتجات">
                <SlidersHorizontal className="me-1 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {([
                  ["all", "الكل"],
                  ["offers", "عروض فعلية"],
                  ["featured", "اختيارات المتجر"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedCollection(value)}
                    aria-pressed={selectedCollection === value}
                    className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${selectedCollection === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {homeProducts.length === 0 ? (
            <EmptyState
              icon={
                searchQuery ? (
                  <SearchX className="h-8 w-8 text-orange-600" />
                ) : (
                  <PackageOpen className="h-8 w-8 text-emerald-600" />
                )
              }
              title={
                searchQuery
                  ? "لم نجد نتائج مطابقة"
                  : selectedCollection === "offers"
                    ? "لا توجد عروض مسجلة حاليًا"
                    : selectedCollection === "featured"
                      ? "لا توجد اختيارات مميزة حاليًا"
                      : "لا توجد منتجات في هذا القسم"
              }
              description={
                searchQuery
                  ? `لم نجد منتجات تطابق "${searchQuery}" — جرّب البحث بكلمات أبسط مثل (طماطم، أرز، لحم).`
                  : selectedCollection === "offers"
                    ? "ستظهر هنا المنتجات التي لها سعر سابق أعلى من السعر الحالي."
                    : selectedCollection === "featured"
                      ? "لم يحدد المتجر منتجات مميزة للعرض حتى الآن."
                      : "لا توجد منتجات متاحة في هذا القسم حاليًا."
              }
              action={
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedCollection("all");
                    setSearchQuery("");
                  }}
                  className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-xs font-black text-white shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                >
                  تصفح كل المنتجات
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <ShoppingBag className="h-4 w-4 text-primary" aria-hidden="true" />
                <span><bdi dir="ltr" className="tabular-nums">{homeProducts.length}</bdi> منتج</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {homeProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onOpen={setSelectedProductForModal} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── 7. FOOTER ─── */}
        <footer className="border-t border-border/70 pt-8 pb-4 text-center space-y-2">
          <div className="text-sm font-black text-foreground font-display">
            {settings.site_name || BRAND_NAME_AR} — سوبرماركت عائلتك 🛒
          </div>
          <p className="text-xs text-muted-foreground font-bold max-w-md mx-auto">
            تصفّح المنتجات المتاحة واختر ما يناسب احتياجاتك.
          </p>
          <div className="text-[10px] text-muted-foreground/70 pt-2" dir="ltr">
            © 2026 Al-Wadi Supermarket. All rights reserved.
          </div>
        </footer>
      </div>

      <StickyCartBar />

      {/* Quick View Product Modal */}
      <ProductModal
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
      />
    </div>
  );
}
