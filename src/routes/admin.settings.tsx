import { NumberInput } from "@/components/ui/number-input";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Save, Loader2, MapPin, Palette,
  Megaphone, BarChart3, Store, Eye, ShoppingCart, Search, User, Leaf,
} from "lucide-react";

// ─── Lazy Load للخريطة — لا تتحمل إلا عند الضغط على "عرض الخريطة" ────────────
const StoreMapPicker = lazy(
  () => import("@/components/admin/StoreMapPicker").then(m => ({ default: m.StoreMapPicker }))
);

type Settings = {
  id?: string;
  whatsapp_number: string | null;
  hero_title: string; hero_subtitle: string;
  hero_image_url: string | null; hero_cta_text: string;
  store_address: string | null; store_lat: number | null; store_lng: number | null;
  site_name: string | null; logo_url: string | null; favicon_url: string | null;
  primary_color: string | null; accent_color: string | null;
  background_color: string | null; foreground_color: string | null;
  announcement_text: string | null; announcement_enabled: boolean | null; announcement_bg_color: string | null;
  ga4_id: string | null; meta_pixel_id: string | null;
  min_order_amount: number | null; default_delivery_fee: number | null;
  first_order_coupon_enabled: boolean | null; first_order_coupon_code: string | null; first_order_discount_percent: number | null;
  hero_bg_image: string | null;
  login_bg_pattern: string | null;
  cart_empty_bg: string | null;
  floating_element_image: string | null;
};

const DEFAULT_SETTINGS: Settings = {
  whatsapp_number: null,
  hero_title: "الوادي الأخضر",
  hero_subtitle: "منتجات طازجة وتوصيل سريع لباب البيت",
  hero_image_url: null,
  hero_cta_text: "تسوّق الآن",
  store_address: null,
  store_lat: null,
  store_lng: null,
  site_name: "الوادي الأخضر",
  logo_url: null,
  favicon_url: null,
  primary_color: "142 76% 24%",
  accent_color: "18 85% 55%",
  background_color: "48 33% 97%",
  foreground_color: "120 18% 12%",
  announcement_text: "شحن مجاني فوق ٣٠٠ ج.م | توصيل سريع خلال ٤٥ دقيقة ⚡ | الدفع عند الاستلام ✓",
  announcement_enabled: true,
  announcement_bg_color: "142 76% 24%",
  ga4_id: null,
  meta_pixel_id: null,
  min_order_amount: 0,
  default_delivery_fee: 0,
  first_order_coupon_enabled: false,
  first_order_coupon_code: null,
  first_order_discount_percent: 10,
  hero_bg_image: null,
  login_bg_pattern: null,
  cart_empty_bg: null,
  floating_element_image: null,
};

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
  const [s, setS]         = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    let mounted = true;
    (globalThis as any).__adminSettingsEffectRuns = ((globalThis as any).__adminSettingsEffectRuns || 0) + 1;
    const runId = (globalThis as any).__adminSettingsEffectRuns;
    console.log(`[AdminSettings] useEffect run #${runId} — fetching store_settings`);
    if (runId > 2) {
      console.error("[AdminSettings] ⚠️ Potential infinite loop — useEffect ran more than twice");
    }
    const t0 = performance.now();
    supabase
      .from("store_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        console.log(`[AdminSettings] fetch done in ${(performance.now() - t0).toFixed(0)}ms`, { hasData: !!data, error });
        if (!mounted) return;
        if (error) {
          console.error("[AdminSettings] failed to load store_settings", error);
          toast.error("تعذر تحميل الإعدادات، تم فتح القيم الافتراضية مؤقتاً");
        }
        setS(data ? ({ ...DEFAULT_SETTINGS, ...data } as Settings) : DEFAULT_SETTINGS);
        setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    const { id, ...payload } = s;
    const res = id
      ? await supabase.from("store_settings").update(payload).eq("id", id)
      : await supabase.from("store_settings").insert(payload);
    setSaving(false);
    if (res.error) toast.error(res.error.message);
    else toast.success("تم حفظ الإعدادات — التغييرات تظهر فوراً على المتجر");
  };

  if (loading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  if (!s) return null;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setS({ ...s, [k]: v });

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <h2 className="font-display text-2xl font-bold">إعدادات المتجر</h2>

      {/* ── معاينة حية ── */}
      <LivePreview s={s} />



      {/* هوية المتجر */}
      <Section icon={Store} title="هوية المتجر">
        <Field label="اسم المتجر">
          <Input value={s.site_name ?? ""} onChange={(e) => set("site_name", e.target.value)} />
        </Field>
        <Field label="رابط الشعار (Logo)">
          <Input value={s.logo_url ?? ""} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="رابط الـ Favicon">
          <Input value={s.favicon_url ?? ""} onChange={(e) => set("favicon_url", e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="رقم واتساب">
          <Input value={s.whatsapp_number ?? ""} onChange={(e) => set("whatsapp_number", e.target.value)} placeholder="+201234567890" />
        </Field>
      </Section>

      {/* الألوان */}
      <Section icon={Palette} title="الألوان والمظهر">
        <p className="text-xs text-muted-foreground">
          القيم بصيغة HSL مثل: <code className="rounded bg-muted px-1">142 76% 36%</code>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="اللون الرئيسي"  value={s.primary_color}    onChange={(v) => set("primary_color", v)} />
          <ColorField label="اللون المميز"    value={s.accent_color}     onChange={(v) => set("accent_color", v)} />
          <ColorField label="لون الخلفية"     value={s.background_color} onChange={(v) => set("background_color", v)} />
          <ColorField label="لون النص"        value={s.foreground_color} onChange={(v) => set("foreground_color", v)} />
        </div>
      </Section>

      {/* شريط الإعلانات */}
      <Section icon={Megaphone} title="الشريط العلوي (Announcement Bar)">
        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <span className="text-sm font-bold">تفعيل الشريط</span>
          <Switch
            checked={!!s.announcement_enabled}
            onCheckedChange={(v) => set("announcement_enabled", v)}
          />
        </div>
        <Field label="نص الشريط">
          <Textarea
            rows={2}
            value={s.announcement_text ?? ""}
            onChange={(e) => set("announcement_text", e.target.value)}
            placeholder="شحن مجاني فوق ٣٠٠ ج.م | توصيل سريع ⚡"
          />
        </Field>
        <ColorField
          label="لون خلفية الشريط"
          value={s.announcement_bg_color}
          onChange={(v) => set("announcement_bg_color", v)}
        />
      </Section>

      {/* Hero */}
      <Section icon={Save} title="قسم الـ Hero">
        <Field label="العنوان الرئيسي">
          <Input value={s.hero_title ?? ""} onChange={(e) => set("hero_title", e.target.value)} />
        </Field>
        <Field label="العنوان الفرعي">
          <Textarea rows={2} value={s.hero_subtitle ?? ""} onChange={(e) => set("hero_subtitle", e.target.value)} />
        </Field>
        <Field label="نص الزر">
          <Input value={s.hero_cta_text ?? ""} onChange={(e) => set("hero_cta_text", e.target.value)} />
        </Field>
        <Field label="رابط صورة الخلفية">
          <Input value={s.hero_image_url ?? ""} onChange={(e) => set("hero_image_url", e.target.value)} placeholder="https://..." />
        </Field>
      </Section>

      {/* كوبون الطلب الأول */}
      <Section icon={Megaphone} title="عرض الطلب الأول">
        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <span className="text-sm font-bold">تفعيل كوبون الطلب الأول</span>
          <Switch
            checked={!!s.first_order_coupon_enabled}
            onCheckedChange={(v) => set("first_order_coupon_enabled", v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="كود الكوبون">
            <Input value={s.first_order_coupon_code ?? ""} onChange={(e) => set("first_order_coupon_code", e.target.value)} placeholder="WELCOME10" />
          </Field>
          <Field label="نسبة الخصم %">
            <NumberInput
              value={s.first_order_discount_percent ?? ""}
              onValueChange={(v) => set("first_order_discount_percent", v ? parseFloat(v) : null)}
            />
          </Field>
        </div>
      </Section>

      {/* التحليلات */}
      <Section icon={BarChart3} title="التحليلات والتتبّع">
        <Field label="Google Analytics 4 ID">
          <Input value={s.ga4_id ?? ""} onChange={(e) => set("ga4_id", e.target.value)} placeholder="G-XXXXXXXXXX" />
        </Field>
        <Field label="Meta Pixel ID">
          <Input value={s.meta_pixel_id ?? ""} onChange={(e) => set("meta_pixel_id", e.target.value)} placeholder="123456789012345" />
        </Field>
      </Section>

      {/* الطلبات والتوصيل */}
      <Section icon={Save} title="الطلبات والتوصيل">
        <div className="grid grid-cols-2 gap-3">
          <Field label="الحد الأدنى للطلب (ج.م)">
            <NumberInput
              value={s.min_order_amount ?? ""}
              onValueChange={(v) => set("min_order_amount", v ? parseFloat(v) : null)}
            />
          </Field>
          <Field label="رسوم التوصيل الافتراضية">
            <NumberInput
              value={s.default_delivery_fee ?? ""}
              onValueChange={(v) => set("default_delivery_fee", v ? parseFloat(v) : null)}
            />
          </Field>
          <Field label="الحد الأدنى للشحن المجاني (ج.م)">
            <NumberInput
              value={(s as any).free_shipping_threshold ?? ""}
              onValueChange={(v) => set("free_shipping_threshold" as any, v ? parseFloat(v) : null)}
            />
          </Field>
        </div>
      </Section>

      {/* موقع المتجر — الخريطة Lazy */}
      <Section icon={MapPin} title="موقع المتجر">
        <Field label="العنوان">
          <Input value={s.store_address ?? ""} onChange={(e) => set("store_address", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <NumberInput
              value={s.store_lat ?? ""}
              onValueChange={(v) => set("store_lat", v ? parseFloat(v) : null)}
            />
          </Field>
          <Field label="Longitude">
            <NumberInput
              value={s.store_lng ?? ""}
              onValueChange={(v) => set("store_lng", v ? parseFloat(v) : null)}
            />
          </Field>
        </div>

        {/* ── الخريطة تتحمل Lazy فقط عند الضغط ── */}
        <MapToggle
          lat={s.store_lat}
          lng={s.store_lng}
          onChange={(lat, lng) => setS({ ...s, store_lat: lat, store_lng: lng })}
        />
      </Section>

      {/* الخلفيات البصرية */}
      <Section icon={Palette} title="الهوية البصرية والخلفيات">
        <p className="text-xs text-muted-foreground">
          الصق روابط الصور من مساحة التخزين لتغيير خلفيات المتجر فوراً.
        </p>
        <Field label="خلفية البانر الرئيسي (Hero)">
          <Input value={s.hero_bg_image ?? ""} onChange={(e) => set("hero_bg_image", e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="خلفية صفحة تسجيل الدخول">
          <Input value={s.login_bg_pattern ?? ""} onChange={(e) => set("login_bg_pattern", e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="خلفية بطاقة السلة الفارغة">
          <Input value={s.cart_empty_bg ?? ""} onChange={(e) => set("cart_empty_bg", e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="صورة العنصر العائم (ورقة/عشب)">
          <Input value={s.floating_element_image ?? ""} onChange={(e) => set("floating_element_image", e.target.value)} placeholder="https://..." />
        </Field>
      </Section>

      {/* زر الحفظ */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button
          onClick={save}
          disabled={saving}
          size="lg"
          className="gap-2 rounded-full hero-gradient text-primary-foreground shadow-lg"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ التغييرات
        </Button>
      </div>
    </div>
  );
}

// ─── مكونات مساعدة ────────────────────────────────────────────────────────────
function Section({
  icon: Icon, title, children,
}: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <Icon className="h-5 w-5 text-accent" /> {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold">{label}</span>
      {children}
    </label>
  );
}

function ColorField({
  label, value, onChange,
}: {
  label: string; value: string | null; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="h-9 w-9 shrink-0 rounded-lg border border-border"
          style={{ background: value ? `hsl(${value})` : "transparent" }}
        />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="142 76% 36%"
        />
      </div>
    </label>
  );
}

// ─── LivePreview: يعرض شكل الهيدر واللافتة والألوان فور تعديل القيم ─────────
function LivePreview({ s }: { s: Settings }) {
  const primary = s.primary_color || "142 76% 24%";
  const accent = s.accent_color || "18 85% 55%";
  const bg = s.background_color || "48 33% 97%";
  const fg = s.foreground_color || "120 18% 12%";
  const annBg = s.announcement_bg_color || primary;

  return (
    <section className="sticky top-2 z-20 space-y-2 rounded-2xl border-2 border-dashed border-primary/40 bg-card p-3 shadow-lg">
      <div className="flex items-center justify-between px-1">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Eye className="h-4 w-4 text-accent" /> معاينة حية
        </h3>
        <span className="text-[10px] text-muted-foreground">تتحدّث فوراً</span>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-border"
        style={{ background: `hsl(${bg})`, color: `hsl(${fg})` }}
        dir="rtl"
      >
        {/* شريط الإعلانات */}
        {s.announcement_enabled && s.announcement_text && (
          <div
            className="truncate px-3 py-1.5 text-center text-[11px] font-bold text-white"
            style={{ background: `hsl(${annBg})` }}
          >
            {s.announcement_text}
          </div>
        )}

        {/* الهيدر */}
        <div
          className="flex items-center justify-between gap-2 border-b px-3 py-2"
          style={{ borderColor: `hsl(${fg} / 0.1)` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {s.logo_url ? (
              <img src={s.logo_url} alt="" className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `hsl(${primary})` }}
              >
                <Leaf className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="truncate text-sm font-bold">{s.site_name || "المتجر"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: `hsl(${fg} / 0.06)` }}
            >
              <Search className="h-3.5 w-3.5" />
            </div>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: `hsl(${fg} / 0.06)` }}
            >
              <User className="h-3.5 w-3.5" />
            </div>
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-white"
              style={{ background: `hsl(${accent})` }}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>

        {/* عيّنة زر ومنتج */}
        <div className="flex items-center gap-2 p-3">
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-xs font-bold text-white shadow"
            style={{ background: `hsl(${primary})` }}
          >
            {s.hero_cta_text || "تسوّق الآن"}
          </button>
          <span
            className="rounded-full px-2 py-1 text-[10px] font-bold text-white"
            style={{ background: `hsl(${accent})` }}
          >
            خصم
          </span>
          <span className="text-xs opacity-70">{s.hero_title || "الوادي الأخضر"}</span>
        </div>
      </div>

      {/* بطاقات الألوان */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { l: "رئيسي", v: primary },
          { l: "مميّز", v: accent },
          { l: "خلفية", v: bg },
          { l: "نص", v: fg },
        ].map((c) => (
          <div key={c.l} className="rounded-lg border border-border p-1.5 text-center">
            <div className="mb-1 h-6 w-full rounded" style={{ background: `hsl(${c.v})` }} />
            <span className="text-[9px] font-bold">{c.l}</span>
          </div>
        ))}
      </div>
    </section>
  );
}


// ─── MapToggle: يحمّل الخريطة Lazy فقط عند الضغط ────────────────────────────
function MapToggle({
  lat, lng, onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setShow(true)}
        className="gap-2"
      >
        <MapPin className="h-4 w-4" /> عرض الخريطة لتحديد الموقع
      </Button>
    );
  }

  return (
    // Suspense يعرض spinner ريثما يتحمل Google Maps
    <Suspense
      fallback={
        <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-secondary/30">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="me-2 text-sm text-muted-foreground">جاري تحميل الخريطة...</span>
        </div>
      }
    >
      <StoreMapPicker lat={lat} lng={lng} onChange={onChange} />
    </Suspense>
  );
}
