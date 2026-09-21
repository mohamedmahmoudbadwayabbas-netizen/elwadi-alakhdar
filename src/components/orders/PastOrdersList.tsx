import React, { useState, useEffect, useMemo } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Copy,
  Check,
  RefreshCw,
  ShoppingBag,
  Truck,
  MapPin,
  CreditCard,
  Ban,
  AlertCircle,
  PhoneCall,
  Sparkles,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-loose";
import { fetchOrdersWithItems, type OrderView, type OrderItemView } from "@/services/orderDataService";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderRatingSection } from "./OrderRatingSection";

export interface PastOrdersListProps {
  /** User ID to fetch orders for. If omitted, uses the currently logged-in user from useAuth() */
  userId?: string;
  /** Maximum number of orders to display */
  limit?: number;
  /** Whether to show the status progress stepper for orders */
  showStepper?: boolean;
  /** Whether to show the filter pills (All, Active, Completed, Cancelled) */
  showFilters?: boolean;
  /** Optional title override */
  title?: string;
  /** Extra container CSS classes */
  className?: string;
  /** Callback when an order is clicked */
  onSelectOrder?: (order: OrderView) => void;
  /** Empty state customization */
  emptyStateAction?: {
    label: string;
    to: string;
  };
}

/**
 * Maps Supabase order status to human-readable Arabic text, color tokens, and icon
 */
function getOrderStatusConfig(status: string): {
  label: string;
  variantClass: string;
  borderClass: string;
  icon: React.ComponentType<{ className?: string }>;
  isOngoing: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
} {
  const normalized = (status || "pending").toLowerCase();
  switch (normalized) {
    case "new":
      return {
        label: "طلب جديد",
        variantClass: "bg-primary/10 text-primary border-primary/25",
        borderClass: "border-primary/30",
        icon: Sparkles,
        isOngoing: true,
        isCompleted: false,
        isCancelled: false,
      };
    case "pending":
      return {
        label: "قيد المراجعة",
        variantClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
        borderClass: "border-amber-500/30",
        icon: Clock,
        isOngoing: true,
        isCompleted: false,
        isCancelled: false,
      };
    case "confirmed":
      return {
        label: "تم التأكيد",
        variantClass: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
        borderClass: "border-blue-500/30",
        icon: CheckCircle2,
        isOngoing: true,
        isCompleted: false,
        isCancelled: false,
      };
    case "preparing":
      return {
        label: "قيد التجهيز",
        variantClass: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25",
        borderClass: "border-purple-500/30",
        icon: Package,
        isOngoing: true,
        isCompleted: false,
        isCancelled: false,
      };
    case "delivering":
      return {
        label: "جاري التوصيل",
        variantClass: "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/25",
        borderClass: "border-teal-500/30",
        icon: Truck,
        isOngoing: true,
        isCompleted: false,
        isCancelled: false,
      };
    case "delivered":
      return {
        label: "تم التسليم",
        variantClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
        borderClass: "border-emerald-500/30",
        icon: CheckCircle2,
        isOngoing: false,
        isCompleted: true,
        isCancelled: false,
      };
    case "cancelled":
      return {
        label: "ملغي",
        variantClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
        borderClass: "border-rose-500/30",
        icon: Ban,
        isOngoing: false,
        isCompleted: false,
        isCancelled: true,
      };
    case "partially_delivered":
      return {
        label: "تم التسليم جزئياً",
        variantClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25",
        borderClass: "border-amber-500/30",
        icon: Package,
        isOngoing: true,
        isCompleted: false,
        isCancelled: false,
      };
    case "delivery_failed":
      return {
        label: "تعذر التسليم",
        variantClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
        borderClass: "border-rose-500/30",
        icon: AlertCircle,
        isOngoing: false,
        isCompleted: false,
        isCancelled: true,
      };
    default:
      return {
        label: status || "غير محدد",
        variantClass: "bg-muted text-muted-foreground border-border",
        borderClass: "border-border",
        icon: Package,
        isOngoing: false,
        isCompleted: false,
        isCancelled: false,
      };
  }
}

/**
 * Formats order date in Arabic with calendar date and hour
 */
function formatOrderDate(dateString: string): { fullDate: string; time: string; relativeDay: string } {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return { fullDate: "تاريخ غير متوفر", time: "", relativeDay: "" };
    }

    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    let relativeDay = "";
    if (isToday) relativeDay = "اليوم";
    else if (isYesterday) relativeDay = "أمس";

    const fullDate = d.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const time = d.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return { fullDate, time, relativeDay };
  } catch {
    return { fullDate: dateString, time: "", relativeDay: "" };
  }
}

function OrderProgressStepper({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="my-2 flex items-center gap-2 rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-2.5 text-xs font-bold text-rose-700 dark:text-rose-400">
        <Ban className="h-4 w-4 shrink-0" />
        <span>تم إلغاء هذا الطلب</span>
      </div>
    );
  }

  const steps = [
    { key: "pending", label: "تم الاستلام" },
    { key: "confirmed", label: "مؤكد" },
    { key: "preparing", label: "قيد التجهيز" },
    { key: "delivering", label: "جاري التوصيل" },
    { key: "delivered", label: "تم التسليم" },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case "new":
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "preparing":
        return 2;
      case "delivering":
      case "shipped":
      case "partially_delivered":
        return 3;
      case "delivered":
        return 4;
      default:
        return 0;
    }
  };

  const currentIdx = getStepIndex(status);

  return (
    <div className="my-3 px-1">
      <div className="relative flex items-center justify-between">
        <div className="absolute top-1/2 inset-x-4 h-1 -translate-y-1/2 bg-secondary -z-0" />
        <div
          className="absolute top-1/2 start-4 h-1 -translate-y-1/2 bg-primary transition-all duration-500 -z-0"
          style={{ width: `${(currentIdx / (steps.length - 1)) * 88}%` }}
        />

        {steps.map((st, idx) => {
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div
              key={st.key}
              className="relative z-10 flex flex-col items-center gap-1 bg-card px-1"
            >
              <div
                className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-black transition-all ${
                  isDone
                    ? "bg-primary text-primary-foreground shadow-xs scale-105"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] font-bold ${
                  isCurrent ? "text-primary font-black" : "text-muted-foreground"
                }`}
              >
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type FilterTab = "all" | "ongoing" | "completed" | "cancelled";

export function PastOrdersList({
  userId: propUserId,
  limit,
  showStepper = true,
  showFilters = true,
  title,
  className = "",
  onSelectOrder,
  emptyStateAction,
}: PastOrdersListProps) {
  const { user: authUser, loading: authLoading } = useAuth();
  const effectiveUserId = propUserId || authUser?.id;
  const qc = useQueryClient();
  const router = useRouter();
  const { addItem } = useCart();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. Fetch past orders for this user using Supabase
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["past-orders", effectiveUserId, limit],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      return fetchOrdersWithItems({
        userId: effectiveUserId,
        limit,
      });
    },
    enabled: Boolean(effectiveUserId),
    staleTime: 1000 * 30, // 30 seconds
  });

  // 2. Real-time updates from Supabase postgres_changes
  useEffect(() => {
    if (!effectiveUserId) return;

    const channel = supabase
      .channel(`realtime-past-orders-${effectiveUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${effectiveUserId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["past-orders", effectiveUserId] });
          qc.invalidateQueries({ queryKey: ["my-orders", effectiveUserId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveUserId, qc]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success("تم تحديث قائمة الطلبات");
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const copyOrderId = (id: string) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    toast.success("تم نسخ رقم الطلب بنجاح");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Cancel order handler
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟")) return;
    if (!effectiveUserId) return;

    setCancellingOrderId(orderId);
    try {
      const { error: cancelError } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .eq("user_id", effectiveUserId);

      if (cancelError) throw cancelError;

      toast.success("تم إلغاء الطلب بنجاح");
      qc.invalidateQueries({ queryKey: ["past-orders", effectiveUserId] });
      qc.invalidateQueries({ queryKey: ["my-orders", effectiveUserId] });
    } catch (err: any) {
      toast.error(err?.message || "تعذر إلغاء الطلب حالياً، يرجى التواصل مع خدمة العملاء");
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Reorder items into cart
  const handleReorder = (order: OrderView) => {
    if (!order.items || order.items.length === 0) {
      toast.error("لا توجد أصناف في هذا الطلب لإعادة إضافتها");
      return;
    }

    let addedCount = 0;
    for (const item of order.items) {
      const prodId = item.product_id || item.id || `reorder-${item.name.replace(/\s+/g, "-")}`;
      addItem(
        {
          id: prodId,
          name: item.name,
          price_per_unit: item.price ?? 0,
          is_by_weight: item.is_by_weight ?? false,
          unit_label: item.unit_label ?? (item.is_by_weight ? "كجم" : "قطعة"),
          category_id: "",
          description: null,
          old_price: null,
          image_url: null,
          stock_quantity: 100,
        } as any,
        item.quantity || 1,
      );
      addedCount++;
    }

    if (addedCount > 0) {
      toast.success(`تمت إضافة ${addedCount} أصناف من هذا الطلب إلى سلتك 🛒`, {
        action: {
          label: "عرض السلة",
          onClick: () => router.history.push("/cart"),
        },
      });
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    return orders.filter((o) => {
      const cfg = getOrderStatusConfig(o.status);
      if (activeTab === "ongoing") return cfg.isOngoing;
      if (activeTab === "completed") return cfg.isCompleted;
      if (activeTab === "cancelled") return cfg.isCancelled;
      return true;
    });
  }, [orders, activeTab]);

  // Counts for each tab
  const tabCounts = useMemo(() => {
    let ongoing = 0;
    let completed = 0;
    let cancelled = 0;
    for (const o of orders) {
      const cfg = getOrderStatusConfig(o.status);
      if (cfg.isOngoing) ongoing++;
      else if (cfg.isCompleted) completed++;
      else if (cfg.isCancelled) cancelled++;
    }
    return {
      all: orders.length,
      ongoing,
      completed,
      cancelled,
    };
  }, [orders]);

  // State: Authentication Check
  if (!authLoading && !effectiveUserId) {
    return (
      <Card className={`rounded-3xl border border-border p-8 text-center bg-card ${className}`}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground mb-4">
          <Package className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground mb-1.5">
          سجل طلباتك السابقة
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5 leading-relaxed">
          يرجى تسجيل الدخول إلى حسابك لمشاهدة جميع طلباتك السابقة ومتابعة حالتها في الوقت الفعلي.
        </p>
        <Link to="/auth">
          <Button className="rounded-xl px-6 text-xs font-black">تسجيل الدخول 🔑</Button>
        </Link>
      </Card>
    );
  }

  return (
    <section aria-label="قائمة الطلبات السابقة" className={`space-y-4 ${className}`} dir="rtl">
      {/* ─── Header & Filters ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Package className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-base sm:text-lg font-black text-foreground">
              {title || "طلباتي السابقة"}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {isLoading ? "جاري تحميل الطلبات..." : `${orders.length} طلب مسجل في حسابك`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading || isRefreshing}
            className="h-8 gap-1.5 rounded-xl border-border px-3 text-xs font-bold"
            title="تحديث القائمة"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </Button>
        </div>
      </div>

      {/* ─── Filter Tabs ─── */}
      {showFilters && orders.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            الكل ({tabCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ongoing")}
            className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "ongoing"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            جارية ({tabCounts.ongoing})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "completed"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            مكتملة ({tabCounts.completed})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              activeTab === "cancelled"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            ملغية ({tabCounts.cancelled})
          </button>
        </div>
      )}

      {/* ─── Loading Skeletons ─── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="rounded-3xl border border-border/70 p-5 bg-card space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32 rounded-lg" />
                  <Skeleton className="h-4 w-44 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-24 rounded-lg" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Error State ─── */}
      {isError && (
        <Card className="rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 p-6 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600 dark:text-rose-400" />
          <div>
            <h4 className="font-bold text-sm text-foreground">تعذر تحميل قائمة الطلبات</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {(error as any)?.message || "حدث خطأ أثناء الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="rounded-xl border-border text-xs font-bold"
          >
            إعادة المحاولة
          </Button>
        </Card>
      )}

      {/* ─── Empty State (No orders at all) ─── */}
      {!isLoading && !isError && orders.length === 0 && (
        <Card className="rounded-3xl border border-border/80 p-8 sm:p-12 text-center bg-card">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-1.5">
            لا توجد لديك طلبات سابقة حتى الآن
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
            عندما تقوم بالطلب من سوبرماركت الوادي الأخضر، ستظهر جميع تفاصيل طلباتك ومتابعتها لحظة بلحظة هنا.
          </p>
          <Link to={emptyStateAction?.to || "/"}>
            <Button className="rounded-xl px-6 py-2.5 text-xs font-black shadow-sm gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>{emptyStateAction?.label || "تسوّق الآن وابدأ طلبك الأول"}</span>
            </Button>
          </Link>
        </Card>
      )}

      {/* ─── Empty State for Filter Tab ─── */}
      {!isLoading && !isError && orders.length > 0 && filteredOrders.length === 0 && (
        <Card className="rounded-3xl border border-border/60 p-6 text-center bg-card">
          <p className="text-xs text-muted-foreground font-semibold">
            لا توجد طلبات تطابق التصنيف المختار ({activeTab}).
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setActiveTab("all")}
            className="text-primary text-xs font-bold mt-1"
          >
            عرض جميع الطلبات
          </Button>
        </Card>
      )}

      {/* ─── Orders List ─── */}
      {!isLoading && !isError && filteredOrders.length > 0 && (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const statusCfg = getOrderStatusConfig(order.status);
            const StatusIcon = statusCfg.icon;
            const { fullDate, time, relativeDay } = formatOrderDate(order.created_at);
            const isExpanded = expandedOrderIds.has(order.id);
            const items = order.items || [];
            const canCancel = ["new", "pending", "confirmed"].includes(order.status.toLowerCase());
            const totalAmount = Number(order.total_amount ?? 0);

            return (
              <Card
                key={order.id}
                id={`past-order-${order.id}`}
                className={`overflow-hidden rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-md ${
                  statusCfg.borderClass
                }`}
                onClick={() => onSelectOrder?.(order)}
              >
                {/* Header Row: ID, Date, Status, Total */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-3.5">
                  <div className="space-y-1.5">
                    {/* Order ID & Status Badge */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-black text-foreground">
                        طلب #{order.id.slice(0, 8)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyOrderId(order.id);
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
                        title="نسخ رقم الطلب كاملاً"
                      >
                        {copiedId === order.id ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Status Badge */}
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black ${statusCfg.variantClass}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        <span>{statusCfg.label}</span>
                      </Badge>
                    </div>

                    {/* Order Date & Time */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{fullDate}</span>
                        {relativeDay && (
                          <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-bold">
                            ({relativeDay})
                          </span>
                        )}
                      </div>
                      {time && (
                        <div className="flex items-center gap-1 border-r border-border pr-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{time}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total Amount & Payment Method */}
                  <div className="text-start sm:text-end">
                    <div className="font-display text-lg sm:text-xl font-black text-primary">
                      {totalAmount.toFixed(2)} ج.م
                    </div>
                    <div className="text-[11px] text-muted-foreground font-semibold flex items-center sm:justify-end gap-1">
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {order.payment_method === "cod"
                          ? "الدفع عند الاستلام"
                          : order.payment_method === "instapay"
                            ? "إنستاباي"
                            : order.payment_method === "card"
                              ? "بطاقة بنكية"
                              : order.payment_method || "دفع نقدًا"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Stepper for active or expanded orders */}
                {showStepper && (statusCfg.isOngoing || isExpanded) && (
                  <OrderProgressStepper status={order.status} />
                )}

                {/* Sub-info: Delivery Method & Items Summary */}
                <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      {order.delivery_method === "pickup" ? "استلام من الفرع" : "توصيل للمنزل"}
                    </span>
                    {items.length > 0 && (
                      <span className="flex items-center gap-1 border-r border-border pr-2 sm:pr-4">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {items.length} أصناف
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {/* Reorder Button */}
                    {items.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReorder(order);
                        }}
                        className="h-7 gap-1 rounded-xl text-[11px] font-bold text-primary hover:bg-primary/10 hover:text-primary"
                        title="إضافة منتجات هذا الطلب للسلة"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>إعادة الطلب</span>
                      </Button>
                    )}

                    {/* Cancel Order if eligible */}
                    {canCancel && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={cancellingOrderId === order.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelOrder(order.id);
                        }}
                        className="h-7 gap-1 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                      >
                        <Ban className="h-3 w-3" />
                        <span>{cancellingOrderId === order.id ? "جاري الإلغاء..." : "إلغاء الطلب"}</span>
                      </Button>
                    )}

                    {/* Expand/Collapse Items Toggle */}
                    {items.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(order.id);
                        }}
                        className="h-7 gap-1 rounded-xl border-border text-[11px] font-bold"
                      >
                        <span>{isExpanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Customer Order Rating Section (1 to 5 stars) */}
                <OrderRatingSection
                  order={order}
                  userId={effectiveUserId}
                />

                {/* Expanded Order Items List */}
                {isExpanded && items.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-border/60 space-y-2">
                    <div className="text-[11px] font-bold text-muted-foreground mb-1.5">
                      محتويات الطلب ({items.length} صنف):
                    </div>
                    <div className="space-y-1.5 rounded-2xl bg-secondary/30 p-2.5">
                      {items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-center justify-between gap-2 text-xs py-1 px-1 border-b border-border/40 last:border-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="grid h-5 w-5 place-items-center rounded bg-secondary text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-foreground truncate">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              × {item.quantity} {item.unit_label || "قطعة"}
                            </span>
                          </div>
                          <div className="font-mono text-xs font-bold text-foreground shrink-0">
                            {(Number(item.price || 0) * (item.quantity || 1)).toFixed(2)} ج.م
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery & Discount Breakdown if present */}
                    {(order.delivery_fee > 0 || order.discount_amount > 0) && (
                      <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] text-muted-foreground pt-1 px-1">
                        {order.delivery_fee > 0 && (
                          <span>رسوم التوصيل: {order.delivery_fee.toFixed(2)} ج.م</span>
                        )}
                        {order.discount_amount > 0 && (
                          <span className="text-primary font-bold">
                            الخصم: -{order.discount_amount.toFixed(2)} ج.م
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default PastOrdersList;
