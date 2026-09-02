import {
  Plus,
  Minus,
  Award,
  Heart,
  ShoppingCart,
  Flame,
  Scale,
  Sparkles,
  Leaf,
  Eye,
} from "lucide-react";
import type { Product } from "@/lib/cart-context";
import {
  useCart,
  WEIGHT_OPTIONS,
  formatWeightLabel,
  calculateEstimatedPrice,
} from "@/lib/cart-context";
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
  onOpen?: (p: Product) => void;
  isTopSeller?: boolean;
}) {
  const { addItem, updateQuantity, updateItemWeight, removeItem, items } = useCart();
  const inCart = items.find((i) => i.product.id === product.id);
  const qty = inCart?.quantity ?? 0;
  const [isLiked, setIsLiked] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<number>(
    inCart?.selected_weight ?? (product.is_by_weight ? 0.5 : 1),
  );

  const isTopSellerActive = Boolean(
    isTopSeller ?? product.isTopSeller ?? product.is_top_seller ?? product.is_popular,
  );

  const discount =
    product.old_price && product.old_price > product.price_per_unit
      ? Math.round(((product.old_price - product.price_per_unit) / product.old_price) * 100)
      : 0;

  const outOfStock = (product.stock_quantity ?? 1) <= 0;
  const step = product.is_by_weight ? 0.25 : 1;

  // Dynamic estimated price calculation
  const currentEstPrice = product.is_by_weight
    ? calculateEstimatedPrice(product, selectedWeight)
    : product.price_per_unit;

  const displayUnit = product.is_by_weight
    ? `/ ${formatWeightLabel(selectedWeight)}`
    : `/ ${product.unit_label ?? "قطعة"}`;

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const amount = product.is_by_weight ? selectedWeight : 1;
    const label = product.is_by_weight
      ? formatWeightLabel(selectedWeight)
      : `${amount} ${product.unit_label ?? "قطعة"}`;

    addItem(product, amount, {
      selected_weight: product.is_by_weight ? selectedWeight : undefined,
      selected_weight_label: product.is_by_weight ? label : undefined,
    });
    flyToCart(e.currentTarget);
    toast.success("تمت الإضافة للسلة 🛒", {
      description: `${product.name} (${label} — ${calculateEstimatedPrice(product, amount).toFixed(2)} ج.م)`,
    });
  };

  const handleQuickWeightSelect = (e: React.MouseEvent, weight: number, label: string) => {
    e.stopPropagation();
    setSelectedWeight(weight);
    if (qty > 0) {
      updateItemWeight(product.id, weight);
      toast.success("تم تحديث الوزن في السلة ⚖️", {
        description: `${product.name}: ${label} (≈ ${calculateEstimatedPrice(product, weight).toFixed(2)} ج.م)`,
      });
    }
  };

  const handleInc = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (product.is_by_weight) {
      const next = +(qty + 0.25).toFixed(3);
      updateItemWeight(product.id, next);
      setSelectedWeight(next);
    } else {
      addItem(product, 1);
    }
    flyToCart(e.currentTarget);
  };

  const handleDec = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = +(qty - step).toFixed(3);
    if (next <= 0) {
      removeItem(product.id);
      toast.info("تمت إزالة المنتج من السلة");
    } else {
      if (product.is_by_weight) {
        updateItemWeight(product.id, next);
        setSelectedWeight(next);
      } else {
        updateQuantity(product.id, next);
      }
    }
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
        "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/40 bg-card text-card-foreground transition-all duration-300 hover:border-[#036233]/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]",
      )}
    >
      {/* منطقة الصورة */}
      <div className="relative aspect-square w-full overflow-hidden bg-emerald-50/30 dark:bg-emerald-950/20">
        <Link
          to="/products/$productId"
          params={{ productId: product.id }}
          className="block h-full w-full"
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
            <div className="grid h-full w-full place-items-center bg-emerald-100/30 text-4xl">
              🌿
            </div>
          )}
        </Link>

        {/* تدرج ظلي خفيف لتعزيز وضوح الشارات */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/25 via-transparent to-transparent opacity-80" />

        {/* شارة الخصم والأكثر مبيعاً */}
        <div className="absolute top-2.5 start-2.5 z-10 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-[#E55300] px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
              خصم {discount}%
            </span>
          )}
          {isTopSellerActive && discount === 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-black text-white shadow-sm">
              <Flame className="h-3 w-3" /> مميز
            </span>
          )}
        </div>

        {/* أزرار الإجراء السريع (المعاينة والمفضلة) */}
        <div className="absolute top-2 end-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={toggleWishlist}
            aria-label="إضافة للمفضلة"
            className={cn(
              "grid h-7 w-7 place-items-center rounded-xl bg-card/90 backdrop-blur-md transition-transform hover:scale-110 shadow-xs",
              isLiked ? "text-rose-500 fill-rose-500" : "text-muted-foreground hover:text-rose-500",
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
          </button>

          {onOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(product);
              }}
              aria-label="نظرة سريعة"
              title="نظرة سريعة"
              className="grid h-7 w-7 place-items-center rounded-xl bg-card/90 backdrop-blur-md text-muted-foreground hover:text-orange-500 transition-transform hover:scale-110 shadow-xs"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* شارات منتجات الوزن */}
        {product.is_by_weight && (
          <div className="absolute bottom-2 start-2 z-10">
            <span className="flex items-center gap-1 rounded-md bg-emerald-950/80 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-bold text-emerald-200 border border-emerald-400/30">
              <Scale className="h-2.5 w-2.5 text-emerald-400" /> بالوزن
            </span>
          </div>
        )}
      </div>

      {/* تفاصيل المنتج */}
      <div className="flex flex-1 flex-col justify-between p-3 gap-2 text-right">
        <div>
          <Link
            to="/products/$productId"
            params={{ productId: product.id }}
            className="block group-hover:text-emerald-600 transition-colors"
          >
            <h4 className="line-clamp-2 min-h-[2rem] text-xs sm:text-sm font-bold leading-snug text-foreground">
              {product.name}
            </h4>
          </Link>

          {/* السعر والوحدة */}
          <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-border/40">
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-black text-[#036233] dark:text-emerald-400">
                {currentEstPrice.toFixed(2)}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">ج.م</span>
              <span className="text-[9px] text-muted-foreground font-semibold ms-0.5">
                {displayUnit}
              </span>
            </div>
            {product.old_price && product.old_price > product.price_per_unit && (
              <span className="text-[10px] text-muted-foreground line-through decoration-[#E55300]/70">
                {(product.old_price * (product.is_by_weight ? selectedWeight : 1)).toFixed(2)} ج.م
              </span>
            )}
          </div>
        </div>

        {/* خيارات التحديد السريع للوزن */}
        {product.is_by_weight && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground">
              <span>اختر الوزن:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                {formatWeightLabel(selectedWeight)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {WEIGHT_OPTIONS.slice(0, 4).map((w) => {
                const isSelected = Math.abs(selectedWeight - w.value) < 0.01;
                return (
                  <button
                    key={w.value}
                    type="button"
                    onClick={(e) => handleQuickWeightSelect(e, w.value, w.label)}
                    className={cn(
                      "px-1 py-0.5 rounded text-[9px] font-bold border transition-all text-center active:scale-95",
                      isSelected
                        ? "bg-[#036233] text-white border-[#036233] shadow-xs"
                        : "bg-secondary/60 hover:bg-[#036233]/5 hover:text-[#036233] text-muted-foreground border-border/50",
                    )}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* زر الإضافة البرتقالي الجذاب أو عداد الكمية */}
        <div className="mt-auto pt-2">
          {qty > 0 ? (
            <div className="flex h-10 items-center justify-between rounded-2xl border border-[#036233]/30 bg-[#036233]/5 dark:bg-[#036233]/10 dark:border-[#036233]/50 px-2 shadow-xs">
              <button
                type="button"
                onClick={handleDec}
                className="grid h-7 w-7 place-items-center rounded-xl bg-white dark:bg-black text-[#036233] hover:bg-[#036233] hover:text-white transition active:scale-90 shadow-sm border border-[#036233]/10"
              >
                <Minus className="h-3 w-3" />
              </button>
              <div className="text-center">
                <span className="text-xs font-black text-[#036233] dark:text-emerald-300 block">
                  {product.is_by_weight ? formatWeightLabel(qty) : `${qty}`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleInc}
                className="grid h-7 w-7 place-items-center rounded-xl bg-[#036233] text-white hover:bg-[#036233]/90 transition active:scale-90 shadow-sm"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAdd}
              className="flex w-full h-10 items-center justify-center gap-1.5 rounded-2xl bg-[#036233] hover:bg-[#036233]/90 text-white font-black text-xs transition-all duration-200 active:scale-95 shadow-[0_4px_14px_rgba(3,98,51,0.25)] disabled:opacity-50 cursor-pointer"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>
                {outOfStock
                  ? "نفدت الكمية"
                  : product.is_by_weight
                    ? `أضف (${formatWeightLabel(selectedWeight)})`
                    : "أضف للسلة"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
