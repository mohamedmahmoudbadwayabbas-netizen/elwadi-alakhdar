import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/cart-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  Search, ShoppingBag, Plus, Heart, MapPin, 
  ChevronRight, Flame, Truck 
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

// بيانات الأقسام كما تظهر في صورتك تماماً
const CATEGORIES = [
  { id: "all", name: "الكل", icon: "✨" },
  { id: "poultry", name: "دواجن", icon: "🍗" },
  { id: "meat", name: "لحوم", icon: "🥩" },
  { id: "vegetables", name: "خضار", icon: "🌿" },
  { id: "dairy", name: "ألبان", icon: "🥛" },
  { id: "groceries", name: "بقالة", icon: "🛒" },
];

function HomePage() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // حالة المفضلة المحلية لمزامنة القلوب في الصفحة الرئيسية
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  // قراءة وقت التوصيل المحفوظ من اختيار العميل في صفحة المنتج أو الموقع الجغرافي
  const [savedDeliveryTime, setSavedDeliveryTime] = useState("30 - 45 دقيقة ⚡");

  useEffect(() => {
    // 1. تحميل المفضلة المحلية
    const savedWish: Record<string, boolean> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("wishlist_")) {
        const pId = key.replace("wishlist_", "");
        savedWish[pId] = localStorage.getItem(key) === "true";
      }
    }
    setWishlist(savedWish);

    // 2. قراءة وقت التوصيل المحفوظ ديناميكياً لتخصيص تجربة المستخدم
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

    // 3. جلب المنتجات من Supabase
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("products").select("*");
      if (!error && data) {
        setProducts(data as Product[]);
      }
      setLoading(false);
    })();
  }, []);

  // دالة تبديل حالة القلب وحفظها فورياً في الـ LocalStorage
  const toggleWish = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // منع الانتقال لصفحة المنتج عند الضغط على القلب
    const nextState = !wishlist[id];
    setWishlist(prev => ({ ...prev, [id]: nextState }));
    localStorage.setItem(`wishlist_${id}`, String(nextState));
    if (nextState) toast.success("تمت الإضافة للمفضلة ❤️");
    else toast.info("تمت الإزالة من المفضلة");
  };

  // تصفية وقفل المنتجات بناءً على الفئة المختارة والبحث
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // فرز المنتجات الأكثر مبيعاً (محاكاة بناءً على شارة أو ترتيب معين كالموجود في الصورة)
  const bestSellers = filteredProducts.slice(0, 4);
  const latestProducts = filteredProducts.slice(2, 7);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-12 text-right" dir="rtl">
      
      {/* ─── شريط البحث العلوي والأنيق ─── */}
      <div className="sticky top-0 z-40 bg-[#FAF9F6]/90 p-4 backdrop-blur-md">
        <div className="relative mx-auto max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن منتج، عطارة، توابل..."
            className="w-full rounded-full border border-border bg-white py-3 pe-4 ps-11 text-xs font-bold shadow-sm outline-none focus:border-emerald-600 transition-colors"
          />
          <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-600" />
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 space-y-6">
        
        {/* ─── البانر الإعلاني الكبير (Carousel Ready Container) ─── */}
        <div className="relative overflow-hidden rounded-3xl bg-[#036233] p-5 text-white shadow-lg transition-transform duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between">
            <div className="space-y-2 max-w-[65%]">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                <Truck className="h-3 w-3 text-orange-400" /> أول توصيل سريع
              </span>
              <h2 className="font-display text-2xl font-black tracking-wide">الوادي الأخضر</h2>
              <p className="text-[11px] text-emerald-100 leading-relaxed font-medium">سوبر ماركت وعطارة - جودة، أصالة وتوصيل سريع مباشر لباب بيتك.</p>
              <button 
                onClick={() => setSelectedCategory("all")}
                className="mt-2 rounded-full bg-[#E55300] px-4 py-1.5 text-xs font-black text-white shadow-md hover:bg-orange-600 active:scale-95 transition-all"
              >
                تسوّق الآن
              </button>
            </div>
            {/* أيقونة شاحنة التوصيل الكبيرة الجانبية كمظهر جمالي كالصورة */}
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-white/10 backdrop-blur-sm shadow-inner">
              <Truck className="h-10 w-10 text-emerald-300" />
            </div>
          </div>
        </div>

        {/* التحديث 7: شريط التوصيل الديناميكي المخصص للزبون أسفل البانر */}
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 flex items-center justify-between text-xs font-bold text-emerald-800">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-emerald-600 animate-bounce" />
            <span>التوصيل المتوقع إليك الآن:</span>
          </div>
          <span className="bg-white px-2 py-0.5 rounded-lg text-emerald-700 shadow-sm font-black">{savedDeliveryTime}</span>
        </div>

        {/* ─── التحديث 2 & 6: قسم تسوق حسب القسم التفاعلي ─── */}
        <div className="space-y-2.5">
          <h3 className="text-sm font-black text-slate-800">تسوّق حسب القسم</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none" dir="rtl">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl bg-white border p-3 min-w-[72px] shadow-sm transition-all duration-200",
                  "hover:scale-105 hover:shadow-md active:scale-95",
                  selectedCategory === cat.id ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600" : "border-border/60"
                )}
              >
                <div className="text-2xl">{cat.icon}</div>
                <span className="text-[11px] font-black text-slate-700">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ─── التحديث 1 & 5 & 8: قسم الأكثر مبيعاً ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1">
              🔥 الأكثر مبيعاً
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {bestSellers.map((product) => {
              const isWished = !!wishlist[product.id];
              const hasDiscount = product.old_price && product.old_price > product.price_per_unit;
              const discountPercent = hasDiscount ? Math.round(((product.old_price! - product.price_per_unit) / product.old_price!) * 100) : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => navigate({ to: "/products/$productId", params: { productId: product.id } })}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer"
                >
                  {/* شارات الـ FOMO والخصومات الجاذبة فوق الصورة */}
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

                  {/* زر القلب المرتبط محلياً وثابت دائماً */}
                  <button
                    onClick={(e) => toggleWish(e, product.id)}
                    className="absolute end-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-transform active:scale-125"
                  >
                    <Heart className={cn("h-3.5 w-3.5 transition-colors", isWished ? "fill-red-500 text-red-500" : "text-slate-400")} />
                  </button>

                  {/* صورة المنتج */}
                  <div className="aspect-square w-full bg-slate-50 overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-3xl">🌿</div>
                    )}
                  </div>

                  {/* تفاصيل البطاقة مع التهوية والتنسيق المثالي للخطوط */}
                  <div className="flex flex-1 flex-col p-3 text-right justify-between space-y-1.5">
                    <div className="space-y-0.5">
                      <h4 className="line-clamp-1 text-xs font-black text-slate-800">{product.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {product.is_by_weight ? "وزن تقريبي 500 جرام" : product.unit_label || "1 قطعة"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* السعر الحالي والقديم منظم عمودياً لمنع التكدس */}
                      <div className="flex flex-col">
                        <span className="font-display text-sm font-black text-emerald-600">
                          {product.price_per_unit.toFixed(2)} <span className="text-[9px] font-bold text-slate-400">ج.م</span>
                        </span>
                        {hasDiscount && (
                          <span className="text-[10px] text-slate-400 line-through font-bold">
                            {product.old_price!.toFixed(2)} ج.م
                          </span>
                        )}
                      </div>

                      {/* زر الإضافة السريع الدائري الأخضر التفاعلي النابض عند اللمس */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addItem(product, product.is_by_weight ? 0.5 : 1);
                          toast.success(`تمت إضافة ${product.name} للسلة 🛒`);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#036233] text-white shadow-sm hover:bg-emerald-700 active:scale-90 transition-transform"
                      >
                        <Plus className="h-4 w-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── قسم أحدث المنتجات ─── */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-black text-slate-800">أحدث المنتجات</h3>
          <div className="grid grid-cols-2 gap-3">
            {latestProducts.map((product) => {
              const isWished = !!wishlist[product.id];
              return (
                <div
                  key={product.id}
                  onClick={() => navigate({ to: "/products/$productId", params: { productId: product.id } })}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm transition-all hover:shadow-md cursor-pointer"
                >
                  <div className="absolute start-2 top-2 z-10">
                    <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
                      جديد الآن
                    </span>
                  </div>
                  <button
                    onClick={(e) => toggleWish(e, product.id)}
                    className="absolute end-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/80 shadow-sm"
                  >
                    <Heart className={cn("h-3.5 w-3.5", isWished ? "fill-red-500 text-red-500" : "text-slate-400")} />
                  </button>

                  <div className="aspect-square w-full bg-slate-50">
                    {product.image_url ? <img src={product.image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-3xl">🌿</div>}
                  </div>

                  <div className="flex flex-1 flex-col p-3 justify-between space-y-1.5">
                    <div className="space-y-0.5">
                      <h4 className="line-clamp-1 text-xs font-black text-slate-800">{product.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold">{product.unit_label || "1 عبوة"}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-display text-sm font-black text-emerald-600">{product.price_per_unit.toFixed(2)} ج.م</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addItem(product, 1);
                          toast.success("أضيف للسلة 🛒");
                        }}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#036233] text-white shadow-sm hover:bg-emerald-700 active:scale-90 transition-all"
                      >
                        <Plus className="h-4 w-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── الفوتر الأنيق المماثل للصورة ─── */}
        <div className="border-t border-slate-200/60 pt-6 pb-4 text-center space-y-1">
          <div className="text-sm font-black text-slate-700">الوادي الأخضر</div>
          <div className="text-[10px] text-slate-400 font-medium">سوبر ماركت وعطارة ومحمصة - جودة أصيلة وتوصيل سريع</div>
          <div className="text-[9px] text-slate-400/80 pt-2" dir="ltr">© 2026 جميع الحقوق محفوظة.</div>
        </div>

      </div>
    </div>
  );
}
