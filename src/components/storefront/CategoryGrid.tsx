type Category = { id: string; name: string; slug: string; icon: string | null };

export function CategoryGrid({
  categories,
  active,
  onSelect,
}: {
  categories: Category[];
  active: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <section className="mx-auto max-w-6xl px-3 pt-6 sm:px-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-black text-foreground sm:text-xl">تسوّق حسب القسم</h2>
        {active && (
          <button onClick={() => onSelect(null)} className="text-xs font-bold text-primary">
            عرض الكل
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 sm:gap-3">
        {categories.map((c) => {
          const isActive = active === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(isActive ? null : c.id)}
              className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all sm:p-4 ${
                isActive
                  ? "border-primary bg-primary/5 shadow-card"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-card"
              }`}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl transition-transform group-hover:scale-110 sm:h-14 sm:w-14 sm:text-3xl ${
                isActive ? "hero-gradient" : "bg-secondary"
              }`}>
                <span>{c.icon ?? "🛍️"}</span>
              </div>
              <span className="text-xs font-bold text-foreground sm:text-sm">{c.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
