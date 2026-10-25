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
  isLoading?: boolean;
}

export function CategoryGrid({
  categories,
  active,
  onSelect,
  productsCountByCategory = {},
  isLoading = false,
}: CategoryGridProps) {
  const isAllSelected = !active || active === "all";

  return (
    <section aria-labelledby="category-grid-title" className="home-category-section">
      <div className="home-section-heading home-category-heading">
        <div>
          <span className="home-section-heading__eyebrow">كل احتياجات البيت</span>
          <h2 id="category-grid-title">في أقسام واضحة</h2>
          <p>اختر من الأقسام الموجودة في المتجر وابدأ التصفّح.</p>
        </div>
        {!isAllSelected && (
          <Button type="button" variant="outline" size="sm" onClick={() => onSelect(null)}>
            عرض كل الأقسام
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="home-category-grid" aria-label="تحميل الأقسام">
          {Array.from({ length: 10 }).map((_, index) => (
            <SkeletonBox key={index} className="home-category-card h-28 rounded-2xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="home-category-empty">
          <div className="home-category-empty__icon"><Grid2X2 aria-hidden="true" /></div>
          <div>
            <h3>الأقسام قيد التجهيز</h3>
            <p>ستظهر الأقسام هنا بعد إضافتها إلى المتجر.</p>
          </div>
        </div>
      ) : (
        <div className="home-category-grid">
          {categories.map((category) => {
            const isActive = active === category.id || active === category.slug;
            const count =
              productsCountByCategory[category.id] ?? productsCountByCategory[category.slug] ?? 0;
            const name = category.name_ar || category.name;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelect(isActive ? null : category.id)}
                aria-pressed={isActive}
                aria-label={`تصفّح قسم ${name}`}
                className={cn("home-category-card", isActive && "is-active")}
              >
                <span className="home-category-card__icon" aria-hidden="true">
                  {category.image_url ? (
                    <img src={category.image_url} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <Layers />
                  )}
                </span>
                <span className="home-category-card__copy">
                  <strong>{name}</strong>
                  <small>{count > 0 ? `${count} صنف` : "تصفّح القسم"}</small>
                </span>
                <span className="home-category-card__arrow" aria-hidden="true">←</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
