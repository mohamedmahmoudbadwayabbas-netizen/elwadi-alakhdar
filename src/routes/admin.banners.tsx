import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { NumberInput } from "@/components/ui/number-input";
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/banners")({
  head: () => ({ meta: [{ title: "البانرات — لوحة التحكم" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: BannersPage,
});

type Banner = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

function BannersPage() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("hero_banners").select("*").order("sort_order");
    setRows((data ?? []) as Banner[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file, { contentType: file.type });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = await supabase.storage.from("store-assets").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (!data?.signedUrl) { toast.error("تعذر إنشاء رابط الصورة"); setUploading(false); return; }
    setEditing((e) => ({ ...(e ?? {}), image_url: data.signedUrl }));
    setUploading(false);
    toast.success("تم رفع الصورة");
  };

  const save = async () => {
    if (!editing?.image_url) { toast.error("ارفع صورة البانر أولاً"); return; }
    const payload = {
      image_url: editing.image_url!,
      title: editing.title || null,
      subtitle: editing.subtitle || null,
      cta_text: editing.cta_text || null,
      link_url: editing.link_url || null,
      sort_order: Number(editing.sort_order ?? 0),
      is_active: editing.is_active ?? true,
    };
    const res = editing.id
      ? await supabase.from("hero_banners").update(payload).eq("id", editing.id)
      : await supabase.from("hero_banners").insert(payload);
    if (res.error) toast.error(res.error.message);
    else { toast.success("تم الحفظ"); setEditing(null); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("تأكيد حذف البانر؟")) return;
    const { error } = await supabase.from("hero_banners").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("تم الحذف"); load(); }
  };

  const toggleActive = async (b: Banner) => {
    await supabase.from("hero_banners").update({ is_active: !b.is_active }).eq("id", b.id);
    load();
  };

  return (
    <div className="space-y-4 p-4 sm:p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">البانرات الإعلانية</h2>
          <p className="text-xs text-muted-foreground">الصور المتحركة في السلايدر بالصفحة الرئيسية</p>
        </div>
        <Button onClick={() => setEditing({ sort_order: rows.length, is_active: true })} className="gap-2 rounded-full hero-gradient text-primary-foreground">
          <Plus className="h-4 w-4" /> بانر جديد
        </Button>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-3xl bg-secondary" />
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          لا توجد بانرات — أنشئ أول بانر إعلاني.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((b) => (
            <div key={b.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[16/9] bg-secondary">
                <img src={b.image_url} alt={b.title ?? ""} className="h-full w-full object-cover" />
                {!b.is_active && (
                  <span className="absolute top-2 start-2 rounded-full bg-destructive/90 px-2 py-1 text-[10px] font-black text-destructive-foreground">
                    غير مفعّل
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <div className="truncate font-bold">{b.title || "بدون عنوان"}</div>
                  <div className="text-[11px] text-muted-foreground">ترتيب {b.sort_order}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(b)}>
                    {b.is_active ? "إخفاء" : "تفعيل"}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{editing?.id ? "تعديل البانر" : "بانر جديد"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div>
                <span className="mb-1.5 block text-xs font-bold">صورة البانر</span>
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/40">
                  {editing.image_url ? (
                    <img src={editing.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
                />
                <Button variant="outline" size="sm" className="mt-2 w-full gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4" />
                  {uploading ? "جارٍ الرفع..." : "رفع صورة من الجهاز"}
                </Button>
              </div>
              <Field label="عنوان (اختياري)"><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
              <Field label="وصف مختصر (اختياري)"><Textarea rows={2} value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="نص الزر"><Input value={editing.cta_text ?? ""} onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })} placeholder="تسوّق الآن" /></Field>
                <Field label="رابط الوجهة"><Input dir="ltr" value={editing.link_url ?? ""} onChange={(e) => setEditing({ ...editing, link_url: e.target.value })} placeholder="/ أو /categories" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="الترتيب"><NumberInput decimal={false} value={editing.sort_order ?? 0} onValueChange={(v) => setEditing({ ...editing, sort_order: parseInt(v || "0", 10) || 0 })} /></Field>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                  مفعّل
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button onClick={save} className="hero-gradient text-primary-foreground">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-bold">{label}</span>{children}</label>;
}
