import { Plus, Flame, Award, Star, Eye } from "lucide-react";
import type { Product } from "@/lib/cart-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const { addItem } = useCart();
  const discount =
    product.old_price && product.old_price > product.price_per_unit
      ? Math.round(((product.old_price - product.price_per_unit) / product.old_price) * 100)
      : 0;
  const outOfStock = (product.stock_quantity ?? 1) <= 0;
  const featured = product.is_featured || product.is_popular;

  const displayPrice = product.is_by_weight ? product.price_per_unit / 2 : product.price_per_unit;
  const displayUnit = product.is_by_weight ? "/ ½ كجم" : `/ ${product.unit_label}`;

  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card",
      "shadow-[0_2px_10px_-3px_oklch(0.40_0.12_150_/_0.10)]",
      "transition-all duration-300 ease-out",
      "hover:-translate-y-1.5 hover:scale-[1.02] hover:border-primary/30",
      "hover:shadow-[0_14px_36px_-10px_oklch(0.40_0.14_150_/_0.20)]",
      "active:scale-[0.98] active:shadow-[0_2px_8px_-3px_oklch(0.40_0.12_150_/_0.15)]",
    )}>
      <button onClick={() => onOpen(product)} className="relative aspect-square overflow-hidden bg-secondary" aria-label={`عرض ${product.name}`}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl">🌿</div>
        )}
        <div className="absolute inset-0 bg-primary/0 transition-colors duration-300 group-hover:bg-primary/5" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-primary shadow-lg backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5" />
            عرض التفاصيل
          </div>
        </div>
        {discount > 0 && (
          <span className="absolute start-2 top-2 rounded-full sale-gradient px-2 py-0.5 text-[10px] font-black text-sale-foreground shadow">
            خصم {discount}%
          </span>
        )}
        {featured && (
          <span className="absolute end-2 top-2 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-accent-foreground shadow">
            {product.is_featured ? <Award className="h-2.5 w-2.5" /> : <Flame className="h-2.5 w-2.5" />}
            الأكثر مبيعاً
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
            <span className="rounded-full bg-destructive px-3 py-1 text-xs font-black text-destructive-foreground">نفدت الكمية</span>
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link to="/products/$productId" params={{ productId: product.id }} className="text-start" onClick={(e) => e.stopPropagation()}>
          <h4 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h4>
        </Link>
        <div className="text-[11px] text-muted-foreground">
          {product.is_by_weight ? `${product.price_per_unit.toFixed(2)} ج.م / كجم` : product.unit_label}
        </div>
        {(product as any).avg_rating ? (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-amber-600">{Number((product as any).avg_rating).toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground">({(product as any).review_count ?? 0})</span>
          </div>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            <div className="font-display text-base font-bold text-primary">
              {displayPrice.toFixed(2)}
              <span className="ms-0.5 text-[10px] font-bold text-muted-foreground"> ج.م</span>
            </div>
            {discount > 0 && product.old_price && (
              <div className="text-[10px] text-muted-foreground line-through">
                {(product.is_by_weight ? product.old_price / 2 : product.old_price).toFixed(2)} ج.م
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">{displayUnit}</div>
          </div>
          <button
            disabled={outOfStock}
            onClick={(e) => {
              e.stopPropagation();
              addItem(product, product.is_by_weight ? 0.5 : 1);
              toast.success("تمت الإضافة للسلة", { description: product.name });
            }}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-xl hero-gradient",
              "text-primary-foreground shadow-card transition-all duration-200",
              "hover:scale-110 hover:shadow-[0_6px_18px_-4px_oklch(0.45_0.13_152_/_0.45)]",
              "active:scale-90 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40",
            )}
            aria-label="أضف للسلة"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}