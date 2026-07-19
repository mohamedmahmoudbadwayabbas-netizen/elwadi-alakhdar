import { Plus, Minus, Trash2, Flame, Award, Star, Eye } from "lucide-react";
import type { Product } from "@/lib/cart-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { flyToCart } from "@/lib/fly-to-cart";

export function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const { addItem, updateQuantity, removeItem, items } = useCart();
  const inCart = items.find((i) => i.product.id === product.id);
  const qty = inCart?.quantity ?? 0;

  const discount = product.old_price && product.old_price > product.price_per_unit
      ? Math.round(((product.old_price - product.price_per_unit) / product.old_price) * 100) : 0;
  
  const outOfStock = (product.stock_quantity ?? 1) <= 0;
  const step = product.is_by_weight ? 0.5 : 1;
  const displayPrice = product.is_by_weight ? product.price_per_unit / 2 : product.price_per_unit;
  const displayUnit = product.is_by_weight ? "/ ½ كجم" : `/ ${product.unit_label}`;

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addItem(product, step);
    flyToCart(e.currentTarget);
    toast.success("تمت الإضافة للسلة", { description: product.name });
  };

  const handleInc = (e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); addItem(product, step); flyToCart(e.currentTarget); };
  const handleDec = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = +(qty - step).toFixed(3);
    if (next <= 0) removeItem(product.id);
    else updateQuantity(product.id, next);
  };

  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-3xl border border-emerald-100 bg-white",
      "shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500",
      "hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl",
    )}>
      {/* منطقة الصورة */}
      <button onClick={() => onOpen(product)} className="relative aspect-[4/3] overflow-hidden bg-emerald-50">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-emerald-100/50 text-4xl">🌿</div>
        )}
        
        {/* شارة الخصم والمميز */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {discount > 0 && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">خصم {discount}%</span>}
            {(product.is_featured || product.is_popular) && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    <Award className="h-3 w-3" /> مميز
                </span>
            )}
        </div>
      </button>

      {/* تفاصيل المنتج */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link to="/products/$productId" params={{ productId: product.id }} className="block" onClick={(e) => e.stopPropagation()}>
          <h4 className="line-clamp-1 text-sm font-bold text-slate-800 hover:text-emerald-700">{product.name}</h4>
        </Link>
        
        <div className="flex items-center justify-between">
            <div className="font-black text-emerald-800 text-lg">
                {displayPrice.toFixed(2)} <span className="text-xs font-medium text-slate-500">ج.م {displayUnit}</span>
            </div>
        </div>

        {/* زر الإضافة */}
        <div className="mt-auto pt-3">
          {qty > 0 ? (
            <div className="flex h-10 items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-2">
              <button onClick={handleDec} className="text-emerald-700"><Minus className="h-4 w-4" /></button>
              <span className="text-sm font-black text-emerald-900">{product.is_by_weight ? `${qty} كجم` : qty}</span>
              <button onClick={handleInc} className="text-emerald-700"><Plus className="h-4 w-4" /></button>
            </div>
          ) : (
            <button
              disabled={outOfStock}
              onClick={handleAdd}
              className="w-full h-10 rounded-2xl bg-emerald-600 text-white font-bold transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {outOfStock ? "نفدت الكمية" : "أضف للسلة"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
