import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminSupabase as supabase } from "@/integrations/supabase/admin-client";
import { Receipt, DollarSign, ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "نظرة عامة — لوحة التحكم" }, { name: "robots", content: "noindex,nofollow" }] }),
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
  const revenueOrders = orders.filter((o) => o.status !== "cancelled");
  const salesToday = revenueOrders.filter((o) => new Date(o.created_at) >= today).reduce((s, o) => s + Number(o.total_price), 0);
  const salesMonth = revenueOrders.filter((o) => new Date(o.created_at) >= monthStart).reduce((s, o) => s + Number(o.total_price), 0);
  const newCount = orders.filter((o) => o.status === "new").length;
  const processing = orders.filter((o) => o.status === "processing").length;

  const tally = new Map<string, number>();
  for (const o of revenueOrders) {
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
        <Stat label="مبيعات اليوم" value={`${salesToday.toFixed(2)} ج.م`} icon={DollarSign} tone="gold" />
        <Stat label="مبيعات الشهر" value={`${salesMonth.toFixed(2)} ج.م`} icon={TrendingUp} tone="primary" />
        <Stat label="طلبات جديدة" value={`${newCount}`} icon={Receipt} tone="accent" />
        <Stat label="قيد المعالجة" value={`${processing}`} icon={ShoppingCart} tone="primary" />
      </div>

      <Card className="card-glass border-0">
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
                  <defs>
                    <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.18 45)" />
                      <stop offset="100%" stopColor="oklch(0.65 0.15 152)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.4 0.02 150)" opacity={0.25} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.75 0.01 100)" }} interval={0} angle={-15} textAnchor="end" height={60} axisLine={{ stroke: "oklch(0.4 0.02 150)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "oklch(0.75 0.01 100)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "oklch(0.65 0.15 152)", opacity: 0.08 }}
                    contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.35 0.02 150)", background: "oklch(0.18 0.02 155)", color: "oklch(0.96 0.005 95)" }}
                  />
                  <Bar dataKey="qty" fill="url(#barGlow)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {lowStock.length > 0 && (
        <Card className="card-glass border-accent/30">
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

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: "primary" | "accent" | "gold" }) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    gold: "bg-gold/10 text-gold",
  }[tone];

  return (
    <Card className="card-glass border-0">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${toneClasses}`}>
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
