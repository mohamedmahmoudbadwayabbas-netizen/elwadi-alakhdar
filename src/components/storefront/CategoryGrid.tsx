import { Grid2X2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SkeletonBox } from "@/components/storefront/Skeletons";

export type Category = {
  id: string;
  name: string;
  name_ar?: string | null;
  slug: string;
  image_url?: string | null;
};

interface CategoryGridProps {
  categories: Category[];
  active: string | null;
  onSelect: (id: string | null) => void;
  productsCountByCategory?: Record<string, number>;
  totalProductsCount?: number;
  isLoading?: boolean;
}

export function CategoryGrid({
  categories,
  active,
  onSelect,
  productsCountByCategory = {},
  totalProductsCount = 0,
  isLoading = false,
}: CategoryGridProps) {
  return (
    <section aria-labelledby="category-grid-title" className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Layers className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 id="category-grid-title" className="truncate text-base font-bold text-foreground sm:text-lg">
              تسوّق حسب القسم
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">ابدأ من القسم الأقرب لقائمتك</p>
          </div>
        </div>
        {active && active !== "all" && <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)}>عرض الكل</Button>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => <SkeletonBox key={index} className="aspect-[4/3] rounded-lg" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex min-h-28 items-center gap-4 rounded-lg border border-dashed border-border bg-muted/40 p-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-card text-primary"><Grid2X2 className="h-5 w-5" /></div>
          <div><h3 className="text-sm font-bold text-foreground">الأقسام قيد التجهيز</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">ستظهر هنا فور إضافتها إلى المتجر.</p></div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSelect(null)}
            className={cn("h-auto min-h-24 flex-col whitespace-normal rounded-lg p-2 text-center", (!active || active === "all") && "border-primary bg-primary/10 text-primary")}
          >
            <Grid2X2 className="h-6 w-6" />
            <span className="text-xs font-bold">كل المنتجات</span>
            {totalProductsCount > 0 && <span className="text-[10px] font-normal text-muted-foreground">{totalProductsCount} صنف</span>}
          </Button>
          {categories.map((c, index) => {
          const isActive = active === c.id || active === c.slug;
          const count = productsCountByCategory[c.id] ?? productsCountByCategory[c.slug] ?? 0;
          const tint = ["bg-primary/10", "bg-secondary", "bg-accent/10", "bg-muted"][index % 4];

          return (
            <Button
              key={c.id}
              type="button"
              variant="outline"
              onClick={() => onSelect(isActive ? null : c.id)}
              className={cn(
                "group h-auto min-h-24 flex-col overflow-hidden whitespace-normal rounded-lg p-0 text-center focus-visible:ring-2",
                isActive ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40",
              )}
            >
              <div className={cn("relative h-14 w-full overflow-hidden", tint)}>
                {c.image_url ? (
                  <img src={c.image_url} alt={`قسم ${c.name_ar || c.name}`} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-primary"><Layers className="h-6 w-6" /></div>
                )}
              </div>
              <div className="flex w-full min-w-0 flex-col px-2 py-2">
                <span className="truncate text-xs font-bold">{c.name_ar || c.name}</span>
                {count > 0 && <span className="text-[10px] font-normal text-muted-foreground">{count} صنف</span>}
              </div>
            </Button>
          );
        })}
        </div>
      )}
    </section>
  );
}
