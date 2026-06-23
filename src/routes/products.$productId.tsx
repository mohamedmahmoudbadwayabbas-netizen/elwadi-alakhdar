import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, lineSubtotal } from "@/lib/cart-context";
import type { Product } from "@/lib/cart-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Minus, Plus, ShoppingBag, Star, Send, Flame, Award,
  Package, ChevronLeft, Heart, Share2, Truck, ShieldCheck,
  RotateCcw, ZoomIn, ChevronRight, X
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

const WEIGHT_PRESETS = [0.25, 0.5, 1, 2];

// ─── TanStack Router ───────────────────────────────────────────────────────────
export const Route = createFileRoute("/products/$productId")({
  component: ProductPage,
});

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <div className="h-5 w-32 animate-pulse rounded-full bg-secondary" />
        <div className="aspect-square w-full animate-pulse rounded-3xl bg-secondary" />
        <div className="flex gap-2">
          {[1,2,3].map(i => <div key={i} className="h-16 w-16 animate-pulse rounded-xl bg-secondary" />)}
        </div>
        <div className="space-y-2">
          <div className="h-7 w-4/5 animate-pulse rounded-full bg-secondary" />
          <div className="h-4 w-2/5 animate-pulse rounded-full bg-secondary" />
          <div className="h-8 w-1/3 animate-pulse rounded-full bg-secondary" />
        </div>
      </div>
    </div>
  );
}

// ─── ملخص التقييمات بالأشرطة ──────────────────────────────────────────────────
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
        {/* متوسط التقييم */}
        <div className="flex flex-col items-center justify-center gap-1 min-w-[80px]">
          <div className="font-display text-5xl font-black text-primary">{avg.toFixed(1)}</div>
          <Stars value={avg} size="sm" />
          <div className="text-xs text-muted-foreground">{reviews.length} تقييم</div>
        </div>

        {/* الأشرطة */}
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

// ─── بطاقة منتج مشابه ─────────────────────────────────────────────────────────
function SimilarCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  return (
    <Link to="/products/$productId" params={{ productId: product.id }}
      className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-2.5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
      <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          : <div className="grid h-full w-full place-items-center text-2xl">🌿</div>}
      </div>
      <div className="text-xs font-bold line-clamp-2 leading-snug">{product.name}</div>
      <div className="flex items-center justify-between mt-auto">
        <div className="text-xs font-black text-primary">
          {product.price_per_unit.toFixed(2)} ج.م
        </div>
        <button
          onClick={(e) => { e.preventDefault(); addItem(product, product.is_by_weight ? 0.5 : 1); toast.success("تمت الإضافة"); }}
          className="grid h-6 w-6 place-items-center rounded-lg hero-gradient text-primary-foreground">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </Link>
  );
}

// ─── الصفحة الرئيسية ───────────────────────────────────────────────────────────
function ProductPage() {
  const { productId } = Route.useParams();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [wished, setWished] = useState(false);

  // gallery
  const [images, setImages] = useState<string[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  // نموذج التعليق
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // sticky زر السلة
  const addBtnRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (addBtnRef.current) observer.observe(addBtnRef.current);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      // تنظيف البيانات السابقة لتجنب ظهور تعليقات المنتج القديم مؤقتاً
      setReviews([]);
      
      const [{ data: prod }, { data: revs }] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false }),
      ]);
      
      if (!isMounted) return;

      if (prod) {
        const p = prod as Product;
        setProduct(p);
        setQty(p.is_by_weight ? 0.5 : 1);
        const imgs = p.image_url ? [p.image_url] : [];
        setImages(imgs);
        setActiveImg(0);

        // جلب منتجات مشابهة
        if (p.category_id) {
          const { data: sim } = await supabase
            .from("products").select("*")
            .eq("category_id", p.category_id)
            .neq("id", productId)
            .limit(6);
          if (isMounted) setSimilar((sim ?? []) as Product[]);
        }
      }
      if (isMounted) {
        setReviews((revs ?? []) as Review[]);
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading) return <Skeleton />;

  if (!product) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background" dir="rtl">
      <div className="text-6xl">🔍</div>
      <p className="font-bold text-lg">المنتج غير موجود</p>
      <Link to="/" className="text-primary underline text-sm">العودة للمتجر</Link>
    </div>
  );

  const outOfStock = (product.stock_quantity ?? 1) <= 0;
  const step = product.is_by_weight ? 0.25 : 1;
  const min = product.is_by_weight ? 0.25 : 1;
  const discount = product.old_price && product.old_price > product.price_per_unit
    ? Math.round(((product.old_price - product.price_per_unit) / product.old_price) * 100) : 0;
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const totalCost = lineSubtotal(product, qty).toFixed(2);

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ الرابط");
    }
  };

  async function submitReview() {
    if (!authorName.trim() || !comment.trim()) { toast.error("يرجى تعبئة الاسم والتعليق"); return; }
    setSubmitting(true);
    const { data, error } = await supabase.from("reviews")
      .insert({ product_id: productId, author_name: authorName.trim(), rating, comment: comment.trim() })
      .select().single();
    setSubmitting(false);
    if (error) { toast.error("حدث خطأ، حاول مرة أخرى"); return; }
    setReviews((prev) => [data as Review, ...prev]);
    setAuthorName(""); setComment(""); setRating(5);
    toast.success("شكراً! تم إضافة تعليقك");
  }

  return (
    <div className="min-h-screen bg-background pb-28" dir="rtl">

      {/* ─── شريط التنقل ─── */}
      <div className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="h-4 w-4" />المتجر
          </Link>
          <span className="line-clamp-1 text-sm font-bold text-foreground flex-1 text-center px-2">{product.name}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setWished(w => !w)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary transition-colors">
              <Heart className={cn("h-4 w-4 transition-all", wished ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground")} />
            </button>
            <button onClick={share} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary transition-colors">
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-5 space-y-5">

        {/* ─── Gallery ─── */}
        <div className="space-y-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-secondary shadow-[0_20px_50px_-12px_oklch(0.40_0.14_150_/_0.18)] group">
            {images.length > 0 ? (
              <img src={images[activeImg]} alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="grid h-full w-full place-items-center text-8xl">🌿</div>
            )}

            {/* زر التكبير */}
            {images.length > 0 && (
              <button onClick={() => setZoomed(true)}
                className="absolute end-3 bottom-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 shadow-md backdrop-blur-sm hover:bg-white transition-all">
                <ZoomIn className="h-4 w-4 text-foreground" />
              </button>
            )}

            {/* تنقل بين الصور */}
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImg(i => Math.max(0, i - 1))}
                  className="absolute start-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-white/80 shadow">
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button onClick={() => setActiveImg(i => Math.min(images.length - 1, i + 1))}
                  className="absolute end-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-white/80 shadow">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            )}

            {/* الشارات */}
            {discount > 0 && (
              <span className="absolute start-3 top-3 rounded-full sale-gradient px-3 py-1 text-sm font-black text-sale-foreground shadow-lg">
                خصم {discount}%
              </span>
            )}
            {(product.is_featured || product.is_popular) && (
              <span className="absolute end-3 top-3 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground shadow-lg">
                {product.is_featured ? <Award className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
                الأكثر مبيعاً
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={cn("h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                    activeImg === i ? "border-primary shadow-card" : "border-border/50 opacity-60 hover:opacity-100")}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Modal تكبير الصورة ─── */}
        {zoomed && images.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setZoomed(false)}>
            <button className="absolute end-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white">
              <X className="h-5 w-5" />
            </button>
            <img src={images[activeImg]} alt={product.name} className="max-h-full max-w-full rounded-2xl object-contain" />
          </div>
        )}

        {/* ─── معلومات المنتج ─── */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
          <div>
            <h1 className="font-display text-2xl font-bold leading-snug text-foreground">{product.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.is_by_weight ? `السعر: ${product.price_per_unit.toFixed(2)} ج.م / كجم` : product.unit_label}
            </p>
          </div>

          {/* التقييم */}
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <Stars value={avgRating} size="sm" />
              <span className="text-sm font-bold text-amber-600">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground underline cursor-pointer" onClick={() => document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" })}>
                ({reviews.length} تقييم)
              </span>
            </div>
          )}

          {/* السعر */}
          <div className="flex items-end gap-3">
            <div className="font-display text-4xl font-black text-primary">
              {totalCost}
              <span className="ms-1 text-base font-bold text-muted-foreground">ج.م</span>
            </div>
            {discount > 0 && product.old_price && (
              <div className="mb-1 text-sm text-muted-foreground line-through">
                {(product.is_by_weight ? product.old_price / 2 : product.old_price).toFixed(2)} ج.م
              </div>
            )}
          </div>

          {/* المخزون */}
          <div className="flex items-center gap-2 text-xs">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            {outOfStock
              ? <span className="font-bold text-destructive">نفدت الكمية</span>
              : <span className="font-bold text-emerald-600">متاح في المخزون ✓</span>}
          </div>

          {/* الوصف */}
          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground border-t border-border/50 pt-3">
              {product.description}
            </p>
          )}
        </div>

        {/* ─── مميزات الخدمة ─── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <Truck className="h-5 w-5 text-primary" />, label: "توصيل سريع", sub: "خلال 24 ساعة" },
            { icon: <ShieldCheck className="h-5 w-5 text-primary" />, label: "جودة مضمونة", sub: "100% طازج" },
            { icon: <RotateCcw className="h-5 w-5 text-primary" />, label: "إرجاع سهل", sub: "خلال 24 ساعة" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-card p-3 text-center shadow-sm">
              {f.icon}
              <div className="text-[11px] font-bold text-foreground">{f.label}</div>
              <div className="text-[10px] text-muted-foreground">{f.sub}</div>
            </div>
          ))}
        </div>

        {/* ─── اختيار الوزن ─── */}
        {product.is_by_weight && (
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 text-sm font-bold">اختر الوزن</div>
            <div className="grid grid-cols-4 gap-2">
              {WEIGHT_PRESETS.map((w) => (
                <button key={w} onClick={() => setQty(w)}
                  className={cn("rounded-xl border px-2 py-3 text-xs font-bold transition-all",
                    qty === w
                      ? "border-primary bg-primary text-primary-foreground shadow-card scale-105"
                      : "border-border bg-secondary/40 hover:border-primary/40 hover:scale-102")}>
                  {w >= 1 ? `${w} كجم` : `${w * 1000} جم`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── الكمية وزر الإضافة ─── */}
        <div ref={addBtnRef} className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
          {!product.is_by_weight && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">الكمية</span>
              <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"
                  onClick={() => setQty((q) => Math.max(min, +(q - step).toFixed(3)))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-14 text-center text-sm font-black">{qty}</span>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"
                  onClick={() => setQty((q) => +(q + step).toFixed(3))}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              disabled={outOfStock}
              onClick={() => {
                addItem(product, qty);
                toast.success("تمت الإضافة للسلة", { description: `${product.name} (${qty})` });
              }}
              className="flex-1 h-12 rounded-xl hero-gradient font-bold text-sm shadow-md"
            >
              <ShoppingBag className="me-2 h-4 w-4" />
              {outOfStock ? "نفدت الكمية" : "أضف إلى السلة"}
            </Button>
          </div>
        </div>

        {/* ─── قسم التقييمات والتعليقات المصلح ─── */}
        <div id="reviews-section" className="space-y-4 pt-4">
          <RatingSummary reviews={reviews} />

          {/* كتابة تعليق جديد */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <h3 className="text-base font-bold">شاركنا رأيك بالمنتج</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1">الاسم</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="اكتب اسمك الكريم"
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">التقييم</label>
                <Stars value={rating} interactive={true} size="lg" onChange={setRating} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">التعليق</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="اكتب تجربتك مع هذا المنتج هنا..."
                  rows={3}
                  className="w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <Button
                onClick={submitReview}
                disabled={submitting}
                className="w-full h-10 rounded-xl font-bold text-xs"
              >
                <Send className="me-2 h-3.5 w-3.5" />
                {submitting ? "جاري الإرسال..." : "إرسال التقييم"}
              </Button>
            </div>
          </div>

          {/* عرض قائمة التعليقات */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold px-1">التعليقات القديمة ({reviews.length})</h3>
            {reviews.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev.id} className="rounded-2xl border border-border/40 bg-card p-4 shadow-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{rev.author_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(rev.created_at).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                  <Stars value={rev.rating} size="sm" />
                  <p className="text-xs leading-relaxed text-muted-foreground/90 pt-1">{rev.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">لا توجد تعليقات لهذا المنتج بعد. كن أول من يضيف تعليقاً! 🌿</p>
            )}
          </div>
        </div>

        {/* ─── منتجات مشابهة ─── */}
        {similar.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="text-base font-bold">منتجات قد تعجبك</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {similar.map((prod) => (
                <SimilarCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ─── Sticky Bar السفلي المتنقل عند النزول ─── */}
      {showSticky && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 p-3 backdrop-blur-md shadow-[0_-8px_30px_rgb(0_0_0_/_0.08)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-bold line-clamp-1">{product.name}</div>
              <div className="font-display text-lg font-black text-primary">
                {totalCost} <span className="text-xs font-bold text-muted-foreground">ج.م</span>
              </div>
            </div>
            <Button
              disabled={outOfStock}
              onClick={() => {
                addItem(product, qty);
                toast.success("تمت الإضافة للسلة");
              }}
              className="h-11 rounded-xl hero-gradient font-bold text-xs px-6 shadow-md"
            >
              <ShoppingBag className="me-1.5 h-4 w-4" />
              إضافة سريعة ({qty})
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
