import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Navigation,
  Phone,
  MapPin,
  CheckCircle2,
  Play,
  Pause,
  Truck,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertCircle,
  User,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton } from "@/components/ui/universal-skeleton";

type DriverOrder = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  total_price: number;
  status: string;
  created_at: string;
  notes?: string | null;
  items?: any[];
};

export const Route = createFileRoute("/driver")({
  head: () => ({
    meta: [
      { title: "بوابة الكابتن للتوصيل — سمارت ستور" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      },
    ],
  }),
  component: DriverPortalPage,
});

function DriverPortalPage() {
  const [driverName, setDriverName] = useState("الكابتن أحمد علي");
  const [driverPhone, setDriverPhone] = useState("01012345678");
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Active GPS Trip Tracking State
  const [activeTripOrderId, setActiveTripOrderId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: 30.0444,
    lng: 31.2357,
  });
  const intervalRef = useRef<any>(null);

  const fetchAssignedOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or("status.eq.delivering,status.eq.processing")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as DriverOrder[]) || []);
    } catch (err: any) {
      toast.error(`تعذر جلب التوصيلات: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedOrders();

    // Supabase Realtime subscription for assigned driver orders
    const channel = supabase
      .channel("driver-portal-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchAssignedOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Start Trip & GPS Simulation / Geolocation Tracker
  const startTrip = (orderId: string) => {
    setActiveTripOrderId(orderId);
    setIsTracking(true);
    toast.success("🚀 تم بدء الرحلة وتشغيل بَث إحداثيات الـ GPS للحساب السحابي فوراً!");

    // Check device geolocation or simulate GPS updates every 6 seconds
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      let lat = currentCoords.lat;
      let lng = currentCoords.lng;

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            lat = pos.coords.latitude;
            lng = pos.coords.longitude;
          },
          () => {
            // Fallback incremental step towards Cairo customer destination
            lat += (Math.random() - 0.4) * 0.0015;
            lng += (Math.random() - 0.4) * 0.0015;
          },
        );
      } else {
        lat += (Math.random() - 0.4) * 0.0015;
        lng += (Math.random() - 0.4) * 0.0015;
      }

      setCurrentCoords({ lat, lng });

      // Send to Supabase (update orders driver_lat / driver_lng or broadcast)
      try {
        await supabase
          .from("orders")
          .update({
            notes: `الموصل: ${driverName} (GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          })
          .eq("id", orderId);
      } catch (_) {}
    }, 6000);
  };

  const completeTrip = async (orderId: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsTracking(false);
    setActiveTripOrderId(null);

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("✅ تم تسليم الطلب بنجاح وتوثيق العملية في النظام!");
      fetchAssignedOrders();
    } catch (err: any) {
      toast.error(`تعذر إنهاء التوصيل: ${err.message}`);
    }
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground p-4 max-w-md mx-auto space-y-4 pb-20"
      dir="rtl"
    >
      {/* Mobile Top App Header */}
      <div className="flex items-center justify-between bg-card border border-border/70 p-4 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center text-xl font-black">
            🛵
          </div>
          <div>
            <h1 className="font-display font-black text-base">{driverName}</h1>
            <p className="text-xs text-muted-foreground font-bold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>جاهز واستقبال الطلبات</span>
            </p>
          </div>
        </div>

        <Button
          size="icon"
          variant="secondary"
          onClick={fetchAssignedOrders}
          className="rounded-2xl h-10 w-10"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* GPS Status Card if active */}
      <AnimatePresence>
        {isTracking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 rounded-3xl hero-gradient text-primary-foreground space-y-2 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 animate-spin text-emerald-300" />
                <span className="font-black text-xs">جاري التتبع الحي للـ GPS 📡</span>
              </div>
              <span className="text-[10px] font-mono bg-black/20 px-2 py-0.5 rounded-full font-bold">
                تحديث كل 6 ثوانٍ
              </span>
            </div>
            <div className="text-xs font-mono font-bold">
              الموقع الحالي: {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="font-display font-black text-sm flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <span>طلبات التوصيل المسندة إليك ({orders.length})</span>
        </h2>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border p-8 text-center space-y-2 bg-card/50">
          <div className="mx-auto h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-xl">
            📦
          </div>
          <h3 className="font-display text-sm font-bold text-foreground">
            لا توجد رحلات أو طلبات متبقية
          </h3>
          <p className="text-xs text-muted-foreground">
            تواصل مع مسؤول الحركة لوضع أية طلبات جديدة في جدولك
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const isCurrentActive = activeTripOrderId === o.id;
            return (
              <div
                key={o.id}
                className={`p-4 rounded-3xl border transition-all bg-card space-y-3 shadow-xs ${
                  isCurrentActive
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between border-b border-border/50 pb-2.5">
                  <div>
                    <span className="font-mono text-[11px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
                      #{o.id.slice(0, 8)}
                    </span>
                    <h3 className="font-display text-base font-black text-foreground mt-1">
                      {o.customer_name}
                    </h3>
                  </div>
                  <div className="text-end">
                    <span className="font-display text-sm font-black text-emerald-500 block">
                      {o.total_price} ج.م
                    </span>
                    <span className="text-[10px] text-muted-foreground font-bold">
                      {o.status === "delivering" ? "جاري التوصيل" : "قيد التجهيز"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs font-bold text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-foreground">
                    <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>{o.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                    <a href={`tel:${o.phone}`} className="underline text-emerald-500">
                      {o.phone}
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  {!isCurrentActive ? (
                    <Button
                      onClick={() => startTrip(o.id)}
                      className="w-full rounded-2xl hero-gradient text-primary-foreground font-black text-xs h-11 gap-2 shadow-md"
                    >
                      <Play className="h-4 w-4" /> بدء رحلة التوصيل وتشغيل الـ GPS 🚀
                    </Button>
                  ) : (
                    <Button
                      onClick={() => completeTrip(o.id)}
                      className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs h-11 gap-2 shadow-md"
                    >
                      <CheckCircle2 className="h-4 w-4" /> إكمال وتسليم الطلب للعميل ✅
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
