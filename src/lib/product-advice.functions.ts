import { createServerFn } from "@tanstack/react-start";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_GEMINI_MODEL } from "@/lib/gemini-config";

const productIdSchema = z.string().uuid();

/**
 * Authenticated, read-only product advice. The caller supplies only a product
 * id; facts are loaded server-side from active catalog rows before Gemini is
 * called, so the browser cannot inject fictional product details.
 */
export const getProductAdvice = createServerFn({ method: "POST" })
  .validator(productIdSchema)
  .middleware([requireSupabaseAuth])
  .handler(async ({ data: productId, context }): Promise<string> => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("مساعد المنتجات غير متاح الآن.");

    const { data: product, error } = await context.supabase
      .from("products")
      .select("id,name,name_ar,description,description_ar,price,original_price,is_active")
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error("تعذر التحقق من بيانات المنتج.");
    if (!product) throw new Error("المنتج غير متاح في المتجر.");

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: [
        "اكتب نصيحة قصيرة ومفيدة بالعربية المصرية لهذا المنتج اعتمادًا على بيانات المتجر الموثقة أدناه فقط. استنتج نوعه من اسمه ووصفه، وقدّم طريقة تحضير فقط إذا كان واضحًا أنه طعام يُطهى. لا تخترع مكونات أو مقادير أو أوقاتًا أو تعليمات سلامة أو حقائق عن السعر/المخزون. إذا لم تكفِ البيانات لتحديد طريقة الاستخدام، قل ذلك بوضوح وقدّم اقتراحًا عامًا آمنًا أو اطلب من العميل مراجعة ملصق المنتج. لا تذكر أنك بحثت في قاعدة بيانات. اجعل النصيحة جملتين كحد أقصى.\n\nبيانات المنتج (مصدرها سجل نشط في كتالوج المتجر):\n" +
          JSON.stringify({
            name: product.name_ar || product.name,
            description: product.description_ar || product.description,
          }),
      ],
      config: { maxOutputTokens: 160 },
    });
    const advice = response.text?.trim();
    if (!advice) throw new Error("لم تصل نصيحة من المساعد. حاول مرة أخرى.");
    return advice.slice(0, 900);
  });
