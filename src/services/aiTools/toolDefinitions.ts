/* =========================================================================
   GEMINI AI ADMIN ENGINE — UNIFIED 24-TOOL SUITE DECLARATIONS
   Precise JSON Schema declarations for Gemini Function Calling & UI Labels
   ========================================================================= */

import type { AiToolDefinition, AiToolGroup } from "./types";

const str = (description: string) => ({ type: "string", description });
const num = (description: string) => ({ type: "number", description });
const bool = (description: string) => ({ type: "boolean", description });

export const AI_TOOL_GROUP_LABELS: Record<AiToolGroup, { labelAr: string; icon: string }> = {
  media: { labelAr: "الوسائط والصور", icon: "Image" },
  catalog: { labelAr: "الكتالوج والأسعار", icon: "Layers" },
  ui: { labelAr: "الواجهة والتصميم", icon: "Palette" },
  marketing: { labelAr: "التسويق والعروض", icon: "Megaphone" },
  safety: { labelAr: "الأمان والاسترجاع", icon: "RotateCcw" },
  universal: { labelAr: "التنسيقات المتقدمة", icon: "Code2" },
  operations: { labelAr: "العمليات والتشغيل", icon: "Users" },
  devops: { labelAr: "الكود والبنية التحتية", icon: "Terminal" },
};

export const AI_TOOL_SUITE: AiToolDefinition[] = [
  // ── CORE 1: MEDIA ──
  {
    name: "generateProductImage",
    group: "media",
    labelAr: "توليد صورة منتج",
    descriptionAr: "إنشاء صورة احترافية لمنتج وحفظها على سجل المنتج في جدول products في Supabase",
    mutatesState: true,
    declaration: {
      name: "generateProductImage",
      description: "Generate a professional studio photo for a product and attach it to Supabase products table.",
      parameters: {
        type: "object",
        properties: {
          productName: str("Arabic product name, e.g. جبن قريش بلدي"),
          category: str("Category name in Arabic"),
          productId: str("Existing product uuid to attach the image to (optional)"),
        },
        required: ["productName"],
      },
    },
  },
  {
    name: "uploadBannerImage",
    group: "media",
    labelAr: "توليد بانر إعلاني",
    descriptionAr: "توليد صورة بانر رئيسي وإضافتها كسلايد جديد في الواجهة وتحديث إعدادات المتجر",
    mutatesState: true,
    declaration: {
      name: "uploadBannerImage",
      description: "Generate a hero banner image and add it as a new homepage hero slide.",
      parameters: {
        type: "object",
        properties: {
          bannerText: str("Arabic banner headline"),
          subtitle: str("Optional Arabic subtitle"),
        },
        required: ["bannerText"],
      },
    },
  },

  // ── CORE 2: CATALOG & PRODUCTS ──
  {
    name: "manageProduct",
    group: "catalog",
    labelAr: "إدارة المنتجات",
    descriptionAr: "إضافة أو تعديل أو حذف منتج في قاعدة بيانات Supabase (جدول products)",
    mutatesState: true,
    declaration: {
      name: "manageProduct",
      description: "Create, update or delete a product in Supabase products table.",
      parameters: {
        type: "object",
        properties: {
          action: str("one of: create | update | delete"),
          data: {
            type: "object",
            description:
              "Product fields: id (uuid), name, price_per_unit, old_price, stock_quantity, category_id, description, unit_label, is_by_weight, image_url, cooking_tip, low_stock_threshold",
          },
        },
        required: ["action", "data"],
      },
    },
  },
  {
    name: "manageCategories",
    group: "catalog",
    labelAr: "إدارة الأقسام",
    descriptionAr: "إضافة أو تعديل أو حذف قسم من أقسام المتجر (جدول categories في Supabase)",
    mutatesState: true,
    declaration: {
      name: "manageCategories",
      description: "Create, update or delete a store category in Supabase categories table.",
      parameters: {
        type: "object",
        properties: {
          action: str("one of: create | update | delete"),
          data: {
            type: "object",
            description: "Category fields: id (uuid), name, slug, icon, image_url, sort_order, parent_id",
          },
        },
        required: ["action", "data"],
      },
    },
  },
  {
    name: "bulkPriceUpdate",
    group: "catalog",
    labelAr: "تحديث أسعار جماعي",
    descriptionAr: "رفع أو خفض أسعار كل منتجات قسم معين بنسبة مئوية في جدول products",
    mutatesState: true,
    declaration: {
      name: "bulkPriceUpdate",
      description: "Increase or decrease all product prices in a category by a percentage in Supabase products table.",
      parameters: {
        type: "object",
        properties: {
          categoryId: str("Category uuid, or 'all' for the whole catalog"),
          percentage: num("Percentage change, negative to discount (e.g. -15 for 15% discount)"),
        },
        required: ["categoryId", "percentage"],
      },
    },
  },

  // ── CORE 3: UI & THEME ──
  {
    name: "updateLayoutConfig",
    group: "ui",
    labelAr: "تعديل تخطيط الواجهة",
    descriptionAr: "تطبيق تعديلات JSON مباشرة على تخطيط الصفحة الرئيسية ومزامنة الإعدادات",
    mutatesState: true,
    declaration: {
      name: "updateLayoutConfig",
      description: "Merge a partial StoreLayoutConfig JSON into the live homepage layout.",
      parameters: {
        type: "object",
        properties: {
          layoutJson: {
            type: "object",
            description: "Partial StoreLayoutConfig object to merge into the live layout",
          },
        },
        required: ["layoutJson"],
      },
    },
  },
  {
    name: "updateThemeColors",
    group: "ui",
    labelAr: "تغيير ألوان الثيم",
    descriptionAr: "تغيير اللون الأساسي والثانوي ووضع الإضاءة للمتجر لحظياً ومزامنة theme_settings",
    mutatesState: true,
    declaration: {
      name: "updateThemeColors",
      description: "Update the store primary/accent colors and light/dark mode instantly.",
      parameters: {
        type: "object",
        properties: {
          primary: str("Primary color hex, e.g. #036233"),
          accent: str("Accent color hex, e.g. #E85D2F"),
          mode: str("light | dark"),
          palette: str("Optional palette key: emerald | dark_green | amber_warm | royal_blue | clean_slate"),
        },
        required: ["primary"],
      },
    },
  },

  // ── CORE 4: MARKETING & RECOVERY ──
  {
    name: "createDiscountBundle",
    group: "marketing",
    labelAr: "إنشاء باقة خصم",
    descriptionAr: "توليد كوبون خصم حقيقي في جدول coupons وربطه بعداد العروض في الواجهة",
    mutatesState: true,
    declaration: {
      name: "createDiscountBundle",
      description: "Create a discount coupon in Supabase coupons and surface it in storefront flash sale timer.",
      parameters: {
        type: "object",
        properties: {
          code: str("Coupon code, uppercase latin, e.g. FLASH30"),
          discountValue: num("Discount numeric value"),
          discountType: str("percent | fixed"),
          title: str("Arabic campaign title"),
          hours: num("Campaign duration in hours"),
          minOrderAmount: num("Minimum order amount in EGP (optional)"),
        },
        required: ["code", "discountValue"],
      },
    },
  },
  {
    name: "sendAbandonedCartRecovery",
    group: "marketing",
    labelAr: "استرداد سلة متروكة",
    descriptionAr: "صياغة رسالة واتساب لاسترداد سلة متروكة وفتحها للإرسال مع كود خصم تحفيزي",
    mutatesState: false,
    declaration: {
      name: "sendAbandonedCartRecovery",
      description: "Draft and open a WhatsApp recovery message with coupon for an abandoned cart.",
      parameters: {
        type: "object",
        properties: {
          cartId: str("Abandoned cart / order id"),
          customerName: str("Customer name"),
          phone: str("Customer phone in local format"),
          totalPrice: num("Cart total in EGP"),
        },
        required: ["cartId"],
      },
    },
  },

  // ── CORE 5: SAFETY ──
  {
    name: "rollbackLastAction",
    group: "safety",
    labelAr: "تراجع عن آخر أمر",
    descriptionAr: "استرجاع حالة المتجر وقاعدة البيانات إلى ما قبل آخر أمر تم تنفيذه",
    mutatesState: false,
    declaration: {
      name: "rollbackLastAction",
      description: "Restore the store and database rows to the snapshot captured before the last executed tool.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },

  // ── PHASE 1: UNIVERSAL METADATA & CUSTOM CSS ──
  {
    name: "executeCustomCSS",
    group: "universal",
    labelAr: "حقن وتطبيق CSS مخصص",
    descriptionAr: "حقن وتطبيق قواعد CSS وتنسيقات مرئية مخصصة فورية في رأس الصفحة وتخزينها",
    mutatesState: true,
    declaration: {
      name: "executeCustomCSS",
      description: "Injects and applies dynamic CSS stylesheet rules to document head for instant visual styling overrides.",
      parameters: {
        type: "object",
        properties: {
          cssRules: str("Valid CSS stylesheet rules or class styling overrides, e.g. ':root { --primary-glow: #10b981; }'"),
        },
        required: ["cssRules"],
      },
    },
  },
  {
    name: "updateRawJsonMetadata",
    group: "universal",
    labelAr: "تحديث إعدادات المتجر (JSON Metadata)",
    descriptionAr: "حفظ وتحديث بيانات وصفية أو إعدادات متقدمة في جدول store_settings في Supabase",
    mutatesState: true,
    declaration: {
      name: "updateRawJsonMetadata",
      description: "Writes or updates dynamic custom settings directly into Supabase store_settings table.",
      parameters: {
        type: "object",
        properties: {
          key: str("Setting key name in store_settings (e.g. site_name, hero_title, custom_css, operational_hours)"),
          value: {
            type: "object",
            description: "Arbitrary JSON payload or primitive value to persist in store_settings",
          },
        },
        required: ["key", "value"],
      },
    },
  },

  // ── PHASE 2: ADVANCED OPERATIONAL TOOLS ──
  {
    name: "manageUsersAndRoles",
    group: "operations",
    labelAr: "إدارة المستخدمين والصلاحيات",
    descriptionAr: "تعديل أدوار وصلاحيات المستخدمين وتحديث بياناتهم في Supabase (user_roles و profiles)",
    mutatesState: true,
    declaration: {
      name: "manageUsersAndRoles",
      description: "Updates user roles, permissions, or profile details in Supabase user_roles and profiles tables.",
      parameters: {
        type: "object",
        properties: {
          userId: str("Target user UUID in auth/profiles, or customer phone/name identifier"),
          role: str("Target role: admin | moderator | driver | customer"),
          fullName: str("Optional updated full name"),
          phone: str("Optional updated phone number"),
        },
        required: ["userId", "role"],
      },
    },
  },
  {
    name: "exportReportsAndAnalytics",
    group: "operations",
    labelAr: "تصدير التقارير والتحليلات",
    descriptionAr: "استعلام الطلبات والمنتجات وحساب المبيعات وإرجاع تقرير تحليلي قابل للتحميل أو العرض",
    mutatesState: false,
    declaration: {
      name: "exportReportsAndAnalytics",
      description: "Queries orders and products to calculate total revenue, top selling items, and returns downloadable structured analytics data.",
      parameters: {
        type: "object",
        properties: {
          timeframe: str("Timeframe for report: today | last_7_days | last_30_days | this_month | all_time"),
          format: str("Format: json | csv | summary_card"),
          includeTopProducts: bool("Whether to include granular top products breakdown"),
        },
        required: ["timeframe", "format"],
      },
    },
  },
  {
    name: "sendPushNotification",
    group: "operations",
    labelAr: "إرسال إشعار فوري (Push)",
    descriptionAr: "بث إشعار فوري لعملاء المتجر وتحديث شريط التنبيهات العام بالمتجر",
    mutatesState: true,
    declaration: {
      name: "sendPushNotification",
      description: "Triggers and broadcasts a real-time web push notification / announcement alert to store users.",
      parameters: {
        type: "object",
        properties: {
          title: str("Notification title in Arabic, e.g. عروض الساعات الذهبية ⚡"),
          message: str("Notification body message in Arabic"),
          targetAudience: str("Target audience: all | active_users | cart_abandoners | vip_customers"),
          actionUrl: str("Optional link URL to redirect user when clicked"),
        },
        required: ["title", "message", "targetAudience"],
      },
    },
  },
  {
    name: "manageDeliveryZones",
    group: "operations",
    labelAr: "إدارة مناطق التوصيل والأسعار",
    descriptionAr: "إضافة أو تعديل رسوم وشروط الشحن لمناطق التوصيل في Supabase (جدول delivery_zones)",
    mutatesState: true,
    declaration: {
      name: "manageDeliveryZones",
      description: "Creates, updates, or adjusts shipping fees, minimum order amounts, and delivery SLA for zones in Supabase delivery_zones table.",
      parameters: {
        type: "object",
        properties: {
          zoneName: str("Delivery zone name, e.g. مدينة نصر والتجمع الخامس"),
          deliveryFee: num("Shipping fee in EGP"),
          minOrderAmount: num("Minimum order amount in EGP (optional)"),
          estimatedMinutes: num("Estimated delivery SLA in minutes (e.g. 35, 45, 60)"),
          action: str("create | update | toggle_active (default: update)"),
          zoneId: str("Optional existing zone UUID if known"),
        },
        required: ["zoneName", "deliveryFee"],
      },
    },
  },

  // ── PHASE 3: CODEBASE, INFRASTRUCTURE & GIT TOOLS ──
  {
    name: "getDirectoryTree",
    group: "devops",
    labelAr: "فحص شجرة مجلدات وملفات المشروع",
    descriptionAr: "مسح مساحة العمل واسترجاع هيكل المجلدات والملفات المسجلة في المشروع",
    mutatesState: false,
    declaration: {
      name: "getDirectoryTree",
      description: "Scans and returns the project directory structure and catalog of registered workspace files.",
      parameters: {
        type: "object",
        properties: {
          rootDir: str("Root directory to scan (default: /src)"),
          maxDepth: num("Maximum scanning depth (e.g. 3)"),
        },
        required: [],
      },
    },
  },
  {
    name: "getFileContent",
    group: "devops",
    labelAr: "قراءة محتوى ملف برمجي",
    descriptionAr: "استرجاع الكود المصدري الخام لأي ملف في مساحة العمل ومراجعة محتواه",
    mutatesState: false,
    declaration: {
      name: "getFileContent",
      description: "Reads and returns the raw source code contents of any specified project workspace file.",
      parameters: {
        type: "object",
        properties: {
          filePath: str("Target file path (e.g. /src/routes/cart.tsx, /src/components/storefront/Header.tsx)"),
        },
        required: ["filePath"],
      },
    },
  },
  {
    name: "searchCodebase",
    group: "devops",
    labelAr: "بحث في الكود والمشروع",
    descriptionAr: "البحث عن الدوال، المكونات، والنصوص البرمجية في كامل ملفات المشروع ومساحة العمل",
    mutatesState: false,
    declaration: {
      name: "searchCodebase",
      description: "Searches for code snippets, functions, components, or text across all project workspace files.",
      parameters: {
        type: "object",
        properties: {
          query: str("Search term, function name, component name, or code pattern"),
          category: str("Optional category filter: routes | components | services | lib | types | styles | all"),
        },
        required: ["query"],
      },
    },
  },
  {
    name: "getAppErrors",
    group: "devops",
    labelAr: "استعراض سجل أخطاء وتشخيص التطبيق",
    descriptionAr: "استرجاع أخطاء الكونسول وسجلات التشخيص للنظام في وقت التشغيل لتحليل المشاكل",
    mutatesState: false,
    declaration: {
      name: "getAppErrors",
      description: "Retrieves runtime diagnostic logs and errors to inspect system operational health.",
      parameters: {
        type: "object",
        properties: {
          limit: num("Maximum number of recent error logs to return (default: 20)"),
        },
        required: [],
      },
    },
  },
  {
    name: "writeNewFile",
    group: "devops",
    labelAr: "إنشاء أو كتابة ملف كود جديد",
    descriptionAr: "إنشاء ملف برمجي جديد في مساحة العمل أو استبدال محتواه بالكامل مع نقطة تراجع",
    mutatesState: true,
    declaration: {
      name: "writeNewFile",
      description: "Creates a new workspace file or updates existing file content with automatic rollback protection.",
      parameters: {
        type: "object",
        properties: {
          filePath: str("Relative workspace path, e.g. /src/components/CustomWidget.tsx"),
          content: str("Complete valid source code content to write into the file"),
          description: str("Short Arabic summary of changes made"),
        },
        required: ["filePath", "content"],
      },
    },
  },
  {
    name: "updateFileAST",
    group: "devops",
    labelAr: "تعديل كود وهيكل ملف برمجي (AST)",
    descriptionAr: "تطبيق تعديلات برمجية جزئية أو استبدال دوال ومكونات محددة بأمان داخل الملف",
    mutatesState: true,
    declaration: {
      name: "updateFileAST",
      description: "Applies structured AST-like search-and-replace or node updates to a source file safely.",
      parameters: {
        type: "object",
        properties: {
          filePath: str("Target file path, e.g. /src/routes/index.tsx"),
          changes: {
            type: "object",
            description: "Modifications object with searchPattern & replacement, or targetNode & newCode",
          },
        },
        required: ["filePath", "changes"],
      },
    },
  },
  {
    name: "deleteFile",
    group: "devops",
    labelAr: "حذف ملف من مساحة العمل",
    descriptionAr: "إزالة ملف غير مرغوب فيه من مساحة العمل وحفظ نسخة احتياطية للتراجع الفوري",
    mutatesState: true,
    declaration: {
      name: "deleteFile",
      description: "Deletes a specified workspace file safely with automatic backup for instant rollback.",
      parameters: {
        type: "object",
        properties: {
          filePath: str("Target file path to delete from workspace"),
        },
        required: ["filePath"],
      },
    },
  },
  {
    name: "gitCommitAndPush",
    group: "devops",
    labelAr: "حفظ ومزامنة التعديلات (Git Commit & Push)",
    descriptionAr: "حفظ وتثبيت التعديلات الحالية في سجل النسخ (Git Workspace) والمزامنة الفورية",
    mutatesState: true,
    declaration: {
      name: "gitCommitAndPush",
      description: "Captures a workspace snapshot and pushes a versioned commit to the project repository.",
      parameters: {
        type: "object",
        properties: {
          commitMessage: str("Conventional commit message in English or Arabic, e.g. 'feat: update checkout delivery zones'"),
        },
        required: ["commitMessage"],
      },
    },
  },
  {
    name: "gitRollbackCommit",
    group: "devops",
    labelAr: "التراجع عن آخر كوميت (Git Rollback)",
    descriptionAr: "استرجاع مساحة العمل إلى حالة الكوميت السابقة واستعادة الملفات المعدلة",
    mutatesState: true,
    declaration: {
      name: "gitRollbackCommit",
      description: "Reverts the last committed git workspace state and restores modified files.",
      parameters: {
        type: "object",
        properties: {
          commitHash: str("Optional target commit hash to revert to (defaults to HEAD~1)"),
        },
        required: [],
      },
    },
  },
];

export const GEMINI_TOOL_DECLARATIONS = AI_TOOL_SUITE.map((t) => t.declaration);

/**
 * Dynamic Tool Router
 * Returns a subset of tools based on the current page context and user role.
 * Fails safe: if role/context is unknown, returns only read-only tools.
 */
export function getActiveTools(context?: { page?: string; userRole?: string }) {
  const role = context?.userRole || "customer";
  const page = context?.page || "global";
  
  // Non-admins/moderators get safe read-only tools
  if (role !== "admin" && role !== "moderator") {
    return AI_TOOL_SUITE.filter(t => t.name === "searchCodebase" || t.name === "exportReportsAndAnalytics").map(t => t.declaration);
  }

  // Admin / Moderator dynamic routing
  let allowedGroups: AiToolGroup[] = [];
  
  if (page.includes("products") || page.includes("catalog")) {
    allowedGroups = ["catalog", "media", "ui", "universal"];
  } else if (page.includes("delivery-zones") || page.includes("orders")) {
    allowedGroups = ["operations", "universal"];
  } else if (page.includes("settings") || page.includes("design")) {
    allowedGroups = ["ui", "operations", "universal"];
  } else if (page === "admin.copilot" || page === "global") {
    // Global Copilot gets all tools for full capability
    allowedGroups = ["catalog", "media", "ui", "operations", "marketing", "devops", "universal"];
  } else {
    // Fail safe unknown context
    return AI_TOOL_SUITE.filter(t => !t.mutatesState).map(t => t.declaration);
  }

  return AI_TOOL_SUITE.filter(t => allowedGroups.includes(t.group)).map(t => t.declaration);
}
