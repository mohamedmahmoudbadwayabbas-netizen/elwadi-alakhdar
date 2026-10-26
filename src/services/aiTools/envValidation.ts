/* =========================================================================
   GEMINI AI ADMIN ENGINE — STRICT ENVIRONMENT & API KEY VALIDATION
   Runtime Diagnostics, Live Client Instantiation & Key Validation
   ========================================================================= */

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
    (metaEnv
      ? metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
        metaEnv.VITE_SUPABASE_ANON_KEY ||
        metaEnv.SUPABASE_PUBLISHABLE_KEY ||
        metaEnv.SUPABASE_ANON_KEY
      : undefined) ||
    (procEnv
      ? procEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
        procEnv.VITE_SUPABASE_ANON_KEY ||
        procEnv.SUPABASE_PUBLISHABLE_KEY ||
        procEnv.SUPABASE_ANON_KEY
      : undefined);

  if (typeof resolved === "string" && resolved.trim().length > 0) {
    return resolved.trim();
  }
  return undefined;
};

// Gemini credentials are intentionally unavailable in browser code. This
// synchronous diagnostic therefore reports no client-side key; actual server
// configuration is checked by the server function for each request.
export const isGeminiConfigured = (): boolean => false;

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
    const warn =
      "[AI Engine Diagnostics] No Gemini key is exposed to the browser. Server-side GEMINI_API_KEY availability is checked per request.";
    console.info(warn);
    warnings.push(warn);
  }

  if (!supabaseReady) {
    const warn =
      "[AI Engine Diagnostics] Supabase configuration is missing or a placeholder. Store-data reads and database mutations fail closed; no mock catalog is used.";
    console.warn(warn);
    warnings.push(warn);
  } else {
    console.info(
      "[AI Engine Diagnostics] Supabase configuration is present; each database-backed tool must still confirm its own read or write result.",
    );
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
}

export function diagnoseGeminiError(err: any): GeminiApiErrorInfo {
  const errorStr = String(err?.message || err?.statusText || err || "");
  const status =
    Number(
      err?.status ||
        err?.statusCode ||
        errorStr.match(/(\b401\b|\b404\b|\b429\b|\b500\b|\b503\b)/)?.[0] ||
        0,
    ) || null;

  const isAuthError =
    status === 401 ||
    errorStr.includes("API_KEY_INVALID") ||
    errorStr.includes("unauthenticated") ||
    errorStr.includes("401");
  const isNotFoundError =
    status === 404 ||
    errorStr.includes("models/") ||
    errorStr.includes("not found") ||
    errorStr.includes("404");
  const isRateLimitError =
    status === 429 ||
    errorStr.includes("RESOURCE_EXHAUSTED") ||
    errorStr.includes("quota") ||
    errorStr.includes("rate limit") ||
    errorStr.includes("429");

  let messageAr = "حدث خطأ غير متوقع أثناء استدعاء نموذج Gemini.";
  if (isAuthError) {
    messageAr =
      "مفتاح Gemini API غير صالح أو منتهي الصلاحية (HTTP 401). يرجى التحقق من متغير البية GEMINI_API_KEY.";
    console.error("[AI Engine Diagnostics] Gemini authentication failed (HTTP 401).");
  } else if (isNotFoundError) {
    messageAr =
      "النموذج المطلوب غير متاح أو قديم (HTTP 404). جاري التحويل التلقائي لنموذج الإنتاج البديل (gemini-2.0-flash).";
    console.error("[AI Engine Diagnostics] Requested Gemini model was not found (HTTP 404).");
  } else if (isRateLimitError) {
    messageAr =
      "تم تجاوز حد الطلبات المسموح به لـ Gemini API مؤقتاً (HTTP 429). جاري التحويل لمحرك القواعد المحلي الفوري.";
    console.warn("[AI Engine Diagnostics] Gemini quota or rate limit reached (HTTP 429).");
  } else {
    console.error("[AI Engine Diagnostics] Gemini request failed.");
  }

  return {
    statusCode: status,
    code: isAuthError
      ? "AUTH_401"
      : isNotFoundError
        ? "MODEL_404"
        : isRateLimitError
          ? "RATE_429"
          : "GENERIC_ERROR",
    isAuthError,
    isNotFoundError,
    isRateLimitError,
    messageAr,
  };
}
