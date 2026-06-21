import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Loader2, MapPin } from "lucide-react";
import { StoreMapPicker } from "@/components/admin/StoreMapPicker";

type Settings = {
  id?: string;
  whatsapp_number: string | null;
  hero_title: string; hero_subtitle: string;
  hero_image_url: string | null; hero_cta_text: string;
  store_address: string | null; store_lat: number | null; store_lng: number | null;
};

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "إعدادات المتجر — لوحة التحكم" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("store_settings").select("*").limit(1).maybeSingle().then(({ data }) => {
      setS(data as Settings | null); setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!s) return;
    setSaving(true);
    const payload = {
      whatsapp_number: s.whatsapp_number, hero_title: s.hero_title, hero_subtitle: s.hero_subtitle,
      hero_image_url: s.hero_image_url, hero_cta_text: s.hero_cta_text, store_address: s.store_address,
      store_lat: s.store_lat, store_lng: s.store_lng,
    };
    const res = s.id
      ? await supabase.from("store_settings").update(payload).eq("id", s.id)
      : await supabase.from("store_settings").insert(payload);
    setSaving(false);
    if (res.error) toast.error(res.error.message);
    else toast.success("تم حفظ الإعدادات");
  };

  if (loading || !s) return <div className="p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <h2 className="font-display text-2xl font-bold">إعدادات المتجر</h2>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-bold">تواصل ودعم</h3>
        <Field label="رقم واتساب (مع رمز الدولة)">
          <Input value={s.whatsapp_number ?? ""} onChange={(e) => setS({ ...s, whatsapp_number: e.target.value })} placeholder="+201234567890" />
        </Field>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display text-lg font-bold">قسم الـ Hero (الصفحة الرئيسية)</h3>
        <Field label="العنوان الرئيسي"><Input value={s.hero_title} onChange={(e) => setS({ ...s, hero_title: e.target.value })} /></Field>
        <Field label="العنوان الفرعي"><Textarea rows={2} value={s.hero_subtitle} onChange={(e) => setS({ ...s, hero_subtitle: e.target.value })} /></Field>
        <Field label="نص الزر"><Input value={s.hero_cta_text} onChange={(e) => setS({ ...s, hero_cta_text: e.target.value })} /></Field>
        <Field label="رابط صورة الخلفية (اختياري)"><Input value={s.hero_image_url ?? ""} onChange={(e) => setS({ ...s, hero_image_url: e.target.value })} placeholder="https://..." /></Field>
      </section>

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold"><MapPin className="h-5 w-5 text-accent" /> موقع المتجر</h3>
        <Field label="العنوان"><Input value={s.store_address ?? ""} onChange={(e) => setS({ ...s, store_address: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="خط العرض (Latitude)"><Input type="number" step="0.000001" value={s.store_lat ?? ""} onChange={(e) => setS({ ...s, store_lat: e.target.value ? +e.target.value : null })} /></Field>
          <Field label="خط الطول (Longitude)"><Input type="number" step="0.000001" value={s.store_lng ?? ""} onChange={(e) => setS({ ...s, store_lng: e.target.value ? +e.target.value : null })} /></Field>
        </div>
        <StoreMapPicker
          lat={s.store_lat}
          lng={s.store_lng}
          onChange={(lat, lng) => setS({ ...s, store_lat: lat, store_lng: lng })}
        />
        {s.store_lat && s.store_lng && (
          <a
            href={`https://www.google.com/maps?q=${s.store_lat},${s.store_lng}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary"
          >
            عرض على Google Maps ↗
          </a>
        )}
        <p className="text-[11px] text-muted-foreground">انقر على الخريطة أو اسحب الدبوس لتحديد موقع المتجر بدقة.</p>
      </section>

      <Button onClick={save} disabled={saving} className="gap-2 rounded-full hero-gradient text-primary-foreground">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ التغييرات
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold">{label}</span>{children}</label>;
}
