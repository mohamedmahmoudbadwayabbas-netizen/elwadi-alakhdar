import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, lineSubtotal } from "@/lib/cart-context";
import type { Product } from "@/lib/cart-context";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Minus, Plus, ShoppingBag, Star, Send, Flame, Award, Package, ChevronLeft } from "lucide-react";

type Review = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

const WEIGHT_PRESETS = [0.25, 0.5, 1, 2];

export const Route = createFileRoute("/products/$productId")({
  component: ProductPage,
});

function Stars({ value, max = 5, interactive = false, onChange }: {
  value: number; max?: number; interactive?: boolean; onChange?: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: max }).map((_, i) => {
        const filled = interactive ? (hovered || value) > i : value > i;
        return (
          <Star key={i}
            className={cn("h-5 w-5 transition-colors", filled ? "fill-amber-400 text-amber-400" : "fill-muted text-muted", interactive && "cursor-pointer hover:scale-110 transition-transform")}
            onClick={() => interactive && onChange?.(i + 1)}
            onMouseEnter={() => interactive && setHovered(i + 1)}
            onMouseLeave={() => interactive && setHovered(0)}
          />
        );
      })}
    </div>
  );
}

function ProductPage() {
  const { productId } = Route.useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: prod }, { data: revs }] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false }),
      ]);
      if (prod) { setProduct(prod as Product); setQty(prod.is_by_weight ? 0.5 : 1); }
      setReviews((revs ?? []) as Review[]);
      setLoading(false);
    })();
  }, [productId]);

  if (loading) return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
        <div className="h-5 w-32 animate-pulse rounded-full bg-secondary" />
        <div className="aspect-square w-full animate-pulse rounded-3xl bg-secondary" />
        <div className="h-4 w-3/5 animate-pulse rounded-full bg-secondary" />
        <div className="h-4 w-2/5 animate-pulse rounded-full bg-secondary" />
      </div>
    </div>
  );

  if (!product) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background" dir="rtl">
      <div className="text-5xl">🔍</div>
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
    <div className="min-h-screen bg-background pb-24" dir="rtl">
      <div className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="h-4 w-4" />المتجر
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="line-clamp-1 text-sm font-bold text-foreground">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* صورة المنتج */}
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-secondary shadow-[0_20px_50px_-12px_oklch(0.40_0.14_150_/_0.18)]">
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            : <div className="grid h-full w-full place-items-center text-8xl">🌿</div>}
          {discount > 0 && (
            <span className="absolute start-4 top-4 rounded-full sale-gradient px-3 py-1 text-sm font-black text-sale-foreground shadow-lg">خصم {discount}%</span>
          )}
          {(product.is_featured || product.is_popular) && (
            <span className="absolute end-4 top-4 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-black text-accent-foreground shadow-lg">
              {product.is_featured ? <Award className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}الأكثر مبيعاً
            </span>
          )}
        </div>

        {/* معلومات المنتج */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
          <div>
            <h1 className="font-display text-2xl font-bold leading-snug">{product.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.is_by_weight ? `السعر: ${product.price_per_unit.toFixed(2)} ج.م / كجم` : product.unit_label}
            </p>
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <Stars value={avgRating} />
              <span className="text-sm font-bold text-amber-600">{avgRating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">({reviews.length} تقييم)</span>
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className="font-display text-3xl font-bold text-primary">
              {lineSubtotal(product, qty).toFixed(2)}
              <span className="ms-1 text-sm font-bold text-muted-foreground">ج.م</span>
            </div>
            {discount > 0 && product.old_price && (
              <div className="mb-1 text-sm text-muted-foreground line-through">
                {(product.is_by_weight ? product.old_price / 2 : product.old_price).toFixed(2)} ج.م
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            {outOfStock
              ? <span className="font-bold text-destructive">نفدت الكمية</span>
              : <span className="text-success font-bold">متاح في المخزون</span>}
          </div>
          {product.description && (
            <p className="text-sm leading-relaxed text-muted-foreground border-t border-border/50 pt-3">{product.description}</p>
          )}
        </div>

        {/* اختيار الوزن */}
        {product.is_by_weight && (
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-3 text-sm font-bold">اختر الوزن</div>
            <div className="grid grid-cols-4 gap-2">
              {WEIGHT_PRESETS.map((w) => (
                <button key={w} onClick={() => setQty(w)}
                  className={cn("rounded-xl border px-2 py-2.5 text-xs font-bold transition-all",
                    qty === w ? "border-primary bg-primary text-primary-foreground shadow-card" : "border-border bg-secondary/40 hover:border-primary/40")}>
                  {w >= 1 ? `${w} كجم` : `${w * 1000} جم`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* الكمية وزر الإضافة */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">الكمية</span>
            <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"
                onClick={() => setQty((q) => Math.max(min, +(q - step).toFixed(3)))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-14 text-center text-sm font-black">
                {product.is_by_weight ? (qty >= 1 ? `${qty} كجم` : `${qty * 1000}جم`) : qty}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"
                onClick={() => setQty((q) => +(q + step).toFixed(3))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button disabled={outOfStock}
            className="h-12 w-full rounded-2xl hero-gradient text-base font-black text-primary-foreground shadow-card hover:opacity-95 active:scale-[0.98] transition-all"
            onClick={() => { addItem(product, qty); toast.success("تمت الإضافة للسلة", { description: product.name }); }}>
            <ShoppingBag className="me-2 h-5 w-5" />
            {outOfStock ? "نفدت الكمية" : `أضف إلى السلة — ${lineSubtotal(product, qty).toFixed(2)} ج.م`}
          </Button>
        </div>

        {/* التقييمات */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-bold">
            التقييمات والتعليقات
            {reviews.length > 0 && <span className="ms-2 text-sm font-normal text-muted-foreground">({reviews.length})</span>}
          </h2>

          {/* نموذج إضافة تعليق */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
            <div className="text-sm font-bold">أضف تقييمك</div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">تقييمك</label>
              <Stars value={rating} interactive onChange={setRating} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">اسمك</label>
              <input value={authorName} onChange={(e) => setAuthorName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">تعليقك</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="شاركنا رأيك في المنتج..." rows={3}
                className="w-full resize-none rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <Button onClick={submitReview} disabled={submitting}
              className="w-full rounded-xl hero-gradient font-bold text-primary-foreground shadow-card hover:opacity-95">
              <Send className="me-2 h-4 w-4" />
              {submitting ? "جاري الإرسال..." : "إرسال التقييم"}
            </Button>
          </div>

          {/* قائمة التعليقات */}
          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <div className="text-3xl">💬</div>
              <p className="mt-2 text-sm font-bold">لا توجد تقييمات بعد</p>
              <p className="text-xs text-muted-foreground">كن أول من يقيّم هذا المنتج!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold">{r.author_name}</div>
                      <Stars value={r.rating} />
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}