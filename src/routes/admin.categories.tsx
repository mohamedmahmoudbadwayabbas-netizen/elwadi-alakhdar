import { NumberInput } from "@/components/ui/number-input";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload, Image as ImageIcon, GripVertical } from "lucide-react";
import { toast } from "sonner";

type Cat = {
  id: string; name: string; slug: string; icon: string | null;
  sort_order: number; image_url: string | null; parent_id: string | null;
};

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "التصنيفات — لوحة التحكم" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Partial<Cat> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setRows((data ?? []) as Cat[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const parents = rows.filter((c) => !c.parent_id);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file, { contentType: file.type });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = await supabase.storage.from("store-assets").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (!data?.signedUrl) { toast.error("تعذر إنشاء رابط الصورة"); setUploading(false); return; }
    setEditing((e) => ({ ...(e ?? {}), image_url: data.signedUrl }));
    setUploading(false);
    toast.success("تم رفع الصورة");
  };

  const save = async () => {
    if (!editing?.name) { toast.error("الاسم مطلوب"); return; }
    if (!editing?.image_url) { toast.error("صورة الفئة مطلوبة"); return; }
    const payload = {
      name: editing.name!,
      slug: (editing.slug || editing.name).toLowerCase().replace(/\s+/g, "-").slice(0, 60),
      icon: null,
      image_url: editing.image_url || null,
      parent_id: editing.parent_id || null,
      sort_order: Number(editing.sort_order ?? 0),
    };
    const res = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (res.error) toast.error(res.error.message);
    else { toast.success("تم الحفظ"); setEditing(null); load(); }
  };

  const remove = async (id: string) => {
    if (!confirm("تأكيد حذف التصنيف؟")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("تم الحذف"); load(); }
  };

  const moveSort = async (cat: Cat, direction: -1 | 1) => {
    const siblings = rows.filter((c) => c.parent_id === cat.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    const idx = siblings.findIndex((c) => c.id === cat.id);
    const swapWith = siblings[idx + direction];
    if (!swapWith) return;
    await supabase.from("categories").update({ sort_order: swapWith.sort_order }).eq("id", cat.id);
    await supabase.from("categories").update({ sort_order: cat.sort_order }).eq("id", swapWith.id);
    load();
  };

  return (
    <div className="space-y-4 p-4 sm:p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">التصنيفات</h2>
          <p className="text-xs text-muted-foreground">فئات رئيسية وفرعية مع صور</p>
        </div>
        <Button onClick={() => setEditing({ sort_order: rows.length })} className="gap-2 rounded-full hero-gradient text-primary-foreground">
          <Plus className="h-4 w-4" /> تصنيف جديد
        </Button>
      </div>
      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-secondary" />
      ) : (
        <div className="space-y-4">
          {parents.map((p) => {
            const kids = rows.filter((c) => c.parent_id === p.id).sort((a, b) => a.sort_order - b.sort_order);
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10">
                    {p.image_url ? (
                      <img src={p.image_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{p.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{p.slug} • رئيسية • ترتيب {p.sort_order}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSort(p, -1)}>▲</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveSort(p, 1)}>▼</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ parent_id: p.id, sort_order: kids.length })}>
                      <Plus className="h-4 w-4" /> فرعي
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                {kids.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3 pr-7">
                    {kids.map((k) => (
                      <div key={k.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-2">
                        <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary">
                          {k.image_url ? (
                            <img src={k.image_url} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold">{k.name}</div>
                          <div className="truncate text-[10px] text-muted-foreground">{k.slug}</div>
                        </div>
                        <div className="flex shrink-0 gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSort(k, -1)}>▲</Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSort(k, 1)}>▼</Button>
                          <Button variant="ghost" size="icon" onClick={() => setEditing(k)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(k.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {parents.length === 0 && (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              لا توجد فئات — أنشئ أول فئة رئيسية.
            </div>
          )}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{editing?.id ? "تعديل" : (editing?.parent_id ? "فئة فرعية جديدة" : "تصنيف جديد")}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div>
                <span className="mb-1.5 block text-xs font-bold">صورة الفئة (تظهر في الرئيسية وصفحة الفئات)</span>
                <div className="flex items-center gap-3">
                  <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/40">
                    {editing.image_url ? <img src={editing.image_url} className="h-full w-full object-cover" alt="" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
                    <Upload className="h-4 w-4" /> {uploading ? "جارٍ الرفع..." : "رفع"}
                  </Button>
                  {editing.image_url && (
                    <Button variant="ghost" size="sm" onClick={() => setEditing({ ...editing, image_url: null })}>إزالة</Button>
                  )}
                </div>
              </div>
              <Field label="فئة أب (اختياري)">
                <select
                  value={editing.parent_id ?? ""}
                  onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="">— لا شيء (فئة رئيسية) —</option>
                  {parents.filter((p) => p.id !== editing.id).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="الاسم"><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="المعرّف (slug)"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="اختياري" /></Field>
              <Field label="الترتيب"><NumberInput decimal={false} value={editing.sort_order ?? 0} onValueChange={(v) => setEditing({ ...editing, sort_order: parseInt(v || "0", 10) || 0 })} /></Field>
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
