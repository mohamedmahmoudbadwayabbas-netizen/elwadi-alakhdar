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

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function hashChangeSet(changeSet: Record<string, unknown>) {
  const canonical = canonicalize(changeSet);
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

function serviceRoleClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function writeAudit(
  client: ReturnType<typeof createClient>,
  eventType: string,
  actorUserId: string | null,
  approvalId: string | null,
  sourceId: string | null,
  changeSetHash: string | null,
  validationResult?: unknown,
  providerResult?: unknown,
  metadata?: Record<string, unknown>,
) {
  const { error } = await client.from("project_engine_audit").insert({
    event_type: eventType,
    actor_user_id: actorUserId,
    approval_id: approvalId,
    source_id: sourceId,
    change_set_hash: changeSetHash,
    validation_result: validationResult ?? null,
    provider_result: providerResult ?? null,
    metadata: metadata ?? {},
  });
  if (error) throw new Error(`AUDIT_WRITE_FAILED: ${error.message}`);
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
      approvalConfigured: Boolean(Deno.env.get("PROJECT_ENGINE_APPROVAL_SECRET") && Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
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
    const payloadBase = `${auth.user.id}:${changeSetHash}:${expiresAtMs}`;
    const approvalSignature = await hmacToken(payloadBase);
    const db = serviceRoleClient();
    if (!approvalSignature || !db) return result("NOT_CONFIGURED", "بوابة الموافقة أو التخزين الآمن للموافقة غير مهيأ على الخادم.", undefined, "APPROVAL_PERSISTENCE_NOT_CONFIGURED", id);
    const { data: approval, error: approvalError } = await db.from("project_engine_approvals").insert({
      actor_user_id: auth.user.id,
      source_id: provider.sourceId,
      change_set_hash: changeSetHash,
      change_set: changeSet,
      status: "approved",
      expires_at: new Date(expiresAtMs).toISOString(),
    }).select("id").single();
    if (approvalError || !approval) return result("FAILED", "تعذر حفظ موافقة التغيير بشكل دائم؛ لم يتم إصدار رمز قابل للتطبيق.", undefined, "APPROVAL_PERSISTENCE_FAILED", id);
    const payload = `${auth.user.id}:${changeSetHash}:${expiresAtMs}:${approval.id}`;
    const approvalToken = await hmacToken(payload);
    if (!approvalToken) return result("NOT_CONFIGURED", "بوابة الموافقة غير مهيأة على الخادم.", undefined, "APPROVAL_SECRET_NOT_CONFIGURED", id);
    await writeAudit(db, "approval_issued", auth.user.id, approval.id, provider.sourceId, changeSetHash, validation, undefined, { requestId: id });
    return result("APPROVAL_REQUIRED", "تم تجهيز Change Set وتسجيل موافقة المدير. لا يمكن استخدام الرمز إلا مرة واحدة وقبل انتهاء صلاحيته.", {
      approvalToken: `${expiresAtMs}.${approval.id}.${approvalToken}`,
      expiresAt: new Date(expiresAtMs).toISOString(),
      changeSetHash,
      approvalId: approval.id,
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
    const [expiresAtRaw, approvalId, signature] = token.split(".");
    const expiresAt = Number(expiresAtRaw);
    const changeSetHash = await hashChangeSet(changeSet);
    const payload = `${auth.user.id}:${changeSetHash}:${expiresAt}:${approvalId}`;
    if (!approvalId || !signature || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || !(await verifyHmac(payload, signature))) {
      return result("APPROVAL_REQUIRED", "الموافقة غير صالحة أو منتهية أو غير مرتبطة بهذه التغييرات.", undefined, "INVALID_APPROVAL_TOKEN", id);
    }
    const db = serviceRoleClient();
    if (!db) return result("NOT_CONFIGURED", "التخزين الآمن للموافقات غير مهيأ على الخادم.", undefined, "APPROVAL_PERSISTENCE_NOT_CONFIGURED", id);
    try {
      const { data: consumed, error: consumeError } = await db.from("project_engine_approvals")
        .update({ status: "applying", applying_at: new Date().toISOString() })
        .eq("id", approvalId).eq("actor_user_id", auth.user.id).eq("source_id", provider.sourceId)
        .eq("change_set_hash", changeSetHash).eq("status", "approved").is("consumed_at", null)
        .gt("expires_at", new Date().toISOString()).select("id").maybeSingle();
      if (consumeError || !consumed) return result("APPROVAL_REQUIRED", "هذه الموافقة غير موجودة أو استُخدمت بالفعل أو انتهت صلاحيتها.", undefined, "APPROVAL_NOT_USABLE", id);
      const providerBody = await providerRequest(provider, "applyChanges", { changeSet, changeSetHash }, auth.user.id);
      if (providerBody.ok === false || providerBody.applied !== true) {
        await db.from("project_engine_approvals").update({ status: "approved", applying_at: null }).eq("id", approvalId);
        await writeAudit(db, "apply_failed", auth.user.id, approvalId, provider.sourceId, changeSetHash, undefined, providerBody, { requestId: id });
        return result("FAILED", "لم يؤكد مزود المشروع تطبيق التغييرات فعليًا؛ لذلك لن نعرض نجاحًا وهميًا.", providerBody.data as Record<string, unknown> | undefined, String(providerBody.error || "PROVIDER_DID_NOT_CONFIRM_APPLY"), id);
      }
      const { error: consumeFinalError } = await db.from("project_engine_approvals").update({ status: "consumed", consumed_at: new Date().toISOString() }).eq("id", approvalId).eq("status", "applying");
      if (consumeFinalError) throw new Error(`APPROVAL_CONSUME_FAILED: ${consumeFinalError.message}`);
      await writeAudit(db, "apply_succeeded", auth.user.id, approvalId, provider.sourceId, changeSetHash, undefined, providerBody, { requestId: id });
      console.info(JSON.stringify({ event: "project_engine_apply", requestId: id, userId: auth.user.id, changeSetHash, approvalId }));
      return result("SUCCESS", "تم تطبيق التغييرات من خلال مزود المشروع الحقيقي وأعيد تأكيد التنفيذ وتسجيله.", providerBody.data as Record<string, unknown> | undefined, undefined, id);
    } catch (error) {
      await writeAudit(db, "apply_exception", auth.user.id, approvalId, provider.sourceId, changeSetHash, undefined, undefined, { requestId: id, error: String(error instanceof Error ? error.message : error) }).catch(() => undefined);
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
