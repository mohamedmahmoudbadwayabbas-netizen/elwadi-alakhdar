import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Printer,
  Download,
  Eye,
  ArrowRightCircle,
  X,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  Search,
  RefreshCw,
  AlertCircle,
  Play,
  Pause,
  Navigation,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Radio,
  PhoneCall,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { Skeleton } from "@/components/ui/universal-skeleton";

type OrderItem = {
  name: string;
  quantity: number;
  unit_label: string;
  subtotal: number;
  price_per_unit?: number;
  is_by_weight?: boolean;
};

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  total_price: number;
  delivery_fee?: number;
  payment_method?: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  notes: string | null;
  ref_source: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  driver_lat?: number | null;
  driver_lng?: number | null;
};

type Driver = {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: "available" | "busy";
  avatar: string;
};

const DRIVERS_LIST: Driver[] = [
  {
    id: "d1",
    name: "الكابتن أحمد علي",
    phone: "01012345678",
    vehicle: "دراجة نارية (سكوتر)",
    status: "available",
    avatar: "🏍️",
  },
  {
    id: "d2",
    name: "الكابتن محمود حسن",
    phone: "01123456789",
    vehicle: "سيارة فان تبريد",
    status: "available",
    avatar: "🚐",
  },
  {
    id: "d3",
    name: "الكابتن مصطفى بدر",
    phone: "01234567890",
    vehicle: "دراجة نارية (سكوتر)",
    status: "available",
    avatar: "🛵",
  },
];

const STATUSES = [
  {
    key: "new",
    label: "جديد 🔔",
    next: "processing",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  {
    key: "processing",
    label: "قيد الإعداد 👨‍🍳",
    next: "delivering",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    key: "delivering",
    label: "جاري التوصيل 🚚",
    next: "completed",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    key: "completed",
    label: "مكتمل ✅",
    next: null,
    color: "bg-green-500/10 text-green-500 border-green-500/20",
  },
  {
    key: "cancelled",
    label: "ملغي ❌",
    next: null,
    color: "bg-red-500/10 text-red-500 border-red-500/20",
  },
] as const;

// تشغيل نغمة تنبيه صوتية خفيفة للطلبات الجديدة
function playNewOrderSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (_) {}
}

declare global {
  interface Window {
    L?: any;
  }
}

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "إدارة الطلبات والتوصيل اللحظي — لوحة التحكم" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [preview, setPreview] = useState<Order | null>(null);

  // حوار تعيين السائق
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(DRIVERS_LIST[0]);

  // حوار محاكي تتبع التوصيل اللحظي
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data ?? []) as unknown as Order[]);
    } catch (err: any) {
      toast.error(`تعذر جلب الطلبات: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    // الاشتراك اللحظي الفوري لجدول الطلبات (Supabase Realtime)
    const channel = supabase
      .channel("admin-orders-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const newOrder = payload.new as Order;
        setOrders((prev) => [newOrder, ...prev]);
        playNewOrderSound();
        toast.success(
          `🎉 وصل طلب جديد الآن من ${newOrder.customer_name || "عميل"} بقيمة ${newOrder.total_price} ج.م!`,
          {
            duration: 6000,
          },
        );
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        const updated = payload.new as Order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // تحديث حالة الطلب
  const setStatus = async (
    id: string,
    newStatus: string,
    driverInfo?: { driver_name: string; driver_phone: string },
  ) => {
    const prev = orders;
    setOrders((p) =>
      p.map((o) => (o.id === id ? { ...o, status: newStatus, ...(driverInfo || {}) } : o)),
    );

    try {
      const payload: any = { status: newStatus };
      if (driverInfo) {
        payload.notes = `الموصل: ${driverInfo.driver_name} (${driverInfo.driver_phone})`;
      }

      const { error } = await supabase.from("orders").update(payload).eq("id", id);
      if (error) throw error;

      toast.success(`تم تحديث حالة الطلب إلى: ${STATUSES.find((s) => s.key === newStatus)?.label}`);
    } catch (err: any) {
      toast.error(`فشل تحديث الحالة: ${err.message}`);
      setOrders(prev);
    }
  };

  // فتح حوار التوصيل وإسناد الموصل
  const handleStartDelivery = (order: Order) => {
    setAssigningOrder(order);
  };

  const confirmDeliveryAssignment = () => {
    if (!assigningOrder || !selectedDriver) return;
    setStatus(assigningOrder.id, "delivering", {
      driver_name: selectedDriver.name,
      driver_phone: selectedDriver.phone,
    });
    setAssigningOrder(null);
  };

  // طباعة الفاتورة الفورية
  const printReceipt = (o: Order) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html dir="rtl">
        <head>
          <title>إيصال طلب #${o.id.slice(0, 8)}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; max-width: 380px; margin: 0 auto; color: #000; }
            h2 { text-align: center; margin-bottom: 4px; }
            p { margin: 2px 0; font-size: 12px; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { text-align: right; padding: 4px 0; }
            .total { font-weight: bold; font-size: 14px; text-align: left; }
          </style>
        </head>
        <body>
          <h2>🛒 المتجر التمويني الفاخر</h2>
          <p style="text-align: center;">إيصال تجميع وتوصيل الطلب</p>
          <div class="line"></div>
          <p><b>رقم الطلب:</b> #${o.id.slice(0, 8)}</p>
          <p><b>التاريخ:</b> ${new Date(o.created_at).toLocaleString("ar-EG")}</p>
          <p><b>العميل:</b> ${o.customer_name}</p>
          <p><b>الهاتف:</b> ${o.phone}</p>
          <p><b>العنوان:</b> ${o.address}</p>
          <div class="line"></div>
          <table>
            <thead>
              <tr><th>الصنف</th><th>الكمية</th><th>السعر</th></tr>
            </thead>
            <tbody>
              ${(o.items || [])
                .map(
                  (it) => `
                <tr>
                  <td>${it.name}</td>
                  <td>${it.quantity} ${it.unit_label || ""}</td>
                  <td>${it.subtotal} ج.م</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div class="line"></div>
          <p class="total">الإجمالي المستحق: ${o.total_price} ج.م</p>
          <div class="line"></div>
          <p style="text-align: center; font-size: 10px; margin-top: 15px;">شكراً لتسوقكم معنا!</p>
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  // تصدير الطلبات كملف Excel
  const exportXlsx = (rows: Order[]) => {
    const data = rows.map((o) => ({
      "رقم الطلب": o.id.slice(0, 8),
      التاريخ: new Date(o.created_at).toLocaleString("ar-EG"),
      "اسم العميل": o.customer_name,
      الهاتف: o.phone,
      العنوان: o.address,
      "إجمالي المبلغ (ج.م)": o.total_price,
      الحالة: STATUSES.find((s) => s.key === o.status)?.label ?? o.status,
      "عدد الأصناف": o.items?.length ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] ?? {}).map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, `orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // التصفية والفلترة
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.customer_name?.toLowerCase().includes(q) ||
        o.phone?.includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.address?.toLowerCase().includes(q),
    );
  }, [orders, searchQuery]);

  const grouped = useMemo(() => {
    const m: Record<string, Order[]> = {};
    for (const s of STATUSES) m[s.key] = [];
    for (const o of filteredOrders) (m[o.status] ?? (m[o.status] = [])).push(o);
    return m;
  }, [filteredOrders]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-4 sm:p-6 pb-24"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-sm">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-black text-foreground">
                إدارة الطلبات وتتبع الموصل اللحظي 🚚
              </h1>
              <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                <Radio className="h-3 w-3" /> بَث لحظي مفعّل
              </span>
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-0.5">
              متابعة الطلبات القادمة فوراً، إسناد الموصلين، والتتبع اللحظي للخرائط المظلمة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => exportXlsx(orders)}
            variant="outline"
            className="rounded-2xl border-border font-bold text-xs gap-2 h-10"
          >
            <Download className="h-4 w-4" />
            <span>تصدير Excel</span>
          </Button>
          <Button
            onClick={load}
            variant="secondary"
            size="icon"
            className="rounded-2xl h-10 w-10"
            title="تحديث البيانات"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Control Bar: Search & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/70 p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم العميل، رقم الهاتف أو معرف الطلب..."
            className="ps-9 h-10 rounded-xl font-bold text-xs bg-background"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-extrabold text-muted-foreground bg-secondary/60 px-4 py-2 rounded-xl border border-border/40 w-full sm:w-auto justify-between">
          <span>
            إجمالي الطلبات: <strong className="text-foreground">{orders.length}</strong>
          </span>
          <span className="text-emerald-500 font-black">
            إجمالي المبيعات:{" "}
            {orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0).toFixed(2)} ج.م
          </span>
        </div>
      </div>

      {/* Tabs list */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto p-1 bg-card border border-border/70 rounded-2xl">
          {STATUSES.map((s) => (
            <TabsTrigger
              key={s.key}
              value={s.key}
              className="text-xs font-extrabold py-2.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>{s.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${s.color}`}
              >
                {grouped[s.key]?.length ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUSES.map((s) => (
          <TabsContent key={s.key} value={s.key}>
            {loading ? (
              <OrderSkeletonList />
            ) : (grouped[s.key] ?? []).length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-border p-12 text-center space-y-3 bg-card/40">
                <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h3 className="font-display text-base font-bold text-foreground">
                  لا توجد طلبات في هذه الحالة حالياً
                </h3>
                <p className="text-xs text-muted-foreground">
                  عند استلام أية طلبات جديدة ستظهر فوراً في هذه القائمة
                </p>
              </div>
            ) : (
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
                }}
                initial="hidden"
                animate="show"
                className="space-y-3"
              >
                {(grouped[s.key] ?? []).map((o) => (
                  <motion.div
                    key={o.id}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs hover:border-primary/40 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20">
                            #{o.id.slice(0, 8)}
                          </span>
                          <h3 className="font-display text-base font-black text-foreground">
                            {o.customer_name}
                          </h3>
                          <div className="relative">
                            <select
                              value={o.status}
                              onChange={(e) => setStatus(o.id, e.target.value)}
                              className={`text-[11px] font-black px-3 py-1 rounded-xl border appearance-none cursor-pointer pe-7 transition-all ${s.color}`}
                            >
                              {STATUSES.map((st) => (
                                <option
                                  key={st.key}
                                  value={st.key}
                                  className="bg-card text-foreground font-bold"
                                >
                                  {st.label}
                                </option>
                              ))}
                            </select>
                            <span className="absolute end-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">
                              ▼
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-bold">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-emerald-500" /> {o.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-amber-500" /> {o.address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />{" "}
                            {new Date(o.created_at).toLocaleString("ar-EG")}
                          </span>
                        </div>
                      </div>

                      <div className="text-start sm:text-end bg-secondary/40 p-2.5 rounded-2xl border border-border/50 shrink-0">
                        <div className="text-[10px] text-muted-foreground font-bold">
                          إجمالي الطلب
                        </div>
                        <div className="font-display text-lg font-black text-primary">
                          {Number(o.total_price || 0).toFixed(2)} ج.م
                        </div>
                        <div className="text-[10px] text-muted-foreground font-extrabold">
                          {o.items?.length ?? 0} أصناف مختلفة
                        </div>
                      </div>
                    </div>

                    {/* Order Notes / Substitution Policy / Driver Info */}
                    {o.notes && (
                      <div className="space-y-1.5">
                        {o.notes.includes("الاتصال هاتفياً") ? (
                          <div className="text-xs bg-amber-500/15 text-amber-900 dark:text-amber-200 p-2.5 rounded-xl border border-amber-500/30 font-bold flex items-center gap-2">
                            <PhoneCall className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>
                              <strong>تعليمات التجهيز:</strong> اتصل هاتفياً بالعميل ({o.phone}) عند
                              نقص أي صنف لاعتماد البديل 📞
                            </span>
                          </div>
                        ) : o.notes.includes("أفضل بديل") ? (
                          <div className="text-xs bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 p-2.5 rounded-xl border border-emerald-500/30 font-bold flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>
                              <strong>تعليمات التجهيز:</strong> استبدل الأصناف الناقصة بأفضل بديل
                              متاح بنفس السعر والجودة تلقائياً ⚡
                            </span>
                          </div>
                        ) : o.notes.includes("عدم الاستبدال") ? (
                          <div className="text-xs bg-rose-500/15 text-rose-900 dark:text-rose-200 p-2.5 rounded-xl border border-rose-500/30 font-bold flex items-center gap-2">
                            <Ban className="h-4 w-4 text-rose-600 shrink-0" />
                            <span>
                              <strong>تعليمات التجهيز:</strong> لا تقم باستبدال أي صنف ناقص — احذف
                              الصنف وعدل قيمة الفاتورة 🚫
                            </span>
                          </div>
                        ) : null}

                        {/* ملاحظات العميل الخاصة */}
                        {o.notes
                          .split("\n")
                          .filter((line: string) => !line.startsWith("[تفضيل البديل:"))
                          .join("\n")
                          .trim() && (
                          <div className="text-xs bg-secondary/60 text-foreground p-2.5 rounded-xl border border-border/60 font-semibold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>
                              <strong>ملاحظات العميل:</strong>{" "}
                              {o.notes
                                .split("\n")
                                .filter((line: string) => !line.startsWith("[تفضيل البديل:"))
                                .join("\n")
                                .trim()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreview(o)}
                          className="rounded-xl text-xs font-bold gap-1.5 h-9"
                        >
                          <Eye className="h-3.5 w-3.5 text-primary" /> تفاصيل الأصناف
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printReceipt(o)}
                          className="rounded-xl text-xs font-bold gap-1.5 h-9"
                        >
                          <Printer className="h-3.5 w-3.5 text-muted-foreground" /> طباعة الإيصال
                        </Button>

                        {o.status === "delivering" && (
                          <Button
                            size="sm"
                            onClick={() => setTrackingOrder(o)}
                            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black gap-1.5 h-9 shadow-md animate-bounce"
                          >
                            <Navigation className="h-3.5 w-3.5" /> تتبع الموصل اللحظي 📍
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {s.key === "processing" && (
                          <Button
                            size="sm"
                            onClick={() => handleStartDelivery(o)}
                            className="rounded-xl hero-gradient text-primary-foreground font-black text-xs gap-1.5 h-9 shadow-md"
                          >
                            <Truck className="h-3.5 w-3.5" /> إسناد موصل وبدء التوصيل 🚚
                          </Button>
                        )}

                        {s.next && s.key !== "processing" && (
                          <Button
                            size="sm"
                            onClick={() => setStatus(o.id, s.next!)}
                            className="rounded-xl hero-gradient text-primary-foreground font-black text-xs gap-1.5 h-9 shadow-md"
                          >
                            <ArrowRightCircle className="h-3.5 w-3.5" />
                            نقل إلى: {STATUSES.find((x) => x.key === s.next)?.label}
                          </Button>
                        )}

                        {o.status !== "cancelled" && o.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatus(o.id, "cancelled")}
                            className="rounded-xl text-destructive hover:bg-destructive/10 font-bold text-xs h-9"
                          >
                            <X className="h-3.5 w-3.5" /> إلغاء الطلب
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal 1: Details Preview Dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent
          dir="rtl"
          className="max-w-lg rounded-3xl p-6 bg-card border-border shadow-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-black flex items-center justify-between">
              <span>تفاصيل الطلب #{preview?.id.slice(0, 8)}</span>
              <span className="text-xs font-bold text-primary font-mono">
                {preview?.created_at ? new Date(preview.created_at).toLocaleString("ar-EG") : ""}
              </span>
            </DialogTitle>
          </DialogHeader>

          {preview && (
            <div className="space-y-4 pt-2">
              <div className="bg-secondary/40 p-3 rounded-2xl border border-border/50 space-y-1 text-xs font-bold">
                <p>
                  <strong>اسم العميل:</strong> {preview.customer_name}
                </p>
                <p>
                  <strong>رقم الهاتف:</strong> {preview.phone}
                </p>
                <p>
                  <strong>عنوان التوصيل:</strong> {preview.address}
                </p>
              </div>

              {preview.notes && (
                <div className="space-y-1.5">
                  {preview.notes.includes("الاتصال هاتفياً") ? (
                    <div className="text-xs bg-amber-500/15 text-amber-900 dark:text-amber-200 p-2.5 rounded-xl border border-amber-500/30 font-bold flex items-center gap-2">
                      <PhoneCall className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>تعليمات التجهيز:</strong> الاتصال بالعميل قبل استبدال أي صنف
                      </span>
                    </div>
                  ) : preview.notes.includes("أفضل بديل") ? (
                    <div className="text-xs bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 p-2.5 rounded-xl border border-emerald-500/30 font-bold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>تعليمات التجهيز:</strong> اختيار أفضل بديل متاح بنفس الجودة والسعر
                      </span>
                    </div>
                  ) : preview.notes.includes("عدم الاستبدال") ? (
                    <div className="text-xs bg-rose-500/15 text-rose-900 dark:text-rose-200 p-2.5 rounded-xl border border-rose-500/30 font-bold flex items-center gap-2">
                      <Ban className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>
                        <strong>تعليمات التجهيز:</strong> عدم استبدال أي صنف وحذف الناقص من الفاتورة
                      </span>
                    </div>
                  ) : null}

                  {preview.notes
                    .split("\n")
                    .filter((line: string) => !line.startsWith("[تفضيل البديل:"))
                    .join("\n")
                    .trim() && (
                    <div className="text-xs bg-secondary/60 text-foreground p-2.5 rounded-xl border border-border/60 font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        <strong>ملاحظات العميل:</strong>{" "}
                        {preview.notes
                          .split("\n")
                          .filter((line: string) => !line.startsWith("[تفضيل البديل:"))
                          .join("\n")
                          .trim()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-black text-foreground block">
                  الأصناف المطلوبة ({preview.items?.length || 0}):
                </span>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {(preview.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background text-xs font-bold"
                    >
                      <div>
                        <span className="text-foreground">{item.name}</span>
                        <span className="text-muted-foreground block text-[10px]">
                          {item.quantity} {item.unit_label || "قطعة"} ×{" "}
                          {item.price_per_unit || (item.subtotal / (item.quantity || 1)).toFixed(2)}{" "}
                          ج.م
                        </span>
                      </div>
                      <span className="text-primary font-black font-mono">{item.subtotal} ج.م</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/60 pt-3 flex justify-between items-center font-black">
                <span>الإجمالي الكلي:</span>
                <span className="text-xl text-primary font-mono">{preview.total_price} ج.م</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setPreview(null)}
              className="w-full rounded-xl hero-gradient text-primary-foreground font-bold text-xs"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Assign Driver Modal */}
      <Dialog open={!!assigningOrder} onOpenChange={(o) => !o && setAssigningOrder(null)}>
        <DialogContent
          dir="rtl"
          className="max-w-md rounded-3xl p-6 bg-card border-border shadow-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-black flex items-center gap-2">
              <Truck className="h-5 w-5 text-emerald-500" />
              <span>إسناد موصل الطلب #{assigningOrder?.id.slice(0, 8)}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground font-bold">
              اختر أحد كباتن التوصيل المتاحين فوراً لإرسال الطلب وإطلاق الخريطة اللحظية:
            </p>

            <div className="space-y-2">
              {DRIVERS_LIST.map((driver) => (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedDriver?.id === driver.id
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-border/80 bg-background"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{driver.avatar}</span>
                    <div>
                      <h4 className="font-black text-xs text-foreground">{driver.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        {driver.vehicle} • {driver.phone}
                      </p>
                    </div>
                  </div>
                  {selectedDriver?.id === driver.id && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="ghost"
              onClick={() => setAssigningOrder(null)}
              className="rounded-xl text-xs font-bold"
            >
              إلغاء
            </Button>
            <Button
              onClick={confirmDeliveryAssignment}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs gap-1.5 px-5"
            >
              تأكيد وإرسال الموصل 🚚
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: GPS Live Tracking Simulator Dialog */}
      {trackingOrder && (
        <GPSTrackingSimulatorModal order={trackingOrder} onClose={() => setTrackingOrder(null)} />
      )}
    </motion.div>
  );
}

// مكون محاكي الخريطة التفاعلية اللحظية لتتبع الموصل
function GPSTrackingSimulatorModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);

  const [eta, setEta] = useState(12); // minutes
  const [speed, setSpeed] = useState(26); // km/h
  const [moving, setMoving] = useState(true);

  // Store coordinates & customer destination coordinates (Cairo default)
  const storePos = [30.0444, 31.2357];
  const targetPos = [30.052, 31.248];

  const [currentPos, setCurrentPos] = useState<[number, number]>([
    storePos[0] + 0.002,
    storePos[1] + 0.003,
  ]);

  useEffect(() => {
    let active = true;

    const initMap = async () => {
      // Load Leaflet map
      if (!window.L) {
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        await new Promise<void>((resolve) => {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          s.onload = () => resolve();
          document.head.appendChild(s);
        });
      }

      if (!active || !mapContainerRef.current) return;
      const L = window.L;

      const map = L.map(mapContainerRef.current, {
        center: currentPos,
        zoom: 15,
        zoomControl: false,
      });

      // Dark Mode Tiles
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "OpenStreetMap & CARTO",
        maxZoom: 19,
      }).addTo(map);

      // Store Marker (Green)
      const storeIcon = L.divIcon({
        className: "custom-store-pin",
        html: `<div style="background-color: #10b981; color: white; border-radius: 50%; padding: 4px; font-size: 14px; text-align: center; border: 2px solid white; box-shadow: 0 0 10px rgba(16,185,129,0.8);">🏪</div>`,
        iconSize: [28, 28],
      });
      L.marker(storePos, { icon: storeIcon }).addTo(map).bindPopup("المتجر الرئيسي");

      // Customer Marker (Red/Amber)
      const customerIcon = L.divIcon({
        className: "custom-customer-pin",
        html: `<div style="background-color: #f59e0b; color: white; border-radius: 50%; padding: 4px; font-size: 14px; text-align: center; border: 2px solid white; box-shadow: 0 0 10px rgba(245,158,11,0.8);">🏠</div>`,
        iconSize: [28, 28],
      });
      L.marker(targetPos, { icon: customerIcon }).addTo(map).bindPopup("عنوان العميل");

      // Driver Bike Marker (Moving)
      const driverIcon = L.divIcon({
        className: "custom-driver-pin",
        html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; padding: 6px; font-size: 16px; text-align: center; border: 3px solid white; box-shadow: 0 0 15px rgba(59,130,246,0.9);">🛵</div>`,
        iconSize: [36, 36],
      });
      const driverMarker = L.marker(currentPos, { icon: driverIcon }).addTo(map);

      // Draw Polyline route
      L.polyline([storePos, currentPos, targetPos], {
        color: "#3b82f6",
        weight: 4,
        dashArray: "8, 8",
      }).addTo(map);

      mapRef.current = map;
      driverMarkerRef.current = driverMarker;
    };

    initMap();

    return () => {
      active = false;
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (_) {}
      }
    };
  }, []);

  // Simulation Interval moving driver towards destination
  useEffect(() => {
    if (!moving) return;

    const interval = setInterval(() => {
      setCurrentPos((prev) => {
        const nextLat = prev[0] + (targetPos[0] - prev[0]) * 0.08;
        const nextLng = prev[1] + (targetPos[1] - prev[1]) * 0.08;

        if (driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([nextLat, nextLng]);
          if (mapRef.current) mapRef.current.panTo([nextLat, nextLng]);
        }

        setEta((prevEta) => Math.max(1, prevEta - 0.2));
        setSpeed(20 + Math.floor(Math.random() * 12));

        return [nextLat, nextLng];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [moving]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        dir="rtl"
        className="max-w-2xl rounded-3xl p-6 bg-card border-border shadow-2xl space-y-4"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-500 animate-spin" />
              <span>تتبع الموصل اللحظي — طلب #{order.id.slice(0, 8)}</span>
            </div>
            <span className="text-xs font-bold bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded-full border border-blue-500/20">
              بَث حي GPS 📡
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Status Stats Bar */}
        <div className="grid grid-cols-3 gap-3 bg-secondary/50 p-3 rounded-2xl border border-border/60 text-center text-xs">
          <div>
            <span className="text-muted-foreground font-bold block">الوقت المتبقي (ETA)</span>
            <strong className="text-base text-emerald-500 font-mono font-black">
              {Math.ceil(eta)} دقائق
            </strong>
          </div>
          <div>
            <span className="text-muted-foreground font-bold block">السرعة الحالية</span>
            <strong className="text-base text-blue-500 font-mono font-black">{speed} كم/س</strong>
          </div>
          <div>
            <span className="text-muted-foreground font-bold block">حالة الطريق</span>
            <strong className="text-base text-amber-500 font-bold">سلس وسريع ⚡</strong>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative h-72 w-full rounded-2xl overflow-hidden border border-border bg-black">
          <div ref={mapContainerRef} className="h-full w-full z-0" />
          <div className="absolute top-3 start-3 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/60 text-xs font-bold text-foreground flex items-center gap-2 z-10 shadow-md">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>الكابتن في الطريق للعميل</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-bold text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span>الموصل: {order.notes?.replace("الموصل: ", "") || "الكابتن أحمد علي"}</span>
          </div>
          <Button
            onClick={onClose}
            className="rounded-xl hero-gradient text-primary-foreground font-bold text-xs px-6"
          >
            إغلاق الخريطة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrderSkeletonList() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32 w-full rounded-3xl" />
      ))}
    </div>
  );
}
