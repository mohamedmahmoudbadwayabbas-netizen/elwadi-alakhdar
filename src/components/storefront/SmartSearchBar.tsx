import { useState, useEffect, useRef } from "react";
import { Search, X, Plus, ShoppingBag, Sparkles, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useSearch } from "@/lib/search-context";
import { searchProductsFuzzy } from "@/lib/fuzzy-search";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { flyToCart } from "@/lib/fly-to-cart";
import { motion, AnimatePresence } from "motion/react";

type SearchProduct = {
  id: string;
  name: string;
  price_per_unit: number;
  old_price?: number | null;
  image_url?: string | null;
  unit_label?: string | null;
  is_by_weight?: boolean;
};

interface SmartSearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSelectProduct?: () => void;
}

export function SmartSearchBar({
  className = "",
  placeholder = "ابحث عن منتج.. مثل: طماطم، أرز، لحم بلدي، لبن طازج",
  autoFocus = false,
  onSelectProduct,
}: SmartSearchBarProps) {
  const { query, setQuery } = useSearch();
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [allProducts, setAllProducts] = useState<SearchProduct[]>([]);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const { addItem } = useCart();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Load product catalog for fast client-side fuzzy searching
  useEffect(() => {
    const fetchCatalog = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price_per_unit, old_price, image_url, unit_label, is_by_weight")
        .limit(200);

      if (data) {
        setAllProducts(data as SearchProduct[]);
      }
    };
    fetchCatalog();
  }, []);

  // Filter products whenever debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const matched = searchProductsFuzzy(allProducts, debouncedQuery, 0.4);
    setResults(matched.slice(0, 8)); // Top 8 suggestions
    setIsOpen(true);
    setIsLoading(false);
  }, [debouncedQuery, allProducts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDirectAddToCart = (e: React.MouseEvent, product: SearchProduct) => {
    e.stopPropagation();
    const targetQty = product.is_by_weight ? 0.5 : 1;

    // Optimistic UI update
    addItem(product as any, targetQty);

    // Visual feedback badge animation
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);

    const targetImg =
      (e.currentTarget.parentElement?.querySelector("img") as HTMLImageElement) || null;
    flyToCart(targetImg);
    toast.success(`تمت إضافة "${product.name}" للسلة بنجاح 🛒`);
  };

  const handleProductClick = (productId: string) => {
    setIsOpen(false);
    if (onSelectProduct) onSelectProduct();
    navigate({ to: "/products/$productId", params: { productId } });
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} dir="rtl">
      {/* Central Classical Input Box */}
      <div className="relative flex items-center">
        <Input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim()) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="h-12 w-full rounded-2xl border-2 border-border/80 bg-card ps-11 pe-10 text-xs sm:text-sm font-bold shadow-xs transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        />

        <div className="absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute end-3 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Instant Autocomplete Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && query.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute start-0 end-0 top-full z-50 mt-2 overflow-hidden rounded-3xl border border-border/80 bg-card p-2 shadow-2xl backdrop-blur-md"
          >
            {results.length > 0 ? (
              <div className="space-y-1 max-h-80 overflow-y-auto divide-y divide-border/40">
                <div className="px-3 py-1.5 text-[11px] font-black text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-emerald-500" /> نتائج البحث السريع (
                    {results.length})
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    تصحيح إملائي تلقائي 🎯
                  </span>
                </div>

                {results.map((product) => {
                  const isAdded = addedIds[product.id];
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleProductClick(product.id)}
                      className="group flex items-center justify-between gap-3 p-2.5 rounded-2xl transition-all hover:bg-secondary/70 cursor-pointer"
                    >
                      {/* Thumbnail & Product Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-secondary grid place-items-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <span className="text-lg">🌿</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold mt-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-black">
                              {product.price_per_unit} ج.م
                            </span>
                            {product.old_price && product.old_price > product.price_per_unit && (
                              <span className="line-through text-[10px] text-muted-foreground/70">
                                {product.old_price} ج.م
                              </span>
                            )}
                            <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-md">
                              {product.is_by_weight ? "بالوزن" : product.unit_label || "قطعة"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Direct Add-To-Cart Action Button */}
                      <Button
                        size="sm"
                        type="button"
                        onClick={(e) => handleDirectAddToCart(e, product)}
                        className={`h-9 px-3 rounded-xl font-black text-xs gap-1 shrink-0 transition-all ${
                          isAdded
                            ? "bg-emerald-500 text-white"
                            : "hero-gradient text-primary-foreground hover:opacity-90 active:scale-95 shadow-sm"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-3.5 w-3.5" /> تم!
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> أضف للسلة
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-lg">
                  🔍
                </div>
                <h4 className="text-xs font-bold text-foreground">لم نجد منتجات تطابق "{query}"</h4>
                <p className="text-[11px] text-muted-foreground">
                  جرب البحث بكلمة عامة مثل (أرز، زيت، لحم، جبن، مسحوق)
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
