import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EngineStatus = "SUCCESS" | "NOT_CONFIGURED" | "APPROVAL_REQUIRED" | "NOT_IMPLEMENTED" | "FAILED";

type EngineRequest = {
  operation?: string;
  args?: Record<string, unknown>;
};

const READ_OPERATIONS = new Set([
  "status",
  "getFileContent",
  "getDirectoryTree",
  "searchCodebase",
  "getAppErrors",
  "validateChanges",
]);

const WRITE_OPERATIONS = new Set([
  "createFile",
  "updateFile",
  "deleteFile",
  "applyChanges",
  "rollback",
  "gitCommitAndPush",
  "gitRollback",
]);

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function result(
  status: EngineStatus,
  messageAr: string,
  data?: Record<string, unknown>,
  error?: string,
  requestId?: string,
) {
  return json({
    ok: status === "SUCCESS",
    status,
    messageAr,
    ...(data ? { data } : {}),
    ...(error ? { error } : {}),
    ...(requestId ? { requestId } : {}),
  });
}

function requestId() {
  return crypto.randomUUID();
}

function configuredProvider() {
  const url = Deno.env.get("PROJECT_ENGINE_PROVIDER_URL")?.trim() || "";
  const token = Deno.env.get("PROJECT_ENGINE_PROVIDER_TOKEN")?.trim() || "";
  const sourceId = Deno.env.get("PROJECT_ENGINE_SOURCE_ID")?.trim() || "";

  if (!url || !token || !sourceId) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return { url, token, sourceId };
  } catch {
    return null;
  }
}

async function hmacToken(payload: string) {
  const secret = Deno.env.get("PROJECT_ENGINE_APPROVAL_SECRET")?.trim() || "";
  if (!secret) return null;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifyHmac(payload: string, signature: string) {
  const secret = Deno.env.get("PROJECT_ENGINE_APPROVAL_SECRET")?.trim() || "";
  if (!secret || !signature) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(atob(signature), (c) => c.charCodeAt(0)),
      new TextEncoder().encode(payload),
    );
  } catch {
    return false;
  }
}

async function hashChangeSet(changeSet: Record<string, unknown>) {
  const canonical = JSON.stringify(changeSet, Object.keys(changeSet).sort());
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim() || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")?.trim();
  if (!supabaseUrl || !publishableKey) throw new Error("NOT_CONFIGURED: Supabase server credentials are missing.");

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) throw new Error("UNAUTHORIZED: Bearer token required.");
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) throw new Error("UNAUTHORIZED: Empty bearer token.");

  const supabase = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) throw new Error("UNAUTHORIZED: Invalid or expired session.");

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  if (roleError) throw new Error(`FORBIDDEN: Unable to verify admin role: ${roleError.message}`);
  const isAdmin = (roles || []).some((row: { role?: string }) => row.role === "admin" || row.role === "super_admin");
  if (!isAdmin) throw new Error("FORBIDDEN: Admin role required.");

  return { supabase, user: userData.user };
}

async function providerRequest(provider: NonNullable<ReturnType<typeof configuredProvider>>, operation: string, args: Record<string, unknown>, userId: string) {
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.token}`,
      "X-Project-Engine-Source-Id": provider.sourceId,
    },
    body: JSON.stringify({ operation, args, actorUserId: userId, sourceId: provider.sourceId }),
  });

  const raw = await response.text();
  let body: Record<string, unknown> = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { /* handled below */ }

  if (!response.ok) {
    throw new Error(String(body.error || body.message || `Project provider returned HTTP ${response.status}.`));
  }
  return body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return result("FAILED", "الطريقة غير مدعومة.");

  const id = requestId();
  let body: EngineRequest;
  try { body = await req.json(); } catch { return result("FAILED", "بيانات الطلب غير صالحة.", undefined, "INVALID_JSON", id); }

  const operation = String(body.operation || "").trim();
  const args = body.args && typeof body.args === "object" ? body.args : {};

  if (!READ_OPERATIONS.has(operation) && !WRITE_OPERATIONS.has(operation) && operation !== "prepareChangeSet") {
    return result("NOT_IMPLEMENTED", `العملية «${operation || "غير معروفة"}» غير مدعومة في محرك المشروع.`, undefined, "UNSUPPORTED_OPERATION", id);
  }

  let auth: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    auth = await requireAdmin(req);
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    const [code, ...rest] = message.split(":");
    const httpStatus = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 503;
    const engineStatus: EngineStatus = code === "UNAUTHORIZED" || code === "FORBIDDEN" ? "FAILED" : "NOT_CONFIGURED";
    return json({
      ok: false,
      status: engineStatus,
      messageAr: rest.join(":").trim() || "تعذر التحقق من صلاحيات محرك المشروع.",
      error: code,
      requestId: id,
    }, httpStatus);
  }

  console.info(JSON.stringify({ event: "project_engine_request", requestId: id, operation, userId: auth.user.id }));

  if (operation === "status") {
    const provider = configuredProvider();
    return result("SUCCESS", provider ? "بوابة محرك المشروع مهيأة، لكن صحة مزود المشروع تُقاس عند تنفيذ العملية." : "محرك المشروع موجود كحد أمني، لكنه غير مهيأ بمزود ملفات حقيقي.", {
      configured: Boolean(provider),
      sourceOfTruth: "Sources ZIP for current code; Supabase live project for live schema; GitHub is repository/integration target only.",
      providerConfigured: Boolean(provider),
      approvalConfigured: Boolean(Deno.env.get("PROJECT_ENGINE_APPROVAL_SECRET")),
    }, undefined, id);
  }

  if (operation === "prepareChangeSet") {
    const provider = configuredProvider();
    if (!provider) return result("NOT_CONFIGURED", "لا يمكن تجهيز Change Set حقيقي قبل تهيئة مزود مشروع حقيقي.", undefined, "PROJECT_ENGINE_PROVIDER_NOT_CONFIGURED", id);
    const changeSet = (args.changeSet || {}) as Record<string, unknown>;
    try {
      const validation = await providerRequest(provider, "validateChanges", { changeSet }, auth.user.id);
      if (validation.ok === false || validation.valid === false) {
        return result("FAILED", "فشل التحقق من Change Set؛ لم يتم إنشاء موافقة قابلة للتطبيق.", validation.data as Record<string, unknown> | undefined, String(validation.error || "VALIDATION_FAILED"), id);
      }
    } catch (error) {
      return result("FAILED", "تعذر تشغيل التحقق الحقيقي قبل طلب الموافقة.", undefined, String(error instanceof Error ? error.message : error), id);
    }
    const changeSetHash = await hashChangeSet(changeSet);
    const expiresAtMs = Date.now() + 10 * 60 * 1000;
    const payload = `${auth.user.id}:${changeSetHash}:${expiresAtMs}`;
    const approvalToken = await hmacToken(payload);
    if (!approvalToken) return result("NOT_CONFIGURED", "بوابة الموافقة غير مهيأة على الخادم.", undefined, "APPROVAL_SECRET_NOT_CONFIGURED", id);
    return result("APPROVAL_REQUIRED", "تم تجهيز Change Set للمراجعة. لا يمكن تطبيقه إلا بعد موافقة المدير الصريحة من واجهة الإدارة.", {
      approvalToken: `${expiresAtMs}.${approvalToken}`,
      expiresAt: new Date(expiresAtMs).toISOString(),
      changeSetHash,
    }, undefined, id);
  }

  if (WRITE_OPERATIONS.has(operation) && operation !== "applyChanges") {
    if (operation === "gitCommitAndPush" || operation === "gitRollback") {
      return result("APPROVAL_REQUIRED", "عمليات Git عالية الخطورة تتطلب موافقة مدير صريحة قبل التنفيذ.", { operation }, undefined, id);
    }
    if (operation !== "applyChanges") {
      return result("APPROVAL_REQUIRED", "تم إنشاء طلب تغيير فقط. يجب مراجعته والموافقة عليه قبل أي كتابة فعلية.", { operation, changeSet: args }, undefined, id);
    }
  }

  if (operation === "applyChanges") {
    const provider = configuredProvider();
    if (!provider) return result("NOT_CONFIGURED", "لا يمكن تطبيق التغييرات لأن مزود الملفات الحقيقي غير مهيأ.", undefined, "PROJECT_ENGINE_PROVIDER_NOT_CONFIGURED", id);
    const changeSet = (args.changeSet || {}) as Record<string, unknown>;
    const token = String(args.approvalToken || "");
    const [expiresAtRaw, signature] = token.split(".");
    const expiresAt = Number(expiresAtRaw);
    const changeSetHash = await hashChangeSet(changeSet);
    const payload = `${auth.user.id}:${changeSetHash}:${expiresAt}`;
    if (!signature || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || !(await verifyHmac(payload, signature))) {
      return result("APPROVAL_REQUIRED", "الموافقة غير صالحة أو منتهية أو غير مرتبطة بهذه التغييرات.", undefined, "INVALID_APPROVAL_TOKEN", id);
    }
    try {
      const providerBody = await providerRequest(provider, "applyChanges", { ...args, changeSetHash }, auth.user.id);
      if (providerBody.ok === false || providerBody.applied !== true) {
        return result("FAILED", "لم يؤكد مزود المشروع تطبيق التغييرات فعليًا؛ لذلك لن نعرض نجاحًا وهميًا.", providerBody.data as Record<string, unknown> | undefined, String(providerBody.error || "PROVIDER_DID_NOT_CONFIRM_APPLY"), id);
      }
      console.info(JSON.stringify({ event: "project_engine_apply", requestId: id, userId: auth.user.id, changeSetHash }));
      return result("SUCCESS", "تم تطبيق التغييرات من خلال مزود المشروع الحقيقي وأعاد المزود تأكيد التنفيذ.", providerBody.data as Record<string, unknown> | undefined, undefined, id);
    } catch (error) {
      return result("FAILED", "فشل تطبيق التغييرات في مزود المشروع الحقيقي.", undefined, String(error instanceof Error ? error.message : error), id);
    }
  }

  const provider = configuredProvider();
  if (!provider) return result("NOT_CONFIGURED", "محرك المشروع غير مهيأ بمزود ملفات/مستودع حقيقي؛ لن يتم اختلاق محتوى أو نجاحات.", undefined, "PROJECT_ENGINE_PROVIDER_NOT_CONFIGURED", id);

  try {
    const providerBody = await providerRequest(provider, operation, args, auth.user.id);
    const providerOk = providerBody.ok !== false;
    return result(providerOk ? "SUCCESS" : "FAILED", String(providerBody.messageAr || providerBody.message || "استجابة من مزود المشروع الحقيقي."), providerBody.data as Record<string, unknown> | undefined, providerOk ? undefined : String(providerBody.error || "PROVIDER_FAILED"), id);
  } catch (error) {
    return result("FAILED", "فشل تنفيذ العملية في مزود المشروع الحقيقي.", undefined, String(error instanceof Error ? error.message : error), id);
  }
});
