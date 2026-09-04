import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/cart-context";

export type Category = {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  image_url: string | null;
  created_at: string | null;
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
  "id,name,name_ar,description,description_ar,price,original_price,image_url,images,category_id,stock,rating,reviews_count,is_featured,is_active,created_at";

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
  return (data ?? []).map((p) => ({
    ...(p as unknown as Product),
    price_per_unit: Number((p as any).price ?? 0),
    old_price: (p as any).original_price == null ? null : Number((p as any).original_price),
    stock_quantity: Number((p as any).stock ?? 0),
    unit_label: "قطعة",
    is_by_weight: false,
    is_popular: Boolean((p as any).is_featured),
    is_on_sale: Number((p as any).original_price ?? 0) > Number((p as any).price ?? 0),
    avg_rating: (p as any).rating ?? null,
    reviews_count: (p as any).reviews_count ?? null,
    is_top_seller: false,
  })) as Product[];
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
    .select("id,name,name_ar,slug,image_url,created_at")
    .order("created_at", { ascending: true });

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
  return [];
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
      const p = data as any;
      return {
        ...(p as Product),
        price_per_unit: Number(p.price ?? 0),
        old_price: p.original_price == null ? null : Number(p.original_price),
        stock_quantity: Number(p.stock ?? 0),
        unit_label: "قطعة",
        is_by_weight: false,
        is_popular: Boolean(p.is_featured),
        is_on_sale: Number(p.original_price ?? 0) > Number(p.price ?? 0),
        avg_rating: p.rating ?? null,
        reviews_count: p.reviews_count ?? null,
        is_top_seller: false,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}
