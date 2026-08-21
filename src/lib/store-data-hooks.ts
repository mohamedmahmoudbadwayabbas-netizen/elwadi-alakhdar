import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/cart-context";
import {
  COMPREHENSIVE_CATEGORIES,
  getMergedCategories,
} from "@/lib/categories-data";
import { seedInitialProductsToSupabase } from "@/lib/auto-seed";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url?: string | null;
  sort_order: number;
  badge?: string | null;
  parent_id?: string | null;
  description?: string;
};

export type HeroBanner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

export const PRODUCT_COLUMNS =
  "id,name,price_per_unit,old_price,image_url,category_id,stock_quantity,description,unit_label,is_by_weight,is_popular,is_on_sale,created_at,views_count,purchase_count,avg_rating,reviews_count,cooking_tip,is_top_seller";

// Get locally cached products for instantaneous initial paint
function getCachedProducts(): Product[] | undefined {
  try {
    const cached = localStorage.getItem("alwadi_products_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return undefined;
}

// ── 1. Fetch & Cache All Store Products Dynamically ──
export async function fetchStoreProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.warn("[Store Data] Error fetching products from Supabase:", error.message);
    }

    let dbProds = (data ?? []) as unknown as Product[];

    // If Supabase table is completely empty, trigger automated initial seeder
    if (dbProds.length === 0) {
      const seedRes = await seedInitialProductsToSupabase();
      if (seedRes.seeded) {
        const { data: reFetched } = await supabase
          .from("products")
          .select(PRODUCT_COLUMNS)
          .order("created_at", { ascending: false })
          .limit(500);
        dbProds = (reFetched ?? []) as unknown as Product[];
      }
    }

    if (dbProds.length > 0) {
      try {
        localStorage.setItem("alwadi_products_cache", JSON.stringify(dbProds));
      } catch {}
      return dbProds;
    }

    // Try cached products from previous session
    const cached = getCachedProducts();
    if (cached && cached.length > 0) {
      return cached;
    }

    return [];
  } catch (err) {
    console.error("[Store Data] Error in fetchStoreProducts:", err);
    return getCachedProducts() || [];
  }
}

export function useStoreProducts() {
  return useQuery({
    queryKey: ["store-products"],
    queryFn: fetchStoreProducts,
    initialData: getCachedProducts,
    staleTime: 1000 * 60 * 3, // 3 minutes fresh
    gcTime: 1000 * 60 * 30, // 30 minutes in memory
    refetchOnWindowFocus: false,
  });
}

// ── 2. Fetch & Cache All Store Categories ──
function getInitialCategories(): Category[] {
  try {
    const cached = localStorage.getItem("alwadi_categories_cache");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return COMPREHENSIVE_CATEGORIES as Category[];
}

export async function fetchStoreCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,slug,icon,image_url,sort_order,parent_id")
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("[Store Data] Failed to fetch categories from Supabase:", error.message);
    }

    const dbCats = (data ?? []) as Category[];
    const mergedCats = getMergedCategories(dbCats);
    const finalCats = mergedCats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      image_url: c.image_url,
      sort_order: c.sort_order,
      badge: c.badge,
      parent_id: c.parent_id,
      description: c.description,
    }));

    try {
      localStorage.setItem("alwadi_categories_cache", JSON.stringify(finalCats));
    } catch {}
    return finalCats;
  } catch (err) {
    console.error("[Store Data] Error fetching store categories:", err);
    return COMPREHENSIVE_CATEGORIES as Category[];
  }
}

export function useStoreCategories() {
  return useQuery({
    queryKey: ["store-categories"],
    queryFn: fetchStoreCategories,
    initialData: getInitialCategories,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
}

// ── 3. Fetch & Cache Hero Banners ──
export async function fetchHeroBanners(): Promise<HeroBanner[]> {
  try {
    const { data, error } = await supabase
      .from("hero_banners")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("[Store Data] Hero banners query error:", error.message);
      return [];
    }
    return (data ?? []) as HeroBanner[];
  } catch {
    return [];
  }
}

export function useHeroBanners() {
  return useQuery({
    queryKey: ["hero-banners"],
    queryFn: fetchHeroBanners,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
}

// ── 4. Fetch & Cache Single Product ──
export function useStoreProduct(productId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["store-product", productId],
    queryFn: async (): Promise<Product | null> => {
      if (!productId) return null;

      // 1. Check if product is already in the cached products list first
      const cachedProducts = queryClient.getQueryData<Product[]>(["store-products"]);
      if (cachedProducts) {
        const found = cachedProducts.find((p) => p.id === productId);
        if (found) return found;
      }

      // 2. Query Supabase directly
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .eq("id", productId)
        .maybeSingle();

      if (error) {
        console.warn(`[Store Data] Error fetching product ${productId}:`, error.message);
        return null;
      }

      if (!data) return null;
      return data as unknown as Product;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}
