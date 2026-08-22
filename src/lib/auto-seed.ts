import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { name: "الألبان والجبن الطازج", slug: "dairy-cheese", icon: "🥛", image_url: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?q=80&w=600&auto=format&fit=crop", sort_order: 1 },
  { name: "الخضروات والفواكه", slug: "vegetables-fruits", icon: "🍅", image_url: "https://images.unsplash.com/photo-1596568289467-34c9c1b332b7?q=80&w=600&auto=format&fit=crop", sort_order: 2 },
  { name: "اللحوم والدواجن", slug: "meat-poultry", icon: "🥩", image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bd6b51?q=80&w=600&auto=format&fit=crop", sort_order: 3 },
  { name: "المخبوزات والحلويات", slug: "bakery-sweets", icon: "🥐", image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop", sort_order: 4 },
  { name: "المعلبات والبقالة", slug: "grocery-canned", icon: "🥫", image_url: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?q=80&w=600&auto=format&fit=crop", sort_order: 5 },
];

const PRODUCTS = [
  {
    name: "جبنة بيضاء براميلي فلاحي",
    category_slug: "dairy-cheese",
    price_per_unit: 140,
    unit_label: "كجم",
    is_by_weight: true,
    stock_quantity: 50,
    image_url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=80&w=600&auto=format&fit=crop",
    description: "جبنة براميلي طازجة من المزارع المصرية، طبيعية 100%.",
    is_popular: true,
  },
  {
    name: "لبن جاموسي طازج",
    category_slug: "dairy-cheese",
    price_per_unit: 45,
    unit_label: "لتر",
    is_by_weight: false,
    stock_quantity: 100,
    image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?q=80&w=600&auto=format&fit=crop",
    description: "لبن جاموسي كامل الدسم معبأ يومياً.",
    is_popular: true,
  },
  {
    name: "طماطم بلدي طازجة",
    category_slug: "vegetables-fruits",
    price_per_unit: 20,
    unit_label: "كجم",
    is_by_weight: true,
    stock_quantity: 200,
    image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=600&auto=format&fit=crop",
    description: "طماطم بلدي حمراء ممتازة للطبخ والسلطات.",
    is_popular: true,
  },
  {
    name: "موز مستورد",
    category_slug: "vegetables-fruits",
    price_per_unit: 35,
    unit_label: "كجم",
    is_by_weight: true,
    stock_quantity: 150,
    image_url: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?q=80&w=600&auto=format&fit=crop",
    description: "موز مستورد عالي الجودة وحلو المذاق.",
    is_popular: false,
  },
  {
    name: "لحم بقري مكعبات صافي",
    category_slug: "meat-poultry",
    price_per_unit: 450,
    unit_label: "كجم",
    is_by_weight: true,
    stock_quantity: 30,
    image_url: "https://images.unsplash.com/photo-1603048297172-c92544798d5e?q=80&w=600&auto=format&fit=crop",
    description: "لحم بقري بلدي طازج مقطع مكعبات جاهز للطبخ.",
    is_popular: true,
  },
  {
    name: "دجاجة كاملة مبردة",
    category_slug: "meat-poultry",
    price_per_unit: 180,
    unit_label: "حبة",
    is_by_weight: false,
    stock_quantity: 80,
    image_url: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?q=80&w=600&auto=format&fit=crop",
    description: "دجاج مبرد وزن 1100-1200 جرام.",
    is_popular: true,
  },
  {
    name: "عيش فينو طازج (5 حبات)",
    category_slug: "bakery-sweets",
    price_per_unit: 15,
    unit_label: "كيس",
    is_by_weight: false,
    stock_quantity: 60,
    image_url: "https://images.unsplash.com/photo-1598373182133-52452f7691ef?q=80&w=600&auto=format&fit=crop",
    description: "خبز فينو طازج مخبوز يومياً.",
    is_popular: true,
  },
  {
    name: "زيت عباد الشمس 1 لتر",
    category_slug: "grocery-canned",
    price_per_unit: 85,
    unit_label: "عبوة",
    is_by_weight: false,
    stock_quantity: 120,
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=600&auto=format&fit=crop",
    description: "زيت طهي نقي 100%.",
    is_popular: false,
  }
];

export async function forceSyncAllToSupabase() {
  try {
    const { data: existingCats } = await supabase.from("categories").select("id").limit(1);
    if (existingCats && existingCats.length > 0) {
      return { success: true, message: "Database already seeded." };
    }

    const { data: insertedCats, error: catError } = await supabase
      .from("categories")
      .insert(CATEGORIES)
      .select("id, slug");

    if (catError) throw catError;

    const productsToInsert = PRODUCTS.map(p => {
      const catId = insertedCats?.find(c => c.slug === p.category_slug)?.id;
      return {
        name: p.name,
        category_id: catId,
        price_per_unit: p.price_per_unit,
        unit_label: p.unit_label,
        is_by_weight: p.is_by_weight,
        stock_quantity: p.stock_quantity,
        image_url: p.image_url,
        description: p.description,
        is_popular: p.is_popular,
      };
    });

    const { error: prodError } = await supabase.from("products").insert(productsToInsert);
    if (prodError) throw prodError;

    return { success: true, categoriesCount: insertedCats?.length || 0, productsCount: productsToInsert.length };
  } catch (error: any) {
    console.error("Seeding Error:", error);
    return { success: false, error: error.message };
  }
}

export async function autoSeedDatabaseIfNeeded() {
  const { data: prods } = await supabase.from("products").select("id").limit(1);
  if (!prods || prods.length === 0) {
    await forceSyncAllToSupabase();
  }
}
