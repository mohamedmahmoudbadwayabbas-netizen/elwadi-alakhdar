import { Plus } from "lucide-react";
import type { Product } from "@/lib/cart-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

export function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const { addItem } = useCart();
  const discount =
    product.old_price && product.old_price > product.price_per_unit
      ? Math.round(((product.old_price - product.price_per_unit) / product.old_price) * 100)
      : 0;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <button onClick={() => onOpen(product)} className="relative aspect-square overflow-hidden bg-secondary">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl">🛍️</div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 start-2 rounded-full sale-gradient px-2 py-0.5 text-[10px] font-black text-sale-foreground shadow">
            خصم {discount}%
          </span>
        )}
        {product.is_popular && (
          <span className="absolute top-2 end-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-accent-foreground shadow">
            الأكثر مبيعاً
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <button onClick={() => onOpen(product)} className="text-start">
          <h4 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{product.name}</h4>
        </button>
        <div className="text-[11px] text-muted-foreground">{product.unit_label}</div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="min-w-0">
            <div className="text-base font-black text-primary">
              {product.price_per_unit.toFixed(2)}
              <span className="ms-0.5 text-[10px] font-bold text-muted-foreground"> ج.م</span>
            </div>
            {product.old_price && (
              <div className="text-[11px] text-muted-foreground line-through">{product.old_price.toFixed(2)}</div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              addItem(product, product.is_by_weight ? 0.5 : 1);
              toast.success("تمت الإضافة للسلة", { description: product.name });
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hero-gradient text-primary-foreground shadow-card transition-transform active:scale-90"
            aria-label="أضف للسلة"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
