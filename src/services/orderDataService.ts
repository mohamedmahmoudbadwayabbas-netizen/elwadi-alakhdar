import { supabase } from "@/lib/supabase-loose";

export type OrderItemView = {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  unit_label: string;
  is_by_weight?: boolean;
};

export type OrderView = {
  id: string;
  user_id: string | null;
  status: string;
  total_amount: number;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
  customer_name: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  delivery_zone_id: string | null;
  delivery_method: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  coupon_code: string | null;
  ref_source: string | null;
  delivery_fee: number;
  discount_amount: number;
  rating?: number | null;
  rating_feedback?: string | null;
  rated_at?: string | null;
  items: OrderItemView[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function extractOrderRating(o: Record<string, any>): {
  rating: number | null;
  rating_feedback: string | null;
  rated_at: string | null;
} {
  // 1. Direct columns if present and populated
  if (o.rating != null && !isNaN(Number(o.rating)) && Number(o.rating) >= 1) {
    return {
      rating: Number(o.rating),
      rating_feedback: typeof o.rating_feedback === "string" ? o.rating_feedback : null,
      rated_at: typeof o.rated_at === "string" ? o.rated_at : null,
    };
  }

  // 2. Shipping address metadata fallback
  const shipping = asRecord(o.shipping_address);
  if (shipping?._order_rating && typeof shipping._order_rating === "object") {
    const r = shipping._order_rating as any;
    if (r.rating != null && !isNaN(Number(r.rating))) {
      return {
        rating: Number(r.rating),
        rating_feedback: typeof r.feedback === "string" ? r.feedback : null,
        rated_at: typeof r.rated_at === "string" ? r.rated_at : null,
      };
    }
  }

  // 3. Notes metadata tag: [تقييم الطلب: {"rating": 5, ...}]
  if (typeof o.notes === "string" && o.notes.includes("[تقييم الطلب:")) {
    const match = o.notes.match(/\[تقييم الطلب:\s*(\{.*?\})\]/);
    if (match?.[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.rating != null) {
          return {
            rating: Number(parsed.rating),
            rating_feedback: typeof parsed.feedback === "string" ? parsed.feedback : null,
            rated_at: typeof parsed.rated_at === "string" ? parsed.rated_at : null,
          };
        }
      } catch {
        // ignore parse error
      }
    }
  }

  // 4. Client localStorage fallback for instant sync across tabs
  if (typeof window !== "undefined" && o.id) {
    try {
      const stored = localStorage.getItem(`order_rating_${o.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.rating != null) {
          return {
            rating: Number(parsed.rating),
            rating_feedback: typeof parsed.feedback === "string" ? parsed.feedback : null,
            rated_at: typeof parsed.rated_at === "string" ? parsed.rated_at : null,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    rating: null,
    rating_feedback: null,
    rated_at: null,
  };
}

const ORDER_COLUMNS_WITH_RATING =
  "id,user_id,status,total_amount,shipping_address,created_at,customer_name,phone,address,notes,delivery_zone_id,delivery_method,payment_method,payment_reference,coupon_code,ref_source,delivery_fee,discount_amount,rating,rating_feedback,rated_at";

const ORDER_COLUMNS_BASE =
  "id,user_id,status,total_amount,shipping_address,created_at,customer_name,phone,address,notes,delivery_zone_id,delivery_method,payment_method,payment_reference,coupon_code,ref_source,delivery_fee,discount_amount";

export async function fetchOrdersWithItems(options?: {
  userId?: string;
  statuses?: string[];
  limit?: number;
}): Promise<OrderView[]> {
  // Try querying with rating columns first; gracefully fallback to base columns if DB column is pending
  let query = supabase.from("orders").select(ORDER_COLUMNS_WITH_RATING).order("created_at", { ascending: false });
  if (options?.userId) query = query.eq("user_id", options.userId);
  if (options?.statuses?.length) query = query.in("status", options.statuses);
  if (options?.limit) query = query.limit(options.limit);

  let orders: any[] | null = null;
  const { data: initialOrders, error: ordersError } = await query;
  if (ordersError && (ordersError.code === "42703" || ordersError.message?.includes("rating"))) {
    let fallbackQuery = supabase.from("orders").select(ORDER_COLUMNS_BASE).order("created_at", { ascending: false });
    if (options?.userId) fallbackQuery = fallbackQuery.eq("user_id", options.userId);
    if (options?.statuses?.length) fallbackQuery = fallbackQuery.in("status", options.statuses);
    if (options?.limit) fallbackQuery = fallbackQuery.limit(options.limit);

    const fallbackRes = await fallbackQuery;
    if (fallbackRes.error) throw fallbackRes.error;
    orders = fallbackRes.data;
  } else if (ordersError) {
    throw ordersError;
  } else {
    orders = initialOrders;
  }

  if (!orders?.length) return [];

  const orderIds = orders.map((o) => o.id);
  const { data: rows, error: itemsError } = await supabase
    .from("order_items")
    .select("id,order_id,product_id,quantity,price")
    .in("order_id", orderIds);
  if (itemsError) throw itemsError;

  const productIds = [
    ...new Set(
      (rows ?? [])
        .map((r) => r.product_id)
        .filter((productId): productId is string => Boolean(productId)),
    ),
  ];
  const productMap = new Map<string, { name: string; name_ar: string | null }>();
  if (productIds.length) {
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id,name,name_ar")
      .in("id", productIds);
    if (productsError) throw productsError;
    for (const p of products ?? []) productMap.set(p.id, { name: p.name, name_ar: p.name_ar });
  }

  const itemsByOrder = new Map<string, OrderItemView[]>();
  for (const row of rows ?? []) {
    const product = row.product_id ? productMap.get(row.product_id) : undefined;
    const item: OrderItemView = {
      id: row.id,
      product_id: row.product_id ?? "",
      name: product?.name_ar || product?.name || "صنف",
      quantity: row.quantity,
      price: Number(row.price),
      subtotal: Number(row.price) * row.quantity,
      unit_label: "قطعة",
    };
    const list = itemsByOrder.get(row.order_id ?? "") ?? [];
    list.push(item);
    itemsByOrder.set(row.order_id ?? "", list);
  }

  return orders.map((o) => {
    const ratingInfo = extractOrderRating(o);
    return {
      ...o,
      status: o.status ?? "pending",
      created_at: o.created_at ?? "",
      shipping_address: asRecord(o.shipping_address),
      total_amount: Number(o.total_amount),
      delivery_fee: Number(o.delivery_fee ?? 0),
      discount_amount: Number(o.discount_amount ?? 0),
      rating: ratingInfo.rating,
      rating_feedback: ratingInfo.rating_feedback,
      rated_at: ratingInfo.rated_at,
      items: itemsByOrder.get(o.id) ?? [],
    };
  });
}

/**
 * Submits or updates a 1-5 star rating and optional customer feedback for a past order.
 * Persists to Supabase orders table (direct columns or metadata fallback) and localStorage.
 */
export async function submitOrderRating(params: {
  orderId: string;
  userId?: string | null;
  rating: number;
  feedback?: string | null;
  currentNotes?: string | null;
  currentShippingAddress?: Record<string, unknown> | null;
}): Promise<{ success: boolean; mode: "column" | "metadata" }> {
  const { orderId, userId, rating, feedback, currentNotes, currentShippingAddress } = params;
  const ratedAt = new Date().toISOString();

  // Instant local cache
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        `order_rating_${orderId}`,
        JSON.stringify({
          rating,
          feedback: feedback?.trim() || null,
          rated_at: ratedAt,
        }),
      );
    } catch {
      // ignore
    }
  }

  // Attempt 1: Direct update to Supabase rating columns
  try {
    let updateQuery = supabase
      .from("orders")
      .update({
        rating,
        rating_feedback: feedback?.trim() || null,
        rated_at: ratedAt,
      })
      .eq("id", orderId);

    if (userId) {
      updateQuery = updateQuery.eq("user_id", userId);
    }

    const { error } = await updateQuery;
    if (!error) {
      return { success: true, mode: "column" };
    }

    if (error.code !== "42703" && !error.message?.includes("rating")) {
      throw error;
    }
  } catch (err: any) {
    if (err?.code !== "42703" && !err?.message?.includes("rating")) {
      throw err;
    }
  }

  // Attempt 2 (Fallback if database column is pending migration):
  // Persist within Supabase orders row via notes and shipping_address
  const ratingTag = `[تقييم الطلب: ${JSON.stringify({ rating, feedback: feedback?.trim() || "", rated_at: ratedAt })}]`;
  const cleanNotes = (currentNotes || "")
    .split("\n")
    .filter((l) => !l.startsWith("[تقييم الطلب:"))
    .join("\n")
    .trim();
  const updatedNotes = cleanNotes ? `${cleanNotes}\n${ratingTag}` : ratingTag;

  const updatedShippingAddress = {
    ...(currentShippingAddress || {}),
    _order_rating: {
      rating,
      feedback: feedback?.trim() || null,
      rated_at: ratedAt,
    },
  };

  let fallbackUpdate = supabase
    .from("orders")
    .update({
      notes: updatedNotes,
      shipping_address: updatedShippingAddress,
    })
    .eq("id", orderId);

  if (userId) {
    fallbackUpdate = fallbackUpdate.eq("user_id", userId);
  }

  const { error: fallbackError } = await fallbackUpdate;
  if (fallbackError) throw fallbackError;

  return { success: true, mode: "metadata" };
}
