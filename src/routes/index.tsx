import { SITE_URL, BRAND_NAME_AR } from "@/lib/brand";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { type Product } from "@/lib/cart-context";
import { useSettings } from "@/lib/settings-context";
import { useSearch } from "@/lib/search-context";
import {
  ArrowLeft,
  ArrowUpLeft,
  Layers,
  PackageOpen,
  SearchX,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
  Store,
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
      { title: "سوبرماركت الوادي الأخضر — سلة البيت الكاملة تبدأ بفكرة" },
      {
        name: "description",
        content:
          "تصفّح أقسام سوبرماركت الوادي الأخضر وابحث في المنتجات المسجلة بالمتجر لتجهّز احتياجات البيت.",
      },
      { property: "og:title", content: "سوبرماركت الوادي الأخضر — احتياجات البيت" },
      {
        property: "og:description",
        content: "ابحث عن المنتجات المسجلة وتصفّح الأقسام المتاحة في المتجر.",
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
  const { data: productsData, isLoading: isProductsLoading } = useStoreProducts();
  const { data: categoriesData } = useStoreCategories();
  const { data: bannersData } = useHeroBanners();

  const products = useMemo(() => productsData ?? [], [productsData]);
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);
  const heroBanners = useMemo(() => bannersData ?? [], [bannersData]);
  const loading =
    isProductsLoading && (!productsData || (productsData as Product[]).length === 0);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<"all" | "offers" | "featured">(
    "all",
  );

  useEffect(() => {
    const syncCategoryFromUrl = () => {
      const category = new URLSearchParams(window.location.search).get("category");
      if (category) setSelectedCategory(category);
    };
    syncCategoryFromUrl();
    window.addEventListener("popstate", syncCategoryFromUrl);
    return () => window.removeEventListener("popstate", syncCategoryFromUrl);
  }, []);

  const heroBanner = heroBanners[0];
  const heroTitle =
    heroBanner?.title || settings.hero_title || "سلة البيت الكاملة تبدأ بفكرة.";
  const heroSubtitle =
    heroBanner?.subtitle ||
    settings.hero_subtitle ||
    "اكتب اسم منتج أو جزءًا من قائمتك، أو ابدأ من أحد أقسام الهايبر ماركت.";
  const heroImage =
    heroBanner?.image_url || settings.hero_image_url || "/home-hypermarket-aisle.jpg";

  const handleSelectCategory = (categoryId: string | null) => {
    const target = categoryId ?? "all";
    setSelectedCategory(target);
    setSelectedCollection("all");
    setSearchQuery("");

    const url = new URL(window.location.href);
    if (target !== "all") url.searchParams.set("category", target);
    else url.searchParams.delete("category");
    window.history.pushState({}, "", url.toString());

    if (target !== "all") {
      document.getElementById("supermarket-shelves")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const productsCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const product of products) {
      if (product.category_id) {
        counts[product.category_id] = (counts[product.category_id] || 0) + 1;
      }
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = products;

    if (selectedCategory !== "all") {
      const category = categories.find(
        (item) => item.id === selectedCategory || item.slug === selectedCategory,
      );
      const targetId = category ? category.id : selectedCategory;
      const targetSlug = category ? category.slug : selectedCategory;
      list = list.filter(
        (product) =>
          product.category_id === targetId ||
          product.category_id === targetSlug ||
          product.category_id === selectedCategory,
      );
    }

    if (searchQuery.trim()) list = searchProductsFuzzy(list, searchQuery, 0.35);
    return list;
  }, [products, selectedCategory, searchQuery, categories]);

  const hasOffers = useMemo(
    () =>
      filteredProducts.some(
        (product) =>
          product.old_price != null && product.old_price > product.price_per_unit,
      ),
    [filteredProducts],
  );
  const hasFeatured = useMemo(
    () => filteredProducts.some((product) => product.is_featured),
    [filteredProducts],
  );

  const homeProducts = useMemo(() => {
    if (selectedCategory !== "all" || searchQuery.trim()) return filteredProducts;
    if (selectedCollection === "offers") {
      return filteredProducts.filter(
        (product) =>
          product.old_price != null && product.old_price > product.price_per_unit,
      );
    }
    if (selectedCollection === "featured") {
      return filteredProducts.filter((product) => product.is_featured);
    }
    return filteredProducts;
  }, [filteredProducts, selectedCollection, selectedCategory, searchQuery]);

  if (loading) return <HomePageSkeleton />;

  const contentLabel = searchQuery.trim()
    ? "نتائج البحث"
    : selectedCategory !== "all"
      ? "منتجات القسم"
      : selectedCollection === "offers"
        ? "منتجات عليها سعر سابق مسجل"
        : selectedCollection === "featured"
          ? "اختيارات المتجر"
          : "تصفّح منتجات المتجر";

  return (
    <main className="elwadi-homepage" dir="rtl">
      <div className="elwadi-homepage__content">
        <section className="home-hero" aria-labelledby="home-hero-title">
          <div className="home-hero__copy">
            <div className="home-eyebrow">
              <Store aria-hidden="true" />
              <span>هايبر ماركت الوادي الأخضر</span>
            </div>
            <h1 id="home-hero-title">{heroTitle}</h1>
            <p className="home-hero__subtitle">{heroSubtitle}</p>

            <div className="home-search-card">
              <div className="home-search-card__label">
                <span className="home-search-card__sparkle"><Sparkles aria-hidden="true" /></span>
                <span>ابحث في منتجات المتجر</span>
              </div>
              <SmartSearchBar
                className="home-search-card__input"
                placeholder="اكتب منتجًا أو كلمة من قائمتك…"
              />
            </div>

            {categories.length > 0 && (
              <div className="home-hero__shortcuts" aria-label="أقسام للبدء منها">
                {categories.slice(0, 4).map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelectCategory(category.id)}
                  >
                    {category.name_ar || category.name}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              className="home-primary-action"
              onClick={() =>
                document.getElementById("home-departments")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <span>{heroBanner?.cta_text || settings.hero_cta_text || "ابدأ التسوق"}</span>
              <ArrowLeft aria-hidden="true" />
            </button>
            <Link to="/assistant" className="home-assistant-link">
              <Sparkles aria-hidden="true" />
              <span>خطّط قائمتك مع مساعد الوادي</span>
              <ArrowLeft aria-hidden="true" />
            </Link>
          </div>

          <div className="home-hero__visual">
            <img
              src={heroImage}
              alt="ممر في هايبر ماركت يضم أقسامًا متنوعة من منتجات البيت"
              fetchPriority="high"
              decoding="async"
            />
          </div>
        </section>

        <section className="home-trust-strip" aria-label="معلومات التسوق">
          <div>
            <Layers aria-hidden="true" />
            <span><strong>أقسام متعددة</strong><small>من احتياجات البيت اليومية</small></span>
          </div>
          <div>
            <ShieldCheck aria-hidden="true" />
            <span><strong>بيانات من المتجر</strong><small>الأسعار والتوفر حسب بيانات المنتجات</small></span>
          </div>
          <div>
            <ShoppingBasket aria-hidden="true" />
            <span><strong>قائمة على راحتك</strong><small>ابدأ بالبحث أو اختر القسم</small></span>
          </div>
        </section>

        <section id="home-departments" className="home-section home-departments">
          <CategoryGrid
            categories={categories}
            active={selectedCategory}
            onSelect={handleSelectCategory}
            productsCountByCategory={productsCountByCategory}
          />
        </section>

        {searchQuery.trim() && (
          <div className="home-search-feedback" role="status">
            <span>
              نتائج البحث عن: <strong>«{searchQuery}»</strong> ({filteredProducts.length} منتج)
            </span>
            <button type="button" onClick={() => setSearchQuery("")}>مسح البحث ×</button>
          </div>
        )}

        <section id="supermarket-shelves" className="home-section home-products">
          <div className="home-section-heading">
            <div>
              <span className="home-section-heading__eyebrow">من تشكيلة المتجر</span>
              <h2>{contentLabel}</h2>
              <p>تصفّح الأصناف المسجلة، وافتح المنتج لمعرفة تفاصيله أو إضافته للسلة.</p>
            </div>
            {!searchQuery.trim() && selectedCategory === "all" && (
              <div className="home-product-filters" role="group" aria-label="تصفية المنتجات">
                <SlidersHorizontal aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setSelectedCollection("all")}
                  aria-pressed={selectedCollection === "all"}
                >
                  الكل
                </button>
                {hasOffers && (
                  <button
                    type="button"
                    onClick={() => setSelectedCollection("offers")}
                    aria-pressed={selectedCollection === "offers"}
                  >
                    عروض مسجلة
                  </button>
                )}
                {hasFeatured && (
                  <button
                    type="button"
                    onClick={() => setSelectedCollection("featured")}
                    aria-pressed={selectedCollection === "featured"}
                  >
                    اختيارات المتجر
                  </button>
                )}
              </div>
            )}
          </div>

          {homeProducts.length === 0 ? (
            <EmptyState
              icon={
                searchQuery ? (
                  <SearchX className="h-8 w-8 text-orange-600" />
                ) : (
                  <PackageOpen className="h-8 w-8 text-emerald-700" />
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
                  ? `لم نجد منتجات تطابق «${searchQuery}». جرّب اسم منتج آخر أو اختر قسمًا.`
                  : "ستظهر المنتجات هنا عند تسجيلها وإتاحتها في المتجر."
              }
              action={
                searchQuery || selectedCollection !== "all" || selectedCategory !== "all" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedCollection("all");
                      setSearchQuery("");
                    }}
                    className="home-reset-action"
                  >
                    عرض كل المنتجات
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="home-product-count">
                <ShoppingBag aria-hidden="true" />
                <span>{homeProducts.length} منتج</span>
              </div>
              <div className="home-product-grid">
                {homeProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={setSelectedProductForModal}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {categories.length > 0 && (
          <section className="home-section home-discovery" aria-labelledby="home-discovery-title">
            <div className="home-section-heading">
              <div>
                <span className="home-section-heading__eyebrow">ابدأ من احتياجك</span>
                <h2 id="home-discovery-title">اكتشف أقسام البيت</h2>
                <p>اختر قسمًا من تشكيلة المتجر للانتقال إلى منتجاته.</p>
              </div>
              <button
                type="button"
                className="home-text-action"
                onClick={() => handleSelectCategory(null)}
              >
                كل الأقسام <ArrowUpLeft aria-hidden="true" />
              </button>
            </div>
            <div className="home-discovery-grid">
              {categories.slice(0, 2).map((category, index) => (
                <button
                  type="button"
                  key={category.id}
                  className="home-discovery-card"
                  onClick={() => handleSelectCategory(category.id)}
                >
                  <span className="home-discovery-card__image">
                    <img
                      src={category.image_url || (index === 0 ? heroImage : settings.floating_element_image || heroImage)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </span>
                  <span className="home-discovery-card__body">
                    <strong>{category.name_ar || category.name}</strong>
                    <span>تصفّح المنتجات المسجلة في هذا القسم</span>
                    <span className="home-discovery-card__link">عرض منتجات القسم <ArrowLeft aria-hidden="true" /></span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="home-footer">
          <div className="home-footer__brand">
            <span className="home-footer__logo"><Store aria-hidden="true" /></span>
            <div>
              <strong>{settings.site_name || BRAND_NAME_AR}</strong>
              <p>هايبر ماركت لاحتياجات البيت من أقسام متعددة.</p>
            </div>
          </div>
          <div className="home-footer__bottom">
            <span>تصفّح الأقسام والمنتجات المسجلة في المتجر.</span>
            <span dir="ltr">© 2026 Al-Wadi Al-Akhdar</span>
          </div>
        </footer>
      </div>

      <StickyCartBar />
      <ProductModal
        product={selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
      />
    </main>
  );
}
