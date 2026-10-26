/* =========================================================================
   GEMINI AI ADMIN ENGINE (PHASE 4: AGENTIC MULTI-STEP TOOL-CALLING LOOP)
   Autonomous Store Admin Copilot with Live Supabase, Tool Calling & Self-Verification
   ========================================================================= */

import { supabase } from "@/integrations/supabase/client";
import { supabase as supabaseLoose } from "@/lib/supabase-loose";
import { generateGeminiContent } from "@/lib/gemini.functions";
import {
  isGeminiConfigured,
  isSupabaseConfigured,
  validateEnvironment,
  getAiEngineStatus,
  diagnoseGeminiError,
} from "./aiTools/envValidation";
import {
  AUTONOMOUS_ADMIN_COPILOT_DIRECTIVE,
  SUPABASE_SCHEMA_CONTEXT_INSTRUCTION,
  PROJECT_ENGINE_CONTEXT,
} from "./aiTools/schemaContext";
import {
  AI_TOOL_SUITE,
  AI_TOOL_GROUP_LABELS,
  GEMINI_TOOL_DECLARATIONS,
  getActiveTools,
} from "./aiTools/toolDefinitions";
import { executeAiTool } from "./aiTools/toolRouter";
import {
  createRollbackPoint,
  getLastRollbackPoint,
  getRollbackStack,
  rollbackLastAction,
  toolGenerateProductImage,
  toolUploadBannerImage,
  toolManageProduct,
  toolManageCategories,
  toolBulkPriceUpdate,
  toolSearchProducts,
  toolGetCategories,
  toolUpdateLayoutConfig,
  toolUpdateThemeColors,
  toolCreateDiscountBundle,
  toolSendAbandonedCartRecovery,
} from "./aiTools/coreCatalogTools";
import {
  executeCustomCSS,
  updateRawJsonMetadata,
  manageUsersAndRoles,
  exportReportsAndAnalytics,
  sendPushNotification,
  manageDeliveryZones,
} from "./aiTools/operationalTools";
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
} from "./aiTools/devopsTools";
import type {
  AiToolName,
  AiToolGroup,
  AiToolDefinition,
  ToolExecutionContext,
  ToolExecutionResult,
  RollbackPoint,
  ChatMessage,
  ExecutiveKpiInput,
  ExecutiveSummaryResult,
  AbandonedCartData,
  AbandonedCartDraftResult,
  ProductCopywriterInput,
  ProductCopywriterResult,
  ProductNutritionalInfo,
  GeminiModelChoice,
  GeminiRoleChoice,
  ParsedActionDetail,} from "./aiTools/types";
import type { StoreLayoutConfig, ThemeColorPalette } from "@/types/layout-config";

// Run startup environment diagnostic validation
validateEnvironment();

/* ───────────────────────── Re-exports ───────────────────────── */

export {
  AI_TOOL_SUITE,
  AI_TOOL_GROUP_LABELS,
  GEMINI_TOOL_DECLARATIONS,
  getActiveTools,
  executeAiTool,  createRollbackPoint,
  getLastRollbackPoint,
  getRollbackStack,
  rollbackLastAction,
  toolGenerateProductImage,
  toolUploadBannerImage,
  toolManageProduct,
  toolManageCategories,
  toolBulkPriceUpdate,
  toolSearchProducts,
  toolGetCategories,
  toolUpdateLayoutConfig,
  toolUpdateThemeColors,
  toolCreateDiscountBundle,
  toolSendAbandonedCartRecovery,
  executeCustomCSS,
  updateRawJsonMetadata,
  manageUsersAndRoles,
  exportReportsAndAnalytics,
  sendPushNotification,
  manageDeliveryZones,
  getDirectoryTree,
  getFileContentTool,
  searchCodebase,
  getAppErrors,
  writeNewFile,
  updateFileAST,
  deleteFileTool,
  gitCommitAndPush,
  gitRollbackCommit,
  validateEnvironment,
  getAiEngineStatus,
  isGeminiConfigured,
  isSupabaseConfigured,
};

export type {
  AiToolName,
  AiToolGroup,
  AiToolDefinition,
  ToolExecutionContext,
  ToolExecutionResult,
  RollbackPoint,
  ChatMessage,
  ExecutiveKpiInput,
  ExecutiveSummaryResult,
  AbandonedCartData,
  AbandonedCartDraftResult,
  ProductCopywriterInput,
  ProductCopywriterResult,
  ProductNutritionalInfo,
  GeminiModelChoice,
  GeminiRoleChoice,
  ParsedActionDetail,};

/* ───────────────────────── System Instructions ───────────────────────── */

const ROLE_PROMPTS: Record<GeminiRoleChoice, string> = {
  store_architect:
    "أنت مهندس واجهات ومتجر سوبرماركت الوادي الأخضر (Store Architect). خبير في تحسين تجربة التسوق والتنسيقات المرئية وتخطيط الصفحة الرئيسية والبانرات وإدارة الكود البرمجي وقواعد البيانات.",
  market_researcher:
    "أنت باحث تسويق ومحلل سوق التجزئة والسوبرماركت المصري (Market Researcher). خبير في تسعير السلع الأساسية والمنافسة وتحليل سلوك المستهلك المصري.",
  growth_strategist:
    "أنت خبير نمو واستراتيجيات تجارة إلكترونية (Growth Strategist). تركز على رفع متوسط قيمة السلة AOV، استرداد السلات المتروكة، والحملات والعروض الترويجية.",
  copywriter:
    "أنت كاتب محتوى إبداعي متخصص في السوبرماركت والأغذية الفاخرة (Copywriter). تكتب بأسلوب مصري راقٍ وشهي وجذاب.",
};

const CUSTOMER_SHOPPING_DIRECTIVE = `
أنت مساعد تسوق ذكي لعملاء سوبرماركت الوادي الأخضر. ساعد العميل في تخطيط الوجبات وقوائم المشتريات وفق عدد الأشخاص والميزانية والتفضيلات التي يذكرها.
قبل أي إجابة تتضمن منتجات المتجر أو أسعارها أو توفرها، استدعِ searchProducts واقرأ نتيجة Supabase الفعلية. لا تعتمد على الذاكرة أو معلومات عامة أو ملفات الواجهة كمصدر للكتالوج. إذا فشل اتصال Supabase أو لم تظهر نتيجة قراءة ناجحة، قل إنك لم تستطع التحقق ولا تقترح أسماء أو أسعار منتجات. لا تخترع منتجاً أو سعراً أو توافراً.
خطط الوجبة من المنتجات التي أعادها البحث الناجح فقط. إذا كانت النتائج فارغة، أخبر العميل بذلك واطلب أسماء بديلة أو اقترح إعادة البحث؛ لا تسرد بدائل غير مقروءة من Supabase.
لا تعرض منتجاً على أنه متاح إذا كان مخزونه صفراً أو غير معروف؛ استخدم فقط السجلات التي تُظهر كمية مخزون موجبة.
وازن القائمة داخل الميزانية مع ذكر الكميات التقريبية والتكلفة المحسوبة اعتماداً على نتائج المتجر، واشرح أي بدائل عند عدم توفر عنصر. لا تضف شيئاً إلى السلة ولا تنفذ أي تغيير؛ اعرض الاقتراح ودع العميل يضيف المنتجات بنفسه.
تحدث بالعربية الطبيعية وباختصار، وقدّم الإجابة على هيئة خطة وجبة وقائمة منتجات وإجمالي تقريبي مع توضيح حدود التقدير.
`;

function requiredStoreRead(message: string, customerExperience: boolean): AiToolName | "unsupported" | null {
  const text = message.toLowerCase();
  if (/عميل|عملاء|بيانات المتجر|إعدادات المتجر|اعدادات المتجر|مخزن|مخازن|توصيل|منطقة|مناطق|كوبون|عروض المتجر|store settings|delivery zone|warehouse|customer details/i.test(text)) {
    return "unsupported";
  }
  if (/منتج|منتجات|سلع|جبن|جبنة|لبن|سعر|أسعار|بكام|متوفر|مخزون|كمية|كتالوج|product|price|stock|available/i.test(text) ||
    customerExperience && /فطار|إفطار|غداء|عشاء|وجبة|ميزانية|احتياجات|عايز|عايزة|محتاج|محتاجة|رشح|اقترح|قائمة|اشتري|شراء|breakfast|lunch|dinner|meal|budget|recommend|shopping/i.test(text)) {
    return "searchProducts";
  }
  if (customerExperience && !/^(مرحبا|أهلاً|اهلا|السلام عليكم|شكرا|شكرًا|hi|hello|thanks)[!.؟\s]*$/i.test(text)) {
    return "searchProducts";
  }
  if (/قسم|أقسام|تصنيف|فئة|category|categories/i.test(text)) return "getCategories";
  if (/طلب|طلبات|أوردر|اوردر|مبيعات|إيراد|تقرير|order|sales|revenue/i.test(text)) {
    return "exportReportsAndAnalytics";
  }
  return null;
}

function isReadOnlyStoreRequest(message: string): boolean {
  if (/^(هل|هل يمكن|ممكن|أقدر|اقدر|should i|can i|is it possible)/i.test(message.trim())) return true;
  if (/\b(add|create|update|delete|remove)\b|أضف|اضف|ضيف|إضافة|اضافة|أنشئ|انشئ|إنشاء|انشاء|حدّث|حدث|تعديل|عدّل|عدل|احذف|حذف|امسح/i.test(message)) return false;
  return /\b(show|list|find|search|what|how much|is there|available|price|stock)\b|هل|ما |ماذا|كم|بكام|كام سعر|اعرض|وريني|ابحث|متوفر|عندكم|عندنا|معلومات|تفاصيل|اعرف/i.test(message);
}

function hasSuccessfulSupabaseRead(steps: ExecutedToolStep[], requiredTool: AiToolName | "unsupported"): boolean {
  if (requiredTool === "unsupported") return false;
  return steps.some((step) => {
    if (step.tool === requiredTool && step.isWrite === false) return step.res.ok === true;
    // Catalog mutation tools perform their own fail-closed Supabase preflight
    // to prevent duplicate creation and stale-record edits.
    const resultData = step.res.data as Record<string, unknown> | undefined;
    if (requiredTool === "searchProducts" && step.tool === "manageProduct" && resultData?.catalogPreflight === true) return true;
    if (requiredTool === "getCategories" && step.tool === "manageCategories" && resultData?.categoryPreflight === true) return true;
    return false;
  });
}

const UNVERIFIED_STORE_DATA_REPLY =
  "لم أستطع التحقق من هذه المعلومة بقراءة ناجحة من قاعدة بيانات المتجر، لذلك لن أخمّن. تأكد من اتصال Supabase ثم أعد المحاولة.";

// Production model fallback sequence
const PRODUCTION_FALLBACK_MODELS: GeminiModelChoice[] = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

// Hard cap on sequential tool-calling turns per user message. Prevents runaway
// loops while still allowing realistic chains like:
// READ category -> WRITE create category -> READ product -> WRITE create product.
const MAX_TOOL_STEPS = 6;

/* ───────────────────────── Agentic Loop Internals ───────────────────────── */

interface ExecutedToolStep {
  tool: AiToolName;
  args: Record<string, unknown>;
  res: ToolExecutionResult;
  isWrite: boolean;
}

function isWriteToolName(tool: AiToolName): boolean {
  const def = AI_TOOL_SUITE.find((t) => t.name === tool);
  return Boolean(def?.mutatesState);
}

// Phrases that would claim a mutation happened. If the model produces one of
// these in its own free text but no WRITE tool actually confirmed success in
// this turn, we cannot trust that sentence — this is exactly the defect this
// fix closes (banner said "success" after only a read-only devops tool ran).
const UNVERIFIED_SUCCESS_PATTERNS: RegExp[] = [
  /تم\s+التنفيذ/i,
  /تم\s+الإضاف/i,
  /تم\s+الاضاف/i,
  /تم\s+التعديل/i,
  /تم\s+التحديث/i,
  /تم\s+الحذف/i,
  /تم\s+إنشاء/i,
  /تم\s+انشاء/i,
  /تم\s+بنجاح/i,
  /نجاح\s+العملية/i,
  /successfully (added|created|updated|deleted)/i,
];

function textClaimsUnverifiedSuccess(text: string): boolean {
  if (!text) return false;
  return UNVERIFIED_SUCCESS_PATTERNS.some((re) => re.test(text));
}

/**
 * finalizeResponse — the single source of truth for what the user is told.
 *
 * ROOT-CAUSE FIX: previously the UI success banner was keyed off the raw
 * `executionRes.ok` of whatever the FIRST tool call happened to be — even if
 * that tool was a read-only devops tool the model reached for because no real
 * catalog tools existed. This function instead looks at the *entire* chain of
 * tool calls executed for this turn and only allows a "تم التنفيذ والتحقق
 * بنجاح" style success claim when there is at least one WRITE step AND the
 * most recent WRITE step explicitly returned ok === true (and success !== false).
 */
function finalizeResponse(
  steps: ExecutedToolStep[],
  modelFinalText: string,
): { text: string; toolResult?: ToolExecutionResult } {
  const cleanModelText = (modelFinalText || "").trim();

  if (steps.length === 0) {
    // Pure conversational turn — no tool was ever invoked, nothing to verify.
    return { text: cleanModelText };
  }

  const writeSteps = steps.filter((s) => s.isWrite);
  const lastWrite = writeSteps[writeSteps.length - 1];
  const verifiedWriteSuccess =
    writeSteps.length > 0 && lastWrite.res.ok === true && lastWrite.res.success !== false;
  const anyWriteFailed = writeSteps.some((s) => s.res.ok === false || s.res.success === false);

  // Only trust the model's own free text if it isn't claiming an unverified success.
  const modelTextIsTrustworthy =
    cleanModelText.length > 0 &&
    !(textClaimsUnverifiedSuccess(cleanModelText) && !verifiedWriteSuccess);

  if (verifiedWriteSuccess) {
    const verificationBadge =
      lastWrite.res.verified !== false ? " [تم التحقق من قاعدة البيانات بنجاح ✔️]" : "";
    const text = modelTextIsTrustworthy
      ? cleanModelText
      : `✅ **تم التنفيذ والتحقق بنجاح:**\n${lastWrite.res.messageAr}${verificationBadge}`;
    return { text, toolResult: lastWrite.res };
  }

  if (writeSteps.length > 0 && anyWriteFailed) {
    const failedStep =
      [...writeSteps].reverse().find((s) => s.res.ok === false || s.res.success === false) ||
      lastWrite;
    const text = `⚠️ **تعذر إتمام الإجراء:**\n${failedStep.res.messageAr || failedStep.res.error || "فشل تنفيذ العملية ولم يتم تأكيد أي تعديل في قاعدة البيانات."}`;
    return { text, toolResult: failedStep.res };
  }

  // Only READ tools ran (searchProducts, getCategories, searchCodebase, ...).
  // Never surface mutation-success language here.
  const lastRead = steps[steps.length - 1];
  const text = modelTextIsTrustworthy
    ? cleanModelText
    : `ℹ️ ${lastRead.res.messageAr || "تم الاطلاع على البيانات المطلوبة."}`;
  return { text, toolResult: lastRead.res };
}

/* ───────────────────────── runAdminCoPilotChat ───────────────────────── */

export interface RunChatOptions {
  model?: GeminiModelChoice;
  selectedModel?: GeminiModelChoice;
  role?: GeminiRoleChoice;
  selectedRole?: GeminiRoleChoice;
  page?: string;
  userRole?: string;
  enableSearchGrounding?: boolean;
  useGrounding?: boolean;
  attachedFile?: { path: string; name: string };
  currentLayout?: StoreLayoutConfig;
  kpis?: ExecutiveKpiInput;
  refresh?: () => void;
  ctx?: ToolExecutionContext;
}

export interface RunChatObjectParams extends RunChatOptions {
  message: string;
  history?: ChatMessage[];
}

export async function runAdminCoPilotChat(
  messageOrParams: string | RunChatObjectParams,
  maybeHistory?: ChatMessage[],
  maybeOptions?: RunChatOptions,
): Promise<{
  text: string;
  groundingSources?: Array<{ title?: string; uri?: string }>;
  modelUsed: string;
  roleUsed: GeminiRoleChoice;
  executedActions?: ParsedActionDetail[];
  action?: {
    label: string;
    command: string;
    type: "apply_layout" | "export_report" | "open_tab";
  };
  toolResult?: ToolExecutionResult;
  toolResults?: ToolExecutionResult[];
}> {
  let message: string;
  let history: ChatMessage[];
  let selectedModel: GeminiModelChoice;
  let selectedRole: GeminiRoleChoice;
  let useGrounding: boolean;
  let attachedFile: { path: string; name: string } | undefined;
  let ctx: ToolExecutionContext | undefined;
  let page = "global";
  let userRole = "customer";

  if (typeof messageOrParams === "string") {
    message = messageOrParams;
    history = maybeHistory || [];
    const opts = maybeOptions || {};
    selectedModel = opts.selectedModel || opts.model || "gemini-2.5-flash";
    selectedRole = opts.selectedRole || opts.role || "store_architect";
    useGrounding = Boolean(opts.useGrounding || opts.enableSearchGrounding);
    attachedFile = opts.attachedFile;
    ctx = opts.ctx;
    page = opts.page || page;
    userRole = opts.userRole || userRole;
  } else {
    message = messageOrParams.message;
    history = messageOrParams.history || [];
    selectedModel = messageOrParams.selectedModel || messageOrParams.model || "gemini-2.5-flash";
    selectedRole = messageOrParams.selectedRole || messageOrParams.role || "store_architect";
    useGrounding = Boolean(messageOrParams.useGrounding || messageOrParams.enableSearchGrounding);
    attachedFile = messageOrParams.attachedFile;
    ctx = messageOrParams.ctx;
    page = messageOrParams.page || page;
    userRole = messageOrParams.userRole || userRole;
  }

  const customerExperience = page === "assistant" && userRole === "customer";

  // Keep the Gemini credential on the server. The same authenticated gateway
  // is used by the customer and admin assistants.
  const ai = {
    models: {
      generateContent: (request: { model: string; contents: unknown; config?: Record<string, unknown> }) =>
        generateGeminiContent({ data: { purpose: "chat", ...request } }),
    },
  };

  if (ai) {
    // Model fallback sequence
    const modelsToTry: string[] = [selectedModel];
    for (const fallback of PRODUCTION_FALLBACK_MODELS) {
      if (!modelsToTry.includes(fallback)) {
        modelsToTry.push(fallback);
      }
    }

    let lastError: any = null;
    let missingServerGeminiKey = false;

    for (const currentModel of modelsToTry) {
      try {
        const systemInstruction = customerExperience ? CUSTOMER_SHOPPING_DIRECTIVE : `
${AUTONOMOUS_ADMIN_COPILOT_DIRECTIVE}
${ROLE_PROMPTS[selectedRole]}
${SUPABASE_SCHEMA_CONTEXT_INSTRUCTION}
${PROJECT_ENGINE_CONTEXT}

=== AVAILABLE 27-TOOL SUITE ===
You have access to 27 operational functions covering media, catalog (including the
read-only searchProducts and getCategories lookups), UI layout, themes, marketing,
rollback, custom CSS, JSON metadata, user roles & RBAC, analytics export, push
notifications, delivery zones, directory scanning, source viewing, code search,
diagnostics logs, file AST mutations, and git commits.

When the user gives a direct command or request that matches any tool, you MUST
invoke the corresponding function tool immediately. You may call multiple tools
in sequence — for example a READ lookup (searchProducts / getCategories) followed
by a WRITE mutation (manageProduct / manageCategories) — before giving your final
answer. Only claim an action was completed after the matching WRITE tool has
actually returned a confirmed success result back to you.
`;

        const contents: any[] = history.slice(-6).map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        }));

        let currentPrompt = message;
        if (attachedFile) {
          currentPrompt += `\n[الملف المرفق: ${attachedFile.path}]`;
        }

        contents.push({
          role: "user",
          parts: [{ text: currentPrompt }],
        });

        // Execute Gemini call with dynamic tool routing
        const activeTools = getActiveTools({ page, userRole });

        const config: any = {
          systemInstruction,
          temperature: 0.4,
          tools: [{ functionDeclarations: activeTools }],
          toolConfig: {
            includeServerSideToolInvocations: true,
            include_server_side_tool_invocations: true,
            functionCallingConfig: {
              mode: "AUTO",
            },
          },
        };

        if (useGrounding && !requiredStoreRead(message, customerExperience)) {
          config.tools.push({ googleSearch: {} });
        }

        // ── Agentic Loop ──────────────────────────────────────────────
        // Each iteration: call the model, and if it responds with one or
        // more functionCalls, execute them for real and feed the results
        // back as a functionResponse turn so the model can decide whether
        // to chain another tool call or give its final answer. This is
        // the fix for the single-pass defect: previously the very first
        // tool result was returned to the user without ever going back
        // to the model, so a pre-check READ call could never be followed
        // by the WRITE call it was meant to gate.
        const steps: ExecutedToolStep[] = [];
        const loopContents = [...contents];
        let finalModelText = "";
        const groundingSources: Array<{ title?: string; uri?: string }> = [];

        for (let stepIdx = 0; stepIdx < MAX_TOOL_STEPS; stepIdx++) {
          const response = await ai.models.generateContent({
            model: currentModel,
            contents: loopContents,
            config,
          });

          const candidate = response.candidates?.[0];
          const parts: any[] = candidate?.content?.parts || [];
          const functionCallParts = parts.filter((p: any) => p.functionCall && p.functionCall.name);

          if (functionCallParts.length === 0) {
            // Model gave its final natural-language answer — stop looping.
            finalModelText = (
              response.text ||
              parts.map((p: any) => p.text || "").join("")
            ).trim();

            const metadata = candidate?.groundingMetadata;
            if (metadata?.groundingChunks) {
              metadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web?.uri) {
                  groundingSources.push({
                    title: chunk.web.title || chunk.web.uri,
                    uri: chunk.web.uri,
                  });
                }
              });
            }
            break;
          }

          // Record the model's turn (its tool-call request) in the running transcript.
          loopContents.push({ role: "model", parts });

          // Execute every requested tool call this turn (usually one, but
          // some models may batch several independent calls together).
          const functionResponseParts: any[] = [];

          for (const fcPart of functionCallParts) {
            const fc = fcPart.functionCall;
            const toolName = fc.name as AiToolName;
            const toolArgs = (fc.args || {}) as Record<string, unknown>;
            const isWrite = isWriteToolName(toolName);

            const requiredRead = requiredStoreRead(message, customerExperience);
            if (isWrite && (requiredRead === "unsupported" || requiredRead && isReadOnlyStoreRequest(message))) {
              const rejected: ToolExecutionResult = {
                tool: toolName,
                ok: false,
                success: false,
                messageAr: "هذا الطلب استعلام عن بيانات؛ لم أنفذ أي تعديل. أحتاج إلى قراءة Supabase المناسبة أولاً.",
              };
              steps.push({ tool: toolName, args: toolArgs, res: rejected, isWrite: true });
              functionResponseParts.push({
                functionResponse: {
                  name: toolName,
                  response: { ok: false, success: false, messageAr: rejected.messageAr, data: null, error: null, verified: false },
                },
              });
              continue;
            }

            console.info(
              `[AI Engine] ⚡ Step ${stepIdx + 1}/${MAX_TOOL_STEPS}: invoking ${isWrite ? "WRITE" : "READ"} tool "${toolName}"`,
              toolArgs,
            );

            const execRes = await executeAiTool(toolName, toolArgs, ctx);
            steps.push({ tool: toolName, args: toolArgs, res: execRes, isWrite });

            functionResponseParts.push({
              functionResponse: {
                name: toolName,
                response: {
                  ok: execRes.ok,
                  success: execRes.success ?? execRes.ok,
                  messageAr: execRes.messageAr,
                  data: execRes.data ?? null,
                  error: execRes.error ?? null,
                  verified: execRes.verified ?? null,
                },
              },
            });
          }

          // Gemini's contents API accepts function responses as a user turn;
          // the legacy "function" role is rejected by the current SDK/API.
          loopContents.push({ role: "user", parts: functionResponseParts });

          if (stepIdx === MAX_TOOL_STEPS - 1) {
            // Loop budget exhausted without a conclusive natural-language
            // answer from the model. finalizeResponse() will still build a
            // truthful message purely from the executed steps below.
            finalModelText = "";
          }
        }

        const requiredRead = requiredStoreRead(message, customerExperience);
        if (requiredRead && !hasSuccessfulSupabaseRead(steps, requiredRead)) {
          return {
            text: UNVERIFIED_STORE_DATA_REPLY,
            modelUsed: currentModel,
            roleUsed: selectedRole,
            toolResults: steps.length > 0 ? steps.map((s) => s.res) : undefined,
          };
        }

        if (requiredRead === "searchProducts") {
          const verifiedMatches = steps.flatMap((step) => {
            if (step.tool !== "searchProducts" || step.res.ok !== true) return [];
            const data = step.res.data as { results?: unknown[] } | undefined;
            return data?.results ?? [];
          });
          const availableMatches = verifiedMatches.filter((product: any) => Number(product.stock) > 0);
          const verifiedCatalogPreflight = steps.some((step) =>
            step.tool === "manageProduct" &&
            (step.res.data as Record<string, unknown> | undefined)?.catalogPreflight === true,
          );
          if (customerExperience && verifiedMatches.length > 0 && availableMatches.length === 0) {
            return {
              text: "تحققت من نتائج البحث في Supabase، لكن المنتجات المطابقة لا يظهر لها مخزون موجب حالياً، لذلك لن أوصي بإضافتها إلى قائمتك.",
              modelUsed: currentModel,
              roleUsed: selectedRole,
              toolResults: steps.map((s) => s.res),
            };
          }
          if (!verifiedMatches.length && !verifiedCatalogPreflight) {
            return {
              text: "قرأت الكتالوج الحالي من Supabase ولم أجد منتجاً مطابقاً لهذا البحث، لذلك لن أقترح منتجاً أو سعراً من الذاكرة.",
              modelUsed: currentModel,
              roleUsed: selectedRole,
              toolResults: steps.map((s) => s.res),
            };
          }
        }

        const finalized = finalizeResponse(steps, finalModelText);

        return {
          text: finalized.text,
          groundingSources: groundingSources.length > 0 ? groundingSources : undefined,
          modelUsed: currentModel,
          roleUsed: selectedRole,
          toolResult: finalized.toolResult ?? steps[steps.length - 1]?.res,
          toolResults: steps.length > 0 ? steps.map((s) => s.res) : undefined,
        };
      } catch (err: any) {
        lastError = err;
        const errorMessage = String(err?.message || err || "");
        missingServerGeminiKey = /GEMINI_API_KEY is not configured/i.test(errorMessage);
        const diagnostics = diagnoseGeminiError(err);
        console.warn(`[AI Engine] Model ${currentModel} returned an issue (${diagnostics.code}). Trying fallback...`);

        // If it's a 401 Auth error, trying other models won't help; break to local fallback
        if (diagnostics.isAuthError || missingServerGeminiKey) {
          break;
        }
      }
    }

    if (missingServerGeminiKey) {
      return {
        text: "مفتاح Gemini غير مضبوط في أسرار خادم التطبيق باسم GEMINI_API_KEY. أضفه إلى بيئة الخادم ثم أعد نشر التطبيق.",
        modelUsed: "gemini-server-key-missing",
        roleUsed: selectedRole,
      };
    }

    if (lastError) {
      const diagnostics = diagnoseGeminiError(lastError);
      console.warn("[AI Engine] Live Gemini attempts exhausted; no tool was executed without a model decision.", diagnostics.code);
      return {
        text: `تعذر إكمال الطلب عبر Gemini (${diagnostics.code}). لم أنفذ أي أداة احتياطيًا أو أخمّن معاملات الطلب. أصلح اتصال Gemini ثم أعد المحاولة.`,
        modelUsed: "gemini-request-failed",
        roleUsed: selectedRole,
      };
    }
  }

  return {
    text: "لم يصل رد من Gemini ولم يتم تنفيذ أي أداة. أعد المحاولة بعد التأكد من إعداد الاتصال بالخادم.",
    modelUsed: "gemini-unavailable",
    roleUsed: selectedRole,
  };
}

/* ───────────────────────── AUTOMATED INTEGRATION SELF-TEST FUNCTION ───────────────────────── */

export interface CopilotSelfTestResult {
  success: boolean;
  step: "env_check" | "database_read" | "gemini_request" | "completed";
  message: string;
  details?: Record<string, unknown>;
  latencyMs?: number;
}

/**
 * Performs read-only checks against the live catalog and authenticated
 * server-side Gemini gateway. It does not mutate data or certify every tool.
 */
export async function verifyCopilotExecution(): Promise<CopilotSelfTestResult> {
  const startTime = Date.now();
  console.info("[AI Engine Self-Test] 🔍 Checking Supabase and server-side Gemini connectivity...");

  // Check app configuration and real catalog read access; do not mutate data.
  const env = validateEnvironment();

  try {
    if (!env.supabaseReady) {
      return {
        success: false,
        step: "env_check",
        message: "إعدادات Supabase غير مكتملة؛ لم يتم إجراء أي تعديل.",
        details: { supabaseConfigured: false, geminiConfigured: env.geminiReady },
        latencyMs: Date.now() - startTime,
      };
    }

    const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] = await Promise.all([
      supabase.from("products").select("id").eq("is_active", true).limit(1),
      supabase.from("categories").select("id").limit(1),
    ]);
    if (productsError || categoriesError) {
      return {
        success: false,
        step: "database_read",
        message: "فشل اختبار القراءة من جداول المنتجات أو الأقسام في Supabase.",
        details: { productsError: productsError?.message, categoriesError: categoriesError?.message, geminiConfigured: env.geminiReady },
        latencyMs: Date.now() - startTime,
      };
    }

    try {
      await generateGeminiContent({
        data: {
          purpose: "chat",
          model: "gemini-2.5-flash",
          contents: "Reply with OK only.",
          config: {
            systemInstruction: "Connectivity check. Reply with OK. Do not call any function.",
            maxOutputTokens: 8,
            tools: [{
              functionDeclarations: AI_TOOL_SUITE
                .filter((tool) => tool.name === "searchProducts" || tool.name === "getCategories")
                .map((tool) => tool.declaration),
            }],
            toolConfig: {
              functionCallingConfig: { mode: "NONE" },
            },
          },
        },
      });
    } catch (geminiError) {
      const diagnosis = diagnoseGeminiError(geminiError);
      return {
        success: false,
        step: "gemini_request",
        message: diagnosis.messageAr,
        details: {
          supabaseConfigured: true,
          productsReadable: true,
          categoriesReadable: true,
          geminiConnected: false,
          geminiErrorCode: diagnosis.code,
        },
        latencyMs: Date.now() - startTime,
      };
    }

    const latency = Date.now() - startTime;
    console.info(`[AI Engine Self-Test] ✅ Supabase and Gemini connectivity passed in ${latency}ms.`);

    return {
      success: true,
      step: "completed",
      message: `نجح الاتصال بـ Gemini وقراءة جداول المنتجات والأقسام من Supabase. هذا الفحص لا ينفذ تغييرات ولا يختبر كل أداة كتابة (${latency}ms).`,
      details: {
        environmentMode: env.mode,
        geminiConfigured: true,
        geminiConnected: true,
        supabaseConfigured: env.supabaseReady,
        productsReadable: true,
        categoriesReadable: true,
        productRowsReturned: products?.length ?? 0,
        categoryRowsReturned: categories?.length ?? 0,
        latencyMs: latency,
      },
      latencyMs: latency,
    };
  } catch (err: any) {
    console.error("[AI Engine Self-Test] ❌ Unhandled error during self-verification:", err);
    return {
      success: false,
      step: "database_read",
      message: `حدث خطأ أثناء اختبار اتصال قراءة Supabase: ${err.message || String(err)}`,
      details: { error: String(err) },
      latencyMs: Date.now() - startTime,
    };
  }
}

/* ───────────────────────── generateExecutiveSummary ───────────────────────── */

export async function generateExecutiveSummary(
  _kpis: ExecutiveKpiInput,
): Promise<ExecutiveSummaryResult> {
  if (!isSupabaseConfigured()) throw new Error("تعذر إنشاء التقرير لأن اتصال Supabase غير مهيأ.");

  const readAll = async <T,>(readPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>) => {
    const rows: T[] = [];
    const pageSize = 500;
    for (let from = 0; from < 50_000; from += pageSize) {
      const { data, error } = await readPage(from, from + pageSize - 1);
      if (error) throw error;
      const page = data ?? [];
      rows.push(...page);
      if (page.length < pageSize) return rows;
    }
    throw new Error("تجاوزت قراءة التقرير الحد الآمن؛ لم أعرض أرقاماً جزئية.");
  };

  const [orders, products] = await Promise.all([
    readAll((from, to) => supabaseLoose.from("orders").select("id,total_amount,status,created_at").range(from, to)),
    readAll((from, to) => supabaseLoose.from("products").select("id,name,name_ar,stock,is_active").eq("is_active", true).range(from, to)),
  ]);
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentOrders = orders.filter((order: any) => order.status !== "cancelled" && new Date(order.created_at).getTime() >= since);
  const totalRevenue = recentOrders.reduce((sum: number, order: any) => sum + (Number(order.total_amount) || 0), 0);
  const averageOrderValue = recentOrders.length ? totalRevenue / recentOrders.length : 0;
  const lowStockProducts = products.filter((product: any) => Number(product.stock ?? 0) > 0 && Number(product.stock) <= 10);
  const outOfStockProducts = products.filter((product: any) => Number(product.stock ?? 0) <= 0);
  const health = Math.max(40, Math.min(100, 70 + Math.min(recentOrders.length, 25) - (lowStockProducts.length ? 5 : 0) - outOfStockProducts.length));

  return {
    headline: `آخر 30 يوماً في Supabase: ${recentOrders.length} طلب، بإيراد ${totalRevenue.toFixed(2)} ج.م`,
    overallHealthScore: health,
    insights: [
      `متوسط قيمة الطلب في البيانات المقروءة: ${averageOrderValue.toFixed(2)} ج.م.`,
      `قرأت ${products.length} منتجاً نشطاً من Supabase؛ منها ${lowStockProducts.length} منخفض المخزون و${outOfStockProducts.length} نافد.`,
      recentOrders.length ? "الأرقام محسوبة من سجلات الطلبات غير الملغاة خلال آخر 30 يوماً." : "لم تُرجع Supabase طلبات غير ملغاة خلال آخر 30 يوماً.",
    ],
    actionableTips: [
      {
        title: lowStockProducts.length || outOfStockProducts.length ? "مراجعة المنتجات منخفضة المخزون" : "متابعة المخزون المسجل",
        description: `قراءة Supabase الحالية تُظهر ${lowStockProducts.length} منتجاً منخفض المخزون و${outOfStockProducts.length} منتجاً نافداً.`,
        impact: lowStockProducts.length || outOfStockProducts.length ? "Urgent" : "Medium",
        category: "Inventory",
        quickActionLabel: "إدارة المنتجات",
        quickActionCommand: "افتح لوحة المنتجات لمراجعة المخزون المسجل",
      },
      {
        title: "مراجعة أداء الطلبات",
        description: `تعرض القراءة ${recentOrders.length} طلباً غير ملغى خلال آخر 30 يوماً، بإيراد مسجل قدره ${totalRevenue.toFixed(2)} ج.م.`,
        impact: "Medium",
        category: "Operations",
        quickActionLabel: "عرض الطلبات",
        quickActionCommand: "افتح لوحة الطلبات لمراجعة السجلات",
      },
    ],
  };
}
/* ───────────────────────── generateAbandonedCartRecovery ───────────────────────── */

export async function generateAbandonedCartRecovery(
  cart: AbandonedCartData,
): Promise<AbandonedCartDraftResult> {
  if (!isSupabaseConfigured()) throw new Error("تعذر التحقق من السلة لأن Supabase غير متصل.");
  const userId = cart.id.startsWith("cart-") ? cart.id.slice("cart-".length) : "";
  if (!userId) throw new Error("معرّف السلة لا يشير إلى مستخدم موثق في Supabase.");
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: cartRows, error: cartError } = await supabaseLoose
    .from("cart_items")
    .select("id,user_id,product_id,quantity,created_at")
    .eq("user_id", userId)
    .lt("created_at", cutoff);
  if (cartError) throw new Error(`تعذر إعادة قراءة السلة من Supabase: ${cartError.message}`);
  if (!cartRows?.length) throw new Error("لم تعد هناك سلة متروكة مطابقة في Supabase.");

  const productIds = [...new Set(cartRows.map((row: any) => row.product_id).filter(Boolean))];
  const lastActivity = Math.max(...cartRows.map((row: any) => new Date(row.created_at ?? 0).getTime()));
  const [profileResult, productsResult, ordersResult] = await Promise.all([
    supabaseLoose.from("profiles").select("id,full_name,phone").eq("id", userId).maybeSingle(),
    supabaseLoose.from("products").select("id,name,name_ar,price,is_active").in("id", productIds).eq("is_active", true),
    supabaseLoose.from("orders").select("id").eq("user_id", userId).gte("created_at", new Date(lastActivity).toISOString()).limit(1),
  ]);
  if (profileResult.error) throw new Error(`تعذر قراءة ملف العميل من Supabase: ${profileResult.error.message}`);
  if (productsResult.error) throw new Error(`تعذر قراءة منتجات السلة من Supabase: ${productsResult.error.message}`);
  if (ordersResult.error) throw new Error(`تعذر التحقق من الطلبات الحديثة في Supabase: ${ordersResult.error.message}`);
  if (ordersResult.data?.length) throw new Error("أُنشئ طلب بعد آخر نشاط للسلة؛ لم أجهز رسالة استرداد.");
  if (!profileResult.data?.phone) throw new Error("لا يوجد رقم هاتف موثق لهذا العميل في Supabase.");

  const productMap = new Map((productsResult.data ?? []).map((product: any) => [product.id, product]));
  if (cartRows.some((row: any) => !row.product_id || !productMap.has(row.product_id))) {
    throw new Error("بعض منتجات السلة لم تعد نشطة أو لم يمكن التحقق منها في Supabase.");
  }
  const items = cartRows.map((row: any) => {
    const product = productMap.get(row.product_id)!;
    return { name: product.name_ar || product.name, lineTotal: Number(product.price || 0) * Number(row.quantity || 0) };
  });
  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const name = profileResult.data.full_name || "عميل المتجر";
  let verifiedCoupon: { code: string; discount_type: string; discount_value: number } | null = null;
  const requestedCode = cart.couponSuggested?.trim().toUpperCase();
  if (requestedCode) {
    const { data: couponRow, error } = await supabaseLoose
      .from("coupons")
      .select("code,discount_type,discount_value,expires_at,is_active,first_order_only,max_uses,uses_count,min_order_amount")
      .eq("code", requestedCode)
      .maybeSingle();
    if (error) throw new Error(`تعذر التحقق من كوبون الخصم في Supabase: ${error.message}`);
    const isLive = couponRow?.is_active && (!couponRow.expires_at || new Date(couponRow.expires_at).getTime() > Date.now());
    const underUseLimit = couponRow?.max_uses == null || Number(couponRow.uses_count) < Number(couponRow.max_uses);
    const meetsMinimum = couponRow?.min_order_amount == null || total >= Number(couponRow.min_order_amount);
    let firstOrderEligible = true;
    if (couponRow?.first_order_only && userId) {
      const { data: previousOrders, error: ordersError } = await supabaseLoose.from("orders").select("id").eq("user_id", userId).limit(1);
      if (ordersError) throw new Error(`تعذر التحقق من أهلية الكوبون في Supabase: ${ordersError.message}`);
      firstOrderEligible = !previousOrders?.length;
    } else if (couponRow?.first_order_only) {
      firstOrderEligible = false;
    }
    if (couponRow && isLive && underUseLimit && meetsMinimum && firstOrderEligible) verifiedCoupon = couponRow;
  }

  const couponLine = verifiedCoupon
    ? `كود خصم متاح حسب بيانات المتجر: *${verifiedCoupon.code}* (${verifiedCoupon.discount_type === "percentage" ? `خصم ${verifiedCoupon.discount_value}%` : `خصم ${verifiedCoupon.discount_value} ج.م`}).`
    : "";
  const cartSummary = `سلتك تحتوي على (${items.slice(0, 2).map((item) => item.name).join("، ")}) بقيمة ${total.toFixed(2)} ج.م.`;
  const message = `أهلاً بك يا ${name} 👋 من سوبرماركت الوادي الأخضر 🌿

${cartSummary}

${couponLine}

راجع سلتك وأكمل طلبك من صفحة المتجر: ${typeof window !== "undefined" ? `${window.location.origin}/cart` : "صفحة السلة"}`;

  const cleanPhone = profileResult.data.phone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("0") ? "2" + cleanPhone : cleanPhone;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  return {
    messageText: message,
    whatsappUrl,
    suggestedDiscountCode: verifiedCoupon?.code || "",
    strategy: verifiedCoupon ? "مسودة تتضمن كوبوناً تم التحقق من صلاحيته من Supabase" : "تذكير محايد بلا خصم أو موعد تسليم غير مؤكد",
  };
}

/* ───────────────────────── generateProductCopywriting ───────────────────────── */

export async function generateProductCopywriting(
  input: ProductCopywriterInput,
): Promise<ProductCopywriterResult> {
  if (!isSupabaseConfigured()) throw new Error("تعذر التحقق من المنتج لأن Supabase غير متصل.");
  const normalize = (value: unknown) => String(value || "").trim().normalize("NFKC").toLocaleLowerCase("ar");
  let product: any = null;
  if (input.productId) {
    const { data, error } = await supabaseLoose
      .from("products")
      .select("*")
      .eq("id", input.productId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(`تعذر قراءة المنتج من Supabase: ${error.message}`);
    product = data;
  } else {
    const { data: products, error } = await supabaseLoose
      .from("products")
      .select("*")
      .eq("is_active", true)
      .limit(500);
    if (error) throw new Error(`تعذر قراءة المنتج من Supabase: ${error.message}`);
    product = (products || []).find((row: any) => normalize(row.name) === normalize(input.productName) || normalize(row.name_ar) === normalize(input.productName));
  }
  if (!product) throw new Error("المنتج غير موجود أو غير نشط في Supabase؛ لم أُنشئ وصفاً أو خصائص غير موثقة.");

  const title = input.productName.trim() || String(product.name_ar || product.name || "");
  const description = String(product.description_ar || product.description || "");
  const storedNutrition = (product.nutritional_info || product.nutritionalInfo || {}) as Record<string, unknown>;
  const storedCharacteristics = product.characteristics;
  return {
    enhancedTitle: title,
    shortDescription: String(product.short_description || description),
    seoDescription: description,
    tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
    cookingTip: String(product.cooking_tip || product.cookingTip || ""),
    characteristics: Array.isArray(storedCharacteristics) ? storedCharacteristics.map(String) : [],
    storageInstructions: String(product.storage_instructions || product.storageInstructions || ""),
    originSource: String(product.origin_source || product.originSource || ""),
    nutritionalInfo: {
      calories: String(storedNutrition.calories || ""),
      protein: String(storedNutrition.protein || ""),
      carbs: String(storedNutrition.carbs || ""),
      fiber: String(storedNutrition.fiber || ""),
      fats: String(storedNutrition.fats || ""),
    },
    keySellingPoints: [],
  };
}
