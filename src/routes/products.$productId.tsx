import { SITE_URL } from "@/lib/brand";
import { NumberInput } from "@/components/ui/number-input";
import { WeightSelector } from "@/components/storefront/WeightSelector";
import { formatWeightLabel, calculateEstimatedPrice } from "@/lib/cart-context";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, lineSubtotal } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import type { Product } from "@/lib/cart-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Send,
  Flame,
  Award,
  Package,
  ChevronLeft,
  Heart,
  Share2,
  Truck,
  ShieldCheck,
  RotateCcw,
  ZoomIn,
  ChevronRight,
  X,
  MapPin,
  Navigation,
  Clock,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  Zap,
  Leaf,
  Thermometer,
  Globe,
  Utensils,
  ThumbsUp,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { ProductPageSkeleton } from "@/components/storefront/Skeletons";
import { ProductStatsAndTip } from "@/components/storefront/ProductStatsAndTip";
import { extractProductDetails } from "@/lib/product-metadata";
import { flyToCart } from "@/lib/fly-to-cart";
import { motion, AnimatePresence } from "motion/react";
import { useStoreProduct, useStoreProducts } from "@/lib/store-data-hooks";
import { StoreGoogleMapsWidget } from "@/components/storefront/StoreGoogleMapsWidget";

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
  {
    id: "far",
    name: "أطراف المدينة والمناطق البعيدة (+15 كم)",
    time: "2 - 3 ساعات 🚚",
    minPrice: 50,
  },
];

const WEIGHT_PRESETS = [0.25, 0.5, 1, 2];

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("products")
      .select("name,description,image_url,price_per_unit")
      .eq("id", params.productId)
      .maybeSingle();
    return { seo: data ?? null };
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/products/${params.productId}`;
    const p = loaderData?.seo;
    const name = p?.name ?? "منتج";
    const title = `${name} — سوبرماركت الوادي الأخضر`.slice(0, 60);
    const description = (
      p?.description?.trim() ||
      `اشترِ ${name} طازجًا من سوبرماركت الوادي الأخضر بأفضل سعر مع توصيل سريع لباب بيتك.`
    ).slice(0, 158);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(p?.image_url?.startsWith("https://")
          ? [
              { property: "og:image", content: p.image_url },
              { name: "twitter:image", content: p.image_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                name: p.name,
                description,
                ...(p.image_url ? { image: p.image_url } : {}),
                offers: {
                  "@type": "Offer",
                  price: p.price_per_unit,
                  priceCurrency: "EGP",
                  availability: "https://schema.org/InStock",
                  url,
                },
              }),
            },
          ]
        : [],
    };
  },
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
function Stars({
  value,
  max = 5,
  interactive = false,
  size = "md",
  onChange,
}: {
  value: number;
  max?: number;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: max }).map((_, i) => {
        const filled = interactive ? (hovered || value) > i : value > i;
        return (
          <Star
            key={i}
            className={cn(
              sz,
              "transition-all duration-150",
              filled ? "fill-amber-400 text-amber-400" : "fill-muted text-muted",
              interactive && "cursor-pointer hover:scale-125",
            )}
            onClick={() => interactive && onChange?.(i + 1)}
            onMouseEnter={() => interactive && setHovered(i + 1)}
            onMouseLeave={() => interactive && setHovered(0)}
          />
        );
      })}
    </div>
  );
}

// ─── ملخص التقييمات ───────────────────────────────────────────────────────────
function RatingSummary({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct: Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100),
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
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
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
  const { user } = useAuth();
  const navigate = useNavigate();

  // Instant cached query
  const { data: cachedProduct, isLoading: isProdLoading } = useStoreProduct(productId);
  const { data: allStoreProducts } = useStoreProducts();

  const initialProd =
    cachedProduct ??
    (allStoreProducts?.find((p) => p.id === productId) || null);

  const [product, setProduct] = useState<Product | null>(initialProd);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(() => (initialProd?.is_by_weight ? 0.5 : 1));
  const [images, setImages] = useState<string[]>(() =>
    initialProd?.image_url ? [initialProd.image_url] : [],
  );

  // Sync cached product instantly
  useEffect(() => {
    if (cachedProduct) {
      setProduct(cachedProduct);
      setQty(cachedProduct.is_by_weight ? 0.5 : 1);
      setImages(cachedProduct.image_url ? [cachedProduct.image_url] : []);
      setLoading(false);

      if (allStoreProducts && cachedProduct.category_id) {
        const simList = allStoreProducts
          .filter((p) => p.category_id === cachedProduct.category_id && p.id !== productId)
          .slice(0, 6);
        setSimilar(simList);
      }
    }
  }, [cachedProduct, allStoreProducts, productId]);

  // المفضلة عبر قاعدة البيانات
  const [wishlistRowId, setWishlistRowId] = useState<string | null>(null);
  const wished = !!wishlistRowId;

  // 🔀 دمج الميزتين: تتبع المسافة الحالية والتوصيل المتوقع ونوع الحساب
  const [deliveryMethod, setDeliveryMethod] = useState<"manual" | "gps">("manual");
  const [selectedZone, setSelectedZone] = useState("near");
  const [calculatedDistanceKM, setCalculatedDistanceKM] = useState<number | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    try {
      const savedMethod = localStorage.getItem("delivery_method") as "manual" | "gps";
      if (savedMethod === "manual" || savedMethod === "gps") setDeliveryMethod(savedMethod);
      const savedZone = localStorage.getItem("user_delivery_zone");
      if (savedZone) setSelectedZone(savedZone);
      const savedDist = localStorage.getItem("calculated_distance");
      if (savedDist) setCalculatedDistanceKM(parseFloat(savedDist));
    } catch {}
  }, []);

  const [activeImg, setActiveImg] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "nutrition">("desc");
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);

  // العد التنازلي للتوصيل اليومي السريع
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 2,
    minutes: 45,
    seconds: 0,
  });

  const addBtnRef = useRef<HTMLDivElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  // حاسبة العد التنازلي للتسليم اليومي
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 3, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: product?.name || "منتج متميز",
      text: `تسوق ${product?.name} بسعر رائع من متجرنا!`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // تم إلغاء المشاركة بواسطة المستخدم
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("تم نسخ رابط المنتج إلى الحافظة 📋");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // تحميل المفضلة من قاعدة البيانات للمستخدم المسجل
  useEffect(() => {
    if (!user) {
      setWishlistRowId(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      setWishlistRowId(data?.id ?? null);
    })();
  }, [user, productId]);

  // تفعيل/إلغاء المفضلة (مرتبطة بحساب المستخدم)
  const toggleWishlist = async () => {
    if (!user) {
      toast.error("سجّل الدخول لإضافة المنتج للمفضلة");
      navigate({ to: "/auth", search: { next: undefined } });
      return;
    }
    if (wishlistRowId) {
      const { error } = await supabase.from("wishlists").delete().eq("id", wishlistRowId);
      if (error) return toast.error(error.message);
      setWishlistRowId(null);
      toast.info("تمت الإزالة من المفضلة");
    } else {
      const { data, error } = await supabase
        .from("wishlists")
        .insert({ user_id: user.id, product_id: productId })
        .select("id")
        .single();
      if (error) return toast.error(error.message);
      setWishlistRowId(data!.id);
      toast.success("تمت الإضافة للمفضلة ❤️");
    }
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
      { enableHighAccuracy: true, timeout: 10000 },
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
    return DELIVERY_ZONES.find((z) => z.id === selectedZone)?.time || "30 - 45 دقيقة ⚡";
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), {
      threshold: 0,
    });
    if (addBtnRef.current) observer.observe(addBtnRef.current);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => {
    let isMounted = true;
    // Track real product view in database (debounced per session)
    try {
      const viewedKey = `viewed_prod_${productId}`;
      if (!sessionStorage.getItem(viewedKey)) {
        sessionStorage.setItem(viewedKey, "1");
        (supabase as any)
          .rpc("increment_product_views", { p_product_id: productId })
          .catch(() => {});
      }
    } catch {}

    // Load reviews in background
    (async () => {
      try {
        const { data: revs } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", productId)
          .order("created_at", { ascending: false });

        if (isMounted && revs) {
          setReviews(revs as Review[]);
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (!product && isProdLoading) return <ProductPageSkeleton />;
  if (!product)
    return (
      <div className="text-center py-20 font-bold text-muted-foreground">
        المنتج غير موجود أو جارٍ تحميله...
      </div>
    );

  const outOfStock = (product.stock_quantity ?? 1) <= 0;
  const step = product.is_by_weight ? 0.25 : 1;
  const min = product.is_by_weight ? 0.25 : 1;
  const totalCost = lineSubtotal(product, qty).toFixed(2);

  async function submitReview() {
    if (!user) {
      toast.error("يجب تسجيل الدخول لإضافة تقييم");
      navigate({ to: "/auth", search: { next: undefined } });
      return;
    }
    if (!comment.trim()) {
      toast.error("يرجى كتابة تعليقك");
      return;
    }
    setSubmitting(true);
    const userMetadata = user.user_metadata as Record<string, string> | undefined;
    const displayName =
      authorName.trim() || userMetadata?.full_name || user.email?.split("@")[0] || "عميل";
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: user.id,
        author_name: displayName,
        rating,
        comment: comment.trim(),
      })
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setReviews((prev) => [data as Review, ...prev]);
    setAuthorName("");
    setComment("");
    toast.success("تمت إضافة تقييمك بنجاح");
  }

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      {/* ─── شريط التنقل العلوي ─── */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-bold"
          >
            <ChevronRight className="h-4 w-4" />
            الرئيسية
          </Link>
          <span className="line-clamp-1 text-sm font-black flex-1 text-center px-2">
            {product.name}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="مشاركة المنتج"
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary/60 hover:bg-secondary text-foreground transition-all active:scale-95"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={toggleWishlist}
              title="إضافة للمفضلة"
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary/60 hover:bg-secondary transition-all active:scale-95"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-all",
                  wished ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-5">
        {/* ─── شريط العد التنازلي للتسليم اليومي المباشر ─── */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/20 backdrop-blur-sm shrink-0">
              <Zap className="h-4 w-4 text-amber-300 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-black">شحن سريع ومباشر اليوم ⚡</div>
              <div className="text-[10px] text-emerald-100 font-medium">
                اطلب الآن ليصلك طلبك خلال وقت قياسي
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-1 text-xs font-mono font-black bg-black/20 px-3 py-1.5 rounded-xl border border-white/10 shrink-0"
            dir="ltr"
          >
            <Clock className="h-3.5 w-3.5 text-amber-300 me-1" />
            <span>{String(timeLeft.hours).padStart(2, "0")}</span>:
            <span>{String(timeLeft.minutes).padStart(2, "0")}</span>:
            <span>{String(timeLeft.seconds).padStart(2, "0")}</span>
          </div>
        </div>

        {/* ─── معرض الصور التفني والـ Zoom Modal ─── */}
        <div className="space-y-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-secondary/40 border border-border/50 shadow-sm group">
            {images.length > 0 ? (
              <>
                <img
                  ref={mainImgRef}
                  src={images[activeImg]}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  alt={product.name}
                />
                <button
                  onClick={() => setZoomed(true)}
                  className="absolute bottom-3 left-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md opacity-90 hover:opacity-100 transition-opacity"
                  title="تكبير الصورة"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="grid h-full w-full place-items-center text-6xl">🌿</div>
            )}

            {/* شارات الجودة والتخفيض والأكثر مبيعاً ─── */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
              {Boolean(
                (product as any).isTopSeller ||
                (product as any).is_top_seller ||
                product.is_featured,
              ) && (
                <span className="rounded-full bg-amber-500 text-white font-black text-[11px] px-3 py-1 shadow-md flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" /> الأكثر مبيعاً
                </span>
              )}
              {product.old_price && product.old_price > product.price_per_unit && (
                <span className="rounded-full bg-red-500 text-white font-black text-[11px] px-3 py-1 shadow-md">
                  خصم{" "}
                  {Math.round(
                    ((product.old_price - product.price_per_unit) / product.old_price) * 100,
                  )}
                  %
                </span>
              )}
              <span className="rounded-full bg-emerald-600/90 text-white font-bold text-[10px] px-2.5 py-0.5 backdrop-blur-sm flex items-center gap-1 shadow-sm">
                <Sparkles className="h-3 w-3" /> جودة 100% طازجة
              </span>
            </div>
          </div>

          {/* مصغرات الصور (Thumbnails) ─── */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(idx)}
                  className={cn(
                    "relative aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                    activeImg === idx
                      ? "border-primary ring-2 ring-primary/20 scale-105"
                      : "border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Modal تكبير الصورة ─── */}
        <AnimatePresence>
          {zoomed && images.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4 backdrop-blur-md"
              onClick={() => setZoomed(false)}
            >
              <button
                onClick={() => setZoomed(false)}
                className="absolute top-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={images[activeImg]}
                alt={product.name}
                className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── تفاصيل السعر والمخزون ─── */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                {product.unit_label ? `يباع بـ: ${product.unit_label}` : "منتج فاخر"}
              </span>
              <h1 className="mt-2 text-2xl font-black text-foreground">{product.name}</h1>
            </div>
            <div className="text-end">
              <div className="font-display text-3xl font-black text-primary">
                {totalCost} <span className="text-sm font-bold text-muted-foreground">ج.م</span>
              </div>
              {product.old_price && product.old_price > product.price_per_unit && (
                <div className="text-xs text-muted-foreground line-through font-bold">
                  {(product.old_price * (product.is_by_weight ? qty : 1)).toFixed(2)} ج.م
                </div>
              )}
            </div>
          </div>

          {/* تأثير الـ FOMO للمخزون المتبقي */}
          {!outOfStock && product.stock_quantity && product.stock_quantity <= 5 && (
            <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-center">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                متبقي {product.stock_quantity} قطع فقط في المخزون! اطلب قبل نفاذ الكمية.
              </p>
            </div>
          )}
        </div>

        {/* استخراج كافة بيانات المنتج والذكاء الاصطناعي */}
        {(() => {
          const details = extractProductDetails(product);
          return (
            <>
              {/* ─── مكون إحصاءات المنتج والمشاهدات والمشترين ونظرة الشيف والطبخ ─── */}
              <ProductStatsAndTip
                viewsCount={(product as any).viewsCount ?? (product as any).views_count ?? 0}
                purchaseCount={(product as any).purchaseCount ?? (product as any).purchase_count ?? 0}
                avgRating={
                  (product as any).avgRating ??
                  (product as any).avg_rating ??
                  (reviews.length > 0
                    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                    : 0)
                }
                reviewsCount={
                  (product as any).reviewsCount ?? (product as any).reviews_count ?? reviews.length
                }
                cookingTip={details.cookingTip || (product as any).cooking_tip || null}
                isTopSeller={Boolean(
                  (product as any).isTopSeller ?? (product as any).is_top_seller ?? product.is_featured,
                )}
              />

              {/* ─── تبويبات تفاصيل المنتج التفاعلية (الوصف / التخزين / الجودة / التغذية) ─── */}
              <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setActiveTab("desc")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                      activeTab === "desc"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Info className="h-3.5 w-3.5" />
                    الوصف والخصائص
                  </button>
                  <button
                    onClick={() => setActiveTab("specs")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                      activeTab === "specs"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Thermometer className="h-3.5 w-3.5" />
                    التخزين والمصدر
                  </button>
                  <button
                    onClick={() => setActiveTab("nutrition")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                      activeTab === "nutrition"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Utensils className="h-3.5 w-3.5" />
                    القيمة الغذائية
                  </button>
                </div>

                <div className="min-h-[80px]">
                  {activeTab === "desc" && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
                        {details.cleanDescription && details.cleanDescription.trim().length > 0
                          ? details.cleanDescription
                          : "منتج طازج عالي الجودة مختار بعناية فائقة ليلبي احتياجات أسرتك اليومية بأعلى معايير السلامة والنظافة."}
                      </p>

                      {/* مميزات وخصائص المنتج */}
                      {details.characteristics.length > 0 && (
                        <div className="pt-1 space-y-1.5">
                          <div className="text-[11px] font-bold text-foreground">أبرز الخصائص والمميزات:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {details.characteristics.map((char, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-xs text-foreground/90 bg-secondary/30 p-2 rounded-xl border border-border/40"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="font-semibold text-[11px]">{char}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* الوسوم والشارات */}
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-[11px] font-bold">
                          <Leaf className="h-3 w-3" /> طازج 100%
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 text-[11px] font-bold">
                          <ShieldCheck className="h-3 w-3" /> جودة مضمونة
                        </span>
                        {details.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-lg bg-secondary text-muted-foreground px-2 py-0.5 text-[10px] font-bold"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "specs" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-200">
                      <div className="rounded-xl border bg-secondary/20 p-3 space-y-1">
                        <div className="text-muted-foreground text-[10px] font-bold">
                          المصدر وبلد المنشأ
                        </div>
                        <div className="font-bold flex items-center gap-1.5 text-foreground">
                          <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{details.originSource || "مزارع محلية طازجة معتمدة"}</span>
                        </div>
                      </div>
                      <div className="rounded-xl border bg-secondary/20 p-3 space-y-1">
                        <div className="text-muted-foreground text-[10px] font-bold">
                          طريقة الحفظ والتخزين المثالية
                        </div>
                        <div className="font-bold flex items-center gap-1.5 text-foreground">
                          <Thermometer className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{details.storageInstructions || "يُحفظ في درجة حرارة 2 - 4°C"}</span>
                        </div>
                      </div>
                      <div className="rounded-xl border bg-secondary/20 p-3 space-y-1">
                        <div className="text-muted-foreground text-[10px] font-bold">
                          التعبئة والتغليف
                        </div>
                        <div className="font-bold text-foreground">عبوة آمنة ومفرغة من الهواء لضمان الجودة</div>
                      </div>
                      <div className="rounded-xl border bg-secondary/20 p-3 space-y-1">
                        <div className="text-muted-foreground text-[10px] font-bold">مدة الصلاحية</div>
                        <div className="font-bold text-foreground">أسبوع من تاريخ الاستلام والتجهيز</div>
                      </div>
                    </div>
                  )}

                  {activeTab === "nutrition" && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>الحقائق والقيمة الغذائية (لكل 100 جرام):</span>
                        <span className="text-[10px] text-muted-foreground font-semibold">تقدير معتمد</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="rounded-xl border bg-amber-500/10 border-amber-500/20 p-2.5">
                          <div className="text-[10px] text-muted-foreground font-bold">سعرات</div>
                          <div className="font-black text-amber-600 dark:text-amber-400">
                            {details.nutritionalInfo.calories || "52 kcal"}
                          </div>
                        </div>
                        <div className="rounded-xl border bg-emerald-500/10 border-emerald-500/20 p-2.5">
                          <div className="text-[10px] text-muted-foreground font-bold">بروتين</div>
                          <div className="font-black text-emerald-600 dark:text-emerald-400">
                            {details.nutritionalInfo.protein || "1.2 جم"}
                          </div>
                        </div>
                        <div className="rounded-xl border bg-blue-500/10 border-blue-500/20 p-2.5">
                          <div className="text-[10px] text-muted-foreground font-bold">كربوهيدرات</div>
                          <div className="font-black text-blue-600 dark:text-blue-400">
                            {details.nutritionalInfo.carbs || "14 جم"}
                          </div>
                        </div>
                        <div className="rounded-xl border bg-purple-500/10 border-purple-500/20 p-2.5">
                          <div className="text-[10px] text-muted-foreground font-bold">ألياف</div>
                          <div className="font-black text-purple-600 dark:text-purple-400">
                            {details.nutritionalInfo.fiber || "2.4 جم"}
                          </div>
                        </div>
                        <div className="rounded-xl border bg-rose-500/10 border-rose-500/20 p-2.5">
                          <div className="text-[10px] text-muted-foreground font-bold">دهون</div>
                          <div className="font-black text-rose-600 dark:text-rose-400">
                            {details.nutritionalInfo.fats || "0.4 جم"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

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
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <div className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">حساب وقت التوصيل الدقيق والمسافة</span>
            </div>
            {deliveryMethod === "gps" && calculatedDistanceKM !== null && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold shrink-0">
                موقعك نشط: {calculatedDistanceKM.toFixed(1)} كم
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* زر تحديد الموقع الجغرافي الخرائطي الذكي */}
            <Button
              type="button"
              variant={deliveryMethod === "gps" ? "default" : "outline"}
              onClick={handleGPSDetection}
              disabled={isDetecting}
              className="w-full sm:flex-1 h-10 rounded-xl text-xs font-bold gap-1"
            >
              <Navigation className={cn("h-3.5 w-3.5 shrink-0", isDetecting && "animate-spin")} />
              <span className="truncate">
                {isDetecting ? "جاري القراءة..." : "تحديد موقعي (GPS)"}
              </span>
            </Button>

            {/* الخيار اليدوي البديل في حال تعطل الـ GPS */}
            <select
              value={deliveryMethod === "manual" ? selectedZone : ""}
              onChange={(e) => handleZoneChange(e.target.value)}
              className="w-full sm:flex-1 min-w-0 max-w-full rounded-xl border bg-background px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary text-muted-foreground truncate"
            >
              <option value="" disabled>
                -- أو اختر منطقتك يدوياً --
              </option>
              {DELIVERY_ZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          {/* خريطة وتغطية Google Maps للمنتج */}
          <StoreGoogleMapsWidget
            title="تغطية التوصيل وموقع المتجر المباشر"
            subtitle={`التوصيل السريع لمنتج ${product.name} إلى موقعك`}
            storeName="المركز الرئيسي - سوبرماركت الوادي الأخضر"
            showAiGrounding={true}
          />
        </div>

        {/* ─── أوزان وكميات الشراء (Variable Weight Selector: 250g, 500g, 750g, 1kg, 1.5kg) ─── */}
        {product.is_by_weight && (
          <WeightSelector
            product={product}
            selectedWeight={qty}
            onWeightChange={(w) => setQty(w)}
            showEstimatedPrice={true}
          />
        )}

        {/* ─── زر إضافة السلة + شراء فوري ─── */}
        <div ref={addBtnRef} className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-4">
            {!product.is_by_weight && (
              <div className="flex items-center gap-1 rounded-full border bg-secondary/30 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setQty((q) => Math.max(min, +(q - step).toFixed(3)))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="min-w-10 text-center text-sm font-black">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => setQty((q) => +(q + step).toFixed(3))}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
            <Button
              disabled={outOfStock}
              onClick={() => {
                const label = product.is_by_weight ? formatWeightLabel(qty) : `${qty} قطعة`;
                addItem(product, qty, {
                  selected_weight: product.is_by_weight ? qty : undefined,
                  selected_weight_label: product.is_by_weight ? label : undefined,
                });
                flyToCart(mainImgRef.current);
                toast.success("تمت الإضافة للسلة 🛒", {
                  description: `${product.name} (${label} — ${calculateEstimatedPrice(product, qty)} ج.م)`,
                });
              }}
              variant="outline"
              className="flex-1 h-11 rounded-xl font-bold text-xs"
            >
              <ShoppingBag className="me-2 h-4 w-4" />{" "}
              {outOfStock
                ? "نفدت الكمية"
                : product.is_by_weight
                  ? `أضف للسلة (${formatWeightLabel(qty)})`
                  : "أضف إلى السلة"}
            </Button>
          </div>
          <Button
            disabled={outOfStock}
            onClick={() => {
              const label = product.is_by_weight ? formatWeightLabel(qty) : `${qty} قطعة`;
              addItem(product, qty, {
                selected_weight: product.is_by_weight ? qty : undefined,
                selected_weight_label: product.is_by_weight ? label : undefined,
              });
              navigate({ to: "/cart" });
            }}
            className="w-full h-11 rounded-xl hero-gradient font-black text-sm text-primary-foreground shadow-md"
          >
            اشترِ الآن — إتمام الشراء مباشرة
          </Button>
        </div>

        {/* ─── نموذج التعليقات والآراء مع الفلاتر ─── */}
        <div className="space-y-4 pt-2">
          <RatingSummary reviews={reviews} />

          {reviews.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                <h3 className="text-sm font-bold">آراء العملاء ({reviews.length})</h3>
                {/* فلاتر النجوم */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  <button
                    onClick={() => setSelectedStarFilter(null)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0",
                      selectedStarFilter === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/60 text-muted-foreground",
                    )}
                  >
                    الكل
                  </button>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedStarFilter(selectedStarFilter === s ? null : s)}
                      className={cn(
                        "flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0",
                        selectedStarFilter === s
                          ? "bg-amber-500 text-white"
                          : "bg-secondary/60 text-muted-foreground",
                      )}
                    >
                      <span>{s}</span>
                      <Star className="h-3 w-3 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {reviews
                  .filter((r) => selectedStarFilter === null || r.rating === selectedStarFilter)
                  .map((r) => (
                    <div key={r.id} className="rounded-2xl border bg-card p-4 shadow-sm space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-black text-primary shrink-0">
                            {r.author_name?.trim().charAt(0) || "؟"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate">
                                {r.author_name || "زائر"}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.2 rounded font-bold">
                                <CheckCircle2 className="h-2.5 w-2.5" /> مشتري مؤكد
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString("ar-EG", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                        <Stars value={r.rating} size="sm" />
                      </div>
                      {r.comment && (
                        <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {user ? (
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold">شاركنا رأيك بالمنتج</h3>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="الاسم المعروض (اختياري)"
                className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
              <Stars value={rating} interactive={true} size="lg" onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="اكتب تجربتك هنا..."
                rows={3}
                className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:outline-none focus:border-primary resize-none"
              />
              <Button
                onClick={submitReview}
                disabled={submitting}
                className="w-full h-9 rounded-xl font-bold text-xs"
              >
                {submitting ? "جاري الإرسال..." : "إرسال التقييم"}
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card p-5 shadow-sm text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                سجّل الدخول لتشارك تقييمك ورأيك بالمنتج
              </p>
              <Button
                onClick={() => navigate({ to: "/auth", search: { next: undefined } })}
                className="w-full h-9 rounded-xl hero-gradient font-bold text-xs text-primary-foreground"
              >
                تسجيل الدخول لكتابة تقييم
              </Button>
            </div>
          )}
        </div>

        {/* ─── منتجات قد تعجبك ─── */}
        {similar.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-bold px-1">منتجات قد تعجبك</h3>
            <div className="grid grid-cols-2 gap-4">
              {similar.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onOpen={(p: Product) =>
                    navigate({ to: "/products/$productId", params: { productId: p.id } })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── الـ Sticky Bar السفلي السريع (موبايل فقط) ─── */}
      {showSticky && (
        <div className="fixed bottom-16 inset-x-0 z-40 border-t border-border bg-card p-3 shadow-elegant md:hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-bold truncate max-w-[130px]">
                {product.name}
              </div>
              <div className="font-display text-base font-black text-primary">
                {totalCost} <span className="text-[10px] font-bold text-muted-foreground">ج.م</span>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-0.5">
              <button
                aria-label="تقليل"
                onClick={() => setQty((q) => Math.max(min, +(q - step).toFixed(3)))}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-background"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-8 text-center text-xs font-black">
                {product.is_by_weight
                  ? qty >= 1
                    ? `${qty}كجم`
                    : `${Math.round(qty * 1000)}جم`
                  : qty}
              </span>
              <button
                aria-label="زيادة"
                onClick={() => setQty((q) => +(q + step).toFixed(3))}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-background"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <Button
              disabled={outOfStock}
              onClick={() => {
                addItem(product, qty);
                flyToCart(mainImgRef.current);
                toast.success("تمت الإضافة للسلة");
              }}
              className="h-10 rounded-xl hero-gradient font-bold text-xs px-4 shrink-0"
            >
              أضف للسلة
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
