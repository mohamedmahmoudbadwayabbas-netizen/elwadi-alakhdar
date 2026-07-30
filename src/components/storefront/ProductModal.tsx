import { NumberInput } from "@/components/ui/number-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/cart-context";
import { useCart, lineSubtotal } from "@/lib/cart-context";
import { toast } from "sonner";
import { flyToCart } from "@/lib/fly-to-cart";

export function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => { if (product) setQty(product.is_by_weight ? 0.5 : 1); }, [product]);

  if (!product) return null;
  const step = product.is_by_weight ? 0.25 : 1;
  const min = product.is_by_weight ? 0.25 : 1;
  const outOfStock = (product.stock_quantity ?? 1) <= 0;

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:rounded-3xl" dir="rtl">
        <div className="relative aspect-[5/3] w-full overflow-hidden bg-secondary">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-6xl">🌿</div>
          )}
          {product.is_on_sale && (
            <span className="absolute top-3 start-3 rounded-full sale-gradient px-3 py-1 text-xs font-black text-sale-foreground shadow">
              عرض خاص
            </span>
          )}
        </div>
        <div className="p-5">
          <DialogHeader className="space-y-1 text-start">
            <DialogTitle className="font-display text-xl font-bold">{product.name}</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {product.is_by_weight ? `السعر: ${product.price_per_unit.toFixed(2)} ج.م / كجم` : product.unit_label}
            </p>
          </DialogHeader>

          {product.description && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          {product.is_by_weight && (
            <div className="mt-4">
              <label className="mb-2 block text-xs font-bold text-foreground">
                أدخل الوزن المطلوب (جرام)
              </label>
              <div className="flex items-center gap-2">
                <NumberInput
                  decimal={false}
                  value={Math.round(qty * 1000)}
                  onValueChange={(v) => {
                    const g = Math.max(0, parseInt(v || "0", 10) || 0);
                    setQty(+(g / 1000).toFixed(3));
                  }}
                  className="h-11 flex-1 text-center text-base font-bold"
                  placeholder="مثال: 500"
                />
                <span className="rounded-xl bg-secondary/50 px-3 py-2 text-xs font-bold text-muted-foreground">جرام</span>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                يمكنك إدخال أي وزن (مثلاً 350 جرام، 750 جرام، 1200 جرام...)
              </p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="font-display text-2xl font-bold text-primary">
                {lineSubtotal(product, qty).toFixed(2)}
                <span className="ms-1 text-xs font-bold text-muted-foreground">ج.م</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {product.is_by_weight ? `${(qty * 1000).toFixed(0)} جرام` : `${qty} ${product.unit_label}`}
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
              <Button aria-label="تقليل الكمية" variant="ghost" size="icon" className="h-8 w-8 rounded-full"
                onClick={() => setQty((q) => Math.max(min, +(q - step).toFixed(3)))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-14 text-center text-sm font-black">
                {product.is_by_weight ? (qty >= 1 ? `${qty} كجم` : `${qty * 1000}جم`) : qty}
              </span>
              <Button aria-label="زيادة الكمية" variant="ghost" size="icon" className="h-8 w-8 rounded-full"
                onClick={() => setQty((q) => +(q + step).toFixed(3))}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
  disabled={outOfStock}
  className="mt-5 h-12 w-full rounded-2xl hero-gradient text-base font-black text-primary-foreground shadow-card hover:opacity-95"
  onClick={(e) => {
    addItem(product, qty);
    flyToCart(e.currentTarget);
    toast.success("تمت الإضافة للسلة");
    onClose();
  }}
>
            }}
          >
            <ShoppingBag className="me-2 h-5 w-5" />
            {outOfStock ? "نفدت الكمية" : "أضف إلى السلة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
