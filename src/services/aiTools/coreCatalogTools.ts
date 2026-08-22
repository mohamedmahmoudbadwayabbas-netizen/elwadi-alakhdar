/* =========================================================================
   GEMINI AI ADMIN ENGINE — 10 CORE LOVABLE TOOLS (SUPABASE ALIGNED)
   Strict database mutations, live Supabase queries, and instant rollback protection
   ========================================================================= */

import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "./envValidation";
import type {
  ToolExecutionContext,
  ToolExecutionResult,
  RollbackPoint,
  AiToolName,
} from "./types";
import type { StoreLayoutConfig, ThemeColorPalette } from "@/types/layout-config";
import { generateAdminImage } from "@/services/geminiImageService";

/* ───────────────────────── Rollback Engine ───────────────────────── */

const ROLLBACK_STACK_KEY = "smartstore_ai_rollback_stack";
const MAX_ROLLBACK_DEPTH = 30;

export function getRollbackStack(): RollbackPoint[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROLLBACK_STACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRollbackStack(stack: RollbackPoint[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      ROLLBACK_STACK_KEY,
      JSON.stringify(stack.slice(-MAX_ROLLBACK_DEPTH)),
    );
  } catch {
    /* ignore storage quota */
  }
}

export function createRollbackPoint(
  tool: AiToolName,
  labelAr: string,
  layout: StoreLayoutConfig | null,
): string {
  const id = `rb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const point: RollbackPoint = {
    id,
    tool,
    labelAr,
    createdAt: new Date().toISOString(),
    layout: layout ? JSON.parse(JSON.stringify(layout)) : null,
  };
  const stack = getRollbackStack();
  stack.push(point);
  saveRollbackStack(stack);
  return id;
}

export function attachDbUndo(
  pointId: string,
  dbUndo: NonNullable<RollbackPoint["db"]>,
): void {
  const stack = getRollbackStack();
  const target = stack.find((p) => p.id === pointId);
  if (target) {
    target.db = dbUndo;
    saveRollbackStack(stack);
  }
}

export function getLastRollbackPoint(): RollbackPoint | null {
  const stack = getRollbackStack();
  return stack.length > 0 ? stack[stack.length - 1] : null;
}

export async function rollbackLastAction(
  ctx?: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const stack = getRollbackStack();
  const last = stack.pop();
  if (!last) {
    return {
      tool: "rollbackLastAction",
      ok: false,
      messageAr: "لا توجد إجراءات سابقة للتراجع عنها في الذاكرة.",
    };
  }

  saveRollbackStack(stack);

  // 1. Revert UI layout if saved
  if (last.layout && ctx) {
    ctx.updateLayout(last.layout);
  }

  // 2. Revert DB changes in Supabase
  if (last.db && isSupabaseConfigured()) {
    try {
      const { table, kind, rows, id } = last.db;
      if (kind === "restore-rows" && rows && rows.length > 0) {
        await supabase.from(table as any).upsert(rows as any);
      } else if (kind === "delete-row" && id) {
        await supabase.from(table as any).delete().eq("id", id);
      }
    } catch (err) {
      console.warn("Database rollback restoration error:", err);
    }
  }

  ctx?.refresh?.();

  return {
    tool: "rollbackLastAction",
    ok: true,
    messageAr: `تم التراجع بنجاح عن «${last.labelAr}» واستعادة الحالة السابقة.`,
    data: { revertedTool: last.tool, revertedAt: last.createdAt },
  };
}

/* ───────────────────────── 1. generateProductImage ───────────────────────── */

export async function toolGenerateProductImage(
  args: { productName?: string; category?: string; productId?: string },
  ctx?: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const name = (args.productName || "").trim();
  if (!name) {
    return { tool: "generateProductImage", ok: false, messageAr: "اسم المنتج مطلوب لتوليد الصورة." };
  }

  const prompt = `Professional commercial supermarket studio photography of ${name}, fresh Egyptian gourmet grocery, clean studio lighting, 8k resolution, appetizing presentation on neutral background`;
  const pointId = createRollbackPoint("generateProductImage", `توليد صورة منتج: ${name}`, ctx?.layout || null);

  const res = await generateAdminImage({
    prompt,
    aspectRatio: "1:1",
    imageName: `prod_${Date.now()}`,
  });

  if (!res.ok || !res.imageUrl) {
    return {
      tool: "generateProductImage",
      ok: false,
      messageAr: res.errorAr || "تعذر توليد الصورة بالذكاء الاصطناعي حالياً.",
    };
  }

  // Attach image to Supabase product if productId provided
  if (args.productId && isSupabaseConfigured()) {
    try {
      const { data: prev } = await supabase
        .from("products")
        .select("id, image_url")
        .eq("id", args.productId)
        .maybeSingle();

      if (prev) {
        attachDbUndo(pointId, {
          table: "products",
          kind: "restore-rows",
          rows: [prev as Record<string, unknown>],
        });
      }

      await supabase
        .from("products")
        .update({
          image_url: res.imageUrl,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", args.productId);
    } catch (e) {
      console.warn("Product image remote attach skipped:", e);
    }
  }

  ctx?.refresh?.();

  return {
    tool: "generateProductImage",
    ok: true,
    rollbackPointId: pointId,
    messageAr: `تم توليد صورة استوديو احترافية لمنتج «${name}» بنجاح.`,
    data: { imageUrl: res.imageUrl, productName: name, productId: args.productId },
  };
}

/* ───────────────────────── 2. uploadBannerImage ───────────────────────── */

export async function toolUploadBannerImage(
  args: { bannerText?: string; subtitle?: string },
  ctx?: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const headline = (args.bannerText || "").trim();
  if (!headline) {
    return { tool: "uploadBannerImage", ok: false, messageAr: "عنوان البانر مطلوب." };
  }

  const prompt = `Modern vibrant Egyptian supermarket promotional banner for "${headline}", fresh grocery products, luxury appetizing background, 16:9 widescreen layout`;
  const pointId = createRollbackPoint("uploadBannerImage", `توليد بانر: ${headline}`, ctx?.layout || null);

  const res = await generateAdminImage({
    prompt,
    aspectRatio: "16:9",
    imageName: `banner_${Date.now()}`,
  });

  if (!res.ok || !res.imageUrl) {
    return {
      tool: "uploadBannerImage",
      ok: false,
      messageAr: res.errorAr || "تعذر توليد صورة البانر حالياً.",
    };
  }

  if (ctx) {
    const nextLayout: StoreLayoutConfig = JSON.parse(JSON.stringify(ctx.layout));
    nextLayout.heroBanner.enabled = true;
    nextLayout.heroBanner.slides = [
      {
        id: `slide-${Date.now()}`,
        title: headline,
        subtitle: args.subtitle || "عروض حصرية طازجة بأعلى جودة",
        imageUrl: res.imageUrl,
        ctaText: "تسوق الآن",
        ctaLink: "/categories",
        badge: "عرض خاص",
        align: "right",
      },
      ...(nextLayout.heroBanner.slides || []).slice(0, 4),
    ];
    ctx.updateLayout(nextLayout);
  }

  if (isSupabaseConfigured()) {
    try {
      const { data: existing } = await supabase
        .from("store_settings")
        .select("id, hero_title, hero_subtitle, hero_image_url")
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        attachDbUndo(pointId, {
          table: "store_settings",
          kind: "restore-rows",
          rows: [existing as Record<string, unknown>],
        });

        await supabase
          .from("store_settings")
          .update({
            hero_title: headline,
            hero_subtitle: args.subtitle || null,
            hero_image_url: res.imageUrl,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", existing.id);
      }
    } catch (e) {
      console.warn("store_settings banner sync skipped:", e);
    }
  }

  return {
    tool: "uploadBannerImage",
    ok: true,
    rollbackPointId: pointId,
    messageAr: `تم توليد البانر الترويجي «${headline}» وإضافته لواجهة المتجر بنجاح.`,
    data: { imageUrl: res.imageUrl, headline },
  };
}

/* ───────────────────────── 3. manageProduct ───────────────────────── */

export async function toolManageProduct(
  args: { action?: string; data?: Record<string, unknown> },
  ctx?: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const action = (args.action || "create").toLowerCase();
  const data = args.data || {};
  const pointId = createRollbackPoint("manageProduct", `إدارة منتج (${action})`, ctx?.layout || null);

  try {
    if (action === "create") {
      const name = String(data.name || "منتج جديد");
      const pricePerUnit = Number(data.price_per_unit || data.price || 0);

      const payload = {
        name,
        price_per_unit: pricePerUnit,
        old_price: data.old_price !== undefined && data.old_price !== null ? Number(data.old_price) : null,
        stock_quantity: Number(data.stock_quantity ?? data.stock ?? 50),
        category_id: (data.category_id as string) || null,
        description: (data.description as string) || null,
        unit_label: (data.unit_label as string) || (data.is_by_weight ? "كجم" : "قطعة"),
        is_by_weight: Boolean(data.is_by_weight),
        image_url: (data.image_url as string) || null,
        is_featured: Boolean(data.is_featured),
        is_on_sale: Boolean(data.is_on_sale || (data.old_price && Number(data.old_price) > pricePerUnit)),
        is_popular: Boolean(data.is_popular),
        is_top_seller: Boolean(data.is_top_seller),
        low_stock_threshold: Number(data.low_stock_threshold ?? 10),
        cooking_tip: (data.cooking_tip as string) || null,
      };

      if (isSupabaseConfigured()) {
        const { data: inserted, error } = await supabase
          .from("products")
          .insert(payload as never)
          .select("id")
          .maybeSingle();

        if (error) throw error;
        if (inserted?.id) {
          attachDbUndo(pointId, { table: "products", kind: "delete-row", id: inserted.id });
        }
      }

      ctx?.refresh?.();
      return {
        tool: "manageProduct",
        ok: true,
        rollbackPointId: pointId,
        messageAr: `تمت إضافة المنتج «${payload.name}» بسعر ${payload.price_per_unit} ج.م في الكتالوج بنجاح.`,
        data: { name: payload.name, price: payload.price_per_unit },
      };
    }

    const id = String(data.id || "");
    if (!id) {
      return { tool: "manageProduct", ok: false, messageAr: "معرّف المنتج (id) مطلوب للتعديل أو الحذف." };
    }

    if (isSupabaseConfigured()) {
      const { data: prev } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (prev) {
        attachDbUndo(pointId, { table: "products", kind: "restore-rows", rows: [prev as Record<string, unknown>] });
      }

      if (action === "delete") {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;
        ctx?.refresh?.();
        return {
          tool: "manageProduct",
          ok: true,
          rollbackPointId: pointId,
          messageAr: `تم حذف المنتج (id: ${id}) بنجاح مع إمكانية التراجع الفوري.`,
        };
      }

      const { id: _omit, ...patch } = data as Record<string, unknown>;
      const { error } = await supabase
        .from("products")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", id);

      if (error) throw error;
    }

    ctx?.refresh?.();
    return {
      tool: "manageProduct",
      ok: true,
      rollbackPointId: pointId,
      messageAr: `تم تحديث بيانات المنتج «${data.name || id}» في Supabase بنجاح.`,
      data: { id, updatedFields: Object.keys(data) },
    };
  } catch (e) {
    return {
      tool: "manageProduct",
      ok: false,
      messageAr: `تعذر تنفيذ عملية إدارة المنتج: ${(e as Error).message}`,
    };
  }
}

/* ───────────────────────── 4. manageCategories ───────────────────────── */

export async function toolManageCategories(
  args: { action?: string; data?: Record<string, unknown> },
  ctx?: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const action = (args.action || "create").toLowerCase();
  const data = args.data || {};
  const pointId = createRollbackPoint("manageCategories", `إدارة قسم (${action})`, ctx?.layout || null);

  try {
    if (action === "create") {
      const name = String(data.name || "قسم جديد");
      const slug = String(data.slug || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
      const payload = {
        name,
        slug,
        icon: (data.icon as string) || "🛒",
        image_url: (data.image_url as string) || null,
        sort_order: Number(data.sort_order ?? 99),
        parent_id: (data.parent_id as string) || null,
      };

      if (isSupabaseConfigured()) {
        const { data: inserted, error } = await supabase
          .from("categories")
          .insert(payload as never)
          .select("id")
          .maybeSingle();

        if (error) throw error;
        if (inserted?.id) {
          attachDbUndo(pointId, { table: "categories", kind: "delete-row", id: inserted.id });
        }
      }

      ctx?.refresh?.();
      return {
        tool: "manageCategories",
        ok: true,
        rollbackPointId: pointId,
        messageAr: `تمت إضافة القسم «${name}» لقاعدة البيانات بنجاح.`,
        data: { name, slug },
      };
    }

    const id = String(data.id || "");
    if (!id) {
      return { tool: "manageCategories", ok: false, messageAr: "معرّف القسم (id) مطلوب." };
    }

    if (isSupabaseConfigured()) {
      const { data: prev } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
      if (prev) {
        attachDbUndo(pointId, { table: "categories", kind: "restore-rows", rows: [prev as Record<string, unknown>] });
      }

      if (action === "delete") {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) throw error;
        ctx?.refresh?.();
        return {
          tool: "manageCategories",
          ok: true,
          rollbackPointId: pointId,
          messageAr: `تم حذف القسم بنجاح.`,
        };
      }

      const { id: _omit, ...patch } = data as Record<string, unknown>;
      const { error } = await supabase
        .from("categories")
        .update({
          ...patch,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", id);

      if (error) throw error;
    }

    ctx?.refresh?.();
    return {
      tool: "manageCategories",
      ok: true,
      rollbackPointId: pointId,
      messageAr: `تم تحديث بيانات القسم بنجاح.`,
    };
  } catch (e) {
    return {
      tool: "manageCategories",
      ok: false,
      messageAr: `تعذر تنفيذ العملية على القسم: ${(e as Error).message}`,
    };
  }
}

/* ───────────────────────── 5. bulkPriceUpdate ───────────────────────── */

export async function toolBulkPriceUpdate(
  args: { categoryId?: string; percentage?: number },
  ctx?: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const pct = Number(args.percentage ?? 0);
  if (!pct) {
    return { tool: "bulkPriceUpdate", ok: false, messageAr: "حدد نسبة التغيير المطلوبة للأسعار (مثلاً: -15 لخصم 15%)." };
  }

  const categoryId = args.categoryId || "all";
  const pointId = createRollbackPoint(
    "bulkPriceUpdate",
    `تحديث أسعار ${categoryId === "all" ? "كل المنتجات" : "قسم محدد"} بنسبة ${pct}%`,
    ctx?.layout || null,
  );

  try {
    if (isSupabaseConfigured()) {
      let query = supabase.from("products").select("id, price_per_unit, old_price");
      if (categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }
      const { data: rows, error } = await query;
      if (error) throw error;

      if (rows && rows.length > 0) {
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
                is_on_sale: pct < 0 ? true : undefined,
                updated_at: new Date().toISOString(),
              } as never)
              .eq("id", r.id),
          ),
        );
      }
    }

    ctx?.refresh?.();
    return {
      tool: "bulkPriceUpdate",
      ok: true,
      rollbackPointId: pointId,
      messageAr: `تم ${pct < 0 ? "تخفيض" : "زيادة"} أسعار المنتجات بنسبة ${Math.abs(pct)}% بنجاح.`,
      data: { percentage: pct, categoryId },
    };
  } catch (e) {
    return {
      tool: "bulkPriceUpdate",
      ok: false,
      messageAr: `تعذر تحديث الأسعار: ${(e as Error).message}`,
    };
  }
}

/* ───────────────────────── 6. updateLayoutConfig ───────────────────────── */

export async function toolUpdateLayoutConfig(
  args: { layoutJson?: Record<string, unknown> },
  ctx?: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const json = args.layoutJson;
  if (!json || typeof json !== "object") {
    return { tool: "updateLayoutConfig", ok: false, messageAr: "بيانات التخطيط layoutJson مطلوبة." };
  }

  const pointId = createRollbackPoint("updateLayoutConfig", "تعديل تخطيط الواجهة", ctx?.layout || null);

  if (ctx) {
    const merged: StoreLayoutConfig = {
      ...ctx.layout,
      ...(json as Partial<StoreLayoutConfig>),
      lastUpdated: new Date().toISOString(),
    };
    ctx.updateLayout(merged);
  }

  return {
    tool: "updateLayoutConfig",
    ok: true,
    rollbackPointId: pointId,
    messageAr: "تم دمج وتطبيق تعديلات تخطيط الواجهة بنجاح.",
    data: { updatedKeys: Object.keys(json) },
  };
}

/* ───────────────────────── 7. updateThemeColors ───────────────────────── */

export function hexToHslString(hex: string): string | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export async function toolUpdateThemeColors(
  args: { primary?: string; accent?: string; mode?: string; palette?: string },
  ctx?: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const primary = args.primary || "#036233";
  const accent = args.accent || "#E85D2F";
  const mode = args.mode === "dark" ? "dark" : args.mode === "light" ? "light" : undefined;
  const pointId = createRollbackPoint("updateThemeColors", `تحديث الألوان: ${primary}`, ctx?.layout || null);

  // Apply to document DOM
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    const primHsl = hexToHslString(primary);
    const accHsl = hexToHslString(accent);
    if (primHsl) {
      root.style.setProperty("--primary", primHsl);
      root.style.setProperty("--ring", primHsl);
    }
    if (accHsl) {
      root.style.setProperty("--accent", accHsl);
      root.style.setProperty("--sale", accHsl);
    }
    if (mode === "dark") root.classList.add("dark");
    else if (mode === "light") root.classList.remove("dark");
  }

  // Update layout theme
  if (ctx) {
    const next: StoreLayoutConfig = JSON.parse(JSON.stringify(ctx.layout));
    next.theme.primaryColor = primary;
    next.theme.accentColor = accent;
    if (mode) next.theme.mode = mode;
    if (args.palette) next.theme.palette = args.palette as ThemeColorPalette;
    ctx.updateLayout(next);
  }

  // Sync to Supabase theme_settings & store_settings
  if (isSupabaseConfigured()) {
    try {
      const { data: themeRow } = await supabase.from("theme_settings").select("id").limit(1).maybeSingle();
      if (themeRow?.id) {
        await supabase
          .from("theme_settings")
          .update({
            primary_hex: primary,
            accent_hex: accent,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", themeRow.id);
      }

      const { data: storeRow } = await supabase.from("store_settings").select("id").limit(1).maybeSingle();
      if (storeRow?.id) {
        await supabase
          .from("store_settings")
          .update({
            primary_color: primary,
            accent_color: accent,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", storeRow.id);
      }
    } catch (e) {
      console.warn("Theme DB sync skipped:", e);
    }
  }

  return {
    tool: "updateThemeColors",
    ok: true,
    rollbackPointId: pointId,
    messageAr: `تم تحديث هوية وألوان المتجر (الأساسي: ${primary}، الثانوي: ${accent}) بنجاح.`,
    data: { primary, accent, mode, palette: args.palette },
  };
}

/* ───────────────────────── 8. createDiscountBundle ───────────────────────── */

export async function toolCreateDiscountBundle(
  args: {
    code?: string;
    discountValue?: number;
    discountType?: string;
    title?: string;
    hours?: number;
    minOrderAmount?: number;
  },
  ctx?: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const code = (args.code || `SAVE${Math.floor(Math.random() * 90 + 10)}`).toUpperCase();
  const value = Number(args.discountValue ?? 15);
  const type = args.discountType === "fixed" ? "fixed" : "percent";
  const hours = Number(args.hours ?? 6);
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  const pointId = createRollbackPoint("createDiscountBundle", `إنشاء كوبون: ${code}`, ctx?.layout || null);

  if (isSupabaseConfigured()) {
    try {
      const { data: inserted, error } = await supabase
        .from("coupons")
        .insert({
          code,
          discount_type: type,
          discount_value: value,
          expires_at: expiresAt,
          is_active: true,
          first_order_only: false,
          min_order_amount: args.minOrderAmount ? Number(args.minOrderAmount) : null,
        } as never)
        .select("id")
        .maybeSingle();

      if (!error && inserted?.id) {
        attachDbUndo(pointId, { table: "coupons", kind: "delete-row", id: inserted.id });
      }
    } catch (e) {
      console.warn("Coupons table insert skipped:", e);
    }
  }

  // Surface in flash sale timer
  if (ctx) {
    const next: StoreLayoutConfig = JSON.parse(JSON.stringify(ctx.layout));
    next.flashSaleTimer.enabled = true;
    next.flashSaleTimer.title = args.title || `عروض الساعات الذهبية — استخدم كود ${code}`;
    next.flashSaleTimer.couponCode = code;
    next.flashSaleTimer.discountTag = type === "percent" ? `خصم ${value}%` : `خصم ${value} ج.م`;
    next.flashSaleTimer.endTime = expiresAt;
    ctx.updateLayout(next);
  }

  return {
    tool: "createDiscountBundle",
    ok: true,
    rollbackPointId: pointId,
    messageAr: `تم إنشاء باقة الخصم وتفعيل كود «${code}» (${type === "percent" ? `${value}%` : `${value} ج.م`}) لمدة ${hours} ساعات.`,
    data: { code, discountValue: value, discountType: type, expiresAt },
  };
}

/* ───────────────────────── 9. sendAbandonedCartRecovery ───────────────────────── */

export async function toolSendAbandonedCartRecovery(
  args: { cartId?: string; customerName?: string; phone?: string; totalPrice?: number },
): Promise<ToolExecutionResult> {
  const name = args.customerName || "عزيزنا العميل";
  const phone = args.phone || "01000000000";
  const total = Number(args.totalPrice ?? 0);
  const coupon = "COMEBACK10";

  const message = `أهلاً بك يا ${name} 👋 من سوبرماركت الوادي الأخضر 🌿\nلاحظنا أنك تركت سلة التسوق بقيمة ${total.toFixed(2)} ج.م دون إتمام.\nصممنا لك كود خصم خاص 🎁 *${coupon}* يمنحك خصماً 10%!\nأكمل طلبك الآن في ثوانٍ: ${typeof window !== "undefined" ? window.location.origin : "https://alwadi-alakhdar.eg"}/cart`;

  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("0") ? "2" + cleanPhone : cleanPhone;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  if (typeof window !== "undefined") {
    window.open(whatsappUrl, "_blank");
  }

  return {
    tool: "sendAbandonedCartRecovery",
    ok: true,
    messageAr: `تم إنشاء رسالة الاسترداد وفتح رابط الواتساب للعميل «${name}» مع كود ${coupon}.`,
    data: { whatsappUrl, messageText: message, coupon },
  };
}
