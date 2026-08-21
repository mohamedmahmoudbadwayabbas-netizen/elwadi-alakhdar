/* =========================================================================
   GEMINI 3.6 FLASH — 10-TOOL EXECUTABLE ENGINE (Admin Co-Pilot)
   Declares Gemini function-calling definitions + real executable handlers
   for media, catalog, UI/theme, marketing and safety operations.
   ========================================================================= */

import { supabase } from "@/integrations/supabase/client";
import { generateAdminImage } from "@/services/geminiImageService";
import { generateAbandonedCartRecovery } from "@/services/gemini36Service";
import type { StoreLayoutConfig, ThemeColorPalette } from "@/types/layout-config";

/* ───────────────────────── Types ───────────────────────── */

export type AiToolName =
  | "generateProductImage"
  | "uploadBannerImage"
  | "manageProduct"
  | "manageCategories"
  | "bulkPriceUpdate"
  | "updateLayoutConfig"
  | "updateThemeColors"
  | "createDiscountBundle"
  | "sendAbandonedCartRecovery"
  | "rollbackLastAction";

export type AiToolGroup = "media" | "catalog" | "ui" | "marketing" | "safety";

export interface AiToolDefinition {
  name: AiToolName;
  group: AiToolGroup;
  labelAr: string;
  descriptionAr: string;
  /** Gemini function-calling declaration */
  declaration: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
  /** Whether a rollback point must be captured before running */
  mutatesState: boolean;
}

export interface ToolExecutionContext {
  layout: StoreLayoutConfig;
  updateLayout: (next: StoreLayoutConfig) => void;
  /** Optional cache invalidation (TanStack Query) after DB writes */
  refresh?: () => void;
}

export interface ToolExecutionResult {
  tool: AiToolName;
  ok: boolean;
  messageAr: string;
  data?: Record<string, unknown>;
  rollbackPointId?: string;
}

/* ───────────────── 1. TOOL SUITE DECLARATIONS (10) ───────────────── */

const str = (description: string) => ({ type: "string", description });
const num = (description: string) => ({ type: "number", description });

export const AI_TOOL_SUITE: AiToolDefinition[] = [
  {
    name: "generateProductImage",
    group: "media",
    labelAr: "توليد صورة منتج",
    descriptionAr: "إنشاء صورة احترافية لمنتج بالذكاء الاصطناعي وحفظها على المنتج مباشرة",
    mutatesState: true,
    declaration: {
      name: "generateProductImage",
      description:
        "Generate a professional studio photo for a store product and attach it to the product record.",
      parameters: {
        type: "object",
        properties: {
          productName: str("Arabic product name, e.g. جبن قريش بلدي"),
          category: str("Category name in Arabic"),
          productId: str("Existing product id to attach the image to (optional)"),
        },
        required: ["productName"],
      },
    },
  },
  {
    name: "uploadBannerImage",
    group: "media",
    labelAr: "توليد بانر إعلاني",
    descriptionAr: "توليد صورة بانر رئيسي وإضافتها كسلايد جديد في الواجهة فوراً",
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
  {
    name: "manageProduct",
    group: "catalog",
    labelAr: "إدارة المنتجات",
    descriptionAr: "إضافة أو تعديل أو حذف منتج في قاعدة البيانات",
    mutatesState: true,
    declaration: {
      name: "manageProduct",
      description: "Create, update or delete a product in the store catalog.",
      parameters: {
        type: "object",
        properties: {
          action: str("one of: create | update | delete"),
          data: {
            type: "object",
            description:
              "Product fields: id, name, price_per_unit, old_price, stock_quantity, category_id, description, unit_label, is_by_weight",
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
    descriptionAr: "إضافة أو تعديل أو حذف قسم من أقسام المتجر",
    mutatesState: true,
    declaration: {
      name: "manageCategories",
      description: "Create, update or delete a store category.",
      parameters: {
        type: "object",
        properties: {
          action: str("one of: create | update | delete"),
          data: {
            type: "object",
            description: "Category fields: id, name, slug, icon, image_url, sort_order",
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
    descriptionAr: "رفع أو خفض أسعار كل منتجات قسم معين بنسبة مئوية",
    mutatesState: true,
    declaration: {
      name: "bulkPriceUpdate",
      description: "Increase or decrease all product prices in a category by a percentage.",
      parameters: {
        type: "object",
        properties: {
          categoryId: str("Category id, or 'all' for the whole catalog"),
          percentage: num("Percentage change, negative to discount (e.g. -15)"),
        },
        required: ["categoryId", "percentage"],
      },
    },
  },
  {
    name: "updateLayoutConfig",
    group: "ui",
    labelAr: "تعديل تخطيط الواجهة",
    descriptionAr: "تطبيق تعديلات JSON مباشرة على تخطيط الصفحة الرئيسية",
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
    descriptionAr: "تغيير اللون الأساسي والثانوي ووضع الإضاءة للمتجر لحظياً",
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
          palette: str("Optional palette key, e.g. emerald | dark_green | amber_warm"),
        },
        required: ["primary"],
      },
    },
  },
  {
    name: "createDiscountBundle",
    group: "marketing",
    labelAr: "إنشاء باقة خصم",
    descriptionAr: "توليد كوبون خصم حقيقي وربطه بعداد العروض في الواجهة",
    mutatesState: true,
    declaration: {
      name: "createDiscountBundle",
      description: "Create a discount coupon bundle and surface it in the storefront flash sale.",
      parameters: {
        type: "object",
        properties: {
          code: str("Coupon code, uppercase latin"),
          discountValue: num("Discount value"),
          discountType: str("percent | fixed"),
          title: str("Arabic campaign title"),
          hours: num("Campaign duration in hours"),
        },
        required: ["code", "discountValue"],
      },
    },
  },
  {
    name: "sendAbandonedCartRecovery",
    group: "marketing",
    labelAr: "استرداد سلة متروكة",
    descriptionAr: "صياغة رسالة واتساب لاسترداد سلة متروكة وفتحها للإرسال",
    mutatesState: false,
    declaration: {
      name: "sendAbandonedCartRecovery",
      description: "Draft and open a WhatsApp recovery message for an abandoned cart.",
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
  {
    name: "rollbackLastAction",
    group: "safety",
    labelAr: "تراجع عن آخر أمر",
    descriptionAr: "استرجاع حالة المتجر إلى ما قبل آخر أمر تم تنفيذه",
    mutatesState: false,
    declaration: {
      name: "rollbackLastAction",
      description: "Restore the store to the snapshot captured before the last executed tool.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

export const AI_TOOL_GROUP_LABELS: Record<AiToolGroup, string> = {
  media: "الوسائط والصور",
  catalog: "الكتالوج والمخزون",
  ui: "الواجهة والثيم",
  marketing: "التسويق والعروض",
  safety: "الأمان والتراجع",
};

/** Gemini function declarations array, ready to pass as `tools` config */
export const GEMINI_TOOL_DECLARATIONS = AI_TOOL_SUITE.map((t) => t.declaration);

/* ───────────────── 2. ROLLBACK / SAFETY SYSTEM ───────────────── */

const ROLLBACK_KEY = "smartstore_ai_rollback_stack_v1";
const MAX_POINTS = 15;

export interface RollbackPoint {
  id: string;
  tool: AiToolName | "manual";
  labelAr: string;
  createdAt: string;
  layout: StoreLayoutConfig | null;
  /** DB compensating operation */
  db?: {
    table: string;
    kind: "restore-rows" | "delete-row";
    rows?: Record<string, unknown>[];
    id?: string;
  };
}

function readStack(): RollbackPoint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROLLBACK_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStack(stack: RollbackPoint[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROLLBACK_KEY, JSON.stringify(stack.slice(-MAX_POINTS)));
    window.dispatchEvent(new CustomEvent("ai_rollback_stack_changed"));
  } catch {
    /* storage full — ignore */
  }
}

export function createRollbackPoint(
  tool: AiToolName | "manual",
  labelAr: string,
  layout: StoreLayoutConfig | null,
  db?: RollbackPoint["db"],
): string {
  const point: RollbackPoint = {
    id: `rb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tool,
    labelAr,
    createdAt: new Date().toISOString(),
    layout: layout ? JSON.parse(JSON.stringify(layout)) : null,
    db,
  };
  writeStack([...readStack(), point]);
  return point.id;
}

export function attachDbUndo(pointId: string, db: RollbackPoint["db"]) {
  const stack = readStack();
  const idx = stack.findIndex((p) => p.id === pointId);
  if (idx >= 0) {
    stack[idx] = { ...stack[idx], db };
    writeStack(stack);
  }
}

export function getLastRollbackPoint(): RollbackPoint | null {
  const stack = readStack();
  return stack.length ? stack[stack.length - 1] : null;
}

export function getRollbackStack(): RollbackPoint[] {
  return readStack();
}

export function clearRollbackStack() {
  writeStack([]);
}

export async function rollbackLastAction(ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
  const stack = readStack();
  const point = stack.pop();
  if (!point) {
    return { tool: "rollbackLastAction", ok: false, messageAr: "لا توجد أوامر سابقة للتراجع عنها." };
  }

  if (point.layout) ctx.updateLayout(point.layout);

  if (point.db) {
    try {
      if (point.db.kind === "delete-row" && point.db.id) {
        await supabase.from(point.db.table as never).delete().eq("id", point.db.id);
      } else if (point.db.kind === "restore-rows" && point.db.rows?.length) {
        await supabase.from(point.db.table as never).upsert(point.db.rows as never);
      }
    } catch (e) {
      console.warn("Rollback DB step failed:", e);
    }
  }

  writeStack(stack);
  ctx.refresh?.();
  return {
    tool: "rollbackLastAction",
    ok: true,
    messageAr: `تم التراجع بنجاح عن: ${point.labelAr}`,
  };
}

/* ───────────────── 3. TOOL HANDLERS ───────────────── */

async function toolGenerateProductImage(
  args: { productName?: string; category?: string; productId?: string },
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const name = (args.productName || "").trim();
  if (!name)
    return { tool: "generateProductImage", ok: false, messageAr: "اسم المنتج مطلوب لتوليد الصورة." };

  const pointId = createRollbackPoint("generateProductImage", `توليد صورة للمنتج: ${name}`, null);

  const res = await generateAdminImage({
    prompt: `Professional Egyptian supermarket product photography of "${name}"${
      args.category ? ` from the "${args.category}" category` : ""
    }, fresh, appetizing, soft studio lighting, clean white background, high detail, commercial e-commerce shot`,
    aspectRatio: "1:1",
    imageSize: "1K",
  });

  if (!res.success || !res.imageUrl) {
    return {
      tool: "generateProductImage",
      ok: false,
      messageAr: res.error || "تعذر توليد صورة المنتج.",
    };
  }

  if (args.productId) {
    const { data: prev } = await supabase
      .from("products")
      .select("id,image_url")
      .eq("id", args.productId)
      .maybeSingle();
    if (prev) attachDbUndo(pointId, { table: "products", kind: "restore-rows", rows: [prev] });
    await supabase.from("products").update({ image_url: res.imageUrl }).eq("id", args.productId);
    ctx.refresh?.();
  }

  return {
    tool: "generateProductImage",
    ok: true,
    rollbackPointId: pointId,
    messageAr: `تم توليد صورة احترافية لمنتج «${name}»${args.productId ? " وحفظها على المنتج" : ""}.`,
    data: { imageUrl: res.imageUrl, modelUsed: res.modelUsed },
  };
}

async function toolUploadBannerImage(
  args: { bannerText?: string; subtitle?: string },
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const text = (args.bannerText || "").trim();
  if (!text)
    return { tool: "uploadBannerImage", ok: false, messageAr: "نص البانر مطلوب لتوليد الصورة." };

  const pointId = createRollbackPoint("uploadBannerImage", `إضافة بانر: ${text}`, ctx.layout);

  const res = await generateAdminImage({
    prompt: `Wide cinematic hero banner for an Egyptian online hypermarket. Theme: ${text}. Rich groceries display, emerald and gold accents, luxurious lighting, no text overlay.`,
    aspectRatio: "16:9",
    imageSize: "2K",
  });

  if (!res.success || !res.imageUrl)
    return { tool: "uploadBannerImage", ok: false, messageAr: res.error || "تعذر توليد البانر." };

  const next: StoreLayoutConfig = {
    ...ctx.layout,
    lastUpdated: new Date().toISOString(),
    heroBanner: {
      ...ctx.layout.heroBanner,
      enabled: true,
      slides: [
        {
          id: `hero-ai-${Date.now()}`,
          title: text,
          subtitle: args.subtitle || "عروض حصرية بأسعار الجملة وتوصيل فوري لباب بيتك",
          badge: "جديد ✨",
          image_url: res.imageUrl,
          button_text: "تسوّق الآن 🛒",
          link_url: "/categories",
        },
        ...ctx.layout.heroBanner.slides,
      ],
    },
  };
  ctx.updateLayout(next);

  return {
    tool: "uploadBannerImage",
    ok: true,
    rollbackPointId: pointId,
    messageAr: `تم توليد بانر «${text}» وإضافته كسلايد أول في الصفحة الرئيسية.`,
    data: { imageUrl: res.imageUrl },
  };
}

async function toolManageProduct(
  args: { action?: string; data?: Record<string, unknown> },
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const action = (args.action || "create").toLowerCase();
  const data = args.data || {};
  const pointId = createRollbackPoint("manageProduct", `إدارة منتج (${action})`, null);

  try {
    if (action === "create") {
      const payload = {
        name: String(data.name || "منتج جديد"),
        price_per_unit: Number(data.price_per_unit ?? 0),
        old_price: data.old_price != null ? Number(data.old_price) : null,
        stock_quantity: Number(data.stock_quantity ?? 0),
        category_id: (data.category_id as string) || null,
        description: (data.description as string) || null,
        unit_label: (data.unit_label as string) || "قطعة",
        is_by_weight: Boolean(data.is_by_weight),
        image_url: (data.image_url as string) || null,
      };
      const { data: inserted, error } = await supabase
        .from("products")
        .insert(payload as never)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (inserted?.id)
        attachDbUndo(pointId, { table: "products", kind: "delete-row", id: inserted.id });
      ctx.refresh?.();
      return {
        tool: "manageProduct",
        ok: true,
        rollbackPointId: pointId,
        messageAr: `تمت إضافة المنتج «${payload.name}» للكتالوج بنجاح.`,
        data: { id: inserted?.id },
      };
    }

    const id = String(data.id || "");
    if (!id) return { tool: "manageProduct", ok: false, messageAr: "معرّف المنتج مطلوب." };

    const { data: prev } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (prev) attachDbUndo(pointId, { table: "products", kind: "restore-rows", rows: [prev] });

    if (action === "delete") {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      ctx.refresh?.();
      return {
        tool: "manageProduct",
        ok: true,
        rollbackPointId: pointId,
        messageAr: "تم حذف المنتج، ويمكنك التراجع فوراً عند الحاجة.",
      };
    }

    const { id: _omit, ...patch } = data as Record<string, unknown>;
    const { error } = await supabase.from("products").update(patch as never).eq("id", id);
    if (error) throw error;
    ctx.refresh?.();
    return {
      tool: "manageProduct",
      ok: true,
      rollbackPointId: pointId,
      messageAr: "تم تحديث بيانات المنتج بنجاح.",
    };
  } catch (e) {
    return {
      tool: "manageProduct",
      ok: false,
      messageAr: `تعذر تنفيذ العملية على المنتج: ${(e as Error).message}`,
    };
  }
}

async function toolManageCategories(
  args: { action?: string; data?: Record<string, unknown> },
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const action = (args.action || "create").toLowerCase();
  const data = args.data || {};
  const pointId = createRollbackPoint("manageCategories", `إدارة قسم (${action})`, null);

  try {
    if (action === "create") {
      const name = String(data.name || "قسم جديد");
      const payload = {
        name,
        slug: String(data.slug || `cat-${Date.now()}`),
        icon: (data.icon as string) || "🛒",
        image_url: (data.image_url as string) || null,
        sort_order: Number(data.sort_order ?? 99),
      };
      const { data: inserted, error } = await supabase
        .from("categories")
        .insert(payload as never)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (inserted?.id)
        attachDbUndo(pointId, { table: "categories", kind: "delete-row", id: inserted.id });
      ctx.refresh?.();
      return {
        tool: "manageCategories",
        ok: true,
        rollbackPointId: pointId,
        messageAr: `تمت إضافة القسم «${name}» بنجاح.`,
      };
    }

    const id = String(data.id || "");
    if (!id) return { tool: "manageCategories", ok: false, messageAr: "معرّف القسم مطلوب." };

    const { data: prev } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
    if (prev) attachDbUndo(pointId, { table: "categories", kind: "restore-rows", rows: [prev] });

    if (action === "delete") {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      ctx.refresh?.();
      return {
        tool: "manageCategories",
        ok: true,
        rollbackPointId: pointId,
        messageAr: "تم حذف القسم بنجاح.",
      };
    }

    const { id: _omit, ...patch } = data as Record<string, unknown>;
    const { error } = await supabase.from("categories").update(patch as never).eq("id", id);
    if (error) throw error;
    ctx.refresh?.();
    return {
      tool: "manageCategories",
      ok: true,
      rollbackPointId: pointId,
      messageAr: "تم تحديث بيانات القسم بنجاح.",
    };
  } catch (e) {
    return {
      tool: "manageCategories",
      ok: false,
      messageAr: `تعذر تنفيذ العملية على القسم: ${(e as Error).message}`,
    };
  }
}

async function toolBulkPriceUpdate(
  args: { categoryId?: string; percentage?: number },
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const pct = Number(args.percentage ?? 0);
  if (!pct)
    return { tool: "bulkPriceUpdate", ok: false, messageAr: "حدد نسبة التغيير المطلوبة للأسعار." };

  const categoryId = args.categoryId || "all";
  const pointId = createRollbackPoint(
    "bulkPriceUpdate",
    `تحديث أسعار ${categoryId === "all" ? "كل المنتجات" : "قسم محدد"} بنسبة ${pct}%`,
    null,
  );

  try {
    let query = supabase.from("products").select("id,price_per_unit,old_price");
    if (categoryId !== "all") query = query.eq("category_id", categoryId);
    const { data: rows, error } = await query;
    if (error) throw error;
    if (!rows?.length)
      return { tool: "bulkPriceUpdate", ok: false, messageAr: "لا توجد منتجات مطابقة للتحديث." };

    attachDbUndo(pointId, {
      table: "products",
      kind: "restore-rows",
      rows: rows as Record<string, unknown>[],
    });

    const factor = 1 + pct / 100;
    await Promise.all(
      rows.map((r) =>
        supabase
          .from("products")
          .update({
            price_per_unit: Math.max(0.5, +(Number(r.price_per_unit || 0) * factor).toFixed(2)),
            old_price: pct < 0 ? Number(r.price_per_unit || 0) : r.old_price,
          } as never)
          .eq("id", r.id),
      ),
    );
    ctx.refresh?.();

    return {
      tool: "bulkPriceUpdate",
      ok: true,
      rollbackPointId: pointId,
      messageAr: `تم ${pct < 0 ? "خفض" : "رفع"} أسعار ${rows.length} منتج بنسبة ${Math.abs(pct)}%.`,
      data: { affected: rows.length },
    };
  } catch (e) {
    return {
      tool: "bulkPriceUpdate",
      ok: false,
      messageAr: `تعذر تحديث الأسعار: ${(e as Error).message}`,
    };
  }
}

async function toolUpdateLayoutConfig(
  args: { layoutJson?: Partial<StoreLayoutConfig> },
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const patch = args.layoutJson;
  if (!patch || typeof patch !== "object")
    return { tool: "updateLayoutConfig", ok: false, messageAr: "لم يتم تمرير تعديل صالح للتخطيط." };

  const pointId = createRollbackPoint("updateLayoutConfig", "تعديل تخطيط الواجهة", ctx.layout);
  ctx.updateLayout({ ...ctx.layout, ...patch, lastUpdated: new Date().toISOString() });

  return {
    tool: "updateLayoutConfig",
    ok: true,
    rollbackPointId: pointId,
    messageAr: `تم تطبيق تعديل التخطيط على الأقسام: ${Object.keys(patch).join("، ")}.`,
  };
}

function hexToHslString(hex: string): string | null {
  const m = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

async function toolUpdateThemeColors(
  args: { primary?: string; accent?: string; mode?: string; palette?: string },
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const primary = args.primary || "";
  if (!primary)
    return { tool: "updateThemeColors", ok: false, messageAr: "اللون الأساسي مطلوب (HEX)." };

  const pointId = createRollbackPoint("updateThemeColors", "تغيير ألوان الثيم", ctx.layout);

  // Instant CSS token application (live preview)
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    const p = hexToHslString(primary);
    const a = args.accent ? hexToHslString(args.accent) : null;
    if (p) {
      root.style.setProperty("--primary", p);
      root.style.setProperty("--ring", p);
    }
    if (a) {
      root.style.setProperty("--accent", a);
      root.style.setProperty("--sale", a);
    }
    if (args.mode === "dark") root.classList.add("dark");
    if (args.mode === "light") root.classList.remove("dark");
  }

  ctx.updateLayout({
    ...ctx.layout,
    lastUpdated: new Date().toISOString(),
    theme: {
      ...ctx.layout.theme,
      palette: (args.palette as ThemeColorPalette) || ctx.layout.theme.palette,
      darkModeDefault: args.mode === "dark" ? true : args.mode === "light" ? false : ctx.layout.theme.darkModeDefault,
    },
  });

  try {
    const { data: prev } = await supabase
      .from("theme_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (prev) {
      attachDbUndo(pointId, {
        table: "theme_settings",
        kind: "restore-rows",
        rows: [prev as Record<string, unknown>],
      });
      await supabase
        .from("theme_settings")
        .update({ primary_hex: primary, accent_hex: args.accent ?? undefined } as never)
        .eq("id", (prev as { id: string }).id);
    }
  } catch (e) {
    console.warn("theme_settings sync skipped:", e);
  }

  ctx.refresh?.();
  return {
    tool: "updateThemeColors",
    ok: true,
    rollbackPointId: pointId,
    messageAr: `تم تطبيق اللون الأساسي ${primary}${args.accent ? ` واللون الثانوي ${args.accent}` : ""} على المتجر لحظياً.`,
  };
}

async function toolCreateDiscountBundle(
  args: {
    code?: string;
    discountValue?: number;
    discountType?: string;
    title?: string;
    hours?: number;
  },
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const code = (args.code || `AI${Date.now().toString().slice(-5)}`).toUpperCase();
  const value = Number(args.discountValue ?? 10);
  const type = args.discountType === "fixed" ? "fixed" : "percent";
  const hours = Number(args.hours ?? 6);
  const title = args.title || `باقة توفير ${value}${type === "percent" ? "%" : " ج.م"} ⚡`;

  const pointId = createRollbackPoint("createDiscountBundle", `إنشاء باقة خصم ${code}`, ctx.layout);

  try {
    const { data: inserted } = await supabase
      .from("coupons")
      .insert({
        code,
        discount_type: type,
        discount_value: value,
        is_active: true,
        expires_at: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
      } as never)
      .select("id")
      .maybeSingle();
    if (inserted?.id)
      attachDbUndo(pointId, { table: "coupons", kind: "delete-row", id: inserted.id });
  } catch (e) {
    console.warn("coupon insert failed, layout campaign still applied:", e);
  }

  ctx.updateLayout({
    ...ctx.layout,
    lastUpdated: new Date().toISOString(),
    flashSaleTimer: {
      ...ctx.layout.flashSaleTimer,
      enabled: true,
      title,
      subtitle: `استخدم كود الخصم ${code} قبل انتهاء العرض`,
      endTime: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
      discountBadge: type === "percent" ? `وفر ${value}%` : `وفر ${value} ج.م`,
    },
  });
  ctx.refresh?.();

  return {
    tool: "createDiscountBundle",
    ok: true,
    rollbackPointId: pointId,
    messageAr: `تم إنشاء باقة الخصم «${code}» بقيمة ${value}${type === "percent" ? "%" : " ج.م"} لمدة ${hours} ساعات وتفعيلها في الواجهة.`,
    data: { code, value, type, hours },
  };
}

async function toolSendAbandonedCartRecovery(args: {
  cartId?: string;
  customerName?: string;
  phone?: string;
  totalPrice?: number;
}): Promise<ToolExecutionResult> {
  const draft = await generateAbandonedCartRecovery({
    cartId: args.cartId || "cart-unknown",
    customerName: args.customerName || "عميلنا العزيز",
    phone: args.phone || "",
    totalPrice: Number(args.totalPrice ?? 0),
    itemsList: [],
  } as never);

  if (typeof window !== "undefined" && args.phone) {
    const wa = args.phone.replace(/\D/g, "").replace(/^0/, "20");
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(draft.messageText)}`, "_blank");
  }

  return {
    tool: "sendAbandonedCartRecovery",
    ok: true,
    messageAr: `تم تجهيز رسالة استرداد السلة${args.phone ? " وفتح واتساب للإرسال" : ""}.`,
    data: { messageText: draft.messageText, strategy: draft.strategy },
  };
}

/* ───────────────── 4. UNIFIED EXECUTOR ───────────────── */

export async function executeAiTool(
  tool: AiToolName,
  args: Record<string, unknown>,
  ctx: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  switch (tool) {
    case "generateProductImage":
      return toolGenerateProductImage(args as never, ctx);
    case "uploadBannerImage":
      return toolUploadBannerImage(args as never, ctx);
    case "manageProduct":
      return toolManageProduct(args as never, ctx);
    case "manageCategories":
      return toolManageCategories(args as never, ctx);
    case "bulkPriceUpdate":
      return toolBulkPriceUpdate(args as never, ctx);
    case "updateLayoutConfig":
      return toolUpdateLayoutConfig(args as never, ctx);
    case "updateThemeColors":
      return toolUpdateThemeColors(args as never, ctx);
    case "createDiscountBundle":
      return toolCreateDiscountBundle(args as never, ctx);
    case "sendAbandonedCartRecovery":
      return toolSendAbandonedCartRecovery(args as never);
    case "rollbackLastAction":
      return rollbackLastAction(ctx);
    default:
      return { tool, ok: false, messageAr: "أداة غير معروفة." };
  }
}

/* ───────────────── 5. LOCAL INTENT ROUTER (offline fallback) ─────────────────
   Maps an Arabic admin instruction to one of the 10 tools + arguments,
   so the suite stays fully functional even without a Gemini API key. */

export function routeCommandToTool(
  command: string,
): { tool: AiToolName; args: Record<string, unknown> } | null {
  const c = command.trim();
  const low = c.toLowerCase();

  if (/تراجع|undo|رجوع عن|الغاء اخر|ألغِ آخر/.test(low))
    return { tool: "rollbackLastAction", args: {} };

  if (/(صورة|صور).*(منتج)|ولّد صورة|ولد صورة|generate image/.test(low)) {
    const nameMatch = c.match(/(?:منتج|للمنتج|لمنتج)\s+«?([^»"\n]{2,40})/);
    return {
      tool: "generateProductImage",
      args: { productName: nameMatch?.[1]?.trim() || c.replace(/.*صورة\s*/, "").trim() },
    };
  }

  if (/بانر|بنر|banner|سلايد/.test(low))
    return { tool: "uploadBannerImage", args: { bannerText: c.replace(/.*بانر\s*/, "").trim() || c } };

  if (/(ارفع|زود|خفض|قلل|انقص).*(سعر|أسعار|اسعار)|bulk price|خصم على كل/.test(low)) {
    const pctMatch = c.match(/(\d+(?:\.\d+)?)\s*%/);
    const down = /(خفض|قلل|انقص|خصم)/.test(low);
    const pct = pctMatch ? Number(pctMatch[1]) : 10;
    return { tool: "bulkPriceUpdate", args: { categoryId: "all", percentage: down ? -pct : pct } };
  }

  if (/(اضف|أضف|انشئ|أنشئ|احذف|عدل).*(قسم|تصنيف)/.test(low)) {
    const action = /(احذف)/.test(low) ? "delete" : /(عدل)/.test(low) ? "update" : "create";
    const nameMatch = c.match(/(?:قسم|تصنيف)\s+«?([^»"\n]{2,40})/);
    return { tool: "manageCategories", args: { action, data: { name: nameMatch?.[1]?.trim() } } };
  }

  if (/(اضف|أضف|انشئ|أنشئ|احذف|عدل).*(منتج|صنف)/.test(low)) {
    const action = /(احذف)/.test(low) ? "delete" : /(عدل)/.test(low) ? "update" : "create";
    const nameMatch = c.match(/(?:منتج|صنف)\s+«?([^»"\n]{2,40})/);
    const priceMatch = c.match(/(\d+(?:\.\d+)?)\s*(?:ج|جنيه|EGP)/i);
    return {
      tool: "manageProduct",
      args: {
        action,
        data: {
          name: nameMatch?.[1]?.trim(),
          price_per_unit: priceMatch ? Number(priceMatch[1]) : 0,
        },
      },
    };
  }

  if (/(كوبون|خصم|باقة|بندل|عرض).*(\d)|coupon|bundle/.test(low)) {
    const pctMatch = c.match(/(\d+(?:\.\d+)?)\s*%/);
    const codeMatch = c.match(/\b([A-Z0-9]{4,12})\b/);
    return {
      tool: "createDiscountBundle",
      args: {
        code: codeMatch?.[1],
        discountValue: pctMatch ? Number(pctMatch[1]) : 10,
        discountType: pctMatch ? "percent" : "fixed",
        hours: 6,
      },
    };
  }

  if (/سلة متروكة|استرداد|abandoned/.test(low)) {
    const phone = c.match(/0?1\d{9}/)?.[0];
    return { tool: "sendAbandonedCartRecovery", args: { cartId: `cart-${Date.now()}`, phone } };
  }

  const hex = c.match(/#[0-9a-fA-F]{6}/g);
  if (hex?.length || /(لون|ألوان|الوان|ثيم|theme|داكن|فاتح)/.test(low)) {
    if (hex?.length) {
      return {
        tool: "updateThemeColors",
        args: {
          primary: hex[0],
          accent: hex[1],
          mode: /داكن|dark/.test(low) ? "dark" : /فاتح|light/.test(low) ? "light" : undefined,
        },
      };
    }
  }

  return null;
}
