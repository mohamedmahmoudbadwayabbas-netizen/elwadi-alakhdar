import { Plus, Minus, Award, Heart, ShoppingCart, Flame, Scale, Sparkles, Leaf } from "lucide-react";
import type { Product } from "@/lib/cart-context";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { flyToCart } from "@/lib/fly-to-cart";
import { useState } from "react";

export function ProductCard({
  product,
  onOpen,
  isTopSeller,
}: {
  product: Product;
  onOpen: (p: Product) => void;
  isTopSeller?: boolean;
}) {
  const { addItem, updateQuantity, removeItem, items } = useCart();
  const inCart = items.find((i) => i.product.id === product.id);
  const qty = inCart?.quantity ?? 0;
  const [isLiked, setIsLiked] = useState(false);

  const isTopSellerActive = Boolean(
    isTopSeller ??
      product.isTopSeller ??
      product.is_top_seller ??
      product.is_featured,
  );

  const discount =
    product.old_price && product.old_price > product.price_per_unit
      ? Math.round(((product.old_price - product.price_per_unit) / product.old_price) * 100)
      : 0;

  const outOfStock = (product.stock_quantity ?? 1) <= 0;
  const step = product.is_by_weight ? 0.5 : 1;
  const displayPrice = product.is_by_weight ? product.price_per_unit / 2 : product.price_per_unit;
  const displayUnit = product.is_by_weight ? "/ ½ كجم" : `/ ${product.unit_label ?? "قطعة"}`;

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>, customWeight?: number) => {
    e.stopPropagation();
    const amount = customWeight ?? step;
    addItem(product, amount);
    flyToCart(e.currentTarget);
    toast.success("تمت الإضافة للسلة 🛒", {
      description: `${product.name} (${product.is_by_weight ? (amount >= 1 ? `${amount} كجم` : `${amount * 1000} جم`) : `${amount} ${product.unit_label ?? "قطعة"}`})`,
    });
  };

  const handleQuickWeightSelect = (e: React.MouseEvent, weight: number) => {
    e.stopPropagation();
    if (qty > 0) {
      updateQuantity(product.id, weight);
      toast.success("تم تحديث الوزن في السلة ⚖️", {
        description: `${product.name}: ${weight >= 1 ? `${weight} كجم` : `${weight * 1000} جم`}`,
      });
    } else {
      addItem(product, weight);
      flyToCart(e.currentTarget as HTMLElement);
      toast.success("تمت الإضافة للسلة بالوزن المحدد ⚖️", {
        description: `${product.name}: ${weight >= 1 ? `${weight} كجم` : `${weight * 1000} جم`}`,
      });
    }
  };

  const handleInc = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addItem(product, step);
    flyToCart(e.currentTarget);
  };
  const handleDec = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = +(qty - step).toFixed(3);
    if (next <= 0) removeItem(product.id);
    else updateQuantity(product.id, next);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    if (!isLiked) {
      toast.success("تمت الإضافة للمفضلة ❤️", { description: product.name });
    } else {
      toast.info("تمت الإزالة من المفضلة");
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-emerald-100/80 bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl dark:border-emerald-900/30",
      )}
    >
      {/* منطقة الصورة */}
      <div
        onClick={() => onOpen(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(product);
          }
        }}
        className="relative aspect-[4/3] w-full overflow-hidden bg-emerald-50/50 dark:bg-emerald-950/30 cursor-pointer"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-emerald-100/50 text-4xl">🌿</div>
        )}

        {/* تدرج ظلي خفيف لتعزيز وضوح الشارات */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-80" />

        {/* شارة الخصم والأكثر مبيعاً والمميز */}
        <div className="absolute top-2.5 start-2.5 z-10 flex flex-wrap gap-1.5">
          {isTopSellerActive && (
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-md">
              <Flame className="h-3 w-3" /> الأكثر مبيعاً
            </span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-gradient-to-r from-rose-600 to-pink-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-md">
              خصم {discount}%
            </span>
          )}
          {product.is_popular && !isTopSellerActive && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
              <Award className="h-3 w-3" /> مميز
            </span>
          )}
        </div>

        {/* زر المفضلة */}
        <button
          onClick={toggleWishlist}
          aria-label="إضافة للمفضلة"
          className={cn(
            "absolute top-2.5 end-2.5 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-all hover:scale-110 shadow-sm",
            isLiked
              ? "text-rose-500 fill-rose-500"
              : "text-slate-600 dark:text-slate-300 hover:text-rose-500",
          )}
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        </button>

        {/* شارات منتجات الوزن والطزاجة */}
        {product.is_by_weight && (
          <div className="absolute bottom-2 start-2 z-10 flex flex-wrap gap-1">
            <span className="flex items-center gap-1 rounded-lg bg-emerald-950/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-emerald-200 border border-emerald-400/30 shadow-xs">
              <Scale className="h-3 w-3 text-emerald-400" /> يباع بالوزن
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-amber-950/80 backdrop-blur-md px-1.5 py-0.5 text-[10px] font-bold text-amber-200 border border-amber-400/30">
              <Leaf className="h-2.5 w-2.5 text-amber-400" /> طازج يومياً
            </span>
          </div>
        )}
      </div>

      {/* تفاصيل المنتج */}
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <Link
          to="/products/$productId"
          params={{ productId: product.id }}
          className="block"
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="line-clamp-2 min-h-[2.25rem] text-xs font-bold leading-snug text-foreground sm:text-sm hover:text-emerald-600 transition-colors">
            {product.name}
          </h4>
        </Link>

        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">
              {displayPrice.toFixed(2)}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              ج.م {displayUnit}
            </span>
          </div>
          {product.old_price && product.old_price > product.price_per_unit && (
            <span className="text-xs text-muted-foreground line-through decoration-rose-500/70">
              {product.old_price.toFixed(2)}
            </span>
          )}
        </div>

        {/* خيارات التحديد السريع للوزن في البطاقة (Quick Weight Chips) */}
        {product.is_by_weight && (
          <div className="flex items-center justify-between gap-1 pt-1">
            <span className="text-[10px] font-extrabold text-muted-foreground">تحديد سريع:</span>
            <div className="flex items-center gap-1">
              {[
                { label: "250 جم", val: 0.25 },
                { label: "500 جم", val: 0.5 },
                { label: "1 كجم", val: 1 },
              ].map((w) => (
                <button
                  key={w.val}
                  onClick={(e) => handleQuickWeightSelect(e, w.val)}
                  className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all active:scale-95",
                    qty === w.val
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-secondary/70 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-foreground border-border/60",
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* زر الإضافة */}
        <div className="mt-auto pt-2">
          {qty > 0 ? (
            <div className="flex h-10 items-center justify-between rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800 px-2 shadow-xs">
              <button
                onClick={handleDec}
                className="grid h-7 w-7 place-items-center rounded-xl text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200/50 transition"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-100">
                {product.is_by_weight
                  ? qty >= 1
                    ? `${qty} كجم`
                    : `${Math.round(qty * 1000)} جم`
                  : qty}
              </span>
              <button
                onClick={handleInc}
                className="grid h-7 w-7 place-items-center rounded-xl text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200/50 transition"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              disabled={outOfStock}
              onClick={handleAdd}
              className="flex w-full h-10 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              {outOfStock ? "نفدت الكمية" : "أضف للسلة"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
