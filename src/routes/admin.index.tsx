import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, DollarSign, ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  component: OverviewPage,
});

type OrderRow = {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  items: { id?: string; name: string; quantity: number; subtotal: number }[];
};

function OverviewPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [lowStock, setLowStock] = useState<{ id: string; name: string; stock_quantity: number; low_stock_threshold: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: ords }, { data: prods }] = await Promise.all([
        supabase.from("orders").select("id,total_price,status,created_at,items").order("created_at", { ascending: false }).limit(500),
        supabase.from("products").select("id,name,stock_quantity,low_stock_threshold"),
      ]);
      setOrders((ords ?? []) as unknown as OrderRow[]);
      const low = (prods ?? []).filter((p: any) => (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 0));
      setLowStock(low as any);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel("admin-overview-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const salesToday = orders.filter((o) => new Date(o.created_at) >= today).reduce((s, o) => s + Number(o.total_price), 0);
  const salesMonth = orders.filter((o) => new Date(o.created_at) >= monthStart).reduce((s, o) => s + Number(o.total_price), 0);
  const newCount = orders.filter((o) => o.status === "new").length;
  const processing = orders.filter((o) => o.status === "processing").length;

  // Best sellers from order items
  const tally = new Map<string, number>();
  for (const o of orders) {
    for (const it of o.items ?? []) {
      tally.set(it.name, (tally.get(it.name) ?? 0) + Number(it.quantity || 0));
    }
  }
  const bestSellers = Array.from(tally.entries())
    .map(([name, qty]) => ({ name, qty: +qty.toFixed(2) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 7);

  if (loading) {
    return (
      <div className="grid gap-4 p-4 sm:p-6">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="مبيعات اليوم" value={`${salesToday.toFixed(2)} ج.م`} icon={DollarSign} tone="primary" />
        <Stat label="مبيعات الشهر" value={`${salesMonth.toFixed(2)} ج.م`} icon={TrendingUp} tone="accent" />
        <Stat label="طلبات جديدة" value={`${newCount}`} icon={Receipt} tone="primary" />
        <Stat label="قيد المعالجة" value={`${processing}`} icon={ShoppingCart} tone="accent" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">الأكثر مبيعاً</CardTitle>
          <CardDescription>أعلى 7 منتجات حسب الكمية المباعة</CardDescription>
        </CardHeader>
        <CardContent>
          {bestSellers.length === 0 ? (
            <div className="rounded-xl bg-secondary/40 p-8 text-center text-sm text-muted-foreground">لا توجد بيانات مبيعات بعد</div>
          ) : (
            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer>
                <BarChart data={bestSellers} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "var(--accent)", opacity: 0.1 }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                  <Bar dataKey="qty" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {lowStock.length > 0 && (
        <Card className="border-accent/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <AlertTriangle className="h-5 w-5 text-accent" />
              تنبيهات المخزون المنخفض
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-3 py-2 text-sm">
                  <span className="font-bold">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    متبقي <span className="font-black text-destructive">{p.stock_quantity}</span> (حد التنبيه {p.low_stock_threshold})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: "primary" | "accent" }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tone === "primary" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="truncate font-display text-lg font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
