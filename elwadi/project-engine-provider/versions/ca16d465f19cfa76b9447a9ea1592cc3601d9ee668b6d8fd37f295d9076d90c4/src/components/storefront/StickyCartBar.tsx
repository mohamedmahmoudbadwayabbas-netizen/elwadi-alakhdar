import { ShoppingBag, ChevronLeft } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

export function StickyCartBar() {
  const { items, totalPrice, totalCount, setOpen } = useCart();

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 inset-x-4 z-50 md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:w-[420px]",
        "animate-in slide-in-from-bottom-4 duration-300",
      )}
    >
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3.5",
          "rounded-2xl hero-gradient text-primary-foreground",
          "shadow-[0_8px_30px_-4px_oklch(0.40_0.14_150_/_0.45)]",
          "transition-all duration-200 active:scale-[0.98]",
        )}
      >
        {/* عدد المنتجات */}
        <div className="flex items-center gap-2.5">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/20">
            <ShoppingBag className="h-4.5 w-4.5" />
            <span className="absolute -end-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-[10px] font-black text-accent-foreground shadow">
              {totalCount}
            </span>
          </div>
          <span className="text-sm font-bold">
            {items.length} {items.length === 1 ? "منتج" : "منتجات"}
          </span>
        </div>

        {/* السعر الإجمالي */}
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-black">{totalPrice.toFixed(2)} ج.م</span>
          <div className="grid h-7 w-7 place-items-center rounded-xl bg-white/20">
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </div>
        </div>
      </button>
    </div>
  );
}
