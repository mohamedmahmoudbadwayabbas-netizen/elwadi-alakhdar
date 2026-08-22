import { NumberInput } from "@/components/ui/number-input";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Save,
  Loader2,
  MapPin,
  Palette,
  Megaphone,
  BarChart3,
  Store,
  ShoppingCart,
  Search,
  User,
  Leaf,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Truck,
  Tag,
  Image as ImageIcon,
  Sliders,
  RotateCcw,
  Download,
  Upload,
  PhoneCall,
  Activity,
  Globe,
  Database,
} from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { LiveStorefrontPreview } from "@/components/admin/LiveStorefrontPreview";

// Lazy Load Map Component
const StoreMapPicker = lazy(() =>
  import("@/components/admin/StoreMapPicker").then((m) => ({ default: m.StoreMapPicker })),
);

type Settings = {
  id?: string;
  whatsapp_number: string | null;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  hero_cta_text: string;
  store_address: string | null;
  store_lat: number | null;
  store_lng: number | null;
  site_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  foreground_color: string | null;
  announcement_text: string | null;
  announcement_enabled: boolean | null;
  announcement_bg_color: string | null;
  ga4_id: string | null;
  meta_pixel_id: string | null;
  min_order_amount: number | null;
  default_delivery_fee: number | null;
  free_shipping_threshold?: number | null;
  first_order_coupon_enabled: boolean | null;
  first_order_coupon_code: string | null;
  first_order_discount_percent: number | null;
  hero_bg_image: string | null;
  login_bg_pattern: string | null;
  cart_empty_bg: string | null;
  floating_element_image: string | null;
  font_family?: string | null;

  // Customizer Fields
  categories_style?: "grid" | "scroll" | "cards" | "pills";
  products_style?: "modern" | "compact" | "bordered" | "glass";
  card_radius?: "rounded-xl" | "rounded-2xl" | "rounded-3xl";
  hero_style?: "gradient" | "image" | "split";
};


const DEFAULT_SETTINGS: Settings = {
  whatsapp_number: "+201234567890",
  hero_title: "الوادي الأخضر — سوبرماركت عائلتك 🛒",
  hero_subtitle:
    "أجود السلع التموينية والبقالة واللحوم الطازجة والألبان بأفضل الأسعار وتوصيل فوري لباب المنزل.",
  hero_image_url:
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=85",
  hero_cta_text: "تسوّق الآن 🛒",
  store_address: "القاهرة، مصر — سوبرماركت الوادي الأخضر",
  store_lat: 30.0444,
  store_lng: 31.2357,
  site_name: "الوادي الأخضر",
  logo_url: null,
  favicon_url: null,
  primary_color: "142 76% 24%",
  accent_color: "18 85% 55%",
  background_color: "48 33% 97%",
  foreground_color: "120 18% 12%",
  announcement_text:
    "🛒 سوبرماركت الوادي الأخضر — كل احتياجات بيتك وتموينك بتوصيل فوري لباب بيتك ⚡",
  announcement_enabled: true,
  announcement_bg_color: "142 76% 24%",
  ga4_id: null,
  meta_pixel_id: null,
  min_order_amount: 100,
  default_delivery_fee: 35,
  free_shipping_threshold: 500,
  first_order_coupon_enabled: false,
  first_order_coupon_code: "WELCOME10",
  first_order_discount_percent: 10,
  hero_bg_image:
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=85",
  login_bg_pattern: null,
  cart_empty_bg: null,
  floating_element_image:
    "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&w=500&q=80",

  categories_style: "grid",
  products_style: "modern",
  card_radius: "rounded-2xl",
  hero_style: "image",
};

// الثيمات الجاهزة للاختيار السريع
const COLOR_PRESETS = [
  {
    name: "الغابة الخضراء 🌲",
    primary: "142 76% 24%",
    accent: "18 85% 55%",
    bg: "48 33% 97%",
    fg: "120 18% 12%",
  },
  {
    name: "الزمرد الحديث 💎",
    primary: "160 84% 28%",
    accent: "38 92% 50%",
    bg: "150 20% 98%",
    fg: "160 30% 10%",
  },
  {
    name: "الغروب الدافئ 🌅",
    primary: "12 76% 36%",
    accent: "42 95% 52%",
    bg: "20 30% 98%",
    fg: "12 30% 12%",
  },
  {
    name: "الليلي المظلم 🌙",
    primary: "142 70% 45%",
    accent: "24 90% 55%",
    bg: "220 20% 10%",
    fg: "0 0% 95%",
  },
];

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "إعدادات المتجر — لوحة التحكم" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [showMap, setShowMap] = useState(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Load store settings from LocalStorage / State
  useEffect(() => {
    let customizerLocal = {};
    let cacheLocal = {};
    try {
      const cached = localStorage.getItem("alwadi_store_settings_cache");
      if (cached) cacheLocal = JSON.parse(cached);
      const cust = localStorage.getItem("store_customizer_options");
      if (cust) customizerLocal = JSON.parse(cust);
    } catch {}

    const initial = {
      ...DEFAULT_SETTINGS,
      ...cacheLocal,
      ...customizerLocal,
    } as Settings;

    setS(initial);
    setLoading(false);
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 500);
  }, []);

  // Background Auto-Save to LocalStorage
  useEffect(() => {
    if (isInitialLoadRef.current || !s) return;

    setAutoSaveStatus("saving");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem("alwadi_store_settings_cache", JSON.stringify(s));
        const customizerKeys = {
          categories_style: s.categories_style,
          products_style: s.products_style,
          card_radius: s.card_radius,
          hero_style: s.hero_style,
        };
        localStorage.setItem("store_customizer_options", JSON.stringify(customizerKeys));
      } catch {}

      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [s]);

  // General Manual Save
  const handleSaveAll = async () => {
    if (!s) return;

    setSaving(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(70), 100);
    const timer2 = setTimeout(() => setProgress(95), 200);

    try {
      localStorage.setItem("alwadi_store_settings_cache", JSON.stringify(s));
      const customizerKeys = {
        categories_style: s.categories_style,
        products_style: s.products_style,
        card_radius: s.card_radius,
        hero_style: s.hero_style,
      };
      localStorage.setItem("store_customizer_options", JSON.stringify(customizerKeys));
      window.dispatchEvent(new CustomEvent("store_settings_updated", { detail: s }));

      // Save directly to Supabase store_settings table
      try {
        await (supabase as any).from("store_settings").upsert([
          {
            site_name: s.site_name,
            hero_title: s.hero_title,
            hero_subtitle: s.hero_subtitle,
            hero_cta_text: s.hero_cta_text,
            hero_image_url: s.hero_image_url,
            announcement_text: s.announcement_text,
            announcement_enabled: s.announcement_enabled,
            announcement_bg_color: s.announcement_bg_color,
            primary_color: s.primary_color,
            accent_color: s.accent_color,
            background_color: s.background_color,
            foreground_color: s.foreground_color,
            store_address: s.store_address,
            whatsapp_number: s.whatsapp_number,
            min_order_amount: s.min_order_amount,
            default_delivery_fee: s.default_delivery_fee,
            free_shipping_threshold: s.free_shipping_threshold,
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch (dbErr) {
        console.warn("[Admin Settings] Notice syncing to Supabase:", dbErr);
      }
    } catch {}

    clearTimeout(timer1);
    clearTimeout(timer2);

    setProgress(100);
    toast.success("تم حفظ وتطبيق التغييرات بنجاح في قاعدة البيانات والمتجر ✨");

    setTimeout(() => {
      setProgress(null);
      setSaving(false);
    }, 300);
  };

  const updateSetting = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    if (!s) return;
    const next = { ...s, [k]: v };
    setS(next);

    // Broadcast live update to store settings context and preview frame
    window.dispatchEvent(new CustomEvent("store_settings_updated", { detail: { [k]: v } }));

    // Save visual layout choices to local storage for persistence
    if (["categories_style", "products_style", "card_radius", "hero_style"].includes(k as string)) {
      try {
        const stored = JSON.parse(localStorage.getItem("store_customizer_options") || "{}");
        stored[k] = v;
        localStorage.setItem("store_customizer_options", JSON.stringify(stored));
      } catch {}
    }
  };

  const applyColorPreset = (preset: (typeof COLOR_PRESETS)[0]) => {
    if (!s) return;
    const next = {
      ...s,
      primary_color: preset.primary,
      accent_color: preset.accent,
      background_color: preset.bg,
      foreground_color: preset.fg,
    };
    setS(next);

    window.dispatchEvent(
      new CustomEvent("store_settings_updated", {
        detail: {
          primary_color: preset.primary,
          accent_color: preset.accent,
          background_color: preset.bg,
          foreground_color: preset.fg,
        },
      }),
    );

    toast.success(`تم تطبيق ثيم "${preset.name}" ✨`);
  };

  // Reset all settings to defaults
  const handleResetToDefaults = () => {
    if (!window.confirm("هل أنت متأكد من رغبتك في استعادة جميع الإعدادات الافتراضية للمتجر؟"))
      return;
    setS(DEFAULT_SETTINGS);
    try {
      localStorage.setItem("alwadi_store_settings_cache", JSON.stringify(DEFAULT_SETTINGS));
      const customizerKeys = {
        categories_style: DEFAULT_SETTINGS.categories_style,
        products_style: DEFAULT_SETTINGS.products_style,
        card_radius: DEFAULT_SETTINGS.card_radius,
        hero_style: DEFAULT_SETTINGS.hero_style,
      };
      localStorage.setItem("store_customizer_options", JSON.stringify(customizerKeys));
      window.dispatchEvent(new CustomEvent("store_settings_updated", { detail: DEFAULT_SETTINGS }));
    } catch {}
    toast.success("تمت استعادة الإعدادات الافتراضية بنجاح 🔄");
  };

  // Export settings as JSON file
  const handleExportJSON = () => {
    if (!s) return;
    try {
      const dataStr =
        "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(s, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `store_settings_backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success("تم تصدير ملف الإعدادات الاحتياطي بنجاح 💾");
    } catch (err: any) {
      toast.error("فشل تصدير الإعدادات: " + (err.message || err));
    }
  };

  // Import settings from JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === "object" && parsed !== null) {
          const merged = { ...DEFAULT_SETTINGS, ...parsed };
          setS(merged);
          localStorage.setItem("alwadi_store_settings_cache", JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent("store_settings_updated", { detail: merged }));
          toast.success("تم استيراد وتطبيق الإعدادات بنجاح ✨");
        } else {
          toast.error("ملف غير صالح، يرجى اختيار ملف JSON صحيح");
        }
      } catch (err: any) {
        toast.error("فشل قراءة الملف: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Test WhatsApp Link
  const handleTestWhatsApp = () => {
    if (!s?.whatsapp_number) {
      toast.error("يرجى إدخال رقم واتساب صالح أولاً");
      return;
    }
    const cleanNum = s.whatsapp_number.replace(/[^\d+]/g, "").replace(/^00/, "+");
    const numOnly = cleanNum.replace("+", "");
    window.open(
      `https://wa.me/${numOnly}?text=${encodeURIComponent("مرحباً، هذه رسالة تجربة من إعدادات المتجر 🛒")}`,
      "_blank",
    );
    toast.success("تم فتح محادثة واتساب التجريبية بنجاح 💬");
  };

  if (loading) return <SettingsPageSkeleton />;
  if (!s) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-4 sm:p-6 pb-24 relative"
    >
      {/* Top Animated Progress Bar */}
      <AnimatePresence>
        {progress !== null && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: progress / 100 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 start-0 end-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-primary z-50 origin-start"
          />
        )}
      </AnimatePresence>

      {/* Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black text-foreground">
              إعدادات الهوية والتخصيص المباشر ⚙️
            </h1>
            <AnimatePresence mode="wait">
              {autoSaveStatus === "saving" && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20"
                >
                  <Loader2 className="h-3 w-3 animate-spin" /> جاري التعديل...
                </motion.span>
              )}
              {autoSaveStatus === "saved" && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20"
                >
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 animate-pulse" /> حفظ تلقائي
                  مباشر
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            عدّل أي عنصر أو ارفع صورة مباشرة وتفقد النتيجة فوراً على نافذة المعاينة المباشرة للمتجر
          </p>
        </div>

        {/* Quick Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export Settings */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="rounded-xl font-bold text-xs gap-1.5 h-9 border-border/80 hover:bg-secondary"
            title="تصدير نسخة احتياطية من الإعدادات"
          >
            <Download className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline">تصدير</span>
          </Button>

          {/* Import Settings */}
          <label className="cursor-pointer">
            <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
            <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border/80 bg-card hover:bg-secondary font-bold text-xs text-foreground transition-colors shadow-xs">
              <Upload className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">استيراد</span>
            </span>
          </label>

          {/* Reset to Defaults */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefaults}
            className="rounded-xl font-bold text-xs gap-1.5 h-9 border-border/80 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
            title="استعادة الإعدادات الأصلية الافتراضية"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">استعادة الافتراضي</span>
          </Button>

          {/* Save Button */}
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="rounded-xl hero-gradient text-primary-foreground font-black text-xs gap-2 h-9 shadow-md transition-transform hover:scale-[1.02] active:scale-95 shrink-0 px-4"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>حفظ التغييرات الآن</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Form Controls on Right, Live Simulator on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Storefront Sticky Preview (5 Cols on LG) */}
        <div className="lg:col-span-5 lg:order-2 lg:sticky lg:top-4 z-20 space-y-3">
          <LiveStorefrontPreview s={s} />
        </div>

        {/* Form Controls (7 Cols on LG) */}
        <div className="lg:col-span-7 lg:order-1 space-y-5">
          {/* 1. هوية وبيانات المتجر واللوجو والموقع */}
          <Section icon={Store} title="هوية وبيانات المتجر والشعار والموقع">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="اسم المتجر الرئيسي">
                  <Input
                    value={s.site_name ?? ""}
                    onChange={(e) => updateSetting("site_name", e.target.value)}
                    placeholder="سوبرماركت الوادي الأخضر"
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </Field>
                <div className="space-y-1.5">
                  <span className="block text-xs font-extrabold text-foreground">
                    رقم واتساب للتواصل والطلبات
                  </span>
                  <div className="flex gap-2">
                    <Input
                      value={s.whatsapp_number ?? ""}
                      onChange={(e) => updateSetting("whatsapp_number", e.target.value)}
                      placeholder="+201234567890"
                      className="h-10 rounded-xl font-bold text-xs dir-ltr text-right flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestWhatsApp}
                      className="h-10 rounded-xl text-xs font-bold gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 shrink-0"
                      title="تجربة فتح محادثة واتساب بالرقم الحالي"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      <span>تجربة</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Store Address & Map Location */}
              <div className="pt-2 border-t border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <Field label="عنوان مقر الفرع الرئيسي أو المتجر">
                    <Input
                      value={s.store_address ?? ""}
                      onChange={(e) => updateSetting("store_address", e.target.value)}
                      placeholder="القاهرة، مصر — شارع التحرير"
                      className="h-10 rounded-xl font-bold text-xs"
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-secondary/20 p-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                      <span>إحداثيات الموقع الجغرافي للمتجر (GPS):</span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground block dir-ltr text-start">
                      Lat: {s.store_lat ?? 30.0444} | Lng: {s.store_lng ?? 31.2357}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant={showMap ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                    className="h-8 rounded-xl text-xs font-bold gap-1.5 border-border/80"
                  >
                    <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{showMap ? "إخفاء الخريطة" : "تحديد على الخريطة 🗺️"}</span>
                  </Button>
                </div>

                <AnimatePresence>
                  {showMap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden rounded-2xl border border-border"
                    >
                      <Suspense
                        fallback={
                          <div className="p-8 text-center text-xs font-bold text-muted-foreground">
                            جاري تحميل الخريطة التفاعلية...
                          </div>
                        }
                      >
                        <StoreMapPicker
                          lat={s.store_lat}
                          lng={s.store_lng}
                          address={s.store_address}
                          onChange={(lat, lng) => {
                            updateSetting("store_lat", lat);
                            updateSetting("store_lng", lng);
                            toast.success("تم تحديث إحداثيات موقع المتجر بنجاح 📍");
                          }}
                        />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/50">
                <ImageUploader
                  value={s.logo_url}
                  onChange={(v) => updateSetting("logo_url", v)}
                  label="شعار المتجر (Logo)"
                  folder="logos"
                  compact
                />
                <ImageUploader
                  value={s.favicon_url}
                  onChange={(v) => updateSetting("favicon_url", v)}
                  label="أيقونة المتجر للمتصفح (Favicon)"
                  folder="favicons"
                  compact
                />
              </div>
            </div>
          </Section>

          {/* 2. قسم الواجهة الرئيسية والبقالة (Hero Banner & Upload) */}
          <Section icon={Sparkles} title="قسم البانر والواجهة الرئيسية (Hero Banner)">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="العنوان الرئيسي لبانر الهيرو">
                  <Input
                    value={s.hero_title ?? ""}
                    onChange={(e) => updateSetting("hero_title", e.target.value)}
                    placeholder="سوبرماركت الوادي الأخضر — هايبر ماركت"
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </Field>

                <Field label="نص الزر التفاعلي (CTA)">
                  <Input
                    value={s.hero_cta_text ?? ""}
                    onChange={(e) => updateSetting("hero_cta_text", e.target.value)}
                    placeholder="تصفح العروض والمنتجات 🛒"
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </Field>
              </div>

              <Field label="الوصف التوضيحي للهيرو" full>
                <Textarea
                  rows={2}
                  value={s.hero_subtitle ?? ""}
                  onChange={(e) => updateSetting("hero_subtitle", e.target.value)}
                  placeholder="تسوّق جميع سلع البقالة، اللحوم البلدية الطازجة..."
                  className="rounded-xl font-bold text-xs"
                />
              </Field>

              {/* Upload Hero Image from File */}
              <div className="pt-2 border-t border-border/50">
                <ImageUploader
                  value={s.hero_bg_image || s.hero_image_url}
                  onChange={(v) => {
                    updateSetting("hero_bg_image", v);
                    updateSetting("hero_image_url", v);
                  }}
                  label="خلفية البانر الرئيسي (رفع أو توليد بالذكاء الاصطناعي)"
                  promptHint={`خلفية بانر تسويقية فائقة الجمال لمتجر سوبرماركت حديث باسم "${s.site_name || "الوادي الأخضر"}" تعرض أرفف سوبرماركت منظمة، سلع تموينية، ألبان ولحوم مع إضاءة سينمائية`}
                  folder="hero"
                />
              </div>
            </div>
          </Section>

          {/* 3. تخصيص أشكال الهيكل والمنتجات والأقسام (Visual Customizer) */}
          <Section icon={Sliders} title="خيارات أشكال الأقسام والمنتجات والإطارات">
            <div className="space-y-4">
              {/* Categories Style */}
              <div className="space-y-1.5">
                <span className="block text-xs font-extrabold text-foreground">
                  شكل وتصميم عرض الأقسام (Categories Layout):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "grid", label: "شبكة دائرية ⭕", desc: "دوائر أنيقة مع عناوين" },
                    { id: "scroll", label: "شريط أفقي ↔️", desc: "سحب سريع أفقي" },
                    { id: "cards", label: "بطاقات عريضة 🪟", desc: "صور بارزة وعريضة" },
                    { id: "pills", label: "أزرار تبويب 🏷️", desc: "حبوب سريعة مدمجة" },
                  ].map((catOpt) => (
                    <button
                      key={catOpt.id}
                      type="button"
                      onClick={() => updateSetting("categories_style", catOpt.id as any)}
                      className={`p-2.5 rounded-2xl border text-start transition-all ${
                        (s.categories_style || "grid") === catOpt.id
                          ? "border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/30"
                          : "border-border/80 bg-card hover:border-border"
                      }`}
                    >
                      <div className="font-extrabold text-xs text-foreground">{catOpt.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{catOpt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Style */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <span className="block text-xs font-extrabold text-foreground">
                  تصميم بطاقة المنتج (Product Card Style):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "modern", label: "عصري حديث ✨", desc: "صورة كبيرة وزر بارز" },
                    { id: "compact", label: "مدمج سريع 📱", desc: "أقصى استغلال للمساحة" },
                    { id: "bordered", label: "إطار بارز 🔲", desc: "حدود قوية وظلال" },
                    { id: "glass", label: "زجاجي أنيق 🧊", desc: "شفافية خفيفة ناعمة" },
                  ].map((prodOpt) => (
                    <button
                      key={prodOpt.id}
                      type="button"
                      onClick={() => updateSetting("products_style", prodOpt.id as any)}
                      className={`p-2.5 rounded-2xl border text-start transition-all ${
                        (s.products_style || "modern") === prodOpt.id
                          ? "border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/30"
                          : "border-border/80 bg-card hover:border-border"
                      }`}
                    >
                      <div className="font-extrabold text-xs text-foreground">{prodOpt.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{prodOpt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Radius */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <span className="block text-xs font-extrabold text-foreground">
                  تدوير زوايا الإطارات والبطاقات (Border Radius):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "rounded-xl", label: "زوايا هادئة (12px)", radius: "12px" },
                    { id: "rounded-2xl", label: "زوايا عصرية (16px)", radius: "16px" },
                    { id: "rounded-3xl", label: "منحنية بالكامل (24px)", radius: "24px" },
                  ].map((radOpt) => (
                    <button
                      key={radOpt.id}
                      type="button"
                      onClick={() => updateSetting("card_radius", radOpt.id as any)}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        (s.card_radius || "rounded-2xl") === radOpt.id
                          ? "border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/30"
                          : "border-border/80 bg-card hover:border-border"
                      }`}
                    >
                      <div className="font-extrabold text-xs text-foreground">{radOpt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* 4. ثيم الألوان والأنماط البصرية */}
          <Section icon={Palette} title="تخصيص ثيم الألوان المتقدم (HSL)">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">
                  ثيمات لونية جاهزة للتطبيق بنقرة واحدة:
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyColorPreset(p)}
                    className="p-2 rounded-xl border border-border/70 bg-card hover:border-primary/50 text-start text-[11px] font-bold transition-all hover:scale-[1.02] shadow-xs"
                  >
                    <div className="flex h-3 w-full rounded-md overflow-hidden mb-1.5 border border-border/40">
                      <div className="flex-1" style={{ background: `hsl(${p.primary})` }} />
                      <div className="flex-1" style={{ background: `hsl(${p.accent})` }} />
                      <div className="flex-1" style={{ background: `hsl(${p.bg})` }} />
                    </div>
                    <span className="truncate block">{p.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <ColorField
                  label="اللون الرئيسي (Primary)"
                  value={s.primary_color}
                  onChange={(v) => updateSetting("primary_color", v)}
                />
                <ColorField
                  label="اللون المميز (Accent)"
                  value={s.accent_color}
                  onChange={(v) => updateSetting("accent_color", v)}
                />
                <ColorField
                  label="لون الخلفية (Background)"
                  value={s.background_color}
                  onChange={(v) => updateSetting("background_color", v)}
                />
                <ColorField
                  label="لون النصوص (Foreground)"
                  value={s.foreground_color}
                  onChange={(v) => updateSetting("foreground_color", v)}
                />
              </div>
            </div>
          </Section>

          {/* 5. شريط الإعلانات العلوي */}
          <Section icon={Megaphone} title="الشريط العلوي الترويجي (Announcement Bar)">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-foreground block">
                    تفعيل الشريط العلوي
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    إظهار شريط إعلانات متحرك في أعلى المتجر
                  </span>
                </div>
                <Switch
                  checked={!!s.announcement_enabled}
                  onCheckedChange={(v) => updateSetting("announcement_enabled", v)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              <AnimatePresence>
                {s.announcement_enabled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3 pt-1 overflow-hidden"
                  >
                    <Field label="نص الإعلان أو العرض">
                      <Textarea
                        rows={2}
                        value={s.announcement_text ?? ""}
                        onChange={(e) => updateSetting("announcement_text", e.target.value)}
                        placeholder="🛒 سوبرماركت الوادي الأخضر — توصيل فورى..."
                        className="rounded-xl font-bold text-xs"
                      />
                    </Field>
                    <ColorField
                      label="لون خلفية الشريط (HSL)"
                      value={s.announcement_bg_color}
                      onChange={(v) => updateSetting("announcement_bg_color", v)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Section>

          {/* 6. كود الخصم والشحن والطلبات */}
          <Section icon={Truck} title="إعدادات الشحن والكوبونات والطلبات">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
                <div className="space-y-0.5">
                  <span className="text-xs font-black text-foreground block">
                    تفعيل كود الخصم للطلب الأول
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    منح العملاء الجدد خصماً تشجيعياً عند أول طلب
                  </span>
                </div>
                <Switch
                  checked={!!s.first_order_coupon_enabled}
                  onCheckedChange={(v) => updateSetting("first_order_coupon_enabled", v)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              {s.first_order_coupon_enabled && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Field label="كود الخصم">
                    <Input
                      value={s.first_order_coupon_code ?? ""}
                      onChange={(e) => updateSetting("first_order_coupon_code", e.target.value)}
                      placeholder="WELCOME10"
                      className="h-10 rounded-xl font-bold text-xs uppercase"
                    />
                  </Field>
                  <Field label="نسبة الخصم %">
                    <NumberInput
                      value={s.first_order_discount_percent ?? 10}
                      onValueChange={(v) =>
                        updateSetting("first_order_discount_percent", v ? parseFloat(v) : null)
                      }
                    />
                  </Field>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/40">
                <Field label="الحد الأدنى للطلب (ج.م)">
                  <NumberInput
                    value={s.min_order_amount ?? 0}
                    onValueChange={(v) => updateSetting("min_order_amount", v ? parseFloat(v) : 0)}
                  />
                </Field>
                <Field label="رسوم التوصيل الافتراضية">
                  <NumberInput
                    value={s.default_delivery_fee ?? 0}
                    onValueChange={(v) =>
                      updateSetting("default_delivery_fee", v ? parseFloat(v) : 0)
                    }
                  />
                </Field>
                <Field label="حد الشحن المجاني (ج.م)">
                  <NumberInput
                    value={s.free_shipping_threshold ?? 0}
                    onValueChange={(v) =>
                      updateSetting("free_shipping_threshold", v ? parseFloat(v) : 0)
                    }
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* 7. رفع باقي صور وخلفيات الهوية */}
          <Section icon={ImageIcon} title="رفع الصور وخلفيات العناصر الثانوية">
            <div className="space-y-4">
              <ImageUploader
                value={s.floating_element_image}
                onChange={(v) => updateSetting("floating_element_image", v)}
                label="الصورة الترويجية العائمة (Floating Element)"
                folder="floating"
                compact
              />
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/40">
                <ImageUploader
                  value={s.login_bg_pattern}
                  onChange={(v) => updateSetting("login_bg_pattern", v)}
                  label="خلفية صفحة تسجيل الدخول"
                  folder="backgrounds"
                  compact
                />
                <ImageUploader
                  value={s.cart_empty_bg}
                  onChange={(v) => updateSetting("cart_empty_bg", v)}
                  label="صورة السلة الفارغة"
                  folder="backgrounds"
                  compact
                />
              </div>
            </div>
          </Section>

          {/* 8. أدوات التحليل والتتبع الإعلاني */}
          <Section icon={BarChart3} title="أدوات التحليل والتتبع الإعلاني (Analytics & Pixels)">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="معرف جوجل أناليتكس (Google Analytics 4 ID)">
                  <Input
                    value={s.ga4_id ?? ""}
                    onChange={(e) => updateSetting("ga4_id", e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                    className="h-10 rounded-xl font-mono text-xs uppercase dir-ltr text-right"
                  />
                </Field>
                <Field label="معرف بكسل فيسبوك / ميتا (Meta Pixel ID)">
                  <Input
                    value={s.meta_pixel_id ?? ""}
                    onChange={(e) => updateSetting("meta_pixel_id", e.target.value)}
                    placeholder="123456789012345"
                    className="h-10 rounded-xl font-mono text-xs dir-ltr text-right"
                  />
                </Field>
              </div>
              <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">
                💡 تُستخدم هذه الأكواد لربط الحملات الإعلانية على فيسبوك وتيك توك وجوجل وتتبع الزوار
                والطلبات ومعدل التحويل تلقائياً.
              </p>
            </div>
          </Section>
        </div>
      </div>

      {/* Floating Save Bar on Mobile */}
      <div className="fixed bottom-4 start-4 end-4 lg:hidden z-40">
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          size="lg"
          className="w-full h-12 rounded-2xl hero-gradient text-primary-foreground font-black text-sm shadow-2xl gap-2"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          <span>حفظ التغييرات الآن</span>
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Helper UI Components ──────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3.5 rounded-3xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80">
      <h3 className="flex items-center gap-2 font-display text-base font-black text-foreground border-b border-border/50 pb-2.5">
        <Icon className="h-4 w-4 text-emerald-500" />
        <span>{title}</span>
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-extrabold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (v: string) => void;
}) {
  const colorHsl = value ? `hsl(${value})` : "transparent";

  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-extrabold text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="h-10 w-10 shrink-0 rounded-xl border-2 border-border shadow-xs transition-colors duration-300"
          style={{ background: colorHsl }}
        />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="142 76% 24%"
          className="h-10 rounded-xl font-mono text-xs font-bold bg-background/90 dir-ltr text-right"
        />
      </div>
    </label>
  );
}

function SettingsPageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 animate-pulse">
      <div className="h-8 w-64 bg-secondary rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-[500px] bg-secondary/60 rounded-3xl" />
        <div className="lg:col-span-7 space-y-4">
          <div className="h-40 bg-secondary/60 rounded-3xl" />
          <div className="h-40 bg-secondary/60 rounded-3xl" />
          <div className="h-40 bg-secondary/60 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
