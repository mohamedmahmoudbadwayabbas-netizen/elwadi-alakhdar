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
  items: OrderItemView[];
};

// الأعمدة الحقيقية الموجودة فعلياً في جدول orders (العناصر مخزنة كـ jsonb)
const ORDER_COLUMNS =
  "id,user_id,status,total_price,items,created_at,customer_name,phone,address,notes,delivery_zone_id,delivery_method,payment_method,payment_reference,ref_source,delivery_fee";

function normalizeItems(raw: unknown): OrderItemView[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index) => {
    const item = (entry ?? {}) as Record<string, any>;
    const quantity = Number(item.quantity ?? 1);
    const price = Number(item.price_per_unit ?? item.price ?? 0);
    const subtotal = item.subtotal != null ? Number(item.subtotal) : price * quantity;
    return {
      id: String(item.id ?? `${index}`),
      product_id: String(item.id ?? item.product_id ?? ""),
      name: item.name ?? "صنف",
      quantity,
      price,
      subtotal,
      unit_label: item.unit_label ?? "قطعة",
      is_by_weight: Boolean(item.is_by_weight),
    };
  });
}

export async function fetchOrdersWithItems(options?: {
  userId?: string;
  statuses?: string[];
  limit?: number;
}): Promise<OrderView[]> {
  let query = supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false });
  if (options?.userId) query = query.eq("user_id", options.userId);
  if (options?.statuses?.length) query = query.in("status", options.statuses);
  if (options?.limit) query = query.limit(options.limit);

  const { data: orders, error: ordersError } = await query;
  if (ordersError) throw ordersError;
  if (!orders?.length) return [];

  return orders.map((o: any) => ({
    id: o.id,
    user_id: o.user_id ?? null,
    status: o.status ?? "new",
    total_amount: Number(o.total_price ?? 0),
    shipping_address: null,
    created_at: o.created_at ?? "",
    customer_name: o.customer_name ?? null,
    phone: o.phone ?? null,
    address: o.address ?? null,
    notes: o.notes ?? null,
    delivery_zone_id: o.delivery_zone_id ?? null,
    delivery_method: o.delivery_method ?? null,
    payment_method: o.payment_method ?? null,
    payment_reference: o.payment_reference ?? null,
    coupon_code: null,
    ref_source: o.ref_source ?? null,
    delivery_fee: Number(o.delivery_fee ?? 0),
    discount_amount: 0,
    items: normalizeItems(o.items),
  }));
}
