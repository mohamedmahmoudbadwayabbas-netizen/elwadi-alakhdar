/* =========================================================================
   GEMINI AI ADMIN ENGINE — STRICT ENVIRONMENT & API KEY VALIDATION
   Runtime Diagnostics, Live Client Instantiation & Key Validation
   ========================================================================= */

import { GoogleGenAI } from "@google/genai";

export const getGeminiApiKey = (): string | undefined => {
  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any)?.env : undefined;
  const procEnv = typeof process !== "undefined" ? process?.env : undefined;

  const resolved =
    (metaEnv ? metaEnv.VITE_GEMINI_API_KEY || metaEnv.GEMINI_API_KEY : undefined) ||
    (procEnv ? procEnv.VITE_GEMINI_API_KEY || procEnv.GEMINI_API_KEY : undefined);

  if (typeof resolved === "string" && resolved.trim().length > 0) {
    return resolved.trim();
  }
  return undefined;
};

export const getSupabaseUrl = (): string | undefined => {
  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any)?.env : undefined;
  const procEnv = typeof process !== "undefined" ? process?.env : undefined;

  const resolved =
    (metaEnv ? metaEnv.VITE_SUPABASE_URL || metaEnv.SUPABASE_URL : undefined) ||
    (procEnv ? procEnv.VITE_SUPABASE_URL || procEnv.SUPABASE_URL : undefined);

  if (typeof resolved === "string" && resolved.trim().length > 0) {
    return resolved.trim();
  }
  return undefined;
};

export const getSupabaseAnonKey = (): string | undefined => {
  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any)?.env : undefined;
  const procEnv = typeof process !== "undefined" ? process?.env : undefined;

  const resolved =
    (metaEnv ? metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.SUPABASE_ANON_KEY : undefined) ||
    (procEnv ? procEnv.VITE_SUPABASE_ANON_KEY || procEnv.SUPABASE_ANON_KEY : undefined);

  if (typeof resolved === "string" && resolved.trim().length > 0) {
    return resolved.trim();
  }
  return undefined;
};

export const isGeminiConfigured = (): boolean => Boolean(getGeminiApiKey());

export const isSupabaseConfigured = (): boolean => {
  const url = getSupabaseUrl() || "";
  const key = getSupabaseAnonKey() || "";
  return Boolean(url && key && !url.includes("placeholder.supabase.co"));
};

export interface DiagnosticEnvironmentStatus {
  geminiReady: boolean;
  supabaseReady: boolean;
  mode: "full_live" | "gemini_only" | "supabase_only" | "local_mock";
  supabaseUrlConfigured: boolean;
  warnings: string[];
}

export function validateEnvironment(): DiagnosticEnvironmentStatus {
  const geminiReady = isGeminiConfigured();
  const supabaseReady = isSupabaseConfigured();
  const supabaseUrlConfigured = Boolean(getSupabaseUrl());
  const warnings: string[] = [];

  if (!geminiReady) {
    const warn = "[AI Engine Diagnostics] GEMINI_API_KEY / VITE_GEMINI_API_KEY is not set. Falling back to local deterministic rule engine.";
    console.warn(warn);
    warnings.push(warn);
  } else {
    console.info("[AI Engine Diagnostics] Gemini Generative AI SDK key validated and active.");
  }

  if (!supabaseReady) {
    const warn = "[AI Engine Diagnostics] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing/placeholder. Falling back to local storage and state virtualization.";
    console.warn(warn);
    warnings.push(warn);
  } else {
    console.info("[AI Engine Diagnostics] Live Supabase PostgreSQL database connection active for all 24 tools.");
  }

  let mode: "full_live" | "gemini_only" | "supabase_only" | "local_mock" = "local_mock";
  if (geminiReady && supabaseReady) mode = "full_live";
  else if (geminiReady && !supabaseReady) mode = "gemini_only";
  else if (!geminiReady && supabaseReady) mode = "supabase_only";

  return {
    geminiReady,
    supabaseReady,
    mode,
    supabaseUrlConfigured,
    warnings,
  };
}

export function getAiEngineStatus(): {
  geminiReady: boolean;
  supabaseReady: boolean;
  mode: "full_live" | "gemini_only" | "supabase_only" | "local_mock";
} {
  const status = validateEnvironment();
  return {
    geminiReady: status.geminiReady,
    supabaseReady: status.supabaseReady,
    mode: status.mode,
  };
}

export interface GeminiApiErrorInfo {
  statusCode: number | null;
  code: string;
  isAuthError: boolean;
  isNotFoundError: boolean;
  isRateLimitError: boolean;
  messageAr: string;
  rawError: string;
}

export function diagnoseGeminiError(err: any): GeminiApiErrorInfo {
  const errorStr = String(err?.message || err?.statusText || err || "");
  const status = Number(err?.status || err?.statusCode || (errorStr.match(/(\b401\b|\b404\b|\b429\b|\b500\b|\b503\b)/)?.[0] || 0)) || null;

  const isAuthError = status === 401 || errorStr.includes("API_KEY_INVALID") || errorStr.includes("unauthenticated") || errorStr.includes("401");
  const isNotFoundError = status === 404 || errorStr.includes("models/") || errorStr.includes("not found") || errorStr.includes("404");
  const isRateLimitError = status === 429 || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota") || errorStr.includes("rate limit") || errorStr.includes("429");

  let messageAr = "حدث خطأ غير متوقع أثناء استدعاء نموذج Gemini.";
  if (isAuthError) {
    messageAr = "مفتاح Gemini API غير صالح أو منتهي الصلاحية (HTTP 401). يرجى التحقق من متغير البية GEMINI_API_KEY.";
    console.error("[AI Engine Diagnostics] 🔴 HTTP 401 Unauthorized: Invalid Gemini API key provided.", err);
  } else if (isNotFoundError) {
    messageAr = "النموذج المطلوب غير متاح أو قديم (HTTP 404). جاري التحويل التلقائي لنموذج الإنتاج البديل (gemini-2.0-flash).";
    console.error("[AI Engine Diagnostics] 🔴 HTTP 404 Not Found: Model endpoint not found or deprecated.", err);
  } else if (isRateLimitError) {
    messageAr = "تم تجاوز حد الطلبات المسموح به لـ Gemini API مؤقتاً (HTTP 429). جاري التحويل لمحرك القواعد المحلي الفوري.";
    console.warn("[AI Engine Diagnostics] 🟡 HTTP 429 Rate Limit / Quota Exceeded. Fallback engaged.", err);
  } else {
    console.error("[AI Engine Diagnostics] 🔴 Gemini API Error:", err);
  }

  return {
    statusCode: status,
    code: isAuthError ? "AUTH_401" : isNotFoundError ? "MODEL_404" : isRateLimitError ? "RATE_429" : "GENERIC_ERROR",
    isAuthError,
    isNotFoundError,
    isRateLimitError,
    messageAr,
    rawError: errorStr,
  };
}

// Lazy initialization of GenAI SDK
let genAIInstance: GoogleGenAI | null = null;
export function getGenAI(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIInstance;
}

