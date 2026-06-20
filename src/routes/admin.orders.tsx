import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Download, Eye, ArrowRightCircle, X } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type OrderItem = { name: string; quantity: number; unit_label: string; subtotal: number; price_per_unit?: number; is_by_weight?: boolean };
type Order = {
  id: string; customer_name: string; phone: string; address: string;
  total_price: number; status: string; created_at: string;
  items: OrderItem[]; notes: string | null; ref_source: string | null;
};

const STATUSES = [
  { key: "new", label: "جديد", next: "processing" },
  { key: "processing", label: "قيد المعالجة", next: "shipped" },
  { key: "shipped", label: "تم الشحن", next: "completed" },
  { key: "completed", label: "مكتمل", next: null },
  { key: "cancelled", label: "ملغي", next: null },
] as const;

export const Route = createFileRoute("/admin/orders")({ component: OrdersPage });

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("new");
  const [preview, setPreview] = useState<Order | null>(null);

  const load = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(((data ?? []) as unknown as Order[]));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel("admin-orders-rt").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const grouped = useMemo(() => {
    const m: Record<string, Order[]> = {};
    for (const s of STATUSES) m[s.key] = [];
    for (const o of orders) (m[o.status] ?? (m[o.status] = [])).push(o);
    return m;
  }, [orders]);

  const setStatus = async (id: string, status: string) => {
    const prev = orders;
    setOrders((p) => p.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); setOrders(prev); }
    else toast.success("تم تحديث الحالة");
  };

  const exportXlsx = (rows: Order[]) => {
    const data = rows.map((o) => ({
      "رقم الطلب": o.id.slice(0, 8),
      "التاريخ": new Date(o.created_at).toLocaleString("ar-EG"),
      "العميل": o.customer_name,
      "الهاتف": o.phone,
      "العنوان": o.address,
      "الإجمالي": o.total_price,
      "الحالة": STATUSES.find((s) => s.key === o.status)?.label ?? o.status,
      "عدد الأصناف": o.items?.length ?? 0,
      "المصدر": o.ref_source ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] ?? {}).map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-bold">الطلبات</h2>
        <Button onClick={() => exportXlsx(orders)} variant="outline" className="gap-2 rounded-full">
          <Download className="h-4 w-4" /> تصدير Excel
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-5">
          {STATUSES.map((s) => (
            <TabsTrigger key={s.key} value={s.key} className="text-xs">
              {s.label}
              <span className="ms-1.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">{grouped[s.key]?.length ?? 0}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {STATUSES.map((s) => (
          <TabsContent key={s.key} value={s.key} className="mt-4">
            {loading ? (
              <div className="h-32 animate-pulse rounded-xl bg-secondary" />
            ) : (grouped[s.key] ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">لا توجد طلبات في هذه الحالة</div>
            ) : (
              <ul className="space-y-2">
                {(grouped[s.key] ?? []).map((o) => (
                  <li key={o.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold">{o.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{o.phone} • {o.address}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString("ar-EG")} {o.ref_source ? `• مصدر: ${o.ref_source}` : ""}</div>
                      </div>
                      <div className="text-end">
                        <div className="font-display text-lg font-bold text-primary">{Number(o.total_price).toFixed(2)} ج.م</div>
                        <div className="text-[11px] text-muted-foreground">{o.items?.length ?? 0} صنف</div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPreview(o)}>
                        <Eye className="h-3.5 w-3.5" /> تفاصيل
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => printReceipt(o)}>
                        <Printer className="h-3.5 w-3.5" /> طباعة إيصال
                      </Button>
                      {s.next && (
                        <Button size="sm" className="gap-1.5 hero-gradient text-primary-foreground" onClick={() => setStatus(o.id, s.next!)}>
                          <ArrowRightCircle className="h-3.5 w-3.5" />
                          نقل إلى: {STATUSES.find((x) => x.key === s.next)?.label}
                        </Button>
                      )}
                      {o.status !== "cancelled" && o.status !== "completed" && (
                        <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" onClick={() => setStatus(o.id, "cancelled")}>
                          <X className="h-3.5 w-3.5" /> إلغاء
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">تفاصيل الطلب</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-2 text-sm">
              <div><b>العميل:</b> {preview.customer_name}</div>
              <div><b>الهاتف:</b> {preview.phone}</div>
              <div><b>العنوان:</b> {preview.address}</div>
              {preview.notes && <div><b>ملاحظات:</b> {preview.notes}</div>}
              <ul className="mt-2 divide-y rounded-xl border bg-secondary/30 text-xs">
                {preview.items?.map((it, i) => (
                  <li key={i} className="flex justify-between p-2">
                    <span>{it.name} <span className="text-muted-foreground">({it.quantity} {it.unit_label})</span></span>
                    <span className="font-bold">{Number(it.subtotal).toFixed(2)} ج.م</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between rounded-xl bg-primary/10 p-2 font-bold text-primary">
                <span>الإجمالي</span><span>{Number(preview.total_price).toFixed(2)} ج.م</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function printReceipt(o: Order) {
  const html = `
  <div class="receipt-print">
    <div style="text-align:center;font-weight:bold;font-size:14pt">الوادي الأخضر</div>
    <div style="text-align:center;font-size:9pt;margin-bottom:6pt">سوبر ماركت وعطارة</div>
    <hr/>
    <div style="font-size:9pt">طلب: ${o.id.slice(0, 8)}</div>
    <div style="font-size:9pt">${new Date(o.created_at).toLocaleString("ar-EG")}</div>
    <div style="font-size:9pt">${o.customer_name} - ${o.phone}</div>
    <div style="font-size:9pt">${o.address}</div>
    <hr/>
    <table style="width:100%;font-size:9pt;border-collapse:collapse">
      <thead><tr><th align="right">الصنف</th><th align="right">الكمية</th><th align="left">السعر</th></tr></thead>
      <tbody>
        ${(o.items ?? []).map((it) => `
          <tr><td>${it.name}</td><td>${it.quantity} ${it.unit_label}</td><td align="left">${Number(it.subtotal).toFixed(2)}</td></tr>
        `).join("")}
      </tbody>
    </table>
    <hr/>
    <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:11pt">
      <span>الإجمالي</span><span>${Number(o.total_price).toFixed(2)} ج.م</span>
    </div>
    <div style="text-align:center;margin-top:8pt;font-size:9pt">شكراً لتسوقكم معنا 🌿</div>
  </div>`;
  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) return;
  w.document.write(`<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>إيصال</title>
    <style>body{font-family:Tajawal,Arial,sans-serif;margin:0;padding:0}hr{border:none;border-top:1px dashed #000;margin:6pt 0}</style>
    </head><body>${html}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script></body></html>`);
  w.document.close();
}
