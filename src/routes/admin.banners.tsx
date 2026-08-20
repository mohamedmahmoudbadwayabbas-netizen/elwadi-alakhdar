import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Eye,
  EyeOff,
  Tag,
  ChevronLeft,
  ChevronRight,
  Flame,
  Layers,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const Route = createFileRoute("/admin/banners")({
  head: () => ({
    meta: [
      { title: "إدارة البانرات والعروض — لوحة التحكم" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: BannersPage,
});

export type Banner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
};

// جاهزية عروض مسبقة للاضافة بنقرة واحدة (Presets)
const PROMO_PRESETS = [
  {
    title: "مهرجان الطازج — خصم حتى 35% 🥩🥦",
    subtitle: "تسوّق أفضل أجود اللحوم البلدي والخضروات الفاخرة الموردة طازجة يومياً لبيتك.",
    cta_text: "تصفح قسم الطازج 🛒",
    link_url: "#selective-category-grid",
    image_url:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "جمعة البقالة التوفيرية 🌾🛍️",
    subtitle: "عروض البقالة والسلع التموينية الأساسية بأعلى جودة وأفضل أسعار الجملة في مصر.",
    cta_text: "عروض البقالة 🚀",
    link_url: "#selective-category-grid",
    image_url:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1400&q=85",
  },
  {
    title: "عروض المنظفات واللاوازم المنزلية 🧴✨",
    subtitle: "كل ما تحتاجه لجميع أعمال النظافة والعناية بالمنزل بأقوى الخصومات.",
    cta_text: "تصفح العروض 🛒",
    link_url: "#selective-category-grid",
    image_url:
      "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=1400&q=85",
  },
];

const DEFAULT_BANNERS: Banner[] = PROMO_PRESETS.map((p, idx) => ({
  id: `banner-default-${idx + 1}`,
  image_url: p.image_url,
  title: p.title,
  subtitle: p.subtitle,
  cta_text: p.cta_text,
  link_url: p.link_url,
  sort_order: idx + 1,
  is_active: true,
  created_at: new Date().toISOString(),
}));

function BannersPage() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const load = async () => {
    setLoading(true);
    let localList: Banner[] = [];
    try {
      const cached = localStorage.getItem("alwadi_hero_banners");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) localList = parsed;
      }
    } catch {}

    try {
      const { data, error } = await supabase
        .from("hero_banners")
        .select("*")
        .order("sort_order", { ascending: true });

      if (data && data.length > 0) {
        setRows(data as Banner[]);
        try {
          localStorage.setItem("alwadi_hero_banners", JSON.stringify(data));
        } catch {}
        setLoading(false);
        return;
      }
    } catch {}

    const finalList = localList.length > 0 ? localList : DEFAULT_BANNERS;
    setRows(finalList);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Save manual edit or creation
  const handleSave = async () => {
    if (!editing?.image_url) {
      toast.error("يرجى اختيار أو رفع صورة البانر أولاً 🖼️");
      return;
    }

    setSaving(true);
    const payload: Banner = {
      id: editing.id || `banner-${Date.now()}`,
      image_url: editing.image_url!,
      title: editing.title || null,
      subtitle: editing.subtitle || null,
      cta_text: editing.cta_text || null,
      link_url: editing.link_url || null,
      sort_order: Number(editing.sort_order ?? rows.length),
      is_active: editing.is_active ?? true,
      created_at: editing.created_at || new Date().toISOString(),
    };

    try {
      if (editing.id) {
        await supabase.from("hero_banners").update(payload).eq("id", editing.id);
      } else {
        await supabase.from("hero_banners").insert(payload);
      }
    } catch {}

    setRows((prev) => {
      let next: Banner[];
      if (editing.id) {
        next = prev.map((item) => (item.id === editing.id ? payload : item));
      } else {
        next = [...prev, payload];
      }
      try {
        localStorage.setItem("alwadi_hero_banners", JSON.stringify(next));
      } catch {}
      return next;
    });

    setSaving(false);
    toast.success(editing.id ? "تم تحديث البانر بنجاح ✨" : "تم إضافة البانر الترويجي بنجاح 🎉");
    setEditing(null);
  };

  // Add preset promo banner
  const handleAddPreset = async (preset: (typeof PROMO_PRESETS)[0]) => {
    const payload: Banner = {
      id: `banner-preset-${Date.now()}`,
      ...preset,
      sort_order: rows.length,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from("hero_banners").insert(payload);
    } catch {}

    setRows((prev) => {
      const next = [...prev, payload];
      try {
        localStorage.setItem("alwadi_hero_banners", JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success(`تمت إضافة العرض "${preset.title}" لسلايدر الهيرو ✨`);
  };

  const confirmDelete = async () => {
    if (!deletingBanner) return;
    setIsDeleting(true);
    try {
      await supabase.from("hero_banners").delete().eq("id", deletingBanner.id);
    } catch {}
    setIsDeleting(false);

    setRows((prev) => {
      const next = prev.filter((item) => item.id !== deletingBanner.id);
      try {
        localStorage.setItem("alwadi_hero_banners", JSON.stringify(next));
      } catch {}
      return next;
    });

    toast.success("تم حذف البانر الترويجي بنجاح 🗑️");
    setDeletingBanner(null);
    if (editing?.id === deletingBanner.id) setEditing(null);
  };

  const toggleActive = async (b: Banner) => {
    const updated = { ...b, is_active: !b.is_active };
    try {
      await supabase.from("hero_banners").update({ is_active: updated.is_active }).eq("id", b.id);
    } catch {}

    setRows((prev) => {
      const next = prev.map((item) => (item.id === b.id ? updated : item));
      try {
        localStorage.setItem("alwadi_hero_banners", JSON.stringify(next));
      } catch {}
      return next;
    });

    toast.success(
      updated.is_active ? "تم تفعيل البانر بالصفحة الرئيسية ✨" : "تم إخفاء البانر من الواجهة",
    );
  };

  const activeBanners = rows.filter((r) => r.is_active);

  return (
    <div className="space-y-6 p-4 sm:p-6 pb-24" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="font-display text-2xl font-black text-foreground flex items-center gap-2">
            <span>إدارة البانرات والسلايدر الترويجي 🖼️</span>
            <span className="text-xs font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
              {rows.length} بانرات ({activeBanners.length} مفعّل)
            </span>
          </h1>
          <p className="text-xs font-bold text-muted-foreground mt-1">
            أضف وعدّل البانرات الترويجية والعروض التي تظهر في سلايدر الهيرو المتحرك بصفحة المتجر
            الرئيسية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={load}
            variant="outline"
            size="sm"
            className="rounded-2xl gap-1.5 text-xs font-bold border-border/80"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>تحديث</span>
          </Button>

          <Button
            onClick={() =>
              setEditing({
                sort_order: rows.length,
                is_active: true,
                title: "عرض ترويجي جديد 🔥",
                cta_text: "تسوّق العرض 🛒",
              })
            }
            className="rounded-2xl hero-gradient text-primary-foreground font-black text-xs gap-2 shadow-md hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة بانر جديد 🖼️</span>
          </Button>
        </div>
      </div>

      {/* Quick Presets Section */}
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>إضافة عروض ترويجية جاهزة لسلايدر الواجهة بنقرة واحدة:</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PROMO_PRESETS.map((preset, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-emerald-500/40 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={preset.image_url}
                  alt=""
                  className="h-11 w-14 rounded-xl object-cover shrink-0 border border-border/50"
                />
                <div className="min-w-0">
                  <div className="text-xs font-black text-foreground truncate">{preset.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {preset.cta_text}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleAddPreset(preset)}
                className="h-8 rounded-xl text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 shrink-0 gap-1 ms-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>إضافة</span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Live Admin Slider Preview */}
      {rows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-500" />
              <span>معاينة سلايدر الهيرو في الصفحة الرئيسية (Interactive Live Preview):</span>
            </h3>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={() => setPreviewIndex((prev) => (prev > 0 ? prev - 1 : rows.length - 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-[11px] font-mono font-bold px-2">
                {previewIndex + 1} / {rows.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg"
                onClick={() => setPreviewIndex((prev) => (prev < rows.length - 1 ? prev + 1 : 0))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-border/80 shadow-lg min-h-[200px] bg-slate-900 text-white p-6 flex flex-col justify-between">
            {rows[previewIndex] && (
              <>
                <div
                  className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
                  style={{
                    backgroundImage: `url(${rows[previewIndex].image_url})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
                </div>

                <div className="relative z-10 space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-400/30">
                    <Flame className="h-3 w-3 text-amber-400" />
                    <span>
                      عرض ترويجي حقيقي ({rows[previewIndex].is_active ? "مفعّل" : "معطّل"})
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white leading-tight">
                    {rows[previewIndex].title || "عنوان العرض الترويجي"}
                  </h3>
                  <p className="text-xs text-slate-200 line-clamp-2">
                    {rows[previewIndex].subtitle || "الوصف التفصيلي للعرض والتخفيضات المتاحة..."}
                  </p>
                </div>

                <div className="relative z-10 pt-4 flex items-center justify-between">
                  <div className="px-5 py-2 rounded-xl hero-gradient text-xs font-black text-primary-foreground shadow-md inline-flex items-center gap-2">
                    <span>{rows[previewIndex].cta_text || "تسوّق العرض الآن"}</span>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex gap-1.5">
                    {rows.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        onClick={() => setPreviewIndex(dotIdx)}
                        className={`h-2 rounded-full transition-all ${
                          dotIdx === previewIndex ? "w-6 bg-emerald-400" : "w-2 bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Banners List Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-foreground">قائمة البانرات الحالية:</h3>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-48 rounded-3xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-3 bg-card/50">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">لا توجد بانرات ترويجية حالياً</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                اضغط على "إضافة بانر جديد" أو اختر من العروض الجاهزة بالخلفية الخضراء أعلاه
              </p>
            </div>
            <Button
              onClick={() =>
                setEditing({
                  sort_order: 0,
                  is_active: true,
                  title: "عروض السوبرماركت والتوفير 🔥",
                })
              }
              className="rounded-2xl hero-gradient text-primary-foreground text-xs font-black gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>أنشئ أول بانر ترويجي 🚀</span>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((b, idx) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`overflow-hidden rounded-3xl border transition-all ${
                  b.is_active
                    ? "border-border/80 bg-card hover:border-emerald-500/40 shadow-xs"
                    : "border-border/40 bg-card/60 opacity-70"
                }`}
              >
                {/* Banner Thumbnail */}
                <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden group">
                  <img
                    src={b.image_url}
                    alt={b.title ?? ""}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Status Badge */}
                  <div className="absolute top-3 start-3 flex items-center gap-1.5">
                    {b.is_active ? (
                      <span className="rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                        مفعّل بالواجهة ⚡
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-800/90 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black text-slate-300">
                        معطّل
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 end-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                    #{b.sort_order}
                  </div>

                  {/* Quick Card Action Title Overlay */}
                  <div className="absolute bottom-3 start-3 end-3 text-white">
                    <h4 className="font-black text-sm truncate">{b.title || "بدون عنوان"}</h4>
                    {b.cta_text && (
                      <span className="text-[10px] text-emerald-300 font-bold block truncate">
                        الزر: {b.cta_text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Controls Footer */}
                <div className="p-3.5 space-y-2">
                  {b.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-2 font-bold leading-relaxed">
                      {b.subtitle}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(b)}
                      className={`h-8 rounded-xl text-xs font-bold gap-1.5 ${
                        b.is_active
                          ? "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                      }`}
                    >
                      {b.is_active ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      <span>{b.is_active ? "إخفاء" : "تفعيل"}</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditing(b)}
                        className="h-8 w-8 rounded-xl border-border/80"
                        title="تعديل البانر"
                      >
                        <Pencil className="h-3.5 w-3.5 text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingBanner(b)}
                        className="h-8 w-8 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                        title="حذف البانر"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent dir="rtl" className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-black flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <span>{editing?.id ? "تعديل البانر الترويجي" : "إضافة بانر ترويجي جديد"}</span>
            </DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4 py-2">
              {/* Image Upload Component */}
              <ImageUploader
                value={editing.image_url}
                onChange={(v) => setEditing({ ...editing, image_url: v || "" })}
                label="صورة البانر (رفع مباشر من الجهاز أو رابط)"
                folder="banners"
              />

              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-extrabold text-foreground">
                    عنوان البانر أو العرض:
                  </span>
                  <Input
                    value={editing.title ?? ""}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    placeholder="مثلاً: مهرجان اللحوم البلدية — خصم 25%"
                    className="h-10 rounded-xl font-bold text-xs"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-extrabold text-foreground">
                    الوصف التوضيحي للعرض:
                  </span>
                  <Textarea
                    rows={2}
                    value={editing.subtitle ?? ""}
                    onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                    placeholder="تسوّق أفضل قطعيات اللحوم البلدية الطازجة بأفضل أسعار الجملة..."
                    className="rounded-xl font-bold text-xs"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-extrabold text-foreground">
                      نص زر التوجيه (CTA):
                    </span>
                    <Input
                      value={editing.cta_text ?? ""}
                      onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })}
                      placeholder="تسوّق العرض الآن 🛒"
                      className="h-10 rounded-xl font-bold text-xs"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-extrabold text-foreground">
                      رابط الوجهة عند النقر:
                    </span>
                    <Input
                      dir="ltr"
                      value={editing.link_url ?? ""}
                      onChange={(e) => setEditing({ ...editing, link_url: e.target.value })}
                      placeholder="#selective-category-grid أو /categories"
                      className="h-10 rounded-xl font-bold text-xs text-right"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center pt-2 border-t border-border/50">
                  <label className="block space-y-1">
                    <span className="text-xs font-extrabold text-foreground">
                      رقم الترتيب بالسلايدر:
                    </span>
                    <NumberInput
                      decimal={false}
                      value={editing.sort_order ?? 0}
                      onValueChange={(v) =>
                        setEditing({ ...editing, sort_order: parseInt(v || "0", 10) || 0 })
                      }
                    />
                  </label>

                  <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-secondary/30 p-2.5 mt-4">
                    <span className="text-xs font-bold text-foreground">تفعيل بالواجهة</span>
                    <Switch
                      checked={editing.is_active ?? true}
                      onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60 flex-row items-center justify-between">
            {editing?.id ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  setDeletingBanner(rows.find((r) => r.id === editing.id) || (editing as Banner))
                }
                className="rounded-xl text-xs font-bold gap-1.5 bg-rose-500 hover:bg-rose-600 me-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>حذف البانر</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
                className="rounded-xl text-xs font-bold"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl hero-gradient text-primary-foreground font-black text-xs gap-2 shadow-md"
              >
                {saving ? (
                  <span>جارٍ الحفظ...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>حفظ البانر</span>
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingBanner} onOpenChange={(o) => !o && setDeletingBanner(null)}>
        <DialogContent dir="rtl" className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>تأكيد حذف البانر الترويجي</span>
            </DialogTitle>
          </DialogHeader>

          {deletingBanner && (
            <div className="space-y-3 py-2">
              <p className="text-xs font-bold text-foreground leading-relaxed">
                هل أنت تأكد من رغبتك في حذف هذا البانر الترويجي؟ لن تظهر هذه الصورة أو العرض مجدداً
                في سلايدر الواجهة الرئيسية.
              </p>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50 border border-border/60">
                <img
                  src={deletingBanner.image_url}
                  alt=""
                  className="h-12 w-16 rounded-xl object-cover shrink-0 border border-border/50"
                />
                <div className="min-w-0">
                  <div className="text-xs font-black text-foreground truncate">
                    {deletingBanner.title || "عرض بدون عنوان"}
                  </div>
                  {deletingBanner.subtitle && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {deletingBanner.subtitle}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeletingBanner(null)}
              className="rounded-xl text-xs font-bold"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs gap-1.5 shadow-md"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>تأكيد الحذف النهائي</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
