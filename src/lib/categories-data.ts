export type ComprehensiveCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  badge?: string | null;
  sort_order: number;
  parent_id?: string | null;
  description?: string;
  subcategories?: {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    image_url?: string;
  }[];
};

export const COMPREHENSIVE_CATEGORIES: ComprehensiveCategory[] = [
  {
    id: "cat-grocery",
    name: "البقالة والتموين",
    slug: "grocery-pantry",
    icon: "🌾",
    image_url:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80",
    badge: "أساسيات البيت",
    sort_order: 1,
    description: "جميع المستلزمات والسلع التموينية الأساسية: أرز، زيوت، مكرونة، سكر، معلبات وصفيح",
    subcategories: [
      {
        id: "sub-rice-pasta",
        name: "الأرز، المكرونة والحبوب",
        slug: "rice-pasta",
        icon: "🍚",
        image_url:
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-oil-ghee",
        name: "الزيوت والسمن الطبيعي",
        slug: "oils-ghee",
        icon: "🫒",
        image_url:
          "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-canned",
        name: "المعلبات والأغذية المحفوظة",
        slug: "canned-foods",
        icon: "🥫",
        image_url:
          "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-sugar-flour",
        name: "السكر، الدقيق والمخبوزات",
        slug: "sugar-flour",
        icon: "🌾",
        image_url:
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-sauces",
        name: "الصلصات، المايونيز والتوابل",
        slug: "sauces-condiments",
        icon: "🍶",
        image_url:
          "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-meat",
    name: "اللحوم والدواجن الطازجة",
    slug: "meats-poultry",
    icon: "🥩",
    image_url:
      "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80",
    badge: "ذبح يومي طازج",
    sort_order: 2,
    description: "لحوم بلدي كندوز وضاني طازجة، دواجن منظفة ومفروم جاهز للطهي",
    subcategories: [
      {
        id: "sub-fresh-meat",
        name: "لحوم بلدي طازجة",
        slug: "fresh-beef",
        icon: "🥩",
        image_url:
          "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-poultry",
        name: "دواجن كاملة ومقطعة",
        slug: "poultry",
        icon: "🍗",
        image_url:
          "https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-minced",
        name: "مفروم ومصنعات بلدي",
        slug: "minced-meat",
        icon: "🍔",
        image_url:
          "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-dairy",
    name: "الألبان والأجبان",
    slug: "dairy-cheese",
    icon: "🧀",
    image_url:
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80",
    badge: "قسم الأجبان البلدية",
    sort_order: 3,
    description: "أجبان رومي وشيدر وبراميلي، حليب طازج يومياً، زبادي، قشطة وزبدة طبيعية",
    subcategories: [
      {
        id: "sub-fresh-milk",
        name: "الحليب والمشروبات اللبنية",
        slug: "fresh-milk",
        icon: "🥛",
        image_url:
          "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-white-cheese",
        name: "الأجبان البيضاء والبلدية",
        slug: "white-cheese",
        icon: "🧀",
        image_url:
          "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-hard-cheese",
        name: "الرومي، الشيدر والجبن الجاف",
        slug: "hard-cheese",
        icon: "🧀",
        image_url:
          "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-butter-cream",
        name: "الزبدة، القشطة والزبادي",
        slug: "butter-cream",
        icon: "🧈",
        image_url:
          "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-veg-fruit",
    name: "خضروات وفواكه طازجة",
    slug: "vegetables-fruits",
    icon: "🥑",
    image_url:
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80",
    badge: "فرز أول يومياً",
    sort_order: 4,
    description: "خضروات وفواكه طازجة نخب أول مجمعة يومياً من أفضل المزارع",
    subcategories: [
      {
        id: "sub-veg-leafy",
        name: "خضروات ورقية وأعشاب",
        slug: "leafy-greens",
        icon: "🥬",
        image_url:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-veg-fresh",
        name: "خضروات طازجة متنوعة",
        slug: "fresh-vegetables",
        icon: "🥕",
        image_url:
          "https://images.unsplash.com/photo-1598170845058-12ef4a457539?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-fruit-local",
        name: "فواكه موسمية محليّة",
        slug: "local-fruits",
        icon: "🍊",
        image_url:
          "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-fruit-import",
        name: "فواكه مستوردة فاخرة",
        slug: "imported-fruits",
        icon: "🍎",
        image_url:
          "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-bakery",
    name: "المخبوزات والحلويات",
    slug: "bakery-sweets",
    icon: "🥐",
    image_url:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
    badge: "مخبوزات الفرن",
    sort_order: 5,
    description: "خبز بلدي، توست، كرواسون، معجنات طازجة وحلويات شرقية وغربية",
    subcategories: [
      {
        id: "sub-bread",
        name: "خبز وتوست يومي",
        slug: "daily-bread",
        icon: "🍞",
        image_url:
          "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-pastries",
        name: "معجنات وفطائر",
        slug: "pastries",
        icon: "🥐",
        image_url:
          "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-oriental",
        name: "حلويات شرقية وغربية",
        slug: "sweets",
        icon: "🍰",
        image_url:
          "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-toast",
        name: "بقسماط وسونات",
        slug: "toast-rusks",
        icon: "🥖",
        image_url:
          "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-frozen",
    name: "المأكولات المجمدة",
    slug: "frozen-foods",
    icon: "🧊",
    image_url:
      "https://images.unsplash.com/photo-1584473457406-6df3a637210c?auto=format&fit=crop&w=600&q=80",
    badge: "تجميد ممتاز",
    sort_order: 6,
    description: "خضروات مجمدة، بانيه ودواجن جاهزة، أسماك ووجبات سريعة التحضير",
    subcategories: [
      {
        id: "sub-froz-veg",
        name: "خضروات وفواكه مجمدة",
        slug: "frozen-veg",
        icon: "🥦",
        image_url:
          "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-froz-meat",
        name: "مصنعات ودواجن مجمدة",
        slug: "frozen-poultry",
        icon: "🥩",
        image_url:
          "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-froz-fish",
        name: "أسماك ومأكولات بحرية",
        slug: "seafood",
        icon: "🐟",
        image_url:
          "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-froz-pizza",
        name: "بيتزا ووجبات سريعة",
        slug: "frozen-meals",
        icon: "🍕",
        image_url:
          "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-beverages",
    name: "المشروبات والعصائر",
    slug: "beverages-juices",
    icon: "🧃",
    image_url:
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
    badge: "عصائر ومشروبات",
    sort_order: 7,
    description: "عصائر طبيعية، مياه معدنية، مشروبات غازية وشاي وقهوة سريعة التحضير",
    subcategories: [
      {
        id: "sub-juices",
        name: "عصائر طبيعية وبودرة",
        slug: "juices",
        icon: "🧃",
        image_url:
          "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-soda",
        name: "مشروبات غازية وفوارة",
        slug: "soda",
        icon: "🥤",
        image_url:
          "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-water",
        name: "مياه معدنية ونقية",
        slug: "water",
        icon: "💧",
        image_url:
          "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-hot-drink",
        name: "شاي، قهوة ومشروبات ساخنة",
        slug: "hot-drinks",
        icon: "☕",
        image_url:
          "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-snacks",
    name: "الشوكولاتة والتسالي",
    slug: "snacks-chocolates",
    icon: "🍫",
    image_url:
      "https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=600&q=80",
    badge: "سناكس وتسالي",
    sort_order: 8,
    description: "شوكولاتة فاخرة، شيبس، بسكويت ومقرمشات لجميع أوقات العائلة",
    subcategories: [
      {
        id: "sub-choco",
        name: "شوكولاتة وموالح",
        slug: "chocolates",
        icon: "🍫",
        image_url:
          "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-chips",
        name: "شيبس وبسكويت",
        slug: "biscuits-chips",
        icon: "🍪",
        image_url:
          "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-candy",
        name: "حلويات وكاندي أطفال",
        slug: "candies",
        icon: "🍬",
        image_url:
          "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-cleaning",
    name: "المنظفات والورقيات",
    slug: "cleaning-paper",
    icon: "🧹",
    image_url:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80",
    badge: "نظافة وتطهير",
    sort_order: 9,
    description: "مساحيق غسيل أوتوماتيك، مطهرات، مناديل ورقية ومعطرات المنزل",
    subcategories: [
      {
        id: "sub-laundry",
        name: "مساحيق ومنعمات الغسيل",
        slug: "laundry",
        icon: "🧺",
        image_url:
          "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-cleaners",
        name: "مطهرات وملمعات أسطح",
        slug: "disinfectants",
        icon: "🧽",
        image_url:
          "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-tissues",
        name: "مناديل ورقية وورق مطبخ",
        slug: "tissues",
        icon: "🧻",
        image_url:
          "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-personal-care",
    name: "العناية الشخصية والطفل",
    slug: "personal-care-baby",
    icon: "🧴",
    image_url:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
    badge: "عناية وصحة",
    sort_order: 10,
    description: "شامبو، صابون، عناية بالبشرة، وحفاضات ومستلزمات الطفل",
    subcategories: [
      {
        id: "sub-hair-body",
        name: "العناية بالشعر والجسم",
        slug: "hair-body",
        icon: "🧴",
        image_url:
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-soap-wash",
        name: "الصابون وغسول الوجه",
        slug: "soap-wash",
        icon: "🧼",
        image_url:
          "https://images.unsplash.com/photo-1607006411601-775c8cc6a726?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-baby-care",
        name: "حفاضات ومستلزمات الطفل",
        slug: "baby-care",
        icon: "👶",
        image_url:
          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-spices",
    name: "العطارة والبهارات",
    slug: "spices-herbs",
    icon: "🌶️",
    image_url:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80",
    badge: "عطارة فاخرة",
    sort_order: 11,
    description: "توابل، بهارات مشكلة، أعشاب طبيعية وزيوت نادرة بخلطات السوبرماركت",
    subcategories: [
      {
        id: "sub-ground-spices",
        name: "بهارات مطحونة طازجة",
        slug: "ground-spices",
        icon: "🧂",
        image_url:
          "https://images.unsplash.com/photo-1509358271058-acd02cc93898?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-herbs",
        name: "أعشاب طبيعية وطبية",
        slug: "natural-herbs",
        icon: "🌿",
        image_url:
          "https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-blends",
        name: "خلطات عطارة الوادي الخاصة",
        slug: "special-blends",
        icon: "✨",
        image_url:
          "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-oils",
        name: "زيوت معصورة وعطرية",
        slug: "essential-oils",
        icon: "🫗",
        image_url:
          "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-roastery",
    name: "المحمصة والمكسرات",
    slug: "roastery-nuts",
    icon: "🥜",
    image_url:
      "https://images.unsplash.com/photo-1536591375315-198953926e82?auto=format&fit=crop&w=600&q=80",
    badge: "تحميص طازج",
    sort_order: 12,
    description: "مكسرات فاخرة، كاجو، لوز، فستق، بن يمني وقهوة محوجة",
    subcategories: [
      {
        id: "sub-roasted-nuts",
        name: "مكسرات فاخرة محمصة",
        slug: "roasted-nuts",
        icon: "🥜",
        image_url:
          "https://images.unsplash.com/photo-1536591375315-198953926e82?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-raw-nuts",
        name: "مكسرات نية للطبخ",
        slug: "raw-nuts",
        icon: "🌰",
        image_url:
          "https://images.unsplash.com/photo-1508061252966-f728f244199f?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-coffee",
        name: "بن محوج وقهوة عربية",
        slug: "coffee-beans",
        icon: "☕",
        image_url:
          "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-seeds",
        name: "لب وتسالي محمصة",
        slug: "seeds-snacks",
        icon: "🍿",
        image_url:
          "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
  {
    id: "cat-household",
    name: "الأدوات المنزلية والبلاستيك",
    slug: "household-plastics",
    icon: "🍽️",
    image_url:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
    badge: "مستلزمات المنزل",
    sort_order: 13,
    description: "علب حفظ الطعام، أدوات المطبخ، بلاستيكيات وأكياس حفظ وطهي",
    subcategories: [
      {
        id: "sub-kitchenware",
        name: "أدوات ومستلزمات المطبخ",
        slug: "kitchenware",
        icon: "🍽️",
        image_url:
          "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-plastic-containers",
        name: "علب وأكياس حفظ الطعام",
        slug: "plastic-containers",
        icon: "📦",
        image_url:
          "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=300&q=80",
      },
      {
        id: "sub-foil-wrap",
        name: "ورق ألومنيوم وستريتش",
        slug: "foil-wrap",
        icon: "🍱",
        image_url:
          "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=300&q=80",
      },
    ],
  },
];

export function getMergedCategories(dbCats?: any[]): ComprehensiveCategory[] {
  const resultMap = new Map<string, ComprehensiveCategory>();

  // Add preset categories
  for (const c of COMPREHENSIVE_CATEGORIES) {
    resultMap.set(c.id, { ...c });
  }

  if (dbCats && Array.isArray(dbCats) && dbCats.length > 0) {
    for (const dbCat of dbCats) {
      if (!dbCat || !dbCat.name) continue;

      const dbNameNorm = dbCat.name.trim().toLowerCase();

      // Find matching preset by id, slug, or name
      const match = COMPREHENSIVE_CATEGORIES.find(
        (c) =>
          c.id === dbCat.id ||
          c.slug === dbCat.slug ||
          c.name.trim().toLowerCase().includes(dbNameNorm) ||
          dbNameNorm.includes(c.name.trim().toLowerCase()) ||
          (dbNameNorm.includes("خضار") && c.id === "cat-veg-fruit") ||
          (dbNameNorm.includes("لحم") && c.id === "cat-meat") ||
          (dbNameNorm.includes("لبن") && c.id === "cat-dairy") ||
          (dbNameNorm.includes("جبن") && c.id === "cat-dairy") ||
          (dbNameNorm.includes("بقالة") && c.id === "cat-grocery") ||
          (dbNameNorm.includes("عطارة") && c.id === "cat-spices") ||
          (dbNameNorm.includes("مكسرات") && c.id === "cat-roastery") ||
          (dbNameNorm.includes("مخبوز") && c.id === "cat-bakery") ||
          (dbNameNorm.includes("مجمد") && c.id === "cat-frozen") ||
          (dbNameNorm.includes("عصير") && c.id === "cat-beverages") ||
          (dbNameNorm.includes("شوكول") && c.id === "cat-snacks") ||
          (dbNameNorm.includes("عناية") && c.id === "cat-personal-care") ||
          (dbNameNorm.includes("منظف") && c.id === "cat-cleaning") ||
          (dbNameNorm.includes("أدوات") && c.id === "cat-household"),
      );

      if (match) {
        const existing = resultMap.get(match.id) || match;
        const validImage =
          dbCat.image_url && dbCat.image_url.startsWith("http") ? dbCat.image_url : match.image_url;

        resultMap.set(match.id, {
          ...existing,
          id: dbCat.id || existing.id,
          name: dbCat.name || existing.name,
          slug: dbCat.slug || existing.slug,
          icon: dbCat.icon || existing.icon,
          image_url: validImage,
          sort_order: dbCat.sort_order ?? existing.sort_order,
        });
      } else if (!dbCat.parent_id) {
        // Custom parent category
        resultMap.set(dbCat.id || `custom-${resultMap.size}`, {
          id: dbCat.id,
          name: dbCat.name,
          slug: dbCat.slug || dbCat.id,
          icon: dbCat.icon || "🌿",
          image_url:
            dbCat.image_url && dbCat.image_url.startsWith("http")
              ? dbCat.image_url
              : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
          sort_order: dbCat.sort_order ?? 99,
        });
      }
    }
  }

  return Array.from(resultMap.values()).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export const MOCK_PRODUCTS: any[] = [
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
    isTopSeller: true,
    stock_quantity: 45,
    low_stock_threshold: 10,
    views_count: 1420,
    viewsCount: 1420,
    purchase_count: 310,
    purchaseCount: 310,
    avg_rating: 4.9,
    avgRating: 4.9,
    reviews_count: 48,
    reviewsCount: 48,
    cooking_tip: "يُفضل طهيه على نار هادئة مع إضافة حبهان وورق لورا وبصلة مشوية للحصول على ألذ شوربة ونكهة لحم غنية.",
    cookingTip: "يُفضل طهيه على نار هادئة مع إضافة حبهان وورق لورا وبصلة مشوية للحصول على ألذ شوربة ونكهة لحم غنية.",
    created_at: new Date().toISOString(),
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
    is_top_seller: true,
    isTopSeller: true,
    stock_quantity: 60,
    low_stock_threshold: 15,
    views_count: 980,
    viewsCount: 980,
    purchase_count: 245,
    purchaseCount: 245,
    avg_rating: 4.8,
    avgRating: 4.8,
    reviews_count: 36,
    reviewsCount: 36,
    cooking_tip: "يُقلى في زيت غزير ساخن لمدة 4 دقائق لكل جانب للحصول على قرمشة ذهبية مثالية ولحم طري من الداخل.",
    cookingTip: "يُقلى في زيت غزير ساخن لمدة 4 دقائق لكل جانب للحصول على قرمشة ذهبية مثالية ولحم طري من الداخل.",
    created_at: new Date().toISOString(),
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
    is_top_seller: true,
    isTopSeller: true,
    stock_quantity: 120,
    low_stock_threshold: 20,
    views_count: 1890,
    viewsCount: 1890,
    purchase_count: 520,
    purchaseCount: 520,
    avg_rating: 5.0,
    avgRating: 5.0,
    reviews_count: 62,
    reviewsCount: 62,
    cooking_tip: "يُغسل جيداً ويُشوّح مع السمن الطبيعي لمدة دقيقتين قبل إضافة الماء المغلي بنسبة 1:1 لنتيجة مفلفلة رائعة.",
    cookingTip: "يُغسل جيداً ويُشوّح مع السمن الطبيعي لمدة دقيقتين قبل إضافة الماء المغلي بنسبة 1:1 لنتيجة مفلفلة رائعة.",
    created_at: new Date().toISOString(),
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
    isTopSeller: false,
    stock_quantity: 80,
    low_stock_threshold: 15,
    views_count: 640,
    viewsCount: 640,
    purchase_count: 115,
    purchaseCount: 115,
    avg_rating: 4.7,
    avgRating: 4.7,
    reviews_count: 19,
    reviewsCount: 19,
    cooking_tip: "مثالي للسلطات والمقبلات وتتبيل المشويات؛ يُفضل إضافته في نهاية الطهي للحفاظ على الفوائد الصحية.",
    cookingTip: "مثالي للسلطات والمقبلات وتتبيل المشويات؛ يُفضل إضافته في نهاية الطهي للحفاظ على الفوائد الصحية.",
    created_at: new Date().toISOString(),
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
    is_top_seller: true,
    isTopSeller: true,
    stock_quantity: 35,
    low_stock_threshold: 10,
    views_count: 1120,
    viewsCount: 1120,
    purchase_count: 280,
    purchaseCount: 280,
    avg_rating: 4.9,
    avgRating: 4.9,
    reviews_count: 41,
    reviewsCount: 41,
    cooking_tip: "يُبشر ناعماً فوق المكرونات والمعجنات الساخنة أو يُقدم مع الخبز البلدي الطازج والعسل الأبيض.",
    cookingTip: "يُبشر ناعماً فوق المكرونات والمعجنات الساخنة أو يُقدم مع الخبز البلدي الطازج والعسل الأبيض.",
    created_at: new Date().toISOString(),
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
    isTopSeller: false,
    stock_quantity: 50,
    low_stock_threshold: 10,
    views_count: 530,
    viewsCount: 530,
    purchase_count: 95,
    purchaseCount: 95,
    avg_rating: 4.6,
    avgRating: 4.6,
    reviews_count: 14,
    reviewsCount: 14,
    cooking_tip: "تُذاب على نار هادئة جداً مع رشة ملح لتحويلها إلى سمن بلدي صافٍ برائحة ونكهة زكية تدوم طويلاً.",
    cookingTip: "تُذاب على نار هادئة جداً مع رشة ملح لتحويلها إلى سمن بلدي صافٍ برائحة ونكهة زكية تدوم طويلاً.",
    created_at: new Date().toISOString(),
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
    is_top_seller: true,
    isTopSeller: true,
    stock_quantity: 200,
    low_stock_threshold: 30,
    views_count: 2450,
    viewsCount: 2450,
    purchase_count: 670,
    purchaseCount: 670,
    avg_rating: 4.8,
    avgRating: 4.8,
    reviews_count: 53,
    reviewsCount: 53,
    cooking_tip: "تُحفظ خارج الثلاجة للحفاظ على حلاوتها الطبيعية، وتُستخدم للصلصات بعد تقشيرها بالغمر في ماء مغلي لثوانٍ.",
    cookingTip: "تُحفظ خارج الثلاجة للحفاظ على حلاوتها الطبيعية، وتُستخدم للصلصات بعد تقشيرها بالغمر في ماء مغلي لثوانٍ.",
    created_at: new Date().toISOString(),
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
    isTopSeller: false,
    stock_quantity: 90,
    low_stock_threshold: 15,
    views_count: 760,
    viewsCount: 760,
    purchase_count: 180,
    purchaseCount: 180,
    avg_rating: 4.9,
    avgRating: 4.9,
    reviews_count: 27,
    reviewsCount: 27,
    cooking_tip: "يُحضر في كنكة نحاسية على نار هادئة جداً (شمعة) مع التقليب لمرة واحدة فقط لضمان وش قهوة كثيف ورغوة متماسكة.",
    cookingTip: "يُحضر في كنكة نحاسية على نار هادئة جداً (شمعة) مع التقليب لمرة واحدة فقط لضمان وش قهوة كثيف ورغوة متماسكة.",
    created_at: new Date().toISOString(),
  },
];
