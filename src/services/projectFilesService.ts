// Service to index, read, modify, and manage all files in the project workspace

export interface ProjectFileMeta {
  path: string;
  name: string;
  category: "routes" | "components" | "services" | "lib" | "types" | "styles" | "config";
  extension: "tsx" | "ts" | "css" | "json" | "md";
  description: string;
  lineCount?: number;
  lastModified?: string;
  content?: string;
}

// Built-in registry of key project files with their descriptions and default source representations
export const PROJECT_FILES_REGISTRY: ProjectFileMeta[] = [
  // ─── ROUTES ───
  {
    path: "/src/routes/index.tsx",
    name: "index.tsx",
    category: "routes",
    extension: "tsx",
    description:
      "الصفحة الرئيسية للمتجر (Storefront Homepage) — تضم البانرات، الفلاش سيل، شبكة الإعلانات، والأقسام الديناميكية",
    lineCount: 380,
  },
  {
    path: "/src/routes/cart.tsx",
    name: "cart.tsx",
    category: "routes",
    extension: "tsx",
    description:
      "صفحة سلة التسوق وإتمام الطلب (Cart & Checkout) — ملخص السلة، عناوين العميل الافتراضية، كوبونات الخصم، وتحديد الموقع على الخريطة",
    lineCount: 450,
  },
  {
    path: "/src/routes/driver.tsx",
    name: "driver.tsx",
    category: "routes",
    extension: "tsx",
    description:
      "بوابة وتطبيق مندوب التوصيل (Driver Portal) — الخريطة التفاعلية، التوجيه ثنائي المراحل، تتبع GPS، إثبات التسليم والتخزين دون إنترنت",
    lineCount: 520,
  },
  {
    path: "/src/routes/categories.tsx",
    name: "categories.tsx",
    category: "routes",
    extension: "tsx",
    description:
      "صفحة استعراض كافة تصنيفات المتجر (Categories Browsing) — تصفية متقدمة وتصنيف المنتجات",
    lineCount: 260,
  },
  {
    path: "/src/routes/products.$productId.tsx",
    name: "products.$productId.tsx",
    category: "routes",
    extension: "tsx",
    description:
      "صفحة تفاصيل المنتج (Product Detail Page) — معرض الصور، اختيار الوزن/الكمية، التقييمات، وبدائل المنتجات",
    lineCount: 340,
  },
  {
    path: "/src/routes/admin.copilot.tsx",
    name: "admin.copilot.tsx",
    category: "routes",
    extension: "tsx",
    description:
      "لوحة تحكم الذكاء الاصطناعي وجيميناي (AI Admin Co-Pilot & Code Studio) — محادثة، تعديل ملفات، وبحث السوق",
    lineCount: 650,
  },
  {
    path: "/src/routes/admin.orders.tsx",
    name: "admin.orders.tsx",
    category: "routes",
    extension: "tsx",
    description:
      "لوحة إدارة الطلبات (Admin Orders Dashboard) — تتبع حالات الطلبات، الفواتير، وتعيين المندوبين",
    lineCount: 410,
  },
  {
    path: "/src/routes/admin.products.tsx",
    name: "admin.products.tsx",
    category: "routes",
    extension: "tsx",
    description:
      "لوحة إدارة المنتجات والمخزون (Products & Inventory) — إضافة وتعديل المنتجات، الأسعار، وتنبيهات نفاد المخزون",
    lineCount: 480,
  },
  {
    path: "/src/routes/admin.delivery-zones.tsx",
    name: "admin.delivery-zones.tsx",
    category: "routes",
    extension: "tsx",
    description:
      "إدارة مناطق ورسوم التوصيل (Delivery Zones & Pricing) — رسم النطاقات الجغرافية وتحديد أسعار التوصيل",
    lineCount: 310,
  },
  {
    path: "/src/routes/admin.settings.tsx",
    name: "admin.settings.tsx",
    category: "routes",
    extension: "tsx",
    description:
      "إعدادات المتجر العامة والفرع (Store Settings) — بيانات الاتصال، أوقات العمل، وخيارات الدفع",
    lineCount: 290,
  },

  // ─── STOREFRONT COMPONENTS ───
  {
    path: "/src/components/storefront/Header.tsx",
    name: "Header.tsx",
    category: "components",
    extension: "tsx",
    description:
      "شريط التنقل العلوي للمتجر (Store Header) — الشعار، البحث الذكي، زر السلة التفاعلي، وقائمة الحساب",
    lineCount: 230,
  },
  {
    path: "/src/components/storefront/StoreGoogleMapsWidget.tsx",
    name: "StoreGoogleMapsWidget.tsx",
    category: "components",
    extension: "tsx",
    description:
      "ويدجت خرائط جوجل التفاعلي (Google Maps Location Picker) — تحديد العنوان بدقة، التثبيت، والحفظ كموقع افتراضي",
    lineCount: 390,
  },
  {
    path: "/src/components/storefront/HeroCarousel.tsx",
    name: "HeroCarousel.tsx",
    category: "components",
    extension: "tsx",
    description: "سلايدر البانرات الإعلانية التفاعلي في الهيدر (Hero Banner Slider)",
    lineCount: 180,
  },
  {
    path: "/src/components/storefront/ProductCard.tsx",
    name: "ProductCard.tsx",
    category: "components",
    extension: "tsx",
    description:
      "كارت المنتج في شبكة العرض (Storefront Product Card) — إضافة سريعة للسلة، شارات الخصم، وتحديد الأوزان",
    lineCount: 210,
  },
  {
    path: "/src/components/storefront/CartDrawer.tsx",
    name: "CartDrawer.tsx",
    category: "components",
    extension: "tsx",
    description:
      "درج السلة الجانبي السريع (Side Cart Drawer) — مراجعة الأصناف فورياً وحساب التكلفة",
    lineCount: 220,
  },
  {
    path: "/src/components/storefront/DynamicAnnouncementBar.tsx",
    name: "DynamicAnnouncementBar.tsx",
    category: "components",
    extension: "tsx",
    description: "شريط التنبيهات والعروض الترويجية في أعلى المتجر (Announcement Top Bar)",
    lineCount: 140,
  },
  {
    path: "/src/components/storefront/DynamicMiniAdsGrid.tsx",
    name: "DynamicMiniAdsGrid.tsx",
    category: "components",
    extension: "tsx",
    description: "شبكة الإعلانات المصغرة الترويجية (Mini Ads & Banners Grid)",
    lineCount: 170,
  },
  {
    path: "/src/components/storefront/DynamicFlashSaleTimer.tsx",
    name: "DynamicFlashSaleTimer.tsx",
    category: "components",
    extension: "tsx",
    description: "قسم عداد الفلاش سيل التنازلي التفاعلي (Flash Sale Countdown Section)",
    lineCount: 160,
  },
  {
    path: "/src/components/storefront/BottomNav.tsx",
    name: "BottomNav.tsx",
    category: "components",
    extension: "tsx",
    description: "شريط التنقل السفلي للأجهزة المحمولة (Mobile Bottom Navigation Bar)",
    lineCount: 120,
  },

  // ─── ADMIN COMPONENTS ───
  {
    path: "/src/components/admin/ShopLivePreview.tsx",
    name: "ShopLivePreview.tsx",
    category: "components",
    extension: "tsx",
    description: "المعاينة الحية التفاعلية للمتجر في لوحة التحكم (Storefront Live Preview Iframe)",
    lineCount: 260,
  },
  {
    path: "/src/components/admin/AbandonedCartAgent.tsx",
    name: "AbandonedCartAgent.tsx",
    category: "components",
    extension: "tsx",
    description: "وكيل استرداد السلات المتروكة الذكي عبر واتساب (WhatsApp Cart Recovery Agent)",
    lineCount: 240,
  },
  {
    path: "/src/components/admin/ExecutiveSummaryWidget.tsx",
    name: "ExecutiveSummaryWidget.tsx",
    category: "components",
    extension: "tsx",
    description: "ويدجت الموجز التنفيذي والرؤى الذكية للمتجر (Executive AI Insights Widget)",
    lineCount: 190,
  },
  {
    path: "/src/components/admin/SmartProductCopywriterModal.tsx",
    name: "SmartProductCopywriterModal.tsx",
    category: "components",
    extension: "tsx",
    description:
      "نافذة كاتب المحتوى الإعلاني والأوصاف الذكية للمنتجات (AI Product Copywriter Modal)",
    lineCount: 230,
  },

  // ─── SERVICES & LIBS ───
  {
    path: "/src/integrations/firebase/config.ts",
    name: "config.ts (Firebase)",
    category: "services",
    extension: "ts",
    description: "إعداد وتهيئة Firebase App, Firestore, و Firebase Authentication لسوبرماركت الوادي الأخضر",
    lineCount: 45,
  },
  {
    path: "/src/integrations/firebase/firestore.ts",
    name: "firestore.ts (Firestore Database)",
    category: "services",
    extension: "ts",
    description: "قاعدة بيانات Cloud Firestore: إدارة الفروع الثلاثة، الكتالوج متعدد الفروع، المخزون، والطلبات",
    lineCount: 220,
  },
  {
    path: "/src/integrations/firebase/auth.ts",
    name: "auth.ts (Firebase Auth)",
    category: "services",
    extension: "ts",
    description: "نظام المصادقة المشفر وعزل حساب الإدارة الرئيسي (adminstoresupermarketinvo@gmail.com)",
    lineCount: 160,
  },
  {
    path: "/src/integrations/firebase/types.ts",
    name: "types.ts (Firebase Types)",
    category: "types",
    extension: "ts",
    description: "هياكل البيانات لـ 3 فروع، كتالوج المنتجات مع نصائح الشيف، المخزون، والطلبات",
    lineCount: 140,
  },
  {
    path: "/src/services/gemini36Service.ts",
    name: "gemini36Service.ts",
    category: "services",
    extension: "ts",
    description:
      "محرك الذكاء الاصطناعي وجيميناي المتكامل (Gemini AI Engine & Search Grounding Service)",
    lineCount: 1720,
  },
  {
    path: "/src/lib/cart-context.tsx",
    name: "cart-context.tsx",
    category: "lib",
    extension: "tsx",
    description: "إدارة حالة سلة المشتريات والطلبات (Cart State Context & Storage Management)",
    lineCount: 210,
  },
  {
    path: "/src/lib/layout-config-context.tsx",
    name: "layout-config-context.tsx",
    category: "lib",
    extension: "tsx",
    description:
      "إدارة حالة وتخطيط المتجر وثيم الألوان الديناميكي (Store Layout & Theme Palette Context)",
    lineCount: 180,
  },
  {
    path: "/src/types/layout-config.ts",
    name: "layout-config.ts",
    category: "types",
    extension: "ts",
    description:
      "تعريفات الأنواع لتخطيط المتجر والألوان والأقسام (Store Layout TypeScript Interfaces & Types)",
    lineCount: 160,
  },
  {
    path: "/src/styles.css",
    name: "styles.css",
    category: "styles",
    extension: "css",
    description: "ملف التنسيقات والأنماط العامة للمشروع وقواعد Tailwind CSS ومصفوفات الألوان",
    lineCount: 280,
  },
];

// Storage key for user-applied file modifications in the workspace
const MODIFIED_FILES_STORAGE_KEY = "smart_store_workspace_file_modifications";

// Get saved file modifications from localStorage
export function getSavedFileModifications(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MODIFIED_FILES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// Save a modified file to workspace storage
export function saveProjectFileModification(filePath: string, content: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getSavedFileModifications();
    current[filePath] = content;
    localStorage.setItem(MODIFIED_FILES_STORAGE_KEY, JSON.stringify(current));
    return true;
  } catch (e) {
    console.error("Failed to save file modification:", e);
    return false;
  }
}

// Get all files matching category or search query
export function searchProjectFiles(query = "", category?: string): ProjectFileMeta[] {
  const cleanQ = query.trim().toLowerCase();
  return PROJECT_FILES_REGISTRY.filter((file) => {
    const matchesCategory = !category || category === "all" || file.category === category;
    if (!matchesCategory) return false;
    if (!cleanQ) return true;
    return (
      file.name.toLowerCase().includes(cleanQ) ||
      file.path.toLowerCase().includes(cleanQ) ||
      file.description.toLowerCase().includes(cleanQ)
    );
  });
}

// Provide realistic source template or modified content for any file
export function getFileContent(filePath: string): string {
  const modifications = getSavedFileModifications();
  if (modifications[filePath]) {
    return modifications[filePath];
  }

  // Realistic source templates for project files
  if (filePath === "/src/routes/cart.tsx") {
    return `// Cart & Checkout Route with Customer Default Address & Google Maps integration
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { StoreGoogleMapsWidget } from "@/components/storefront/StoreGoogleMapsWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

export function CartPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Auto-fetch default address from profile on mount
  useEffect(() => {
    // Fetches user default address from Supabase profile...
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-4xl" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">سلة التسوق وإتمام الطلب</h1>
      {/* Interactive Cart Items, Coupon Validation & Map Widget */}
    </div>
  );
}`;
  }

  if (filePath === "/src/routes/driver.tsx") {
    return `// Driver Portal with Dual-Stage Map Routing, Real-Time GPS Tracking & POD
import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { StoreGoogleMapsWidget } from "@/components/storefront/StoreGoogleMapsWidget";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/driver")({
  component: DriverPortalPage,
});

export function DriverPortalPage() {
  const [activeStage, setActiveStage] = useState<"to_store" | "to_customer" | "delivered">("to_store");
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4" dir="rtl">
      <h1 className="text-xl font-bold">بوابة مندوب التوصيل الذكي 🛵</h1>
      {/* Dual Stage Routing & Live GPS Tracker */}
    </div>
  );
}`;
  }

  if (filePath === "/src/components/storefront/Header.tsx") {
    return `// Storefront Header Component with Smart Search, Cart Drawer & User Menu
import React from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, User, MapPin } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export function Header() {
  const { totalCount } = useCart();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border" dir="rtl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="text-xl font-black text-emerald-600">
          سوبرماركت الوادي الأخضر 🌿
        </Link>
        {/* Search Bar & Cart Actions */}
      </div>
    </header>
  );
}`;
  }

  return `// ${filePath}
// Smart Store Project Workspace File
import React from "react";

export function Component() {
  return <div>ملف مشروع: ${filePath}</div>;
}`;
}
