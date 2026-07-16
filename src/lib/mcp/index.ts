import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listCategories from "./tools/list-categories";
import listMyOrders from "./tools/list-my-orders";
import listMyWishlist from "./tools/list-my-wishlist";
import addToWishlist from "./tools/add-to-wishlist";

// Use the direct Supabase host as issuer (never the .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "al-wadi-al-akhdar-mcp",
  title: "الوادي الأخضر — MCP",
  version: "0.1.0",
  instructions:
    "Tools for the Al-Wadi Al-Akhdar (الوادي الأخضر) grocery & herbal store. Use search_products / list_categories / get_product to browse the catalog. Signed-in users can view list_my_orders, list_my_wishlist, and add_to_wishlist.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProducts, getProduct, listCategories, listMyOrders, listMyWishlist, addToWishlist],
});
