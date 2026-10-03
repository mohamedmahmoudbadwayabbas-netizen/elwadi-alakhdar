import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, PackageX, SearchX, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-loose";
import { useCart, type Product } from "@/lib/cart-context";
import { PRODUCT_COLUMNS } from "@/lib/store-data-hooks";
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
    .select(`${PRODUCT_COLUMNS},unit`)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const r: any = data;
  return {
    ...r,
    price_per_unit: Number(r.price_per_unit ?? 0),
    old_price: r.old_price == null ? null : Number(r.old_price),
    stock_quantity: Number(r.stock_quantity ?? 0),
    is_by_weight: Boolean(r.is_by_weight),
  };
}

async function fetchSimilar(categoryId: string, excludeId: string): Promise<PageProduct[]> {
  const { data } = await supabase
    .from("products")
    .select("id,name,price_per_unit,image_url,unit_label,is_by_weight,stock_quantity,unit")
    .eq("category_id", categoryId)
    .neq("id", excludeId)
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false })
    .limit(6);
  return (data ?? []) as PageProduct[];
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
      <span className="text-sm font-bold text-muted-foreground">EGP / {unitText(product)}</span>
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
          {fmt(qty)} × {fmt(product.price_per_unit)} = {fmt(product.price_per_unit * qty)} EGP
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
        {fmt(value)} <span className="text-xs text-muted-foreground">{unit}</span>
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
  const { data: product, isLoading } = useQuery({
    queryKey: ["product-page", productId],
    queryFn: () => fetchProduct(productId),
  });

  if (isLoading) return <LoadingState />;
  if (!product) return <NotFoundState />;
  const unavailable = (product.stock_quantity ?? 0) <= 0;
  return <ReadyState key={product.id} product={product} unavailable={unavailable} />;
}

function LoadingState() {
  return (
    <main dir="rtl" className="mx-auto max-w-3xl space-y-4 p-4" aria-busy="true">
      <Skeleton className="aspect-square w-full rounded-3xl" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-9 w-1/3" />
      <Skeleton className="h-24 w-full" />
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

function ReadyState({ product, unavailable }: { product: PageProduct; unavailable: boolean }) {
  const { addItem } = useCart();
  const weighted = product.is_by_weight;
  const step = weighted ? 0.25 : 1;
  const min = weighted ? 0.25 : 1;
  const max = Math.max(min, product.stock_quantity ?? 99);
  const [qty, setQty] = useState(weighted ? 0.5 : 1);
  const unit = unitText(product);

  const add = (el: HTMLElement) => {
    addItem(product, qty, weighted ? { selected_weight: qty, selected_weight_label: `${fmt(qty)} ${unit}` } : undefined);
    flyToCart(el);
    toast.success("تمت الإضافة للسلة", { description: `${product.name} (${fmt(qty)} ${unit})` });
  };

  return (
    <main dir="rtl" className="mx-auto max-w-3xl pb-40 md:pb-10">
      <nav className="flex items-center gap-1 px-4 py-3 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">الرئيسية</Link>
        <ChevronRight className="h-3 w-3 rotate-180" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="relative mx-4 aspect-square overflow-hidden rounded-3xl border border-border bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className={`h-full w-full object-cover ${unavailable ? "opacity-50 grayscale" : ""}`}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-6xl">🌿</div>
        )}
        {unavailable && (
          <span className="absolute top-3 start-3 rounded-full bg-destructive px-3 py-1 text-xs font-black text-destructive-foreground">
            نفدت الكمية
          </span>
        )}
      </div>

      <section className="space-y-3 px-4 pt-5">
        <h1 className="font-display text-2xl font-bold leading-snug">{product.name}</h1>
        <PriceBlock product={product} qty={unavailable ? 1 : qty} />
        {!unavailable && (
          <div className="hidden items-center gap-3 pt-2 md:flex">
            <QuantityStepper value={qty} onChange={setQty} step={step} min={min} max={max} unit={unit} />
            <Button className="h-11 flex-1 rounded-2xl text-base font-black" onClick={(e) => add(e.currentTarget)}>
              <ShoppingBag className="me-2 h-5 w-5" /> أضف إلى السلة
            </Button>
          </div>
        )}
      </section>

      {unavailable && product.category_id && (
        <SimilarProducts categoryId={product.category_id} excludeId={product.id} />
      )}

      <Accordion type="multiple" defaultValue={["description"]} className="mt-6 px-4">
        <AccordionItem value="description">
          <AccordionTrigger className="text-base font-bold">الوصف</AccordionTrigger>
          <AccordionContent className="leading-relaxed text-muted-foreground">
            {product.description || "لا يوجد وصف لهذا المنتج حتى الآن."}
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
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} step={step} min={min} max={max} unit={unit} />
            <Button className="h-11 flex-1 rounded-2xl font-black" onClick={(e) => add(e.currentTarget)}>
              <ShoppingBag className="me-1 h-5 w-5" />
              <span>أضف</span>
              <span dir="ltr" className="tabular-nums">{fmt(product.price_per_unit * qty)} EGP</span>
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

function SimilarProducts({ categoryId, excludeId }: { categoryId: string; excludeId: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["similar", categoryId, excludeId],
    queryFn: () => fetchSimilar(categoryId, excludeId),
  });

  return (
    <section className="mx-4 mt-6 rounded-3xl border border-border bg-card p-4" aria-labelledby="similar-h">
      <div className="mb-3 flex items-center gap-2">
        <PackageX className="h-5 w-5 text-destructive" />
        <h2 id="similar-h" className="font-bold">هذا المنتج غير متوفر حالياً — جرّب بدائل من نفس القسم</h2>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
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
                    <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 text-xs font-bold">{p.name}</p>
                  <p dir="ltr" className="text-left text-sm font-black text-primary tabular-nums">
                    {fmt(Number(p.price_per_unit))} EGP
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
