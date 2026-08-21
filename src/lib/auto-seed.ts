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
  {
    id: "prod-beef-kandooz",
    name: "لحم بقري كندوز بلدي طازج",
    description: "قطع لحم بقري كندوز بلدي فاخر أحمر صلب بدون دهن زائد، ذبح يومي طازج من مزارعنا.",
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
    cooking_tip: "يُفضل طهيه على نار هادئة مع إضافة حبهان وورق لورا وبصلة مشوية للحصول على ألذ شوربة ونكهة لحم غنية.",
  },
  {
    id: "prod-chicken-pane",
    name: "صدور دجاج بانيه طازجة متبلة",
    description: "صدور دجاج مخلية ومتبلة بخلطة بهارات خاصة، جاهزة للقلي أو الشواء مباشرة.",
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
    cooking_tip: "يُقلى في زيت غزير ساخن لمدة 4 دقائق لكل جانب للحصول على قرمشة ذهبية مثالية ولحم طري من الداخل.",
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
    cooking_tip: "يُعصج مع بصل مبشور ورشة قرفة وجوزة الطيب لنكهة مصرية أصيلة لا تُنسى.",
  },
  {
    id: "prod-egyptian-rice",
    name: "أرز مصري فاخر عريض الحبة (5 كجم)",
    description: "أرز مصري أبيض منقى ومغسول إلكترونياً، حبة عريضة ممتازة تمنحك أفضل قوام مفلفل.",
    category_id: "cat-grocery",
    price_per_unit: 165,
    old_price: 185,
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "شيكارة 5 كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_top_seller: false,
    stock_quantity: 120,
    low_stock_threshold: 20,
    cooking_tip: "يُغسل جيداً ويُشوّح مع السمن الطبيعي لمدة دقيقتين قبل إضافة الماء المغلي بنسبة 1:1 لنتيجة مفلفلة رائعة.",
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
    cooking_tip: "مثالي للسلطات والمقبلات وتتبيل المشويات؛ يُفضل إضافته في نهاية الطهي للحفاظ على الفوائد الصحية.",
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
    is_top_seller: false,
    stock_quantity: 35,
    low_stock_threshold: 10,
    cooking_tip: "يُبشر ناعماً فوق المكرونات والمعجنات الساخنة أو يُقدم مع الخبز البلدي الطازج والعسل الأبيض.",
  },
  {
    id: "prod-fresh-butter",
    name: "زبدة فلاحي طبيعي بقري صفراء",
    description: "زبدة فلاحي نقية 100% بدون أي إضافات صناعية أو زيوت مهدرجة، طعم ورائحة فلاحي أصيلة.",
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
    cooking_tip: "تُذاب على نار هادئة جداً مع رشة ملح لتحويلها إلى سمن بلدي صافٍ برائحة ونكهة زكية تدوم طويلاً.",
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
    cooking_tip: "يُحفظ في أبرد رف بالثلاجة ويُستخدم لصنع المهلبية والحلويات الشرقية الغنية.",
  },
  {
    id: "prod-cottage-cheese",
    name: "جبن قريش فلاحي طبيعي 100%",
    description: "جبن قريش طازج قليل الملح خالي من الدسم الصناعي، من خير المزارع المصرية.",
    category_id: "cat-dairy",
    price_per_unit: 115,
    old_price: 130,
    image_url: "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 40,
    low_stock_threshold: 10,
    cooking_tip: "يُهرس مع زيت الزيتون وقطع الطماطم والكمون ورشة حبة البركة لوجبة فطور صحية ومغذية.",
  },
  {
    id: "prod-fresh-tomatoes",
    name: "طماطم بلدي فرز أول طازجة",
    description: "طماطم بلدي حمراء متماسكة مقطوفة يومياً، ممتازة للسلطات والطهي والتسبيك.",
    category_id: "cat-veg-fruit",
    price_per_unit: 15,
    old_price: 20,
    image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: true,
    is_top_seller: false,
    stock_quantity: 200,
    low_stock_threshold: 30,
    cooking_tip: "تُحفظ خارج الثلاجة للحفاظ على حلاوتها الطبيعية، وتُستخدم للصلصات بعد تقشيرها بالغمر في ماء مغلي لثوانٍ.",
  },
  {
    id: "prod-golden-potatoes",
    name: "بطاطس تحمير سبونتا ذهبية",
    description: "بطاطس مصرية ممتازة مخصصة للقلي، مقرمشة من الخارج وهشة وطرية من الداخل.",
    category_id: "cat-veg-fruit",
    price_per_unit: 22,
    old_price: 28,
    image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: true,
    is_on_sale: true,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 180,
    low_stock_threshold: 25,
    cooking_tip: "تُنقع في ماء بارد مع ملعقة خل لمدة 15 دقيقة قبل القلي لتحصل على قرمشة فائقة تدوم طويلاً.",
  },
  {
    id: "prod-local-cucumbers",
    name: "خيار بلدي صوَب طازج مقرمش",
    description: "خيار طازج منتقى بعناية، حبة صغيرة ونضرة مثالية للسلطات والوجبات الخفيفة.",
    category_id: "cat-veg-fruit",
    price_per_unit: 18,
    old_price: 22,
    image_url: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?auto=format&fit=crop&w=600&q=80",
    is_by_weight: true,
    unit_label: "كجم",
    is_popular: false,
    is_on_sale: false,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 130,
    low_stock_threshold: 20,
    cooking_tip: "يُحفظ في درج الثلاجة ملفوفاً في مناديل ورقية للحفاظ على قرمشته لمدة تصل إلى أسبوعين.",
  },
  {
    id: "prod-baladi-bread",
    name: "عيش بلدي طازج مخبوز على الردة (10 أرغفة)",
    description: "خبز بلدي مصري أصيل ساخن ومخبوز يومياً على الردة الناعمة.",
    category_id: "cat-bakery",
    price_per_unit: 15,
    old_price: null,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    is_by_weight: false,
    unit_label: "كيس 10 أرغفة",
    is_popular: true,
    is_on_sale: false,
    is_featured: false,
    is_top_seller: false,
    stock_quantity: 250,
    low_stock_threshold: 40,
    cooking_tip: "يُسخن على عين البوتاجاز مباشرة لثوانٍ معدودة ليستعيد طراوته ورائحته الشهية كأنه خارج من الفرن للتو.",
  },
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
    cooking_tip: "يُحضر في كنكة نحاسية على نار هادئة جداً (شمعة) مع التقليب لمرة واحدة فقط لضمان وش قهوة كثيف ورغوة متماسكة.",
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
    cooking_tip: "تُحفظ في وعاء محكم الإغلاق في مكان جاف للحفاظ على النكهة والزيوت الطبيعية المقرمشة.",
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
 * Backward compatibility helper function
 */
export async function autoSeedDatabaseIfNeeded() {
  return seedInitialProductsToSupabase();
}
