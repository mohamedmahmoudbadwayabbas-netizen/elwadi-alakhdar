import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, ArrowRight, LayoutGrid } from "lucide-react";
import { EmptyState } from "@/components/storefront/EmptyState";
import { SkeletonBox } from "@/components/storefront/Skeletons";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "كل الفئات — الوادي الأخضر" },
      { name: "description", content: "تصفّح جميع فئات المتجر: بقالة، خضار وفواكه، منتجات ألبان، عناية شخصية والمزيد" },
    ],
  }),
  component: CategoriesPage,
});

type Cat = {
  id: string; name: string; slug: string; icon: string | null;
  image_url: string | null; parent_id: string | null; sort_order: number;
};

function CategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id,name,slug,icon,image_url,parent_id,sort_order")
        .order("sort_order", { ascending: true });
      setCats((data ?? []) as Cat[]);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("categories-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const parents = cats.filter((c) => !c.parent_id);
  const childrenOf = (pid: string) => cats.filter((c) => c.parent_id === pid);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl hero-gradient text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-bold">الوادي الأخضر</span>
          </Link>
          <h1 className="font-display text-base font-bold">كل الفئات</h1>
          <Link to="/" className="text-xs font-bold text-primary hover:underline">
            <ArrowRight className="me-1 inline h-3.5 w-3.5" />
            الرئيسية
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        {loading ? (
          <div className="grid gap-6">
            <SkeletonBox className="h-40 w-full rounded-3xl" />
            <SkeletonBox className="h-40 w-full rounded-3xl" />
          </div>
        ) : parents.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="h-8 w-8" />}
            title="لا توجد فئات بعد"
            description="سنضيف قريباً فئات جديدة لتصفح المنتجات بسهولة."
          />
        ) : (
          <div className="space-y-8">
            {parents.map((p) => {
              const kids = childrenOf(p.id);
              return (
                <section key={p.id}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-8 w-1.5 rounded-full hero-gradient" />
                    <h2 className="font-display text-xl font-black text-foreground">{p.name}</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {/* الفئة الرئيسية نفسها كبطاقة "عرض الكل" */}
                    <CategoryTile cat={p} label="عرض الكل" />
                    {kids.map((k) => <CategoryTile key={k.id} cat={k} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function CategoryTile({ cat, label }: { cat: Cat; label?: string }) {
  return (
    <Link
      to="/"
      search={{ category: cat.id } as never}
      className="group flex flex-col items-center gap-2"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all group-hover:-translate-y-1 group-hover:shadow-lift">
        {cat.image_url ? (
          <img
            src={cat.image_url}
            alt={cat.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/10 to-accent/10 text-4xl">
            {cat.icon ?? "🌿"}
          </div>
        )}
      </div>
      <span className="line-clamp-2 text-center text-[11px] font-bold text-foreground sm:text-xs">
        {label ?? cat.name}
      </span>
    </Link>
  );
}
