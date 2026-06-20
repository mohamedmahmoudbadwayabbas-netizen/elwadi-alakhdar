import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/cart-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

export function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) setQty(product.is_by_weight ? 0.5 : 1);
  }, [product]);

  if (!product) return null;
  const step = product.is_by_weight ? 0.25 : 1;
  const min = product.is_by_weight ? 0.25 : 1;

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:rounded-3xl" dir="rtl">
        <div className="relative aspect-[5/3] w-full overflow-hidden bg-secondary">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-6xl">🛍️</div>
          )}
          {product.is_on_sale && (
            <span className="absolute top-3 start-3 rounded-full sale-gradient px-3 py-1 text-xs font-black text-sale-foreground shadow">
              عرض خاص
            </span>
          )}
        </div>
        <div className="p-5">
          <DialogHeader className="space-y-1 text-start">
            <DialogTitle className="text-xl font-black">{product.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">{product.unit_label}</p>
          </DialogHeader>

          {product.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-primary">
                {(product.price_per_unit * qty).toFixed(2)}
                <span className="ms-1 text-xs font-bold text-muted-foreground">ج.م</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {product.price_per_unit.toFixed(2)} ج.م / {product.unit_label}
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQty((q) => Math.max(min, +(q - step).toFixed(2)))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-12 text-center text-sm font-black">
                {qty}{product.is_by_weight ? " كجم" : ""}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setQty((q) => +(q + step).toFixed(2))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            className="mt-5 h-12 w-full rounded-2xl hero-gradient text-base font-black text-primary-foreground shadow-card hover:opacity-95"
            onClick={() => {
              addItem(product, qty);
              toast.success("تمت الإضافة للسلة");
              onClose();
            }}
          >
            <ShoppingBag className="me-2 h-5 w-5" />
            أضف إلى السلة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
