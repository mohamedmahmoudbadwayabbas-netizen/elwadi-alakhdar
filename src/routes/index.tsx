import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/cart-context";
import { toast } from "sonner";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { CategoryGrid } from "@/components/storefront/CategoryGrid";
import { ProductModal } from "@/components/storefront/ProductModal";
import { AnnouncementBar } from "@/components/storefront/AnnouncementBar";
import { StickyCartBar } from "@/components/storefront/StickyCartBar";
import {
  Search, SlidersHorizontal, X, Flame, Tag,
  Heart, MapPin, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: HomePage });

type Category = { id: string; name: string; icon?: string | null };
type SortKey = "default" | "price_asc" | "price_desc" | "popular" | "sale";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default",    label: "الافتراضي" },
  { key: "popular",    label: "🔥 الأكثر مبيعاً" },
  { key: "sale",       label: "🏷️ العروض" },
  { key: "price_asc",  label: "السعر: الأقل" },
  { key: "price_desc", label: "السعر: الأعلى" },
];

// ─── Skeleton بطاقة المنتج (من Doc 1) ───────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/40 bg-card p-2 shadow-sm">
      <div className="aspect-square w-full animate-pulse rounded-xl bg-secondary" />
      <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-secondary" />
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-secondary" />
      <div className="flex items-center justify-between">
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-secondary" />
        <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
      </div>
    </div>
  );
}

// ─── بطاقة المنتج المدمجة ─────────────────────────────────────────────────────
// تجمع: شارات FOMO + نسبة الخصم + زر القلب (Doc 2) + فتح Modal (Doc 1)
interface ProductCardProps {
  product: Product;
  isWished: boolean;
  onToggleWish: (e: React.MouseEvent) => void;
  onOpen: () => void;
  onAddToCart: (e: React.MouseEvent) => void;
}

function ProductCard({ product, isWished, onToggleWish, onOpen, onAddToCart }: ProductCardProps) {
  const hasDiscount =
    product.old_price != null && product.old_price > product.price_per_unit;
  const discountPercent = hasDiscount
    ? Math.round(((product.old_price! - product.price_per_unit) / product.old_price!) * 100)
    : null;

  return (
    <div
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
    >
      {/* ── شارات FOMO (Doc 2) ── */}
      <div className="absolute start-2 top-2 z-10 flex flex-col gap-1">
        {product.is_popular && (
          <span className="flex items-center gap-0.5 rounded-md bg-orange-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
            🔥 الأكثر مبيعاً
          </span>
        )}
        {discountPercent && (
          <span className="w-fit rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm animate-pulse">
            خصم {discountPercent}%
          </span>
        )}
        {product.is_on_sale && !discountPercent && (
          <span className="w-fit rounded-md bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
            🏷️ عرض
          </span>
        )}
      </div>

      {/* ── زر القلب مع LocalStorage (Doc 2) ── */}
      <button
        onClick={onToggleWish}
        className="absolute end-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-transform active:scale-125"
        aria-label={isWished ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      >
        <Heart
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            isWished ? "fill-red-500 text-red-500" : "text-slate-400",
          )}
        />
      </button>

      {/* ── صورة المنتج مع Hover Scale (Doc 2) ── */}
      <div className="aspect-square w-full overflow-hidden bg-secondary/30">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl">🌿</div>
        )}
      </div>

      {/* ── تفاصيل البطاقة ── */}
      <div className="flex flex-1 flex-col justify-between space-y-1.5 p-3 text-right">
        <div className="space-y-0.5">
          <h4 className="line-clamp-1 text-xs font-black text-foreground">
            {product.name}
          </h4>
          <p className="text-[10px] font-bold text-muted-foreground">
            {product.is_by_weight ? "وزن تقريبي 500 جرام" : product.unit_label || "1 قطعة"}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          {/* ── السعر الحالي + القديم مشطوب (Doc 2) ── */}
          <div className="flex flex-col">
            <span className="text-sm font-black text-emerald-600">
              {product.price_per_unit.toFixed(2)}{" "}
              <span className="text-[9px] font-bold text-muted-foreground">ج.م</span>
            </span>
            {hasDiscount && product.old_price && (
              <span className="text-[10px] font-bold text-muted-foreground line-through">
                {product.old_price.toFixed(2)} ج.م
              </span>
            )}
          </div>

          {/* ── زر إضافة سريعة + Toast (Doc 2) ── */}
          <button
            onClick={onAddToCart}
            className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:bg-primary/90 active:scale-90"
            aria-label={`أضف ${product.name} للسلة`}
          >
            <Plus className="h-4 w-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── الصفحة الرئيسية المدمجة ─────────────────────────────────────────────────
function HomePage() {
  const { addItem } = useCart();

  const [products, setProducts]           = useState<Product[]>([]);
  const [categories, setCategories]       = useState<Category[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // فلترة وترتيب (Doc 1)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [search, setSearch]               = useState("");
  const [sortKey, setSortKey]             = useState<SortKey>("default");
  const [showSort, setShowSort]           = useState(false);
  const sortRef                           = useRef<HTMLDivElement>(null);

  // إغلاق الـ dropdown لما المستخدم يضغط برّاه
  useEffect(() => {
    if (!showSort) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSort]);

  // مفضلة + وقت توصيل ديناميكي (Doc 2)
  const [wishlist, setWishlist]           = useState<Record<string, boolean>>({});
  const [deliveryTime, setDeliveryTime]   = useState("30 – 45 دقيقة ⚡");

  // ─── جلب البيانات وإعداد الحالة الأولية ──────────────────────────────────
  useEffect(() => {
    // 1. تحميل المفضلة من localStorage
    const savedWish: Record<string, boolean> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("wishlist_")) {
        const pId = key.replace("wishlist_", "");
        savedWish[pId] = localStorage.getItem(key) === "true";
      }
    }
    setWishlist(savedWish);

    // 2. وقت التوصيل الديناميكي بناءً على اختيار العميل السابق
    const method = localStorage.getItem("delivery_method");
    if (method === "gps") {
      const dist = parseFloat(localStorage.getItem("calculated_distance") ?? "0");
      if      (dist <= 3)  setDeliveryTime("20 – 30 دقيقة ⚡ (قريب منك)");
      else if (dist <= 7)  setDeliveryTime("40 – 50 دقيقة 🚗");
      else if (dist <= 15) setDeliveryTime("60 – 80 دقيقة 🏎️");
      else                 setDeliveryTime("90 – 120 دقيقة 🚚");
    } else {
      const zone = localStorage.getItem("user_delivery_zone");
      if (zone === "medium") setDeliveryTime("60 – 90 دقيقة 🚗");
      if (zone === "far")    setDeliveryTime("2 – 3 ساعات 🚚");
    }

    // 3. جلب المنتجات والفئات معاً (Doc 1 – Promise.all)
    (async () => {
      setLoading(true);
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      ]);
      setProducts((prods ?? []) as Product[]);
      setCategories((cats ?? []) as Category[]);
      setLoading(false);
    })();
  }, []);

  // ─── تبديل المفضلة مع حفظ فوري (Doc 2) ──────────────────────────────────
  const toggleWish = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = !wishlist[id];
    setWishlist(prev => ({ ...prev, [id]: next }));
    localStorage.setItem(`wishlist_${id}`, String(next));
    next ? toast.success("أضيف للمفضلة ❤️") : toast.info("أُزيل من المفضلة");
  };

  // ─── فلترة وترتيب المنتجات بـ useMemo (Doc 1 – أداء أفضل) ───────────────
  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCategoryId)
      list = list.filter(p => p.category_id === activeCategoryId);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
      );
    }

    switch (sortKey) {
      case "price_asc":  list.sort((a, b) => a.price_per_unit - b.price_per_unit); break;
      case "price_desc": list.sort((a, b) => b.price_per_unit - a.price_per_unit); break;
      case "popular":    list.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0)); break;
      case "sale":       list.sort((a, b) => (b.is_on_sale ? 1 : 0) - (a.is_on_sale ? 1 : 0)); break;
    }

    return list;
  }, [products, activeCategoryId, search, sortKey]);

  const activeSort = SORT_OPTIONS.find(o => o.key === sortKey)!;
  const hasActiveFilters = !!(activeCategoryId || search || sortKey !== "default");

  return (
    <div className="min-h-screen bg-background" dir="rtl">

      {/* ── شريط الإعلانات (Doc 1) ── */}
      <AnnouncementBar />

      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-32 pt-4">

        {/* ── الكاروسيل (Doc 1 – أفضل من البانر الثابت) ── */}
        <HeroCarousel />

        {/* ── شريط التوصيل الديناميكي (Doc 2) ── */}
        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs font-bold text-emerald-800">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 animate-bounce text-emerald-600" />
            <span>وقت التوصيل المتوقع:</span>
          </div>
          <span className="rounded-lg bg-white px-2 py-0.5 font-black text-emerald-700 shadow-sm">
            {deliveryTime}
          </span>
        </div>

        {/* ── شبكة الفئات (Doc 1 – مرونة من Supabase) ── */}
        <CategoryGrid
          categories={categories}
          activeId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />

        {/* ── شريط البحث + الترتيب (Doc 1 – أكثر ميزات) ── */}
        <div className="flex gap-2">
          {/* حقل البحث مع زر المسح */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن منتج، عطارة، توابل..."
              className="w-full rounded-2xl border border-border bg-card py-2.5 pe-10 ps-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                aria-label="مسح البحث"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* قائمة الترتيب */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setShowSort(v => !v)}
              className={cn(
                "flex h-full items-center gap-1.5 rounded-2xl border px-3 text-sm font-bold transition-all",
                showSort
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40",
              )}
              aria-label="ترتيب النتائج"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">ترتيب</span>
            </button>

            {showSort && (
              <div className="absolute end-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setShowSort(false); }}
                    className={cn(
                      "flex w-full items-center px-4 py-2.5 text-sm transition-colors",
                      sortKey === opt.key
                        ? "bg-primary/10 font-bold text-primary"
                        : "hover:bg-secondary",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── شارات الفلاتر النشطة مع مسح فردي (Doc 1) ── */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {activeCategoryId && (
              <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {categories.find(c => c.id === activeCategoryId)?.name}
                <button onClick={() => setActiveCategoryId(null)} aria-label="إزالة فلتر الفئة">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {search && (
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-bold">
                "{search}"
                <button onClick={() => setSearch("")} aria-label="مسح البحث">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {sortKey !== "default" && (
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-bold">
                {activeSort.label}
                <button onClick={() => setSortKey("default")} aria-label="إزالة الترتيب">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => { setActiveCategoryId(null); setSearch(""); setSortKey("default"); }}
              className="rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive"
            >
              مسح الكل
            </button>
          </div>
        )}

        {/* ── عداد النتائج مع أيقونة حسب الترتيب (Doc 1) ── */}
        {!loading && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{filtered.length} منتج</span>
            {sortKey === "popular" && (
              <span className="flex items-center gap-1 text-xs font-bold text-orange-500">
                <Flame className="h-3.5 w-3.5" /> الأكثر مبيعاً أولاً
              </span>
            )}
            {sortKey === "sale" && (
              <span className="flex items-center gap-1 text-xs font-bold text-rose-500">
                <Tag className="h-3.5 w-3.5" /> العروض أولاً
              </span>
            )}
          </div>
        )}

        {/* ── شبكة المنتجات ── */}
        {loading ? (
          // Skeleton (Doc 1)
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          // حالة الفراغ (Doc 1)
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card py-16 text-center">
            <div className="text-5xl">🔍</div>
            <p className="font-bold text-foreground">لا توجد منتجات</p>
            <p className="text-sm text-muted-foreground">جرّب تغيير الفلتر أو البحث</p>
            <button
              onClick={() => { setActiveCategoryId(null); setSearch(""); setSortKey("default"); }}
              className="rounded-full border border-primary px-4 py-1.5 text-sm font-bold text-primary hover:bg-primary/10"
            >
              إظهار كل المنتجات
            </button>
          </div>
        ) : (
          // البطاقات المدمجة (Doc 1 Modal + Doc 2 wishlist/badges/discount)
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isWished={!!wishlist[product.id]}
                onToggleWish={e => toggleWish(e, product.id)}
                onOpen={() => setSelectedProduct(product)}
                onAddToCart={e => {
                  e.stopPropagation();
                  addItem(product, product.is_by_weight ? 0.5 : 1);
                  toast.success(`تمت إضافة ${product.name} للسلة 🛒`);
                }}
              />
            ))}
          </div>
        )}

        {/* ── الفوتر (Doc 2) ── */}
        <div className="border-t border-border/60 pb-4 pt-6 text-center">
          <p className="text-sm font-black text-foreground">الوادي الأخضر</p>
          <p className="text-[10px] font-medium text-muted-foreground">
            سوبر ماركت وعطارة ومحمصة · جودة أصيلة وتوصيل سريع
          </p>
          <p className="pt-2 text-[9px] text-muted-foreground/70" dir="ltr">
            © 2026 جميع الحقوق محفوظة.
          </p>
        </div>

      </main>

      {/* ── Modal تفاصيل المنتج (Doc 1) ── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* ── شريط السلة الثابت (Doc 1) ── */}
      <StickyCartBar />
    </div>
  );
}
