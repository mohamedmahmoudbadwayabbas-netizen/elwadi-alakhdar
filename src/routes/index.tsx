import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/storefront/Header";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { CategoryGrid } from "@/components/storefront/CategoryGrid";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductModal } from "@/components/storefront/ProductModal";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import type { Product } from "@/lib/cart-context";
import { Flame } from "lucide-react";

type Category = { id: string; name: string; slug: string; icon: string | null; sort_order: number };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "بَركة - سوبر ماركت وعطارة أونلاين" },
      { name: "description", content: "تسوّق منتجات السوبر ماركت والعطارة الطازجة بأسعار مميزة وتوصيل سريع." },
    ],
  }),
  component: Index,
});

function Index() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
      ]);
      setCategories((cats ?? []) as Category[]);
      setProducts((prods ?? []) as Product[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel("products-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, async () => {
        const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        if (data) setProducts(data as Product[]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (activeCat && p.category_id !== activeCat) return false;
      if (query && !p.name.includes(query.trim())) return false;
      return true;
    });
  }, [products, activeCat, query]);

  const popular = useMemo(() => products.filter((p) => p.is_popular).slice(0, 8), [products]);

  return (
    <div className="min-h-screen bg-background pb-16">
      <Header onSearch={setQuery} query={query} />
      <HeroCarousel />
      <CategoryGrid categories={categories} active={activeCat} onSelect={setActiveCat} />

      {!activeCat && !query && popular.length > 0 && (
        <section className="mx-auto max-w-6xl px-3 pt-8 sm:px-6">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-sale" />
            <h3 className="text-lg font-black sm:text-xl">الأكثر مبيعاً</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {popular.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setOpenProduct} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-3 pt-8 sm:px-6">
        <h3 className="mb-3 text-lg font-black sm:text-xl">
          {query ? `نتائج البحث (${filtered.length})` : activeCat ? "منتجات القسم" : "كل المنتجات"}
        </h3>
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-secondary" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <div className="text-4xl">🔍</div>
            <p className="mt-3 font-bold">لا توجد منتجات مطابقة</p>
            <p className="text-sm text-muted-foreground">جرّب البحث بكلمات أخرى</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={setOpenProduct} />
            ))}
          </div>
        )}
      </section>

      <footer className="mx-auto mt-12 max-w-6xl px-3 pb-8 text-center text-xs text-muted-foreground sm:px-6">
        © {new Date().getFullYear()} بَركة — سوبر ماركت وعطارة. كل الحقوق محفوظة.
      </footer>

      <ProductModal product={openProduct} onClose={() => setOpenProduct(null)} />
      <CartDrawer />
    </div>
  );
}
