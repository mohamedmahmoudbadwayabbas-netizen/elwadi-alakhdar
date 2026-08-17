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
  LayoutGrid,
  Layers,
  Grid,
  Maximize2,
  Box,
  Sparkle,
} from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

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
  hero_title: "سمارت ستور — هايبر ماركت أونلاين متكامل 🛒",
  hero_subtitle:
    "تسوّق جميع سلع البقالة، اللحوم البلدية الطازجة، الأجبان، المشروبات والمنظفات بأسعار الجملة التنافسية وتوصيل سريع لباب المنزل.",
  hero_image_url:
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=85",
  hero_cta_text: "تصفح العروض والمنتجات 🛒",
  store_address: "القاهرة، مصر — شارع التحرير",
  store_lat: 30.0444,
  store_lng: 31.2357,
  site_name: "سمارت ستور — هايبر ماركت",
  logo_url: null,
  favicon_url: null,
  primary_color: "142 76% 24%",
  accent_color: "18 85% 55%",
  background_color: "48 33% 97%",
  foreground_color: "120 18% 12%",
  announcement_text:
    "🛒 هايبر ماركت سمارت ستور — توصيل فورى لجميع الأغذية، السلع التموينية، اللحوم والمنظفات ⚡ | شحن مجاني للطلبات أكثر من ٥٠٠ ج.م 🚀",
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

  // Load store settings
  useEffect(() => {
    let mounted = true;

    (supabase.rpc("get_store_settings_admin" as any) as any)
      .maybeSingle()
      .then(({ data, error }: { data: any; error: any }) => {
        if (!mounted) return;
        if (error) {
          toast.error("تعذر تحميل الإعدادات من القاعدة، تم فتح القيم الافتراضية");
        }

        let customizerLocal = {};
        try {
          const cached = localStorage.getItem("store_customizer_options");
          if (cached) customizerLocal = JSON.parse(cached);
        } catch {}

        setS(
          data
            ? ({ ...DEFAULT_SETTINGS, ...data, ...customizerLocal } as Settings)
            : { ...DEFAULT_SETTINGS, ...customizerLocal },
        );
        setLoading(false);
        setTimeout(() => {
          isInitialLoadRef.current = false;
        }, 1000);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Background Auto-Save effect (2.5 seconds debounce)
  useEffect(() => {
    if (isInitialLoadRef.current || !s) return;

    setAutoSaveStatus("saving");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      // Filter out non-DB customizer keys before saving to Supabase
      const { id, categories_style, products_style, card_radius, hero_style, free_shipping_threshold, font_family, ...payload } = s;
      const dbPayload = payload as any;

      const res = id
        ? await supabase.from("store_settings").update(dbPayload).eq("id", id).select("id").maybeSingle()
        : await supabase.from("store_settings").insert(dbPayload).select("id").maybeSingle();

      if (!res.error) {
        if (!id && res.data?.id) {
          setS((prev) => (prev ? { ...prev, id: res.data!.id } : prev));
        }
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 2500);
      } else {
        setAutoSaveStatus("idle");
      }
    }, 2500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [s]);

  // General Manual Save
  const handleSaveAll = async () => {
    if (!s) return;

    setSaving(true);
    setProgress(20);
    toast.success("تم تحديث وحفظ الإعدادات والتصميم بنجاح ✨");

    const timer1 = setTimeout(() => setProgress(60), 150);
    const timer2 = setTimeout(() => setProgress(90), 300);

    const { id, categories_style, products_style, card_radius, hero_style, free_shipping_threshold, font_family, ...payload } = s;
    const dbPayload = payload as any;

    const res = id
      ? await supabase.from("store_settings").update(dbPayload).eq("id", id).select("id").maybeSingle()
      : await supabase.from("store_settings").insert(dbPayload).select("id").maybeSingle();

    clearTimeout(timer1);
    clearTimeout(timer2);

    setProgress(100);

    setTimeout(() => {
      setProgress(null);
      setSaving(false);
    }, 400);

    if (res.error) {
      toast.error(`حدث خطأ أثناء الحفظ الفعلي: ${res.error.message}`);
      return;
    }

    if (!id && res.data?.id) {
      setS((prev) => (prev ? { ...prev, id: res.data!.id } : prev));
    }
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

      {/* Header & Auto-Save Indicator */}
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
            عدّل أي عنصر أو ارفع صورة مباشرة وتفقد النتيجة فوراً على هاتف المعاينة والمتجر
          </p>
        </div>

        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="rounded-2xl hero-gradient text-primary-foreground font-black text-xs gap-2 shadow-md transition-transform hover:scale-[1.02] active:scale-95 shrink-0"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>حفظ التغييرات الآن</span>
        </Button>
      </div>

      {/* Main Grid: Form Controls on Right, Live Mobile Simulator on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Mobile Simulator Sticky Preview (5 Cols on LG) */}
        <div className="lg:col-span-5 lg:order-2 lg:sticky lg:top-4 z-20 space-y-3">
          <LiveMobileSimulator s={s} />
        </div>

        {/* Form Controls (7 Cols on LG) */}
        <div className="lg:col-span-7 lg:order-1 space-y-5">
          {/* 1. هوية المتجر واللوجو */}
          <Section icon={Store} title="هوية وبيانات المتجر والشعار">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="اسم المتجر الرئيسي">
                  <Input
                    value={s.site_name ?? ""}
                    onChange={(e) => updateSetting("site_name", e.target.value)}
                    placeholder="سمارت ستور — هايبر ماركت"
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </Field>
                <Field label="رقم واتساب للتواصل والطلبات">
                  <Input
                    value={s.whatsapp_number ?? ""}
                    onChange={(e) => updateSetting("whatsapp_number", e.target.value)}
                    placeholder="+201234567890"
                    className="h-10 rounded-xl font-bold text-xs dir-ltr text-right"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-1 border-t border-border/50">
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
                    placeholder="سمارت ستور — هايبر ماركت"
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
                  label="رفع صورة خلفية البانر الرئيسي من ملفاتك (Direct Image Upload)"
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
                        placeholder="🛒 هايبر ماركت سمارت ستور — توصيل فورى..."
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

// ─── Live Mobile Simulator Component ──────────────────────────────────────────
function LiveMobileSimulator({ s }: { s: Settings }) {
  const primary = s.primary_color || "142 76% 24%";
  const accent = s.accent_color || "18 85% 55%";
  const bg = s.background_color || "48 33% 97%";
  const fg = s.foreground_color || "120 18% 12%";
  const annBg = s.announcement_bg_color || primary;

  const catStyle = s.categories_style || "grid";
  const prodStyle = s.products_style || "modern";
  const cardRadius = s.card_radius || "rounded-2xl";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="flex items-center gap-2 text-xs font-black text-foreground">
          <Smartphone className="h-4 w-4 text-emerald-500" />
          <span>المعاينة الحية التفاعلية (Live Mobile View)</span>
        </h3>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20">
          تحديث بلحظته ⚡
        </span>
      </div>

      {/* Frame device mockup */}
      <div className="relative mx-auto w-full max-w-[320px] rounded-[38px] border-[8px] border-slate-800 dark:border-slate-700 bg-slate-950 p-2 shadow-2xl overflow-hidden">
        {/* Notch & Camera */}
        <div className="absolute top-0 start-1/2 -translate-x-1/2 h-4 w-28 bg-slate-800 rounded-b-xl z-30 flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-900" />
        </div>

        {/* Inner Phone Screen */}
        <div
          className="rounded-[28px] overflow-hidden min-h-[520px] text-xs font-sans relative flex flex-col transition-colors duration-300"
          style={{ background: `hsl(${bg})`, color: `hsl(${fg})` }}
          dir="rtl"
        >
          {/* Top Status Bar */}
          <div className="pt-3 px-4 pb-1 flex justify-between items-center text-[10px] font-bold opacity-70 z-20">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span>5G</span>
              <div className="w-3.5 h-2 rounded-xs border border-current p-0.5">
                <div className="h-full w-2 bg-current rounded-2xs" />
              </div>
            </div>
          </div>

          {/* Announcement Bar */}
          <AnimatePresence>
            {s.announcement_enabled && s.announcement_text && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-3 py-1.5 text-center text-[10px] font-bold text-white truncate shadow-xs z-10"
                style={{ background: `hsl(${annBg})` }}
              >
                {s.announcement_text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div
            className="px-3 py-2 flex items-center justify-between border-b"
            style={{ borderColor: `hsl(${fg} / 0.08)` }}
          >
            <div className="flex items-center gap-2 min-w-0">
              {s.logo_url ? (
                <img src={s.logo_url} alt="" className="h-7 w-7 rounded-lg object-cover" />
              ) : (
                <div
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-white"
                  style={{ background: `hsl(${primary})` }}
                >
                  <Leaf className="h-4 w-4" />
                </div>
              )}
              <span className="font-extrabold text-xs truncate max-w-[120px]">
                {s.site_name || "سمارت ستور"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full flex items-center justify-center bg-current/10">
                <Search className="h-3 w-3" />
              </div>
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-white relative"
                style={{ background: `hsl(${accent})` }}
              >
                <ShoppingCart className="h-3 w-3" />
                <span className="absolute -top-1 -end-1 bg-emerald-600 text-white text-[8px] font-black h-3 w-3 rounded-full flex items-center justify-center">
                  2
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Screen Content */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
            {/* Hero Card */}
            <div
              className={`relative ${cardRadius} p-3.5 text-white overflow-hidden shadow-sm flex flex-col justify-between min-h-[110px] transition-all duration-300`}
              style={{
                background:
                  s.hero_bg_image || s.hero_image_url
                    ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${s.hero_bg_image || s.hero_image_url}) center/cover`
                    : `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))`,
              }}
            >
              <div>
                <span className="inline-block text-[9px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full font-extrabold mb-1">
                  طازج يومياً ✨
                </span>
                <h4 className="font-black text-sm leading-snug line-clamp-1">
                  {s.hero_title || "سمارت ستور"}
                </h4>
                <p className="text-[10px] opacity-90 line-clamp-2 mt-0.5 leading-tight">
                  {s.hero_subtitle || "منتجات طازجة وتوصيل سريع لباب البيت"}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-xl text-[10px] font-black text-white shadow-md"
                  style={{ background: `hsl(${accent})` }}
                >
                  {s.hero_cta_text || "تسوّق الآن"} ←
                </button>
              </div>
            </div>

            {/* Categories Live Style Preview */}
            <div className="space-y-1">
              <span className="text-[10px] font-black opacity-80 block">
                الأقسام (نمط: {catStyle})
              </span>
              {catStyle === "scroll" ? (
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {["خضروات", "لحوم", "أجبان", "بقالة", "منظفات"].map((c, i) => (
                    <span
                      key={i}
                      className={`px-2.5 py-1 ${cardRadius} text-[9px] font-extrabold whitespace-nowrap border shrink-0`}
                      style={{
                        background: `hsl(${primary} / 0.1)`,
                        color: `hsl(${primary})`,
                        borderColor: `hsl(${primary} / 0.2)`,
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : catStyle === "pills" ? (
                <div className="flex flex-wrap gap-1">
                  {["الكل", "خضروات", "لحوم", "أجبان", "بقالة"].map((c, i) => (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${i === 0 ? "text-white" : ""}`}
                      style={{ background: i === 0 ? `hsl(${primary})` : `hsl(${fg} / 0.06)` }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { name: "خضروات", icon: "🥦" },
                    { name: "لحوم", icon: "🥩" },
                    { name: "أجبان", icon: "🧀" },
                    { name: "بقالة", icon: "🌾" },
                  ].map((cat, i) => (
                    <div key={i} className="flex flex-col items-center text-center p-1">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs mb-0.5 border border-emerald-500/20">
                        {cat.icon}
                      </div>
                      <span className="text-[8px] font-extrabold truncate w-full">{cat.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* First Order Coupon Banner (If Enabled) */}
            {s.first_order_coupon_enabled && (
              <div
                className={`p-2 ${cardRadius} text-[10px] font-bold flex items-center justify-between border`}
                style={{
                  background: `hsl(${accent} / 0.1)`,
                  borderColor: `hsl(${accent} / 0.3)`,
                  color: `hsl(${fg})`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" style={{ color: `hsl(${accent})` }} />
                  <span>خصم {s.first_order_discount_percent ?? 10}% لطلبك الأول!</span>
                </div>
                <span
                  className="px-1.5 py-0.5 rounded-md font-mono font-black text-[9px] text-white"
                  style={{ background: `hsl(${primary})` }}
                >
                  {s.first_order_coupon_code || "WELCOME10"}
                </span>
              </div>
            )}

            {/* Sample Mini Product Grid */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-black">
                <span>أحدث المنتجات</span>
                <span className="text-[9px] text-emerald-600">الكل (12)</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: "تفاح أحمر إيطالي", price: "45 ج.م" },
                  { name: "خيار بلدي ممتاز", price: "18 ج.م" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`p-2 ${cardRadius} border ${
                      prodStyle === "glass"
                        ? "bg-white/40 dark:bg-black/40 backdrop-blur-xs"
                        : prodStyle === "bordered"
                          ? "bg-card border-2 shadow-sm"
                          : "bg-card shadow-2xs"
                    } flex flex-col justify-between space-y-1.5 transition-all`}
                    style={{ borderColor: `hsl(${fg} / 0.1)` }}
                  >
                    <div className="h-14 w-full rounded-lg bg-secondary/80 flex items-center justify-center text-lg">
                      {i === 0 ? "🍎" : "🥒"}
                    </div>
                    <div>
                      <div className="font-bold text-[10px] truncate">{item.name}</div>
                      <div className="font-black text-[11px]" style={{ color: `hsl(${primary})` }}>
                        {item.price}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`w-full py-1 ${cardRadius} font-black text-[9px] text-white`}
                      style={{ background: `hsl(${primary})` }}
                    >
                      إضافة للسلة +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Phone Footer Navigation */}
          <div
            className="p-2 border-t flex justify-around items-center text-[9px] font-bold"
            style={{ borderColor: `hsl(${fg} / 0.1)` }}
          >
            <div
              className="flex flex-col items-center gap-0.5"
              style={{ color: `hsl(${primary})` }}
            >
              <Store className="h-3.5 w-3.5" />
              <span>الرئيسية</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 opacity-60">
              <Layers className="h-3.5 w-3.5" />
              <span>الأقسام</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 opacity-60">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>السلة</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 opacity-60">
              <User className="h-3.5 w-3.5" />
              <span>حسابي</span>
            </div>
          </div>
        </div>
      </div>
    </div>
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
