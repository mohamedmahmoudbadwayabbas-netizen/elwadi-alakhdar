import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, lineSubtotal } from "@/lib/cart-context";
import type { Product } from "@/lib/cart-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ProductCard";
import {
  Minus, Plus, ShoppingBag, Star, Send, Flame, Award,
  Package, ChevronLeft, Heart, Share2, Truck, ShieldCheck,
  RotateCcw, ZoomIn, ChevronRight, X, MapPin, Navigation
} from "lucide-react";

// ─── الأنواع ───────────────────────────────────────────────────────────────────
type Review = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
  verified?: boolean;
};

// 📍 إحداثيات موقع متجرك الثابت (قم بتغييرها لتطابق موقع السوبرماركت الفعلي)
const STORE_LAT = 30.0444; 
const STORE_LNG = 31.2357;

// مناطق التوصيل اليدوية الافتراضية
const DELIVERY_ZONES = [
  { id: "near", name: "المناطق المجاورة (حتى 5 كم)", time: "30 - 45 دقيقة ⚡", minPrice: 15 },
  { id: "medium", name: "مناطق وسط المدينة (5 - 15 كم)", time: "60 - 90 دقيقة 🚗", minPrice: 30 },
  { id: "far", name: "أطراف المدينة والمناطق البعيدة (+15 كم)", time: "2 - 3 ساعات 🚚", minPrice: 50 },
];

const WEIGHT_PRESETS = [0.25, 0.5, 1, 2];

export const Route = createFileRoute("/products/$productId")({
  component: ProductPage,
});

// دالة ذكية لحساب المسافة الجغرافية بين نقطتين بالكيلومتر (Haversine Formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // المسافة بالكيلومتر
}

// ─── مكوّن النجوم ──────────────────────────────────────────────────────────────
function Stars({ value, max = 5, interactive = false, size = "md", onChange }: {
  value: number; max?: number; interactive?: boolean;
  size?: "sm" | "md" | "lg"; onChange?: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: max }).map((_, i) => {
        const filled = interactive ? (hovered || value) > i : value > i;
        return (
          <Star key={i}
            className={cn(sz, "transition-all duration-150",
              filled ? "fill-amber-400 text-amber-400" : "fill-muted text-muted",
              interactive && "cursor-pointer hover:scale-125")}
            onClick={() => interactive && onChange?.(i + 1)}
            onMouseEnter={() => interactive && setHovered(i + 1)}
            onMouseLeave={() => interactive && setHovered(0)}
          />
        );
      })}
    </div>
  );
}

// ─── Skeleton شاشة التحميل ─────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <div className="h-5 w-32 animate-pulse rounded-full bg-secondary" />
        <div className="aspect-square w-full animate-pulse rounded-3xl bg-secondary" />
      </div>
    </div>
  );
}

// ─── ملخص التقييمات ───────────────────────────────────────────────────────────
function RatingSummary({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const counts = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100),
  }));

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-base font-bold">ملخص التقييمات</h3>
      <div className="flex gap-6">
        <div className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
          <div className="font-display text-5xl font-black text-primary">{avg.toFixed(1)}</div>
          <Stars value={avg} size="sm" />
          <div className="text-xs text-muted-foreground">{reviews.length} تقييم</div>
        </div>
        <div className="flex-1 space-y-1.5">
          {counts.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="min-w-[12px] text-xs text-muted-foreground">{star}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <span className="min-w-[24px] text-xs text-muted-foreground text-end">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── الصفحة الرئيسية للمنتج ────────────────────────────────────────────────────
function ProductPage() {
  const { productId } = Route.useParams();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  
  // حفظ حالة المفضلة
  const [wished, setWished] = useState(() => {
    return localStorage.getItem(`wishlist_${productId}`) === "true";
  });

  // 🔀 دمج الميزتين: تتبع المسافة الحالية والتوصيل المتوقع ونوع الحساب
  const [deliveryMethod, setDeliveryMethod] = useState<"manual" | "gps">(() => {
    return (localStorage.getItem("delivery_method") as "manual" | "gps") || "manual";
  });
  const [selectedZone, setSelectedZone] = useState(() => {
    return localStorage.getItem("user_delivery_zone") || "near";
  });
  const [calculatedDistanceKM, setCalculatedDistanceKM] = useState<number | null>(() => {
    const saved = localStorage.getItem("calculated_distance");
    return saved ? parseFloat(saved) : null;
  });
  const [isDetecting, setIsDetecting] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addBtnRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  // تفعيل/إلغاء المفضلة
  const toggleWishlist = () => {
    const nextState = !wished;
    setWished(nextState);
    localStorage.setItem(`wishlist_${productId}`, String(nextState));
    if (nextState) toast.success("تمت الإضافة للمفضلة ❤️");
    else toast.info("تمت الإزالة من المفضلة");
  };

  // تغيير المنطقة يدوياً
  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId);
    setDeliveryMethod("manual");
    localStorage.setItem("delivery_method", "manual");
    localStorage.setItem("user_delivery_zone", zoneId);
    toast.success("تم تحديث وقت التوصيل حسب المنطقة المختارة يدوياً");
  };

  // 🌐 تحديد الموقع تلقائياً عبر نظام الخرائط والـ GPS لحساب المسافة الحقيقية
  const handleGPSDetection = () => {
    if (!navigator.geolocation) {
      toast.error("متصفحك لا يدعم خاصية تحديد الموقع الجغرافي");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // حساب المسافة الدقيقة بين المتجر والزبون بالـ KM
        const distance = calculateDistance(STORE_LAT, STORE_LNG, userLat, userLng);
        
        setCalculatedDistanceKM(distance);
        setDeliveryMethod("gps");
        setIsDetecting(false);

        localStorage.setItem("delivery_method", "gps");
        localStorage.setItem("calculated_distance", distance.toString());
        toast.success(`تم تحديد موقعك بنجاح! المسافة للمتجر: ${distance.toFixed(1)} كم`);
      },
      (error) => {
        setIsDetecting(false);
        toast.error("فشل الحصول على موقعك، يرجى تفعيل الـ GPS أو الاختيار يدوياً");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // دالة ديناميكية لترجمة المسافة الحقيقية إلى وقت شحن دقيق ومتغير في كل مرة
  const getDynamicDeliveryTime = () => {
    if (deliveryMethod === "gps" && calculatedDistanceKM !== null) {
      const distance = calculatedDistanceKM;
      if (distance <= 3) return "20 - 30 دقيقة ⚡ (قريب جداً)";
      if (distance <= 7) return "40 - 50 دقيقة 🚗";
      if (distance <= 15) return "60 - 80 دقيقة 🏎️";
      if (distance <= 30) return "90 - 120 دقيقة 🚚";
      return "توصيل شحن خاص (خارج نطاقنا السريع)";
    }
    // في حال الاختيار اليدوي
    return DELIVERY_ZONES.find(z => z.id === selectedZone)?.time || "30 - 45 دقيقة ⚡";
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), { threshold: 0 });
    if (addBtnRef.current) observer.observe(addBtnRef.current);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      const [{ data: prod }, { data: revs }] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false }),
      ]);
      if (!isMounted) return;

      if (prod) {
        const p = prod as Product;
        setProduct(p);
        setQty(p.is_by_weight ? 0.5 : 1);
        setImages(p.image_url ? [p.image_url] : []);
        if (p.category_id) {
          const { data: sim } = await supabase.from("products").select("*").eq("category_id", p.category_id).neq("id", productId).limit(6);
          if (isMounted) setSimilar((sim ?? []) as Product[]);
        }
      }
      if (isMounted) { setReviews((revs ?? []) as Review[]); setLoading(false); }
    })();
    return () => { isMounted = false; };
  }, [productId]);

  if (loading) return <Skeleton />;
  if (!product) return <div className="text-center py-20">المنتج غير موجود</div>;

  const outOfStock = (product.stock_quantity ?? 1) <= 0;
  const step = product.is_by_weight ? 0.25 : 1;
  const min = product.is_by_weight ? 0.25 : 1;
  const totalCost = lineSubtotal(product, qty).toFixed(2);

  async function submitReview() {
    if (!authorName.trim() || !comment.trim()) { toast.error("يرجى تعبئة الحقول"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("reviews").insert({ product_id: productId, author_name: authorName.trim(), rating, comment: comment.trim() }).select().single();
    setSubmitting(false);
    if (error) return;
    setReviews((prev) => [data as Review, ...prev]);
    setAuthorName(""); setComment("");
    toast.success("تمت إضافة تقييمك بنجاح");
  }

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      
      {/* ─── شريط التنقل العلوي ─── */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-sm text-muted-foreground flex items-center gap-1"><ChevronLeft className="h-4 w-4" />المتجر</Link>
          <span className="line-clamp-1 text-sm font-bold flex-1 text-center">{product.name}</span>
          <div className="flex items-center gap-2">
            <button onClick={toggleWishlist} className="grid h-8 w-8 place-items-center rounded-full bg-secondary/40">
              <Heart className={cn("h-4 w-4 transition-all", wished ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground")} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-5">
        
        {/* ─── معرض الصور ─── */}
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-secondary shadow-sm">
          {images.length > 0 ? <img src={images[activeImg]} className="h-full w-full object-cover" alt="" /> : <div className="grid h-full w-full place-items-center text-6xl">🌿</div>}
        </div>

        {/* ─── تفاصيل السعر والمخزون ─── */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <div className="font-display text-4xl font-black text-primary">{totalCost} <span className="text-base font-bold text-muted-foreground">ج.م</span></div>
          
          {/* تأثير الـ FOMO */}
          {!outOfStock && product.stock_quantity && product.stock_quantity <= 5 && (
            <div className="rounded-xl bg-orange-500/10 p-2.5 border border-orange-500/20 text-center animate-pulse">
              <p className="text-xs font-bold text-orange-600">⚠️ متبقي {product.stock_quantity} قطع فقط! اطلب قبل نفاذ الكمية.</p>
            </div>
          )}
        </div>

        {/* ─── ميزات الخدمة وحساب وقت التوصيل الديناميكي المدمج ─── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-3 text-center shadow-sm">
            <Truck className="h-5 w-5 text-primary" />
            <div className="text-[11px] font-bold">وقت التوصيل</div>
            <div className="text-[10px] text-primary font-black">{getDynamicDeliveryTime()}</div>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-3 text-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div className="text-[11px] font-bold">جودة مضمونة</div>
            <div className="text-[10px] text-muted-foreground">100% طازج</div>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-3 text-center shadow-sm">
            <RotateCcw className="h-5 w-5 text-primary" />
            <div className="text-[11px] font-bold">إرجاع سهل</div>
            <div className="text-[10px] text-muted-foreground">خلال 24 ساعة</div>
          </div>
        </div>

        {/* 🛠️ صندوق أدوات دمج (جوجل مابس التلقائي + الاختيار اليدوي للمناطق) */}
        <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>حساب وقت التوصيل الدقيق والمسافة</span>
            </div>
            {deliveryMethod === "gps" && calculatedDistanceKM !== null && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                موقعك نشط: {calculatedDistanceKM.toFixed(1)} كم
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {/* زر تحديد الموقع الجغرافي الخرائطي الذكي */}
            <Button 
              type="button"
              variant={deliveryMethod === "gps" ? "default" : "outline"}
              onClick={handleGPSDetection}
              disabled={isDetecting}
              className="flex-1 h-10 rounded-xl text-xs font-bold gap-1"
            >
              <Navigation className={cn("h-3.5 w-3.5", isDetecting && "animate-spin")} />
              {isDetecting ? "جاري القراءة للخرائط..." : "تحديد موقعي التلقائي (GPS)"}
            </Button>

            {/* الخيار اليدوي البديل في حال تعطل الـ GPS */}
            <select
              value={deliveryMethod === "manual" ? selectedZone : ""}
              onChange={(e) => handleZoneChange(e.target.value)}
              className="flex-1 rounded-xl border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary text-muted-foreground"
            >
              <option value="" disabled>-- أو اختر منطقتك يدوياً --</option>
              {DELIVERY_ZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── أوزان وكميات الشراء ─── */}
        {product.is_by_weight && (
          <div className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="mb-2 text-xs font-bold">اختر الوزن المطلـوب:</div>
            <div className="grid grid-cols-4 gap-2">
              {WEIGHT_PRESETS.map((w) => (
                <button key={w} onClick={() => setQty(w)} className={cn("rounded-xl border py-2.5 text-xs font-bold", qty === w ? "border-primary bg-primary text-primary-foreground" : "bg-secondary/30")}>
                  {w >= 1 ? `${w} كجم` : `${w * 1000} جم`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── زر إضافة السلة الرئيسي ─── */}
        <div ref={addBtnRef} className="rounded-2xl border bg-card p-4 shadow-sm flex items-center justify-between gap-4">
          {!product.is_by_weight && (
            <div className="flex items-center gap-1 rounded-full border bg-secondary/30 p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQty(q => Math.max(min, +(q - step).toFixed(3)))}><Minus className="h-3 w-3" /></Button>
              <span className="min-w-10 text-center text-sm font-black">{qty}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setQty(q => +(q + step).toFixed(3))}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
          <Button disabled={outOfStock} onClick={() => { addItem(product, qty); toast.success("تمت الإضافة للسلة 🛒"); }} className="flex-1 h-11 rounded-xl hero-gradient font-bold text-xs">
            <ShoppingBag className="me-2 h-4 w-4" /> {outOfStock ? "نفدت الكمية" : "أضف إلى السلة"}
          </Button>
        </div>

        {/* ─── نموذج التعليقات والآراء ─── */}
        <div className="space-y-4 pt-2">
          <RatingSummary reviews={reviews} />
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold">شاركنا رأيك بالمنتج</h3>
            <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="الاسم" className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary" />
            <Stars value={rating} interactive={true} size="lg" onChange={setRating} />
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="اكتب تجربتك هنا..." rows={2} className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary resize-none" />
            <Button onClick={submitReview} disabled={submitting} className="w-full h-9 rounded-xl font-bold text-xs">{submitting ? "جاري الإرسال..." : "إرسال التقييم"}</Button>
          </div>
        </div>

        {/* ─── منتجات قد تعجبك ─── */}
        {similar.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-bold px-1">منتجات قد تعجبك</h3>
            <div className="grid grid-cols-2 gap-4">
              {similar.map((prod) => (
                <ProductCard key={prod.id} product={prod} onOpen={(p) => navigate({ to: "/products/$productId", params: { productId: p.id } })} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ─── الـ Sticky Bar السفلي السريع ─── */}
      {showSticky && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 p-3 backdrop-blur-md shadow-md">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div>
              <div className="text-[10px] text-muted-foreground font-bold truncate max-w-[150px]">{product.name}</div>
              <div className="font-display text-base font-black text-primary">{totalCost} ج.م</div>
            </div>
            <Button disabled={outOfStock} onClick={() => { addItem(product, qty); toast.success("تمت الإضافة للسلة"); }} className="h-10 rounded-xl hero-gradient font-bold text-xs px-5">
              إضافة سريعة ({qty})
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
