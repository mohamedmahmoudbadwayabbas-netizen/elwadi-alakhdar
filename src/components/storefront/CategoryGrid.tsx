import {
  Leaf, Apple, Beef, Bird, Milk, Coffee, Wheat, Droplets,
  Fish, Egg, ShoppingBasket, Flower2, Candy, Package, UtensilsCrossed,
  Salad, Soup, Cookie, FlaskConical, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── ربط اسم الفئة بأيقونة مناسبة ───────────────────────────────────────────
function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("خضر") || n.includes("خضار") || n.includes("salad")) return <Salad className="h-6 w-6" />;
  if (n.includes("فاكه") || n.includes("فواكه") || n.includes("fruit")) return <Apple className="h-6 w-6" />;
  if (n.includes("لحم") || n.includes("لحوم") || n.includes("beef") || n.includes("meat")) return <Beef className="h-6 w-6" />;
  if (n.includes("دجاج") || n.includes("دواجن") || n.includes("chicken")) return <Bird className="h-6 w-6" />;
  if (n.includes("سمك") || n.includes("أسماك") || n.includes("fish")) return <Fish className="h-6 w-6" />;
  if (n.includes("لبن") || n.includes("ألبان") || n.includes("جبن") || n.includes("dairy")) return <Milk className="h-6 w-6" />;
  if (n.includes("بيض") || n.includes("egg")) return <Egg className="h-6 w-6" />;
  if (n.includes("مشروب") || n.includes("عصير") || n.includes("drink")) return <Coffee className="h-6 w-6" />;
  if (n.includes("حبوب") || n.includes("أرز") || n.includes("grain")) return <Wheat className="h-6 w-6" />;
  if (n.includes("زيت") || n.includes("oil")) return <Droplets className="h-6 w-6" />;
  if (n.includes("عطار") || n.includes("توابل") || n.includes("بهارات") || n.includes("herb")) return <Flower2 className="h-6 w-6" />;
  if (n.includes("حلو") || n.includes("حلويات") || n.includes("sweet")) return <Candy className="h-6 w-6" />;
  if (n.includes("مكسرات") || n.includes("nut")) return <FlaskConical className="h-6 w-6" />;
  if (n.includes("شوربة") || n.includes("soup")) return <Soup className="h-6 w-6" />;
  if (n.includes("بسكويت") || n.includes("كيك") || n.includes("biscuit")) return <Cookie className="h-6 w-6" />;
  if (n.includes("معلب") || n.includes("can")) return <Package className="h-6 w-6" />;
  if (n.includes("وجبة") || n.includes("meal")) return <UtensilsCrossed className="h-6 w-6" />;
  if (n.includes("عضوي") || n.includes("organic")) return <Leaf className="h-6 w-6" />;
  return <ShoppingBasket className="h-6 w-6" />;
}

// ─── ألوان دورية للفئات ──────────────────────────────────────────────────────
const PALETTE = [
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-violet-50 text-violet-700 border-violet-200",
  "bg-orange-50 text-orange-700 border-orange-200",
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-pink-50 text-pink-700 border-pink-200",
];

type Category = { id: string; name: string; icon?: string | null };

type Props = {
  categories: Category[];
  activeId?: string | null;
  onSelect: (id: string | null) => void;
};

export function CategoryGrid({ categories, activeId, onSelect }: Props) {
  if (categories.length === 0) return null;

  return (
    <section dir="rtl" className="space-y-3">
      <h2 className="px-1 font-display text-lg font-bold text-foreground">تسوّق حسب الفئة</h2>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {/* زر "الكل" */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-3",
            "transition-all duration-200 active:scale-95",
            activeId === null
              ? "border-primary bg-primary text-primary-foreground shadow-card scale-105"
              : "border-border bg-card text-foreground hover:border-primary/40 hover:scale-102",
          )}
        >
          <Layers className="h-6 w-6" />
          <span className="text-xs font-bold">الكل</span>
        </button>

        {/* الفئات */}
        {categories.map((cat, idx) => {
          const isActive = activeId === cat.id;
          const color = PALETTE[idx % PALETTE.length];
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(isActive ? null : cat.id)}
              className={cn(
                "flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-3",
                "transition-all duration-200 active:scale-95",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-card scale-105"
                  : cn("hover:scale-105 hover:shadow-sm", color),
              )}
            >
              {getCategoryIcon(cat.name)}
              <span className="max-w-[72px] text-center text-xs font-bold leading-tight line-clamp-2">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
