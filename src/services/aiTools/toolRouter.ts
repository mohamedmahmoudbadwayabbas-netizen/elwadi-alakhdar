/* =========================================================================
   GEMINI AI ADMIN ENGINE — UNIFIED TOOL ROUTER & NLP DISPATCHER
   Routes all 24 tool executions and provides local NLP fallback routing
   ========================================================================= */

import type {
  AiToolName,
  ToolExecutionContext,
  ToolExecutionResult,
} from "./types";
import {
  toolGenerateProductImage,
  toolUploadBannerImage,
  toolManageProduct,
  toolManageCategories,
  toolBulkPriceUpdate,
  toolUpdateLayoutConfig,
  toolUpdateThemeColors,
  toolCreateDiscountBundle,
  toolSendAbandonedCartRecovery,
  rollbackLastAction,
} from "./coreCatalogTools";
import {
  executeCustomCSS,
  updateRawJsonMetadata,
  manageUsersAndRoles,
  exportReportsAndAnalytics,
  sendPushNotification,
  manageDeliveryZones,
} from "./operationalTools";
import {
  getDirectoryTree,
  getFileContentTool,
  searchCodebase,
  getAppErrors,
  writeNewFile,
  updateFileAST,
  deleteFileTool,
  gitCommitAndPush,
  gitRollbackCommit,
} from "./devopsTools";

export async function executeAiTool(
  tool: AiToolName,
  args: Record<string, unknown> = {},
  ctx?: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  console.info(`[AI Engine] 🚀 Executing tool "${tool}" with args:`, args);

  let result: ToolExecutionResult;

  switch (tool) {
    // ── Media ──
    case "generateProductImage":
      result = await toolGenerateProductImage(args as any, ctx);
      break;
    case "uploadBannerImage":
      result = await toolUploadBannerImage(args as any, ctx);
      break;

    // ── Catalog ──
    case "manageProduct":
      result = await toolManageProduct(args as any, ctx);
      break;
    case "manageCategories":
      result = await toolManageCategories(args as any, ctx);
      break;
    case "bulkPriceUpdate":
      result = await toolBulkPriceUpdate(args as any, ctx);
      break;

    // ── UI ──
    case "updateLayoutConfig":
      result = await toolUpdateLayoutConfig(args as any, ctx);
      break;
    case "updateThemeColors":
      result = await toolUpdateThemeColors(args as any, ctx);
      break;

    // ── Marketing ──
    case "createDiscountBundle":
      result = await toolCreateDiscountBundle(args as any, ctx);
      break;
    case "sendAbandonedCartRecovery":
      result = await toolSendAbandonedCartRecovery(args as any);
      break;

    // ── Safety ──
    case "rollbackLastAction":
      result = await rollbackLastAction(ctx);
      break;

    // ── Phase 1 ──
    case "executeCustomCSS":
      result = await executeCustomCSS(String(args.cssRules || args.rules || ""), ctx);
      break;
    case "updateRawJsonMetadata":
      result = await updateRawJsonMetadata(String(args.key || ""), args.value, ctx);
      break;

    // ── Phase 2 ──
    case "manageUsersAndRoles":
      result = await manageUsersAndRoles(args as any, ctx);
      break;
    case "exportReportsAndAnalytics":
      result = await exportReportsAndAnalytics(args as any, ctx);
      break;
    case "sendPushNotification":
      result = await sendPushNotification(args as any, ctx);
      break;
    case "manageDeliveryZones":
      result = await manageDeliveryZones(args as any, ctx);
      break;

    // ── Phase 3 ──
    case "getDirectoryTree":
      result = await getDirectoryTree(args as any);
      break;
    case "getFileContent":
      result = await getFileContentTool(args as any);
      break;
    case "searchCodebase":
      result = await searchCodebase(args as any);
      break;
    case "getAppErrors":
      result = await getAppErrors(args as any);
      break;
    case "writeNewFile":
      result = await writeNewFile(args as any, ctx);
      break;
    case "updateFileAST":
      result = await updateFileAST(args as any, ctx);
      break;
    case "deleteFile":
      result = await deleteFileTool(args as any, ctx);
      break;
    case "gitCommitAndPush":
      result = await gitCommitAndPush(args as any, ctx);
      break;
    case "gitRollbackCommit":
      result = await gitRollbackCommit(args as any, ctx);
      break;

    default:
      result = {
        tool,
        ok: false,
        messageAr: `الأداة «${tool}» غير معروفة أو غير مدعومة في الإصدار الحالي.`,
      };
      break;
  }

  // Real-Time UI State Sync: Dispatch global browser events on success
  if (typeof window !== "undefined" && result.ok) {
    try {
      window.dispatchEvent(
        new CustomEvent("smartstore:sync", {
          detail: {
            tool,
            data: result.data,
            timestamp: Date.now(),
            verified: result.verified ?? true,
          },
        }),
      );

      if (tool === "updateLayoutConfig" || tool === "updateThemeColors") {
        window.dispatchEvent(
          new CustomEvent("smartstore:layout_updated", {
            detail: result.data,
          }),
        );
      }

      if (
        tool === "manageProduct" ||
        tool === "manageCategories" ||
        tool === "bulkPriceUpdate"
      ) {
        window.dispatchEvent(
          new CustomEvent("smartstore:catalog_updated", {
            detail: { tool, data: result.data },
          }),
        );
      }

      if (tool === "manageDeliveryZones") {
        window.dispatchEvent(
          new CustomEvent("smartstore:delivery_zones_updated", {
            detail: result.data,
          }),
        );
      }

      if (tool === "manageUsersAndRoles") {
        window.dispatchEvent(
          new CustomEvent("smartstore:auth_roles_updated", {
            detail: result.data,
          }),
        );
      }

      if (tool === "executeCustomCSS") {
        window.dispatchEvent(
          new CustomEvent("smartstore:custom_css_updated", {
            detail: result.data,
          }),
        );
      }

      if (ctx?.refresh) {
        ctx.refresh();
      }
    } catch (evtErr) {
      console.warn("[AI Engine] Could not dispatch sync event:", evtErr);
    }
  }

  return result;
}

/**
 * Fast Arabic & English NLP rule router for instant fallback
 */
export function routeCommandToTool(
  command: string,
): { tool: AiToolName; args: Record<string, unknown> } | null {
  const c = command.trim().toLowerCase();

  // Safety
  if (c.includes("تراجع") || c.includes("undo") || c.includes("rollback")) {
    return { tool: "rollbackLastAction", args: {} };
  }

  // Phase 3: Git & DevOps
  if (c.includes("git commit") || c.includes("كوميت") || c.includes("حفظ التعديلات في جيت") || c.includes("commit and push")) {
    return { tool: "gitCommitAndPush", args: { commitMessage: command } };
  }
  if (c.includes("git rollback") || c.includes("تراجع عن الكوميت") || c.includes("استرجاع الكوميت")) {
    return { tool: "gitRollbackCommit", args: {} };
  }
  if (c.includes("شجرة المجلدات") || c.includes("ملفات المشروع") || c.includes("directory tree") || c.includes("getdirectorytree")) {
    return { tool: "getDirectoryTree", args: { rootDir: "/src" } };
  }
  if (c.includes("اقرأ ملف") || c.includes("محتوى ملف") || c.includes("getfilecontent") || c.includes("view file")) {
    const fileMatch = command.match(/\/src\/[a-zA-Z0-9_\-./]+/);
    return { tool: "getFileContent", args: { filePath: fileMatch ? fileMatch[0] : "/src/routes/cart.tsx" } };
  }
  if (c.includes("ابحث في الكود") || c.includes("search codebase") || c.includes("searchcodebase")) {
    const qMatch = command.replace(/ابحث في الكود عن|ابحث في الكود|search codebase for|search codebase/i, "").trim();
    return { tool: "searchCodebase", args: { query: qMatch || "supabase" } };
  }
  if (c.includes("سجل الأخطاء") || c.includes("أخطاء التطبيق") || c.includes("getapperrors") || c.includes("diagnostics")) {
    return { tool: "getAppErrors", args: { limit: 15 } };
  }

  // Phase 2: Operations
  if (c.includes("صلاحية") || c.includes("صلاحيات") || c.includes("أدمن") || c.includes("مشرف") || c.includes("مندوب") || c.includes("manageusers")) {
    let role = "customer";
    if (c.includes("أدمن") || c.includes("admin")) role = "admin";
    else if (c.includes("مشرف") || c.includes("moderator")) role = "moderator";
    else if (c.includes("مندوب") || c.includes("سائق") || c.includes("driver")) role = "driver";
    return { tool: "manageUsersAndRoles", args: { userId: "current_user", role } };
  }
  if (c.includes("تقرير") || c.includes("تصدير") || c.includes("تحليلات") || c.includes("مبيعات") || c.includes("analytics") || c.includes("exportreports")) {
    return { tool: "exportReportsAndAnalytics", args: { timeframe: "last_30_days", format: "json" } };
  }
  if (c.includes("إشعار") || c.includes("تنبيه") || c.includes("بث") || c.includes("push notification") || c.includes("sendpush")) {
    return { tool: "sendPushNotification", args: { title: "عرض خاص من سمارت ستور ⚡", message: command, targetAudience: "all" } };
  }
  if (c.includes("توصيل") || c.includes("شحن") || c.includes("منطقة") || c.includes("رسوم التوصيل") || c.includes("managedeliveryzones")) {
    const feeMatch = command.match(/\d+/);
    return { tool: "manageDeliveryZones", args: { zoneName: "القاهرة والجيزة", deliveryFee: feeMatch ? Number(feeMatch[0]) : 25 } };
  }

  // Phase 1: CSS & Metadata
  if (c.includes("css") || c.includes("تنسيق") || c.includes("ستايل") || c.includes("لون التوهج")) {
    return { tool: "executeCustomCSS", args: { cssRules: `:root { --primary-glow: #10b981; } /* ${command} */` } };
  }

  // Core Tools: Bulk price, coupons, banner, theme, product
  if (c.includes("خصم") && (c.includes("%") || c.includes("بالمية") || c.includes("بالمئة"))) {
    const pctMatch = command.match(/\d+/);
    const pct = pctMatch ? -Number(pctMatch[0]) : -10;
    return { tool: "bulkPriceUpdate", args: { categoryId: "all", percentage: pct } };
  }
  if (c.includes("كوبون") || c.includes("كود خصم") || c.includes("باقة خصم") || c.includes("ساعات ذهبية")) {
    const valMatch = command.match(/\d+/);
    return { tool: "createDiscountBundle", args: { code: "FLASH20", discountValue: valMatch ? Number(valMatch[0]) : 20, discountType: "percent", hours: 4 } };
  }
  if (c.includes("بانر") || c.includes("صورة رئيسية") || c.includes("سلايدر")) {
    return { tool: "uploadBannerImage", args: { bannerText: command.replace(/بانر|صورة|أنشئ|ولد/g, "").trim() || "عروض طازجة يومياً" } };
  }
  if (c.includes("ألوان") || c.includes("اللون") || c.includes("ثيم") || c.includes("الوضع الليلي") || c.includes("الداكن")) {
    const mode = c.includes("داكن") || c.includes("ليلي") || c.includes("dark") ? "dark" : "light";
    let prim = "#036233";
    if (c.includes("أزرق") || c.includes("blue")) prim = "#1E40AF";
    else if (c.includes("برتقالي") || c.includes("amber")) prim = "#D97706";
    else if (c.includes("بنفسجي") || c.includes("purple")) prim = "#7C3AED";
    return { tool: "updateThemeColors", args: { primary: prim, accent: "#E85D2F", mode } };
  }
  if (c.includes("أضف منتج") || c.includes("إضافة منتج") || c.includes("منتج جديد")) {
    const priceMatch = command.match(/\d+/);
    const nameMatch = command.replace(/أضف منتج|إضافة منتج|بسعر|\d+|جنية|جنيه|ج\.م/g, "").trim();
    return { tool: "manageProduct", args: { action: "create", data: { name: nameMatch || "منتج طازج جديد", price_per_unit: priceMatch ? Number(priceMatch[0]) : 45 } } };
  }

  return null;
}
