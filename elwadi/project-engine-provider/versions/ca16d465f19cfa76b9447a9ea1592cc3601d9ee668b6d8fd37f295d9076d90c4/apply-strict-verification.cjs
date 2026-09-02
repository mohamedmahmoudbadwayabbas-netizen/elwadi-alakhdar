const fs = require('fs');

// 1. types.ts
let typesPath = 'src/services/aiTools/types.ts';
let typesCode = fs.readFileSync(typesPath, 'utf8');
if (!typesCode.includes('source?: "lovable" | "ai-studio";')) {
  typesCode = typesCode.replace(
    /verified\?: boolean;/,
    'verified?: boolean;\n  source?: "lovable" | "ai-studio";'
  );
  fs.writeFileSync(typesPath, typesCode);
}

// 2. toolRouter.ts
let routerPath = 'src/services/aiTools/toolRouter.ts';
let routerCode = fs.readFileSync(routerPath, 'utf8');
if (!routerCode.includes('async function _executeAiToolInner')) {
  routerCode = routerCode.replace(
    /export async function executeAiTool\(/,
    'async function _executeAiToolInner('
  );
  
  const wrapper = `
export async function executeAiTool(
  tool: AiToolName,
  args: Record<string, unknown> = {},
  ctx?: any,
): Promise<ToolExecutionResult> {
  try {
    const result = await _executeAiToolInner(tool, args, ctx);
    const source = typeof window !== "undefined" && window.location.hostname.includes("lovable") ? "lovable" : "ai-studio";
    result.source = source;
    
    // Check if result is explicitly missing success
    if (result.error || result.ok === false) {
      result.success = false;
      result.ok = false;
    }
    
    console.info(\`[STRICT_VERIFICATION_LOG] ENV: \${source} | Tool: \${tool} | Args:\`, args, \`| Raw Response:\`, result);
    return result;
  } catch (error: any) {
    const source = typeof window !== "undefined" && window.location.hostname.includes("lovable") ? "lovable" : "ai-studio";
    const errRes = { tool, ok: false, success: false, error: error.message, messageAr: \`خطأ تنفيذي: \${error.message}\`, source };
    console.error(\`[STRICT_VERIFICATION_LOG_ERROR] ENV: \${source} | Tool: \${tool} | Error:\`, error);
    return errRes as ToolExecutionResult;
  }
}
`;
  routerCode += wrapper;
  fs.writeFileSync(routerPath, routerCode);
}

// 3. gemini36Service.ts
let geminiPath = 'src/services/gemini36Service.ts';
let geminiCode = fs.readFileSync(geminiPath, 'utf8');
if (!geminiCode.includes('refresh?: () => void;')) {
  geminiCode = geminiCode.replace(
    /kpis\?: ExecutiveKpiInput;/,
    'kpis?: ExecutiveKpiInput;\n  refresh?: () => void;'
  );
}
if (!geminiCode.includes('HARD VERIFICATION GATE')) {
  geminiCode = geminiCode.replace(
    /let finalAnswerText = candidate\?.content\?.parts[\s\S]*?trim\(\) \|\| "";[\s\S]*?if \(!finalAnswerText\) \{[\s\S]*?else \{[\s\S]*?\}/,
    `let finalAnswerText = candidate?.content?.parts?.map((p: any) => p.text || "").join("").trim() || "";
            // HARD VERIFICATION GATE
            const isSuccess = executionRes.success === true || executionRes.ok === true;
            if (!isSuccess) {
              finalAnswerText = \`⚠️ **لم أستطع تأكيد التنفيذ:**\\n\${executionRes.error || executionRes.messageAr}\\n\\nيرجى مراجعة المعطيات أو المحاولة مرة أخرى.\`;
            } else {
              if (options?.refresh) options.refresh();
              else if (typeof window !== 'undefined' && (window as any).queryClient) {
                try { (window as any).queryClient.invalidateQueries(); } catch(e){}
              }
              finalAnswerText = \`✅ **تم تأكيد التنفيذ بنجاح في قاعدة البيانات:**\\n\${executionRes.messageAr}\\n\\n\${finalAnswerText}\`;
            }`
  );
  fs.writeFileSync(geminiPath, geminiCode);
}

// 4. admin.copilot.tsx
let copilotPath = 'src/routes/admin.copilot.tsx';
let copilotCode = fs.readFileSync(copilotPath, 'utf8');
if (!copilotCode.includes('refresh: () => queryClient.invalidateQueries()')) {
  copilotCode = copilotCode.replace(
    /currentLayout: layoutConfig,\s*kpis,/,
    'currentLayout: layoutConfig,\n        kpis,\n        refresh: () => queryClient.invalidateQueries(),'
  );
  fs.writeFileSync(copilotPath, copilotCode);
}

// 5. coreCatalogTools.ts - enforce strict returns on error
let catalogPath = 'src/services/aiTools/coreCatalogTools.ts';
let catalogCode = fs.readFileSync(catalogPath, 'utf8');
let modified = false;

// Fix updateProductPrice
if (catalogCode.includes('await supabase.from("products").update(')) {
  catalogCode = catalogCode.replace(
    /const \{ error \} = await supabase\s*\.from\("products"\)\s*\.update\(\{[\s\S]*?\}\)\s*\.eq\("id", pId\);[\s\S]*?if \(error\) throw error;/,
    `const { data, error } = await supabase.from("products").update({ price_per_unit: newPrice, old_price: oldPrice, is_on_sale: isSale }).eq("id", pId).select();
      if (error || !data || data.length === 0) {
        return { tool: "updateProductPrice", ok: false, success: false, error: error?.message || "No rows returned", messageAr: "فشل التحديث في قاعدة البيانات" };
      }`
  );
  modified = true;
}

// Fix createProduct
if (catalogCode.includes('const { error } = await supabase.from("products").insert(')) {
  catalogCode = catalogCode.replace(
    /const \{ error \} = await supabase\.from\("products"\)\.insert\(\[payload\]\);[\s\S]*?if \(error\) \{[\s\S]*?console\.error\("\[AI Tools\] insert error", error\);[\s\S]*?throw error;[\s\S]*?\}/,
    `const { data, error } = await supabase.from("products").insert([payload]).select();
      if (error || !data || data.length === 0) {
        return { tool: "createProduct", ok: false, success: false, error: error?.message || "No rows returned", messageAr: "فشل الإدراج في قاعدة البيانات" };
      }`
  );
  modified = true;
}

if (modified) {
  fs.writeFileSync(catalogPath, catalogCode);
}

console.log("All patches applied.");
