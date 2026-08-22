/* =========================================================================
   DYNAMIC SUPABASE DATABASE SEEDER (PRODUCTS & CATEGORIES)
   Automatically seeds the live Supabase database if tables are empty.
   ========================================================================= */

import { supabase } from "@/integrations/supabase/client";
import { COMPREHENSIVE_CATEGORIES } from "@/lib/categories-data";

export interface InitialSeedProduct {
  id?: string;
  name: string;
  description: string;
  category_id: string;
  price_per_unit: number;
  old_price: number | null;
  image_url: string;
  is_by_weight: boolean;
  unit_label: string;
  is_popular: boolean;
  is_on_sale: boolean;
  is_featured: boolean;
  is_top_seller: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  cooking_tip?: string | null;
}

export const INITIAL_PRODUCTS_CATALOG: InitialSeedProduct[] = [
  // ─── البقالة والسلع التموينية والأساسية (سوبرماركت) ───
  {
    id: "prod-egyptian-rice",
    name: "أرز مصري فاخر عريض الحبة (5 كجم)",
    description: "أرز مصري أبيض منقى ومغسول إلكترونياً، حبة عريضة ممتازة لجميع وجبات العائلة.",
    category_id: "cat-grocery",
    price_per_unit: 165,
    old_price: 185,
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "شيكارة 5 كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_top_seller: true,
    stock_quantity: 120,
    low_stock_threshold: 20,
    cooking_tip: "يُشوّح مع السمن الطبيعي لدقيقتين قبل إضافة الماء المغلي بنسبة 1:1 لنتيجة مفلفلة رائعة.",
  },
  {
    id: "prod-olive-oil",
    name: "زيت زيتون بكر ممتاز معصور على البارد (1 لتر)",
    description: "زيت زيتون بكر ممتاز درجة أولى، حموضة أقل من 0.8%، معصور على البارد من أجود ثمار الزيتون.",
    category_id: "cat-grocery",
    price_per_unit: 290,
    old_price: 330,
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "زجاجة 1 لتر",
    is_popular: true,
    is_on_sale: true,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 80,
    low_stock_threshold: 15,
    cooking_tip: "مثالي للسلطات والمقبلات وتتبيل المشويات؛ يُفضل إضافته في نهاية الطهي.",
  },
  {
    id: "prod-sunflower-oil",
    name: "زيت عباد الشمس نقي للقلي والطهي (2.2 لتر)",
    description: "زيت عباد شمس مكرر ونقي 100% خالي من الكوليسترول، مناسب للطهي والقلي اليومي.",
    category_id: "cat-grocery",
    price_per_unit: 145,
    old_price: 165,
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "زجاجة 2.2 لتر",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_top_seller: true,
    stock_quantity: 110,
    low_stock_threshold: 20,
    cooking_tip: "يتحمل درجات الحرارة العالية ويمنح الأطعمة لوناً ذهبياً بدون أي روائح نفاذة.",
  },
  {
    id: "prod-pasta-penne",
    name: "مكرونة إيطالي فاخرة ريشة (1 كجم)",
    description: "مصنوعة من سميد القمح الصلب 100%، متماسكة عند السلق ولا تلتصق أبداً.",
    category_id: "cat-grocery",
    price_per_unit: 42,
    old_price: 48,
    image_url: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "كيس 1 كجم",
    is_popular: true,
    is_on_sale: false,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 150,
    low_stock_threshold: 30,
    cooking_tip: "تُسلق لمدة 8 دقائق فقط في ماء مملح مغلي لتصل لدرجة النضج المثالية Al Dente.",
  },
  {
    id: "prod-tuna-chunks",
    name: "تونا قطع فاخرة في زيت دوار الشمس (185 جم)",
    description: "لحم تونا أبيض متماسك عالي البروتين بدون أي زفارة، معبأة في زيت دوار الشمس النقي.",
    category_id: "cat-grocery",
    price_per_unit: 48,
    old_price: 55,
    image_url: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "علبة 185 جم",
    is_popular: true,
    is_on_sale: true,
    is_featured: false,
    is_top_seller: true,
    stock_quantity: 130,
    low_stock_threshold: 25,
    cooking_tip: "تُصفى وتُخلط مع الذرة الحلوة وعصير الليمون ورشة كمون لوجبة سريعة وصحية.",
  },
  {
    id: "prod-pure-sugar",
    name: "سكر أبيض ناصع فاخر مكرر (1 كجم)",
    description: "سكر مصري ناصع البياض سريع الذوبان للمشروبات والحلويات المنزلية.",
    category_id: "cat-grocery",
    price_per_unit: 35,
    old_price: 38,
    image_url: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "كيس 1 كجم",
    is_popular: true,
    is_on_sale: false,
    is_featured: false,
    is_top_seller: true,
    stock_quantity: 200,
    low_stock_threshold: 30,
    cooking_tip: "يُحفظ في وعاء زجاجي محكم الإغلاق في مكان جاف بعيداً عن الرطوبة.",
  },

  // ─── قسم الألبان والأجبان ───
  {
    id: "prod-roumy-cheese",
    name: "جبن رومي مصري قديم فاخر (بطارخ)",
    description: "جبن رومي مصري معتق أصلي بطعم غني ومميز، مقطع شرائح طازجة عند الطلب.",
    category_id: "cat-dairy",
    price_per_unit: 340,
    old_price: 380,
    image_url: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_top_seller: true,
    stock_quantity: 35,
    low_stock_threshold: 10,
    cooking_tip: "يُبشر ناعماً فوق المكرونات والمعجنات الساخنة أو يُقدم مع الخبز والتوست.",
  },
  {
    id: "prod-fresh-butter",
    name: "زبدة فلاحي طبيعي بقري صفراء",
    description: "زبدة فلاحي نقية 100% بدون أي إضافات صناعية، طعم ورائحة فلاحي أصيلة.",
    category_id: "cat-dairy",
    price_per_unit: 260,
    old_price: null,
    image_url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: false,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 50,
    low_stock_threshold: 10,
    cooking_tip: "تُذاب على نار هادئة جداً لتحويلها إلى سمن بلدي صافٍ برائحة زكية.",
  },
  {
    id: "prod-baladi-milk",
    name: "حليب بقري طبيعي طازج كامل الدسم (1 لتر)",
    description: "حليب طازج يومي مبستر وغني بالقشطة الطبيعية بدون أي مواد حافظة.",
    category_id: "cat-dairy",
    price_per_unit: 42,
    old_price: 46,
    image_url: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "زجاجة 1 لتر",
    is_popular: true,
    is_on_sale: true,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 90,
    low_stock_threshold: 15,
    cooking_tip: "يُحفظ في أبرد رف بالثلاجة ويُستخدم لصنع الحلويات والمشروبات الصباحية.",
  },
  {
    id: "prod-cheddar-slices",
    name: "جبن شيدر أحمر مستورد شرائح (250 جم)",
    description: "شرائح شيدر ممتازة سريعة الذوبان، مثالية للبرجر والساندوتشات الساخنة.",
    category_id: "cat-dairy",
    price_per_unit: 95,
    old_price: 110,
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "علبة 250 جم",
    is_popular: false,
    is_on_sale: true,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 60,
    low_stock_threshold: 10,
    cooking_tip: "توضع شريحة فوق قطعة اللحم الساخنة قبل التقديم بـ 30 ثانية لتذوب بنعومة.",
  },

  // ─── اللحوم والدواجن الطازجة ───
  {
    id: "prod-beef-kandooz",
    name: "لحم بقري كندوز بلدي طازج",
    description: "قطع لحم بقري كندوز بلدي فاخر أحمر صلب بدون دهن زائد، ذبح يومي معتمد.",
    category_id: "cat-meat",
    price_per_unit: 380,
    old_price: 420,
    image_url: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_top_seller: true,
    stock_quantity: 45,
    low_stock_threshold: 10,
    cooking_tip: "يُفضل طهيه على نار هادئة مع حبهان وورق لورا وبصلة للحصول على ألذ شوربة ولحم طري.",
  },
  {
    id: "prod-chicken-pane",
    name: "صدور دجاج بانيه طازجة متبلة",
    description: "صدور دجاج مخلية ومتبلة بخلطة السوبرماركت الخاصة، جاهزة للقلي أو الشواء مباشرة.",
    category_id: "cat-meat",
    price_per_unit: 210,
    old_price: 240,
    image_url: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_top_seller: false,
    stock_quantity: 60,
    low_stock_threshold: 15,
    cooking_tip: "يُقلى في زيت غزير ساخن لمدة 4 دقائق لكل جانب للحصول على قرمشة ذهبية.",
  },
  {
    id: "prod-minced-meat",
    name: "مفروم بلدي أحمر فاخر",
    description: "لحم بقري بلدي مفروم طازج بنسبة دهن مثالية 10% لكافة أنواع الطواجن والكفتة والباشاميل.",
    category_id: "cat-meat",
    price_per_unit: 340,
    old_price: 370,
    image_url: "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: false,
    is_top_seller: true,
    stock_quantity: 35,
    low_stock_threshold: 10,
    cooking_tip: "يُعصج مع بصل مبشور ورشة قرفة وجوزة الطيب لنكهة مصرية أصيلة.",
  },

  // ─── المنظفات والمستلزمات المنزلية ───
  {
    id: "prod-laundry-powder",
    name: "مسحوق غسيل أوتوماتيك لافندر (4 كجم)",
    description: "مسحوق غسيل مركز للغسالات الأوتوماتيك بنظافة فائقة ورائحة اللافندر المنعشة.",
    category_id: "cat-cleaning",
    price_per_unit: 195,
    old_price: 230,
    image_url: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "شيكارة 4 كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_top_seller: true,
    stock_quantity: 85,
    low_stock_threshold: 15,
    cooking_tip: "يوضع مكيال واحد في درج الغسالة مع تفعيل دورة الشطف الإضافية لملابس ناصعة.",
  },
  {
    id: "prod-dish-soap",
    name: "سائل غسيل الأطباق بالليمون المركز (1 لتر)",
    description: "تركيبة قوية تقضي على أصعب الدهون بلمعة فائقة ورغوة كثيفة تدوم طويلاً.",
    category_id: "cat-cleaning",
    price_per_unit: 38,
    old_price: 45,
    image_url: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "زجاجة 1 لتر",
    is_popular: true,
    is_on_sale: false,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 140,
    low_stock_threshold: 20,
    cooking_tip: "تكفي قطرات قليلة على إسفنجة رطبة لتنظيف كميات كبيرة من الأواني بلمعان كامل.",
  },

  // ─── المحمصة والمشروبات ───
  {
    id: "prod-yemeni-coffee",
    name: "بن يمني محوج بخلطة الهيل والمستكة (250 جم)",
    description: "حبوب بن يمني أصيل مطحونة طازجة ومحوجة بأفخر أنواع الحبهان والمستكة والزعفران.",
    category_id: "cat-roastery",
    price_per_unit: 120,
    old_price: 140,
    image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "علبة 250 جم",
    is_popular: true,
    is_on_sale: true,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 90,
    low_stock_threshold: 15,
    cooking_tip: "يُحضر في كنكة نحاسية على نار هادئة جداً لضمان وش قهوة كثيف ورغوة متماسكة.",
  },
  {
    id: "prod-mixed-nuts",
    name: "مكسرات مشكلة فاخرة محمصة (250 جم)",
    description: "تشكيلة فاخرة من الكاجو والفستق واللوز وعين الجمل المحمص بدون ملح زائد.",
    category_id: "cat-roastery",
    price_per_unit: 160,
    old_price: 190,
    image_url: "https://images.unsplash.com/photo-1536591375315-1b83681469e3?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "علبة 250 جم",
    is_popular: true,
    is_on_sale: true,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 75,
    low_stock_threshold: 10,
    cooking_tip: "تُحفظ في وعاء محكم الإغلاق في مكان جاف للحفاظ على القرمشة الطازجة.",
  },
];

let isSeedingInProgress: Promise<{ success: boolean; seeded: boolean; count: number }> | null = null;

/**
 * Seeds categories and products to Supabase if the tables are empty.
 */
export async function seedInitialProductsToSupabase(): Promise<{
  success: boolean;
  seeded: boolean;
  count: number;
  error?: string;
}> {
  if (isSeedingInProgress) {
    return isSeedingInProgress;
  }

  isSeedingInProgress = (async () => {
    try {
      // 1. Seed Categories first if empty
      const { data: existingCats, error: catErr } = await supabase
        .from("categories")
        .select("id")
        .limit(1);

      if (!catErr && (!existingCats || existingCats.length === 0)) {
        console.info("[Database Seeder] 📂 Seeding default categories...");
        const catsPayload = COMPREHENSIVE_CATEGORIES.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          image_url: c.image_url,
          sort_order: c.sort_order,
          parent_id: c.parent_id || null,
        }));

        await supabase.from("categories").upsert(catsPayload as any);
      }

      // 2. Check if products table is empty
      const { count, error: countErr } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });

      if (countErr) {
        console.warn("[Database Seeder] Warning checking products count:", countErr.message);
      }

      if (count !== null && count > 0) {
        // Table already contains records, no seeding needed
        return { success: true, seeded: false, count };
      }

      console.info("[Database Seeder] 🚀 Products table is empty. Seeding initial catalog to Supabase...");

      const payload = INITIAL_PRODUCTS_CATALOG.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category_id: p.category_id,
        price_per_unit: p.price_per_unit,
        old_price: p.old_price,
        image_url: p.image_url,
        is_by_weight: p.is_by_weight,
        unit_label: p.unit_label,
        is_popular: p.is_popular,
        is_on_sale: p.is_on_sale,
        is_featured: p.is_featured,
        is_top_seller: p.is_top_seller,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold,
        cooking_tip: p.cooking_tip || null,
        created_at: new Date().toISOString(),
      }));

      const { error: insertErr } = await supabase
        .from("products")
        .upsert(payload as any);

      if (insertErr) {
        console.error("[Database Seeder] ❌ Error inserting initial products:", insertErr.message);
        return { success: false, seeded: false, count: 0, error: insertErr.message };
      }

      console.info(`[Database Seeder] ✅ Successfully seeded ${payload.length} products to Supabase.`);
      return { success: true, seeded: true, count: payload.length };
    } catch (err: any) {
      console.error("[Database Seeder] ❌ Seeding exception:", err);
      return { success: false, seeded: false, count: 0, error: String(err?.message || err) };
    } finally {
      isSeedingInProgress = null;
    }
  })();

  return isSeedingInProgress;
}

/**
 * Forces a full synchronization of categories, products, and default store settings to Supabase.
 */
export async function forceSyncAllToSupabase(): Promise<{
  success: boolean;
  categoriesCount: number;
  productsCount: number;
  settingsSaved: boolean;
  error?: string;
}> {
  try {
    // 1. Sync Categories
    const catsPayload = COMPREHENSIVE_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      image_url: c.image_url,
      sort_order: c.sort_order,
      parent_id: c.parent_id || null,
    }));

    const { error: catErr } = await supabase.from("categories").upsert(catsPayload as any);
    if (catErr) {
      console.warn("[Sync Supabase] Categories upsert notice:", catErr.message);
    }

    // 2. Sync Products
    const productsPayload = INITIAL_PRODUCTS_CATALOG.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category_id: p.category_id,
      price_per_unit: p.price_per_unit,
      old_price: p.old_price,
      image_url: p.image_url,
      is_by_weight: p.is_by_weight,
      unit_label: p.unit_label,
      is_popular: p.is_popular,
      is_on_sale: p.is_on_sale,
      is_featured: p.is_featured,
      is_top_seller: p.is_top_seller,
      stock_quantity: p.stock_quantity,
      low_stock_threshold: p.low_stock_threshold,
      cooking_tip: p.cooking_tip || null,
      updated_at: new Date().toISOString(),
    }));

    const { error: prodErr } = await supabase.from("products").upsert(productsPayload as any);
    if (prodErr) {
      console.warn("[Sync Supabase] Products upsert notice:", prodErr.message);
    }

    // 3. Sync Store Settings to Supabase
    const defaultSettingsPayload = {
      site_name: "الوادي الأخضر",
      hero_title: "الوادي الأخضر — سوبرماركت عائلتك 🛒",
      hero_subtitle: "أجود السلع التموينية والبقالة واللحوم الطازجة والألبان بأفضل الأسعار وتوصيل فوري ⚡",
      hero_cta_text: "تسوّق الآن",
      announcement_text: "🛒 سوبرماركت الوادي الأخضر — كل احتياجات بيتك وتموينك بتوصيل فوري لباب بيتك ⚡",
      announcement_enabled: true,
      announcement_bg_color: "142 76% 24%",
      primary_color: "142 76% 24%",
      accent_color: "18 85% 55%",
      background_color: "48 33% 97%",
      foreground_color: "120 18% 12%",
      updated_at: new Date().toISOString(),
    };

    let settingsSaved = false;
    try {
      const { error: setErr } = await (supabase as any)
        .from("store_settings")
        .upsert([defaultSettingsPayload]);
      if (!setErr) settingsSaved = true;
    } catch {
      // Ignored if RLS requires admin or table variation
    }

    return {
      success: true,
      categoriesCount: catsPayload.length,
      productsCount: productsPayload.length,
      settingsSaved,
    };
  } catch (err: any) {
    console.error("[Sync Supabase] Error during sync:", err);
    return {
      success: false,
      categoriesCount: 0,
      productsCount: 0,
      settingsSaved: false,
      error: String(err?.message || err),
    };
  }
}

/**
 * Backward compatibility helper function
 */
export async function autoSeedDatabaseIfNeeded() {
  return seedInitialProductsToSupabase();
}
