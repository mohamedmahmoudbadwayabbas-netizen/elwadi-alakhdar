import { Plus, Flame, Award, Star, Eye } from "lucide-react";
import type { Product } from "@/lib/cart-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const { addItem } = useCart();
  const [isClicking, setIsClicking] = useState(false);

  const discount =
    product.old_price && product.old_price > product.price_per_unit
      ? Math.round(((product.old_price - product.price_per_unit) / product.old_price) * 100)
      : 0;
  const outOfStock = (product.stock_quantity ?? 1) <= 0;
  const featured = product.is_featured || product.is_popular;

  const displayPrice = product.is_by_weight ? product.price_per_unit / 2 : product.price_per_unit;
  const displayUnit = product.is_by_weight ? "/ ½ كجم" : `/ ${product.unit_label}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClicking(true);
    addItem(product, product.is_by_weight ? 0.5 : 1);
    toast.success("تمت الإضافة للسلة", { description: product.name });
    
    // إعادة إنيميشن الزر بعد انتهاء الحركة
    setTimeout(() => setIsClicking(false), 300);
  };

  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card",
      "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]",
      "transition-all duration-500 ease-out",
      "hover:-translate-y-2 hover:scale-[1.01] hover:border-primary/40",
      "hover:shadow-[0_20px_40px_-15px_oklch(0.40_0.14_150_/_0.15)]",
      "active:scale-[0.99]",
    )}>
      
      {/* منطقة الصورة العلوية */}
      <button 
        onClick={() => onOpen(product)} 
        className="relative aspect-square overflow-hidden bg-secondary/50" 
        aria-label={`عرض ${product.name}`}
      >
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl bg-gradient-to-br from-muted to-secondary">🌿</div>
        )}

        {/* تأثير الوميض السحري الشفاف عند الـ Hover */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
        
        {/* تعتيم خفيف ونبثق زر التفاصيل */}
        <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 backdrop-blur-[2px]" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 z-20">
          <div className="flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-xs font-bold text-primary shadow-xl backdrop-blur-md border border-primary/10 transform transition-transform duration-300 group-hover:translate-y-0 translate-y-2">
            <Eye className="h-4 w-4 animate-pulse" />
            عرض التفاصيل
          </div>
        </div>

        {/* الشارات والخصومات المستديرة مع حركة نبض خفيفة */}
        <div className="absolute top-2.5 inset-x-2.5 flex justify-between items-start pointer-events-none z-20">
          {discount > 0 ? (
            <span className="rounded-full sale-gradient px-2.5 py-1 text-[10px] font-black text-sale-foreground shadow-sm animate-pulse">
              خصم {discount}%
            </span>
          ) : <div />}
          
          {featured && (
            <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-black text-accent-foreground shadow-sm backdrop-blur-sm border border-white/10">
              {product.is_featured ? <Award className="h-3 w-3 text-amber-400 animate-spin-slow" /> : <Flame className="h-3 w-3 text-orange-500 animate-bounce" />}
              الأكثر مبيعاً
            </span>
          )}
        </div>

        {/* حالة نفاد الكمية */}
        {outOfStock && (
          <div className="absolute inset-0 grid place-items-center bg-background/80 backdrop-blur-sm z-30">
            <span className="rounded-full bg-destructive/90 px-4 py-1.5 text-xs font-black text-destructive-foreground shadow-md uppercase tracking-wider">نفدت الكمية</span>
          </div>
        )}
      </button>

      {/* تفاصيل المنتج السفلي */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link 
          to="/products/$productId" 
          params={{ productId: product.id }} 
          className="text-start block group/link" 
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover/link:text-primary group-hover:text-primary/90">
            {product.name}
          </h4>
        </Link>
        
        <div className="text-[11px] font-medium text-muted-foreground/80">
          {product.is_by_weight ? `${product.price_per_unit.toFixed(2)} ج.م / كجم` : product.unit_label}
        </div>

        {/* تقييم النجوم */}
        {(product as any).avg_rating ? (
          <div className="flex items-center gap-1 bg-amber-500/5 self-start px-1.5 py-0.5 rounded-md border border-amber-500/10">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-black text-amber-700">{Number((product as any).avg_rating).toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground">({(product as any).review_count ?? 0})</span>
          </div>
        ) : null}

        {/* السعر وزر الإضافة */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2 border-t border-border/40">
          <div className="min-w-0">
            <div className="font-display text-base font-black tracking-tight text-primary flex items-baseline gap-0.5">
              {displayPrice.toFixed(2)}
              <span className="text-[10px] font-bold text-muted-foreground">ج.م</span>
            </div>
            {discount > 0 && product.old_price && (
              <div className="text-[10px] text-muted-foreground/60 line-through font-medium">
                {(product.is_by_weight ? product.old_price / 2 : product.old_price).toFixed(2)} ج.م
              </div>
            )}
            <div className="text-[10px] font-medium text-muted-foreground/70 mt-0.5">{displayUnit}</div>
          </div>

          <button
            disabled={outOfStock}
            onClick={handleAddToCart}
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl hero-gradient",
              "text-primary-foreground shadow-md transition-all duration-300 ease-out",
              "hover:scale-110 hover:shadow-[0_8px_20px_-4px_oklch(0.45_0.13_152_/_0.40)]",
              "active:scale-95 disabled:cursor-not-allowed disabled:opacity-30",
              isClicking && "animate-ping-once scale-90"
            )}
            aria-label="أضف للسلة"
          >
            <Plus className={cn("h-5 w-5 transition-transform duration-300", isClicking && "rotate-90 scale-75")} />
          </button>
        </div>
      </div>
    </div>
  );
}
