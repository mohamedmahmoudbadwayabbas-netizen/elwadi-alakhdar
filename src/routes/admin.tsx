import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-context";
import { ShieldAlert, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم - بَركة" }] }),
  component: AdminPage,
});

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  total_price: number;
  status: string;
  created_at: string;
  items: Array<{ name: string; quantity: number; unit_label: string; subtotal: number }>;
};

function AdminPage() {
  const { isAdmin } = useCart();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      setOrders((data ?? []) as Order[]);
      setLoading(false);
    })();
    const channel = supabase
      .channel("orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async () => {
        const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
        setOrders((data ?? []) as Order[]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-card">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-lg font-black">وصول مرفوض</h2>
          <p className="mt-1 text-sm text-muted-foreground">فعّل وضع المسؤول من الشريط العلوي ثم أعد المحاولة.</p>
          <Button onClick={() => router.history.push("/")} className="mt-5 w-full rounded-full hero-gradient text-primary-foreground">
            العودة للمتجر
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-black">الطلبات الواردة</h1>
          </div>
          <Link to="/" className="flex items-center gap-1 text-sm font-bold text-primary">
            المتجر <ArrowRight className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary" />)}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-card p-12 text-center">
            <div className="text-4xl">📭</div>
            <p className="mt-3 font-bold">لا توجد طلبات بعد</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-black text-foreground">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.phone} • {o.address}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString("ar-EG")}</div>
                  </div>
                  <div className="text-end">
                    <div className="text-lg font-black text-primary">{o.total_price.toFixed(2)} ج.م</div>
                    <span className="inline-block rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">{o.status}</span>
                  </div>
                </div>
                <ul className="mt-3 grid gap-1 border-t pt-3 text-xs">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="truncate">{it.name} <span className="text-muted-foreground">({it.quantity} {it.unit_label})</span></span>
                      <span className="font-bold">{it.subtotal.toFixed(2)} ج.م</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
