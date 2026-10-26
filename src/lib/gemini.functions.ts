import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AI_TOOL_SUITE } from "@/services/aiTools/toolDefinitions";

type GeminiPurpose = "chat" | "image" | "maps";
export type GeminiJsonValue =
  | string
  | number
  | boolean
  | null
  | GeminiJsonValue[]
  | { [key: string]: GeminiJsonValue };
export interface GeminiClientResponse {
  text: string;
  candidates: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        functionCall?: { name?: string; args?: { [key: string]: GeminiJsonValue } };
        inlineData?: { mimeType?: string; data?: string };
      }>;
    };
    groundingMetadata?: {
      groundingChunks?: Array<{
        web?: { uri?: string; title?: string };
        maps?: { [key: string]: GeminiJsonValue };
      }>;
    };
    finishReason?: string;
    safetyRatings?: GeminiJsonValue[];
  }>;
}
type GeminiRequest = {
  purpose: GeminiPurpose;
  model: string;
  contents: unknown;
  config?: Record<string, unknown>;
};

const CHAT_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3.7-flash",
  "gemini-3.1-pro-preview",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
]);
const IMAGE_MODELS = new Set(["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"]);
const CUSTOMER_TOOLS = new Set(["searchProducts", "getCategories"]);
const ADMIN_ROLES = new Set(["admin", "super_admin"]);
const MODERATOR_GROUPS = new Set([
  "catalog",
  "media",
  "ui",
  "operations",
  "marketing",
  "universal",
]);

function getRequestedTools(config: Record<string, unknown> | undefined): string[] {
  const tools = Array.isArray(config?.tools) ? config.tools : [];
  const names: string[] = [];
  for (const tool of tools) {
    if (!tool || typeof tool !== "object") throw new Error("Invalid Gemini tool configuration.");
    const item = tool as Record<string, unknown>;
    if (item.googleSearch && Object.keys(item).every((key) => key === "googleSearch")) {
      names.push("googleSearch");
      continue;
    }
    if (
      Array.isArray(item.functionDeclarations) &&
      Object.keys(item).every((key) => key === "functionDeclarations")
    ) {
      for (const declaration of item.functionDeclarations) {
        if (
          !declaration ||
          typeof declaration !== "object" ||
          typeof (declaration as Record<string, unknown>).name !== "string"
        ) {
          throw new Error("Invalid Gemini function declaration.");
        }
        names.push((declaration as Record<string, unknown>).name as string);
      }
      continue;
    }
    if (item.googleMaps && Object.keys(item).every((key) => key === "googleMaps")) {
      names.push("googleMaps");
      continue;
    }
    throw new Error("Unsupported Gemini tool configuration.");
  }
  return names;
}

function assertValidRequest(data: GeminiRequest): GeminiRequest {
  if (!data || !["chat", "image", "maps"].includes(data.purpose))
    throw new Error("Invalid Gemini request purpose.");
  if (typeof data.model !== "string" || !data.model.trim())
    throw new Error("A Gemini model is required.");
  if (!data.contents || (!Array.isArray(data.contents) && typeof data.contents !== "string"))
    throw new Error("Gemini contents are required.");
  const serialized = JSON.stringify({ contents: data.contents, config: data.config ?? {} });
  const maxBytes = data.purpose === "image" ? 8_000_000 : data.purpose === "maps" ? 8_000 : 64_000;
  if (serialized.length > maxBytes) throw new Error("Gemini request is too large.");
  return data;
}

export const generateGeminiContent = createServerFn({ method: "POST" })
  .validator(assertValidRequest)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }): Promise<GeminiClientResponse> => {
    let roleValue: unknown = null;
    const { data: rpcRole, error: roleError } = await context.supabase.rpc("get_my_role");
    if (!roleError && rpcRole) {
      roleValue = rpcRole;
    } else {
      // Some deployed schemas expose an own-row RLS policy for user_roles but
      // do not have the optional convenience RPC. Fall back to that same
      // caller-scoped table read; never trust a role supplied by the browser.
      const { data: roles, error: rolesError } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId);
      if (rolesError) throw new Error("Could not verify the signed-in user's store role.");
      roleValue = roles?.some((row) => row.role === "super_admin")
        ? "super_admin"
        : roles?.some((row) => row.role === "admin")
          ? "admin"
          : roles?.some((row) => row.role === "moderator")
            ? "moderator"
            : roles?.some((row) => row.role === "staff")
              ? "staff"
              : roles?.some((row) => row.role === "driver")
                ? "driver"
                : roles?.some((row) => row.role === "customer")
                  ? "customer"
                  : null;
    }
    const role = String(roleValue ?? "").toLowerCase();
    const isAdmin = ADMIN_ROLES.has(role);
    const isModerator = role === "moderator";

    if (data.purpose === "image" && !isAdmin)
      throw new Error("Image generation is available to store admins only.");
    if (data.purpose === "chat" && !isAdmin && !isModerator && role !== "customer") {
      throw new Error("The customer assistant is available to customer accounts only.");
    }
    if (
      data.purpose === "maps" &&
      !["customer", "staff", "moderator", "admin", "super_admin", "driver"].includes(role)
    ) {
      throw new Error("Map grounding is not available for this account role.");
    }

    if (data.purpose === "image" && !IMAGE_MODELS.has(data.model))
      throw new Error("That image model is not allowed.");
    if (data.purpose === "maps" && data.model !== "gemini-2.5-flash")
      throw new Error("That maps model is not allowed.");
    if (data.purpose === "chat" && !CHAT_MODELS.has(data.model))
      throw new Error("That chat model is not allowed.");

    const requestedTools = getRequestedTools(data.config);
    if (data.purpose === "image" && requestedTools.length)
      throw new Error("Tools are not supported for image generation.");
    if (data.purpose === "maps" && requestedTools.some((name) => name !== "googleMaps")) {
      throw new Error("Only Google Maps grounding is allowed for map requests.");
    }
    if (data.purpose === "maps" && requestedTools.length !== 1) {
      throw new Error("Map requests must include the Google Maps grounding tool.");
    }
    if (data.purpose === "chat") {
      const allowed = isAdmin
        ? new Set([...AI_TOOL_SUITE.map((tool) => tool.name), "googleSearch"])
        : isModerator
          ? new Set([
              ...AI_TOOL_SUITE.filter((tool) => MODERATOR_GROUPS.has(tool.group)).map(
                (tool) => tool.name,
              ),
              "googleSearch",
            ])
          : new Set(CUSTOMER_TOOLS);
      if (requestedTools.some((name) => !allowed.has(name)))
        throw new Error("This account cannot use one or more requested Gemini tools.");
      if (!isAdmin && !isModerator && requestedTools.length === 0) {
        throw new Error("Customer assistant requests must include the catalog read tools.");
      }
    }

    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured in the server environment.");

    const ai = new GoogleGenAI({ apiKey });
    const config = { ...data.config };
    if (data.purpose === "chat" || data.purpose === "maps") {
      const requestedMax = Number(config.maxOutputTokens);
      const maxOutputTokens = data.purpose === "chat" ? 1200 : 512;
      config.maxOutputTokens = Number.isFinite(requestedMax) && requestedMax > 0
        ? Math.min(requestedMax, maxOutputTokens)
        : maxOutputTokens;
    }
    const response = await ai.models.generateContent({
      model: data.model,
      contents: data.contents as any,
      config: config as any,
    });

    const serializable = JSON.parse(JSON.stringify({
      text: response.text || "",
      candidates: response.candidates ?? [],
    })) as GeminiClientResponse;
    return serializable;
  });
