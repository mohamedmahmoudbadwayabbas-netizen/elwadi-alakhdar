import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/cart-context";

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

// ── 1. Fetch & Cache All Store Products (real Supabase data only) ──
export async function fetchStoreProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.warn("Error fetching products:", error.message);
    return [];
  }
  return (data ?? []) as unknown as Product[];
}

export function useStoreProducts() {
  return useQuery({
    queryKey: ["store-products"],
    queryFn: fetchStoreProducts,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}

// ── 2. Fetch & Cache All Store Categories (real Supabase data only) ──
export async function fetchStoreCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,icon,image_url,sort_order,parent_id")
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("Failed to fetch categories:", error.message);
    return [];
  }
  return (data ?? []) as Category[];
}

export function useStoreCategories() {
  return useQuery({
    queryKey: ["store-categories"],
    queryFn: fetchStoreCategories,
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
