import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search Al-Wadi Al-Akhdar store products by Arabic or English keyword. Returns id, name, price per unit, unit label, stock, category and image.",
  inputSchema: {
    query: z.string().trim().min(1).describe("Search text (matches product name)."),
    limit: z.number().int().min(1).max(50).default(20).describe("Max results (1-50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("products")
      .select(
        "id,name,price_per_unit,old_price,unit_label,is_by_weight,stock_quantity,image_url,category_id,is_featured",
      )
      .ilike("name", `%${query}%`)
      .limit(limit);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
