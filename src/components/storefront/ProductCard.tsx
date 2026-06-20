import { Plus, Flame, Award } from "lucide-react";
import type { Product } from "@/lib/cart-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

export function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const { addItem } = useCart();
  const discount =
    product.old_price && product.old_price > product.price_per_unit
      ? Math.round(((product.old_price - product.price_per_unit) / product.old_price) * 100)
      : 0;
  const outOfStock = (product.stock_quantity ?? 1) <= 0;
  const featured = product.is_featured || product.is_popular;

  // For weight items, show price per 500g as the "card price" to keep numbers approachable.
  const displayPrice = product.is_by_weight ? product.price_per_unit / 2 : product.price_per_unit;
  const displayUnit = product.is_by_weight ? "/ ½ كجم" : `/ ${product.unit_label}`;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift">
      <button onClick={() => onOpen(product)} className="relative aspect-square overflow-hidden bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl">🌿</div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 start-2 rounded-full sale-gradient px-2 py-0.5 text-[10px] font-black text-sale-foreground shadow">
            خصم {discount}%
          </span>
        )}
        {featured && (
          <span className="absolute top-2 end-2 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-accent-foreground shadow">
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
        <button onClick={() => onOpen(product)} className="text-start">
          <h4 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{product.name}</h4>
        </button>
        <div className="text-[11px] text-muted-foreground">
          {product.is_by_weight ? `${product.price_per_unit.toFixed(2)} ج.م / كجم` : product.unit_label}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            <div className="font-display text-base font-bold text-primary">
              {displayPrice.toFixed(2)}
              <span className="ms-0.5 text-[10px] font-bold text-muted-foreground"> ج.م</span>
            </div>
            <div className="text-[10px] text-muted-foreground">{displayUnit}</div>
          </div>
          <button
            disabled={outOfStock}
            onClick={(e) => {
              e.stopPropagation();
              addItem(product, product.is_by_weight ? 0.5 : 1);
              toast.success("تمت الإضافة للسلة", { description: product.name });
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hero-gradient text-primary-foreground shadow-card transition-all hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="أضف للسلة"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
