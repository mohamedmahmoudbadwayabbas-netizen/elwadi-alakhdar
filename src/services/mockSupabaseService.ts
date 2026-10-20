import type { Product } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase-loose";
import { PRODUCT_COLUMNS } from "@/lib/store-data-hooks";

export interface FoodItemCatalogOptions {
  categorySlug?: string;
  categoryId?: string;
  searchQuery?: string;
  sortBy?: "popular" | "price_asc" | "price_desc" | "rating" | "newest";
  onlyInStock?: boolean;
  limit?: number;
}

export const MOCK_FALLBACK_FOOD_ITEMS: Product[] = [
  {
    id: "mock-food-1",
    name: "جبنة بيضاء براميلي فلاحي طبيعية",
    name_ar: "جبنة بيضاء براميلي فلاحي طبيعية",
    category_id: "dairy",
    description: "جبنة براميلي معتقة بنكهة غنية مصنوعة من حليب طبيعي 100% بدون إضافات صناعية.",
    description_ar: "جبنة براميلي معتقة بنكهة غنية مصنوعة من حليب طبيعي 100% بدون إضافات صناعية.",
    price_per_unit: 140,
    old_price: 165,
    image_url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_active: true,
    stock_quantity: 45,
    avg_rating: 4.9,
    reviews_count: 38,
    origin_source: "مزارع الوادي الأخضر",
  },
  {
    id: "mock-food-2",
    name: "طماطم بلدي طازجة درجة أولى",
    name_ar: "طماطم بلدي طازجة درجة أولى",
    category_id: "vegetables",
    description: "طماطم طازجة منتقاة بعناية يومياً، حمراء وممتلئة ومثالية للسلطات والطهي.",
    description_ar: "طماطم طازجة منتقاة بعناية يومياً، حمراء وممتلئة ومثالية للسلطات والطهي.",
    price_per_unit: 20,
    old_price: 25,
    image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: false,
    is_active: true,
    stock_quantity: 120,
    avg_rating: 4.8,
    reviews_count: 52,
    origin_source: "مزارع الصالحية",
  },
  {
    id: "mock-food-3",
    name: "موز بلدي سكري فاخر",
    name_ar: "موز بلدي سكري فاخر",
    category_id: "fruits",
    description: "موز طازج غني بالبوتاسيوم والطاقة، مذاق حلو ونضج مثالي للأطفال والعائلة.",
    description_ar: "موز طازج غني بالبوتاسيوم والطاقة، مذاق حلو ونضج مثالي للأطفال والعائلة.",
    price_per_unit: 35,
    old_price: null,
    image_url: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: false,
    is_on_sale: false,
    is_featured: false,
    is_active: true,
    stock_quantity: 80,
    avg_rating: 4.7,
    reviews_count: 24,
    origin_source: "مزارع النوبارية",
  },
  {
    id: "mock-food-4",
    name: "لحم بقري مكعبات بلدي طازج",
    name_ar: "لحم بقري مكعبات بلدي طازج",
    category_id: "meat",
    description: "مكعبات لحم بقري بلدي طازج قليل الدهن، مقطع يدوياً ومثالي للخضار واليخنات.",
    description_ar: "مكعبات لحم بقري بلدي طازج قليل الدهن، مقطع يدوياً ومثالي للخضار واليخنات.",
    price_per_unit: 450,
    old_price: 490,
    image_url: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_active: true,
    stock_quantity: 25,
    avg_rating: 5.0,
    reviews_count: 67,
    origin_source: "مجزرة الوادي المعتمدة",
  },
  {
    id: "mock-food-5",
    name: "دجاجة كاملة طازجة مبردة (1.2 كجم)",
    name_ar: "دجاجة كاملة طازجة مبردة (1.2 كجم)",
    category_id: "meat",
    description: "دجاج بلدي طازج منظف ومجهز فورياً ومغلف بعناية فائقة للحفاظ على الطزاجة.",
    description_ar: "دجاج بلدي طازج منظف ومجهز فورياً ومغلف بعناية فائقة للحفاظ على الطزاجة.",
    price_per_unit: 180,
    old_price: 200,
    image_url: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "قطعة",
    is_popular: true,
    is_on_sale: true,
    is_featured: false,
    is_active: true,
    stock_quantity: 35,
    avg_rating: 4.9,
    reviews_count: 41,
    origin_source: "مزارع دواجن الوادي",
  },
  {
    id: "mock-food-6",
    name: "لبن جاموسي طازج مبستر 1 لتر",
    name_ar: "لبن جاموسي طازج مبستر 1 لتر",
    category_id: "dairy",
    description: "حليب جاموسي كامل الدسم طبيعي 100% ومبستر، قوام كريمي ونكهة فلاحي أصيلة.",
    description_ar: "حليب جاموسي كامل الدسم طبيعي 100% ومبستر، قوام كريمي ونكهة فلاحي أصيلة.",
    price_per_unit: 45,
    old_price: null,
    image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "زجاجة",
    is_popular: true,
    is_on_sale: false,
    is_featured: false,
    is_active: true,
    stock_quantity: 60,
    avg_rating: 4.8,
    reviews_count: 33,
    origin_source: "مزارع الألبان الحديثة",
  },
  {
    id: "mock-food-7",
    name: "زيت زيتون بكر ممتاز معصور على البارد 500 مل",
    name_ar: "زيت زيتون بكر ممتاز معصور على البارد 500 مل",
    category_id: "pantry",
    description: "زيت زيتون سيناوي نقي من أول عصرة على البارد بنسبة حموضة أقل من 0.8%.",
    description_ar: "زيت زيتون سيناوي نقي من أول عصرة على البارد بنسبة حموضة أقل من 0.8%.",
    price_per_unit: 195,
    old_price: 230,
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "عبوة",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_active: true,
    stock_quantity: 40,
    avg_rating: 4.9,
    reviews_count: 58,
    origin_source: "مزارع شمال سيناء",
  },
  {
    id: "mock-food-8",
    name: "خبز فينو سمسم طازج ومقرمش (6 حبات)",
    name_ar: "خبز فينو سمسم طازج ومقرمش (6 حبات)",
    category_id: "bakery",
    description: "مخبوزات طازجة يومياً من فرن الوادي الأخضر بدقيق نخب أول وسمسم محمص.",
    description_ar: "مخبوزات طازجة يومياً من فرن الوادي الأخضر بدقيق نخب أول وسمسم محمص.",
    price_per_unit: 18,
    old_price: null,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "كيس",
    is_popular: false,
    is_on_sale: false,
    is_featured: false,
    is_active: true,
    stock_quantity: 90,
    avg_rating: 4.6,
    reviews_count: 19,
    origin_source: "مخبز الوادي",
  },
];

export const mockSupabaseService = {
  /**
   * Fetch food products either directly from Supabase, or seamlessly falling back
   * to realistic food item catalog data when offline or in mock mode.
   */
  async getFoodProducts(options: FoodItemCatalogOptions = {}): Promise<{
    data: Product[];
    source: "supabase" | "mock";
    total: number;
    error: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(options.limit || 100);

      if (!error && Array.isArray(data) && data.length > 0) {
        let items: Product[] = data.map((row: any) => {
          const price = Number(row.price ?? row.price_per_unit ?? 0);
          const oldPrice =
            row.original_price != null
              ? Number(row.original_price)
              : row.old_price != null
              ? Number(row.old_price)
              : null;
          return {
            ...row,
            name: row.name_ar || row.name || "منتج غذائي",
            name_ar: row.name_ar ?? row.name ?? null,
            description: row.description_ar || row.description || null,
            price_per_unit: price,
            old_price: oldPrice,
            stock_quantity: Number(row.stock ?? row.stock_quantity ?? 0),
            unit_label: row.unit_label ?? "قطعة",
            is_by_weight: Boolean(row.is_by_weight),
            is_popular: Boolean(row.is_featured || row.is_popular),
            is_on_sale: Boolean(oldPrice != null && oldPrice > price),
            is_featured: Boolean(row.is_featured),
            avg_rating: row.rating != null ? Number(row.rating) : 4.8,
            reviews_count: Number(row.reviews_count ?? 12),
          } as Product;
        });

        // Apply in-memory filtering if requested
        if (options.categoryId && options.categoryId !== "all") {
          items = items.filter((p) => p.category_id === options.categoryId);
        }

        if (options.searchQuery?.trim()) {
          const q = options.searchQuery.toLowerCase().trim();
          items = items.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
              (p.description && p.description.toLowerCase().includes(q)),
          );
        }

        return {
          data: items,
          source: "supabase",
          total: items.length,
          error: null,
        };
      }
    } catch (e: any) {
      console.warn("Falling back to mock Supabase service data:", e?.message);
    }

    // Fallback to high-quality mock data with filtering applied
    let mockFiltered = [...MOCK_FALLBACK_FOOD_ITEMS];
    if (options.categoryId && options.categoryId !== "all") {
      mockFiltered = mockFiltered.filter((p) => p.category_id === options.categoryId);
    }
    if (options.searchQuery?.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      mockFiltered = mockFiltered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }

    return {
      data: mockFiltered,
      source: "mock",
      total: mockFiltered.length,
      error: null,
    };
  },

  /**
   * Simulate a quick add-to-cart transaction record or audit
   */
  async recordCartAction(productId: string, quantity: number, action: "add" | "update" | "remove") {
    // Non-blocking log or Supabase telemetry if needed
    return { success: true, timestamp: Date.now(), productId, quantity, action };
  },
};
