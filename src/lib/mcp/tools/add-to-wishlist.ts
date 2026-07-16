import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function supabaseAsUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "add_to_wishlist",
  title: "Add to wishlist",
  description: "Add a product to the signed-in user's wishlist.",
  inputSchema: {
    product_id: z.string().uuid().describe("Product UUID to add."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ product_id }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await supabaseAsUser(ctx)
      .from("wishlists")
      .upsert({ user_id: ctx.getUserId(), product_id }, { onConflict: "user_id,product_id" })
      .select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: "Added to wishlist" }],
      structuredContent: { row: data?.[0] },
    };
  },
});
