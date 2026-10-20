import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, PackageX, SearchX, ChevronRight, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-loose";
import { useCart, type Product } from "@/lib/cart-context";
import { PRODUCT_COLUMNS, normalizeProduct, useStoreCategories } from "@/lib/store-data-hooks";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { flyToCart } from "@/lib/fly-to-cart";

type PageProduct = Product & { unit?: string | null };

const UNIT_AR: Record<string, string> = { kg: "كجم", liter: "لتر", piece: "قطعة", g: "جم" };

// Plain Western digits, always.
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

function unitText(p: PageProduct) {
  if (p.unit) return UNIT_AR[p.unit] ?? p.unit;
  return p.is_by_weight ? "كجم" : p.unit_label || "قطعة";
}

async function fetchProduct(id: string): Promise<PageProduct | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return normalizeProduct(data) as PageProduct;
}

async function fetchSimilar(categoryId: string, excludeId: string): Promise<PageProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .neq("id", excludeId)
    .gt("stock", 0)
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  return (data ?? []).map((row) => normalizeProduct(row) as PageProduct);
}

export const Route = createFileRoute("/products/$productId")({
  head: () => ({
    meta: [
      { title: "تفاصيل المنتج | سوبرماركت الوادي الأخضر" },
      { name: "description", content: "السعر والتوفر وتفاصيل المنتج في سوبرماركت الوادي الأخضر." },
      { property: "og:title", content: "تفاصيل المنتج | سوبرماركت الوادي الأخضر" },
      { property: "og:description", content: "السعر والتوفر وتفاصيل المنتج." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductPage,
});

/* ───────── LTR islands ───────── */

function PriceBlock({ product, qty }: { product: PageProduct; qty: number }) {
  const hasDiscount = product.old_price != null && product.old_price > product.price_per_unit;
  const pct = hasDiscount
    ? Math.round((1 - product.price_per_unit / (product.old_price as number)) * 100)
    : 0;
  return (
    <div dir="ltr" className="flex flex-wrap items-baseline gap-2 text-left tabular-nums">
      <span className="font-display text-3xl font-black text-primary">
        {fmt(product.price_per_unit)}
      </span>
      <span className="text-sm font-bold text-muted-foreground">
        <bdi dir="rtl">ج.م</bdi> / <bdi dir="rtl">{unitText(product)}</bdi>
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {fmt(product.old_price as number)}
          </span>
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-black text-destructive">
            -{pct}%
          </span>
        </>
      )}
      {qty !== 1 && (
        <span className="w-full text-xs font-semibold text-muted-foreground">
          {fmt(qty)} × {fmt(product.price_per_unit)} = {fmt(product.price_per_unit * qty)} <bdi dir="rtl">ج.م</bdi>
        </span>
      )}
    </div>
  );
}

function QuantityStepper({
  value,
  onChange,
  step,
  min,
  max,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  unit: string;
}) {
  return (
    <div
      dir="ltr"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1 tabular-nums"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="تقليل الكمية"
        className="h-9 w-9 rounded-full"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(3)))}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="min-w-16 text-center text-sm font-black" aria-live="polite">
        {fmt(value)} <bdi dir="rtl" className="text-xs text-muted-foreground">{unit}</bdi>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="زيادة الكمية"
        className="h-9 w-9 rounded-full"
        disabled={value + step > max}
        onClick={() => onChange(Math.min(max, +(value + step).toFixed(3)))}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

/* ───────── Page ───────── */

function ProductPage() {
  const { productId } = Route.useParams();
  const { data: categories = [] } = useStoreCategories();
  const { data: product, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["product-page", productId],
    queryFn: () => fetchProduct(productId),
  });

  if (isLoading) return <LoadingState />;
  if (isError) return <ProductLoadError retry={() => void refetch()} isRetrying={isFetching} />;
  if (!product) return <NotFoundState />;
  const unavailable = (product.stock_quantity ?? 0) <= 0;
  const category = categories.find((candidate) => candidate.id === product.category_id);
  return (
    <ReadyState
      key={product.id}
      product={product}
      unavailable={unavailable}
      categoryName={category?.name_ar || category?.name}
    />
  );
}

function LoadingState() {
  return (
    <main dir="rtl" className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-2" aria-busy="true">
      <Skeleton className="aspect-square w-full rounded-[2rem]" />
      <div className="space-y-4 rounded-[2rem] border border-border p-6">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </main>
  );
}

function NotFoundState() {
  return (
    <main dir="rtl" className="mx-auto grid max-w-md place-items-center gap-4 p-10 text-center">
      <SearchX className="h-12 w-12 text-muted-foreground" />
      <h1 className="font-display text-xl font-bold">المنتج غير موجود</h1>
      <p className="text-sm text-muted-foreground">ربما تم حذفه أو أن الرابط غير صحيح.</p>
      <Button asChild className="rounded-2xl">
        <Link to="/">العودة للمتجر</Link>
      </Button>
    </main>
  );
}

function ProductLoadError({ retry, isRetrying }: { retry: () => void; isRetrying: boolean }) {
  return (
    <main dir="rtl" className="mx-auto grid max-w-md place-items-center gap-4 p-10 text-center">
      <SearchX className="h-12 w-12 text-destructive" />
      <h1 className="font-display text-xl font-bold">تعذر تحميل بيانات المنتج</h1>
      <p className="text-sm text-muted-foreground">تحقق من اتصالك بالإنترنت ثم أعد المحاولة.</p>
      <Button className="rounded-2xl" onClick={retry} disabled={isRetrying}>
        {isRetrying ? "جارٍ إعادة المحاولة…" : "حاول مرة أخرى"}
      </Button>
    </main>
  );
}

function ReadyState({ product, unavailable, categoryName }: { product: PageProduct; unavailable: boolean; categoryName?: string }) {
  const { addItem, items } = useCart();
  const queryClient = useQueryClient();
  const weighted = product.is_by_weight;
  const step = weighted ? 0.25 : 1;
  const min = weighted ? 0.25 : 1;
  const cartQty = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const remainingStock = Math.max(0, (product.stock_quantity ?? 0) - cartQty);
  const max = Math.max(min, weighted ? product.stock_quantity ?? min : remainingStock);
  const limitReached = !weighted && remainingStock < min;
  const [qty, setQty] = useState(weighted ? 0.5 : 1);
  const [isAdding, setIsAdding] = useState(false);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const images = [...new Set([product.image_url, ...(product.images ?? [])].filter((url): url is string => Boolean(url)))];
  const visibleImages = images.filter((url) => !failedImages.includes(url));
  const [selectedImage, setSelectedImage] = useState<string | null>(visibleImages[0] ?? null);
  const currentImage = selectedImage && visibleImages.includes(selectedImage) ? selectedImage : visibleImages[0];
  const isLowStock = !unavailable && product.stock_quantity != null && product.stock_quantity <= (product.low_stock_threshold ?? 5);
  const unit = unitText(product);

  const add = async (el: HTMLElement) => {
    if (isAdding || unavailable || limitReached) return;
    setIsAdding(true);
    try {
      const latest = await queryClient.fetchQuery({
        queryKey: ["product-page", product.id],
        queryFn: () => fetchProduct(product.id),
        staleTime: 0,
      });
      if (!latest) {
        toast.error("لم يعد هذا المنتج متاحًا للشراء.");
        await queryClient.invalidateQueries({ queryKey: ["product-page", product.id] });
        return;
      }
      queryClient.setQueryData(["product-page", product.id], latest);
      if (latest.price_per_unit !== product.price_per_unit) {
        toast.info("تم تحديث السعر. راجعه ثم أضف المنتج مرة أخرى.");
        return;
      }
      const latestRemainingStock = Math.max(0, (latest.stock_quantity ?? 0) - cartQty);
      if (latestRemainingStock < qty) {
        setQty(Math.max(min, latestRemainingStock));
        toast.error("الكمية المتاحة تغيرت. حدّثنا المخزون؛ راجع الكمية الجديدة.");
        return;
      }
      addItem(latest, qty, weighted ? { selected_weight: qty, selected_weight_label: `${fmt(qty)} ${unit}` } : undefined);
      flyToCart(el);
      toast.success("تمت الإضافة للسلة", { description: `${latest.name_ar || latest.name} (${fmt(qty)} ${unit})` });
    } catch {
      toast.error("تعذر التحقق من السعر والمخزون. لم تتم الإضافة.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-4 pb-40 sm:px-6 md:pb-12 lg:px-8">
      <nav aria-label="مسار الصفحة" className="flex items-center gap-1 py-4 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">الرئيسية</Link>
        <ChevronRight className="h-3 w-3 rotate-180" />
        {categoryName && <><span className="truncate">{categoryName}</span><ChevronRight className="h-3 w-3 rotate-180" /></>}
        <span className="truncate text-foreground">{product.name_ar || product.name}</span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-border/80 bg-secondary shadow-sm">
        {currentImage ? (
          <img
            src={currentImage}
            alt={product.name_ar || product.name}
            className={`h-full w-full object-cover ${unavailable ? "opacity-50 grayscale" : ""}`}
            onError={() => setFailedImages((previous) => [...previous, currentImage])}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-6xl">🌿</div>
        )}
        {visibleImages.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2" aria-label="صور المنتج">
            {visibleImages.map((url, index) => (
              <button key={url} type="button" onClick={() => setSelectedImage(url)} aria-label={`عرض الصورة ${index + 1}`} aria-pressed={currentImage === url} className={`h-14 w-14 overflow-hidden rounded-xl border-2 bg-card shadow ${currentImage === url ? "border-primary" : "border-white/70"}`}>
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {unavailable ? (
          <span className="absolute top-4 start-4 inline-flex items-center gap-1.5 rounded-full bg-destructive px-3.5 py-2 text-xs font-black text-destructive-foreground shadow-lg">
            <PackageX className="h-4 w-4" /> نفدت الكمية
          </span>
        ) : isLowStock ? (
          <span className="absolute top-4 start-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-2 text-xs font-black text-white shadow-lg">
              <AlertTriangle className="h-4 w-4" /> متبقي <bdi dir="ltr">{product.stock_quantity}</bdi> فقط
          </span>
        ) : (
          <span className="absolute top-4 start-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-background/90 px-3.5 py-2 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
            <Check className="h-4 w-4" /> متوفر
          </span>
        )}
      </div>

      <section className="space-y-5 rounded-[2rem] border border-border/80 bg-card p-5 shadow-sm sm:p-7 lg:sticky lg:top-6">
        <div className="space-y-2">
          {categoryName && <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{categoryName}</span>}
          <h1 className="font-display text-2xl font-black leading-snug sm:text-3xl">{product.name_ar || product.name}</h1>
          {product.name_ar && product.name_ar !== product.name && <p dir="auto" className="text-sm text-muted-foreground">{product.name}</p>}
        </div>
        <div className="rounded-2xl bg-secondary/35 p-4 sm:p-5">
          <PriceBlock product={product} qty={unavailable ? 1 : qty} />
        </div>
        {product.avg_rating != null && product.avg_rating > 0 && (
          <p className="text-sm font-semibold text-muted-foreground" aria-label={`التقييم ${fmt(product.avg_rating)} من 5`}>
            <span className="text-amber-500">★ {fmt(product.avg_rating)}</span>{product.reviews_count ? ` (${product.reviews_count} تقييم)` : ""}
          </p>
        )}
        {!unavailable && (
          <div className="hidden items-center gap-3 pt-1 md:flex">
            <QuantityStepper value={qty} onChange={setQty} step={step} min={min} max={max} unit={unit} />
            <Button className="h-11 flex-1 rounded-2xl text-base font-black" onClick={(e) => void add(e.currentTarget)} disabled={isAdding || limitReached} aria-busy={isAdding}>
              <ShoppingBag className="me-2 h-5 w-5" /> {isAdding ? "جارٍ التحقق…" : "أضف إلى السلة"}
            </Button>
          </div>
        )}
        {unavailable && <p className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-semibold text-destructive">هذا المنتج غير متاح حاليًا. ستجد بدائل من القسم نفسه أسفل الصفحة.</p>}
        {limitReached && !unavailable && <p className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm font-semibold text-amber-800 dark:text-amber-200">أضفت بالفعل كامل الكمية المتاحة لهذا المنتج إلى سلتك.</p>}
        <div className="grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-2 rounded-xl bg-secondary/40 p-3"><Check className="h-4 w-4 shrink-0 text-primary" /><span>وحدة البيع: {unit}</span></div>
          <div className="flex items-center gap-2 rounded-xl bg-secondary/40 p-3"><Check className="h-4 w-4 shrink-0 text-primary" /><span>{unavailable ? "غير متوفر الآن" : "متاح للإضافة للسلة"}</span></div>
        </div>
      </section>
      </div>

      {product.category_id && (
        <SimilarProducts categoryId={product.category_id} excludeId={product.id} isSubstitute={unavailable} />
      )}

      <Accordion type="multiple" defaultValue={["description"]} className="mx-auto mt-8 max-w-4xl rounded-3xl border border-border bg-card px-5 sm:px-7">
        <AccordionItem value="description">
          <AccordionTrigger className="text-base font-bold">الوصف</AccordionTrigger>
          <AccordionContent className="leading-relaxed text-muted-foreground">
            {product.description_ar || product.description || "لا يوجد وصف لهذا المنتج حتى الآن."}
          </AccordionContent>
        </AccordionItem>
        {product.cooking_tip && (
          <AccordionItem value="tip">
            <AccordionTrigger className="text-base font-bold">نصيحة الاستخدام</AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">
              {product.cooking_tip}
            </AccordionContent>
          </AccordionItem>
        )}
        <AccordionItem value="details">
          <AccordionTrigger className="text-base font-bold">تفاصيل البيع</AccordionTrigger>
          <AccordionContent className="space-y-1 text-muted-foreground">
            <p>وحدة البيع: {unit}</p>
            <p>{weighted ? "يُباع بالوزن — قد يختلف الوزن الفعلي قليلاً عند التجهيز." : "يُباع بالقطعة."}</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {!unavailable && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 p-3 shadow-[0_-8px_32px_-20px_rgba(0,0,0,0.35)] backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} step={step} min={min} max={max} unit={unit} />
            <Button className="h-11 flex-1 rounded-2xl font-black" onClick={(e) => void add(e.currentTarget)} disabled={isAdding || limitReached}>
              <ShoppingBag className="me-1 h-5 w-5" />
            <span>{isAdding ? "جارٍ التحقق…" : "أضف"}</span>
              <span dir="ltr" className="tabular-nums">{fmt(product.price_per_unit * qty)} <bdi dir="rtl">ج.م</bdi></span>
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

function SimilarProducts({ categoryId, excludeId, isSubstitute }: { categoryId: string; excludeId: string; isSubstitute: boolean }) {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["similar", categoryId, excludeId],
    queryFn: () => fetchSimilar(categoryId, excludeId),
  });

  return (
    <section className="mx-4 mt-6 rounded-3xl border border-border bg-card p-4" aria-labelledby="similar-h">
      <div className="mb-3 flex items-center gap-2">
        <PackageX className="h-5 w-5 text-destructive" />
        <h2 id="similar-h" className="font-bold">{isSubstitute ? "بدائل متاحة من نفس القسم" : "منتجات قد تناسبك من نفس القسم"}</h2>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">تعذر تحميل المنتجات المشابهة الآن.</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد بدائل متوفرة في هذا القسم حالياً.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.map((p) => (
            <li key={p.id}>
              <Link
                to="/products/$productId"
                params={{ productId: p.id }}
                className="block overflow-hidden rounded-2xl border border-border hover:border-primary"
              >
                <div className="aspect-square bg-secondary">
                  {p.image_url && (
                    <img src={p.image_url} alt={p.name_ar || p.name} loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 text-xs font-bold">{p.name_ar || p.name}</p>
                  <p dir="ltr" className="text-left text-sm font-black text-primary tabular-nums">
                    {fmt(Number(p.price_per_unit))} ج.م
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
