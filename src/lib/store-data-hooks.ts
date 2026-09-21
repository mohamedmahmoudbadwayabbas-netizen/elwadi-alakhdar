import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-loose";
import type { Product } from "@/lib/cart-context";

export type Category = {
  id: string;
  name: string;
  name_ar?: string | null;
  slug: string;
  icon?: string | null;
  image_url: string | null;
  parent_id?: string | null;
  sort_order?: number | null;
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

// الأعمدة الحقيقية الموجودة فعلياً في جدول products
export const PRODUCT_COLUMNS =
  "id,name,description,price_per_unit,old_price,image_url,category_id,stock_quantity,low_stock_threshold,unit_label,is_by_weight,is_popular,is_on_sale,is_featured,is_top_seller,avg_rating,reviews_count,views_count,purchase_count,cooking_tip,created_at";

function normalizeProduct(row: any): Product {
  return {
    ...row,
    price_per_unit: Number(row.price_per_unit ?? 0),
    old_price: row.old_price == null ? null : Number(row.old_price),
    stock_quantity: Number(row.stock_quantity ?? 0),
    low_stock_threshold: Number(row.low_stock_threshold ?? 10),
    unit_label: row.unit_label ?? "قطعة",
    is_by_weight: Boolean(row.is_by_weight),
    is_popular: Boolean(row.is_popular),
    is_on_sale: Boolean(row.is_on_sale),
    is_featured: Boolean(row.is_featured),
    is_top_seller: Boolean(row.is_top_seller),
    avg_rating: row.avg_rating == null ? null : Number(row.avg_rating),
    reviews_count: row.reviews_count ?? 0,
  } as Product;
}

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
  return (data ?? []).map(normalizeProduct);
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
    .select("id,name,slug,icon,image_url,parent_id,sort_order,created_at")
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

// ── 3. Fetch & Cache Hero Banners (real Supabase data only) ──
export async function fetchHeroBanners(): Promise<HeroBanner[]> {
  const { data, error } = await supabase
    .from("hero_banners")
    .select("id,image_url,title,subtitle,cta_text,link_url,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("Failed to fetch hero banners:", error.message);
    return [];
  }
  return (data ?? []) as HeroBanner[];
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

      const cachedProducts = queryClient.getQueryData<Product[]>(["store-products"]);
      if (cachedProducts) {
        const found = cachedProducts.find((p) => p.id === productId);
        if (found) return found;
      }

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
      return normalizeProduct(data);
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });
}
