import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-context";
import { useSettings } from "@/lib/settings-context";
import { useAuth } from "@/lib/auth-context";
import { useSearch } from "@/lib/search-context";
import type { Product } from "@/lib/cart-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus, Heart, MapPin, Truck, Sparkles, SearchX, PackageOpen,
} from "lucide-react";
import { HomePageSkeleton } from "@/components/storefront/Skeletons";
import { EmptyState } from "@/components/storefront/EmptyState";
import { flyToCart } from "@/lib/fly-to-cart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "الوادي الأخضر — سوبر ماركت أونلاين وتوصيل سريع" },
      {
        name: "description",
        content:
          "تسوّق البقالة واللحوم والدواجن والعطارة من الوادي الأخضر بأسعار مناسبة مع توصيل سريع لباب بيتك.",
      },
      { property: "og:title", content: "الوادي الأخضر — سوبر ماركت أونلاين وتوصيل سريع" },
      {
        property: "og:description",
        content: "تسوّق البقالة واللحوم والدواجن والعطارة من الوادي الأخضر بأسعار مناسبة مع توصيل سريع لباب بيتك.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type Category = { id: string; name: string; slug: string; icon: string | null; sort_order: number };

// نجيب بس الأعمدة المستخدمة فعلياً في الصفحة، وبحد أقصى معقول —
// الصفحة أصلاً بتعرض 9 منتجات كحد أقصى، فمفيش داعي نجيب كل الكتالوج في كل زيارة.
const HOME_PRODUCT_COLUMNS =
  "id,name,price_per_unit,old_price,image_url,category_id,unit_label,is_by_weight,stock_quantity";
const HOME_PRODUCTS_LIMIT = 120;

function HomePage() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const settings = useSettings();
  const { user } = useAuth();
  const { query: searchQuery } = useSearch();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [wishlist, setWishlist] = useState<Record<string, string>>({});
  const [savedDeliveryTime, setSavedDeliveryTime] = useState("30 - 45 دقيقة ⚡");

  useEffect(() => {
    const method = localStorage.getItem("delivery_method");
    if (method === "gps") {
      const dist = parseFloat(localStorage.getItem("calculated_distance") || "0");
      if (dist <= 3) setSavedDeliveryTime("20 - 30 دقيقة ⚡ (قريب منك)");
      else if (dist <= 7) setSavedDeliveryTime("40 - 50 دقيقة 🚗");
      else if (dist <= 15) setSavedDeliveryTime("60 - 80 دقيقة 🏎️");
      else setSavedDeliveryTime("90 - 120 دقيقة 🚚");
    } else {
      const zone = localStorage.getItem("user_delivery_zone");
      if (zone === "medium") setSavedDeliveryTime("60 - 90 دقيقة 🚗");
      if (zone === "far") setSavedDeliveryTime("2 - 3 ساعات 🚚");
    }

    const loadAll = async () => {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        supabase
          .from("products")
          .select(HOME_PRODUCT_COLUMNS)
          .order("created_at", { ascending: false })
          .limit(HOME_PRODUCTS_LIMIT),
        supabase.from("categories").select("id,name,slug,icon,sort_order").order("sort_order", { ascending: true }),
      ]);
      setProducts((prods ?? []) as Product[]);
      setCategories((cats ?? []) as Category[]);
      setLoading(false);
    };
    loadAll();

    const channel = supabase
      .channel("storefront-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "flash_offers" }, loadAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!user) { setWishlist({}); return; }
    (async () => {
      const { data } = await supabase.from("wishlists").select("id,product_id").eq("user_id", user.id);
      const map: Record<string, string> = {};
      for (const w of data ?? []) map[w.product_id] = w.id;
      setWishlist(map);
    })();
  }, [user]);

  const toggleWish = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!user) {
      toast.error("سجّل الدخول لإضافة المنتج للمفضلة");
      navigate({ to: "/auth" });
      return;
    }
    const existing = wishlist[productId];
    if (existing) {
      const { error } = await supabase.from("wishlists").delete().eq("id", existing);
      if (error) return toast.error(error.message);
      setWishlist((p) => { const c = { ...p }; delete c[productId]; return c; });
      toast.info("تمت الإزالة من المفضلة");
    } else {
      const { data, error } = await supabase
        .from("wishlists").insert({ user_id: user.id, product_id: productId }).select("id").single();
      if (error) return toast.error(error.message);
      setWishlist((p) => ({ ...p, [productId]: data!.id }));
      toast.success("تمت الإضافة للمفضلة ❤️");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const bestSellers = filteredProducts.slice(0, 4);
  const latestProducts = filteredProducts.slice(4, 9);

  if (loading) return <HomePageSkeleton />;

  return (
    <div className="min-h-screen bg-background pb-14 text-right" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 space-y-8">
        {/* ─── البانر الإعلاني الكبير — يفضل بلون الهوية ثابت في اللايت والدارك ─── */}
        <div
          className="relative overflow-hidden rounded-3xl bg-[#036233] p-5 text-white shadow-lg transition-transform duration-300 hover:shadow-xl"
          style={
            settings.hero_bg_image
              ? {
                  backgroundImage: `linear-gradient(135deg, rgba(3,98,51,0.85), rgba(3,98,51,0.6)), url(${settings.hero_bg_image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2 max-w-[65%]">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                <Truck className="h-3 w-3 text-orange-400" /> أول توصيل سريع
              </span>
              <h2 className="font-display text-2xl font-black tracking-wide">{settings.hero_title || settings.site_name}</h2>
              <p className="text-[11px] text-emerald-100 leading-relaxed font-medium">{settings.hero_subtitle || "سوبر ماركت وعطارة - جودة، أصالة وتوصيل سريع مباشر لباب بيتك."}</p>
              <button
                onClick={() => setSelectedCategory("all")}
                className="mt-2 rounded-full bg-[#E55300] px-4 py-1.5 text-xs font-black text-white shadow-md hover:bg-orange-600 active:scale-95 transition-all"
              >
                {settings.hero_cta_text || "تسوّق الآن"}
              </button>
            </div>
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm shadow-inner">
              {settings.floating_element_image ? (
                <img
                  src={settings.floating_element_image}
                  alt=""
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Truck className="h-10 w-10 text-emerald-300" />
              )}
            </div>
          </div>
        </div>

        {/* شريط التوصيل الديناميكي */}
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-bounce" />
            <span>التوصيل المتوقع إليك الآن:</span>
          </div>
          <span className="bg-card px-2 py-0.5 rounded-lg text-emerald-700 dark:text-emerald-300 shadow-sm font-black">{savedDeliveryTime}</span>
        </div>

        {/* تسوّق حسب القسم */}
        <div className="space-y-3">
          <h3 className="text-base font-medium text-primary">تسوّق حسب القسم</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" dir="rtl">
            {[{ id: "all", name: "الكل", icon: "✨" }, ...categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))].map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-3 min-w-[80px] transition-all duration-200",
                    "hover:shadow-sm active:scale-95",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border/60 bg-card",
                  )}
                >
                  <div className={cn(
                    "grid h-11 w-11 place-items-center rounded-xl text-xl transition-colors",
                    isActive ? "bg-primary text-white" : "bg-secondary text-primary",
                  )}>
                    {cat.icon ? <span aria-hidden>{cat.icon}</span> : <Sparkles className="h-5 w-5" strokeWidth={1.5} />}
                  </div>
                  <span className="text-xs font-normal text-foreground">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fade wrapper — keyed by category, transitions smoothly on switch */}
        <div key={selectedCategory + searchQuery} className="motion-safe:animate-fade-in space-y-8">
          {filteredProducts.length === 0 && (
            <EmptyState
              icon={searchQuery ? <SearchX className="h-8 w-8" /> : <PackageOpen className="h-8 w-8" />}
              title={searchQuery ? "لا توجد نتائج" : "لا توجد منتجات في هذا القسم بعد"}
              description={
                searchQuery
                  ? `لم نجد منتجات تطابق "${searchQuery}" — جرّب كلمة أخرى أو تصفّح الأقسام.`
                  : "قريباً هنضيف منتجات جديدة في هذا القسم. جرّب قسم آخر مؤقتاً 🌿"
              }
              action={
                <button
                  onClick={() => { setSelectedCategory("all"); }}
                  className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90"
                >
                  تصفّح كل المنتجات
                </button>
              }
            />
          )}

          {/* الأكثر مبيعاً */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-primary flex items-center gap-1">
                🔥 الأكثر مبيعاً
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {bestSellers.map((product, i) => {
                const isWished = !!wishlist[product.id];
                const hasDiscount = product.old_price && product.old_price > product.price_per_unit;
                const discountPercent = hasDiscount ? Math.round(((product.old_price! - product.price_per_unit) / product.old_price!) * 100) : 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate({ to: "/products/$productId", params: { productId: product.id } })}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
                  >
                    <div className="absolute start-2 top-2 z-10 flex flex-col gap-1">
                      <span className="rounded-md bg-[#E55300] px-1.5 py-0.5 text-[9px] font-black text-white flex items-center gap-0.5 shadow-sm">
                        🔥 الأكثر مبيعاً
                      </span>
                      {hasDiscount && (
                        <span className="w-fit rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm animate-pulse">
                          خصم {discountPercent}%
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => toggleWish(e, product.id)}
                      className="absolute end-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-card/80 backdrop-blur-sm shadow-sm transition-transform active:scale-125"
                    >
                      <Heart className={cn("h-3.5 w-3.5 transition-colors", isWished ? "fill-red-500 text-red-500" : "text-slate-400")} />
                    </button>
                    <div className="aspect-square w-full bg-secondary overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading={i === 0 ? "eager" : "lazy"}
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-3xl">🌿</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3 text-right justify-between space-y-1.5">
                      <div className="space-y-0.5">
                        <h4 className="line-clamp-1 text-sm font-normal text-foreground">{product.name}</h4>
                        <p className="text-[11px] text-muted-foreground font-light">
                          {product.is_by_weight ? "وزن تقريبي 500 جرام" : product.unit_label || "1 قطعة"}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-primary">
                            {product.price_per_unit.toFixed(2)} <span className="text-[10px] font-light text-muted-foreground">ج.م</span>
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-muted-foreground line-through font-light">
                              {product.old_price!.toFixed(2)} ج.م
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem(product, product.is_by_weight ? 0.5 : 1);
                            const card = e.currentTarget.closest(".group") as HTMLElement | null;
                            flyToCart(card?.querySelector("img") ?? null);
                            toast.success(`تمت إضافة ${product.name} للسلة 🛒`);
                          }}
                          className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground shadow-sm hover:opacity-90 active:scale-90 transition-transform"
                          aria-label="أضف للسلة"
                        >
                          <Plus className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* أحدث المنتجات */}
          <div className="space-y-4 pt-2">
            <h3 className="text-base font-medium text-primary">أحدث المنتجات</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {latestProducts.map((product) => {
                const isWished = !!wishlist[product.id];
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate({ to: "/products/$productId", params: { productId: product.id } })}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:shadow-md cursor-pointer"
                  >
                    <div className="absolute start-2 top-2 z-10">
                      <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-normal text-white shadow-sm">
                        جديد
                      </span>
                    </div>
                    <button
                      onClick={(e) => toggleWish(e, product.id)}
                      className="absolute end-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-card/80 shadow-sm"
                      aria-label="المفضلة"
                    >
                      <Heart className={cn("h-3.5 w-3.5", isWished ? "fill-accent text-accent" : "text-muted-foreground")} strokeWidth={1.5} />
                    </button>
                    <div className="aspect-square w-full bg-secondary">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-3xl">🌿</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3 justify-between space-y-1.5">
                      <div className="space-y-0.5">
                        <h4 className="line-clamp-1 text-sm font-normal text-foreground">{product.name}</h4>
                        <p className="text-[11px] text-muted-foreground font-light">{product.unit_label || "1 عبوة"}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm font-medium text-primary">{product.price_per_unit.toFixed(2)} <span className="text-[10px] font-light text-muted-foreground">ج.م</span></span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem(product, 1);
                            const card = e.currentTarget.closest(".group") as HTMLElement | null;
                            flyToCart(card?.querySelector("img") ?? null);
                            toast.success("أضيف للسلة 🛒");
                          }}
                          className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground shadow-sm hover:opacity-90 active:scale-90 transition-all"
                          aria-label="أضف للسلة"
                        >
                          <Plus className="h-4 w-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>{/* /fade wrapper */}

        {/* الفوتر */}
        <div className="border-t border-border pt-6 pb-4 text-center space-y-1">
          <div className="text-sm font-black text-foreground">الوادي الأخضر</div>
          <div className="text-[10px] text-muted-foreground font-medium">سوبر ماركت وعطارة ومحمصة - جودة أصيلة وتوصيل سريع</div>
          <div className="text-[9px] text-muted-foreground/80 pt-2" dir="ltr">© 2026 جميع الحقوق محفوظة.</div>
        </div>
      </div>
    </div>
  );
}
