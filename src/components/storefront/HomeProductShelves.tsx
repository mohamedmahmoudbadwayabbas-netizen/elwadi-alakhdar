import { Award, Flame, PackageOpen, Scale, SearchX, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/cart-context";
import { EmptyState } from "@/components/storefront/EmptyState";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";

type Shelf = {
  id: string;
  title: string;
  description: string;
  products: Product[];
  icon: "deals" | "popular" | "fresh" | "pantry";
};

type HomeProductShelvesProps = {
  filteredProducts: Product[];
  shelves: Shelf[];
  isFiltered: boolean;
  searchQuery: string;
  selectedCategoryName?: string;
  onOpenProduct: (product: Product) => void;
  onResetFilters: () => void;
};

const shelfTheme = {
  deals: {
    icon: Flame,
    badgeBg: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    border: "border-orange-500/20",
  },
  popular: {
    icon: Award,
    badgeBg: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    border: "border-border",
  },
  fresh: {
    icon: Scale,
    badgeBg: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    border: "border-border",
  },
  pantry: {
    icon: ShoppingBag,
    badgeBg: "border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400",
    border: "border-border",
  },
};

function ProductGrid({
  products,
  onOpenProduct,
  isTopSeller,
}: {
  products: Product[];
  onOpenProduct: (product: Product) => void;
  isTopSeller?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isTopSeller={isTopSeller}
          onOpen={onOpenProduct}
        />
      ))}
    </div>
  );
}

export default function HomeProductShelves({
  filteredProducts,
  shelves,
  isFiltered,
  searchQuery,
  selectedCategoryName,
  onOpenProduct,
  onResetFilters,
}: HomeProductShelvesProps) {
  if (filteredProducts.length === 0) {
    return (
      <EmptyState
        icon={searchQuery ? <SearchX className="h-8 w-8" /> : <PackageOpen className="h-8 w-8" />}
        title={searchQuery ? "لا توجد نتائج مطابقة" : "المتجر جاهز لاستقبال المنتجات"}
        description={
          searchQuery
            ? `لم نجد منتجات تطابق «${searchQuery}». جرّب كلمة أقصر أو تصفّح كل الأقسام.`
            : "ستظهر المنتجات هنا تلقائياً بعد إضافتها، مرتبة داخل رفوف واضحة وسهلة التسوق."
        }
        action={
          isFiltered ? (
            <Button type="button" onClick={onResetFilters}>
              عرض كل المنتجات
            </Button>
          ) : undefined
        }
        className="max-w-none border-dashed py-10 shadow-none"
      />
    );
  }

  if (isFiltered) {
    return (
      <section aria-labelledby="filtered-products-title" className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 border-b border-border pb-3">
          <div className="min-w-0">
            <h2 id="filtered-products-title" className="truncate text-lg font-bold text-foreground sm:text-xl">
              {selectedCategoryName || "نتائج البحث"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{filteredProducts.length} منتج متاح للتصفح</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onResetFilters}>
            إلغاء التصفية
          </Button>
        </div>
        <ProductGrid products={filteredProducts} onOpenProduct={onOpenProduct} />
      </section>
    );
  }

  return (
    <div className="space-y-10">
      {shelves.filter((shelf) => shelf.products.length > 0).map((shelf) => {
        const theme = shelfTheme[shelf.icon] || shelfTheme.deals;
        const Icon = theme.icon;
        return (
          <section key={shelf.id} aria-labelledby={`${shelf.id}-title`} className="space-y-4">
            <div className={`flex min-w-0 items-start gap-3 border-b ${theme.border} pb-3`}>
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${theme.badgeBg}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2 id={`${shelf.id}-title`} className="text-base font-bold text-foreground sm:text-lg font-display">
                  {shelf.title}
                </h2>
                <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{shelf.description}</p>
              </div>
            </div>
            <ProductGrid
              products={shelf.products}
              isTopSeller={shelf.icon === "popular"}
              onOpenProduct={onOpenProduct}
            />
          </section>
        );
      })}
    </div>
  );
}