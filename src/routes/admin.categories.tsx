import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Cat = { id: string; name: string; slug: string; icon: string | null; sort_order: number };

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "التصنيفات — لوحة التحكم" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [rows, setRows] = useState<Cat[]>([]);
  const [editing, setEditing] = useState<Partial<Cat> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setRows((data ?? []) as Cat[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name) { toast.error("الاسم مطلوب"); return; }
    const payload = {
      name: editing.name!,
      slug: (editing.slug || editing.name).toLowerCase().replace(/\s+/g, "-").slice(0, 60),
      icon: editing.icon || null,
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

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">التصنيفات</h2>
        <Button onClick={() => setEditing({ sort_order: rows.length })} className="gap-2 rounded-full hero-gradient text-primary-foreground">
          <Plus className="h-4 w-4" /> تصنيف جديد
        </Button>
      </div>
      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-secondary" />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">{c.icon ?? "🌿"}</div>
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">{c.slug} • ترتيب {c.sort_order}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle className="font-display">{editing?.id ? "تعديل" : "تصنيف جديد"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <Field label="الاسم"><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="المعرّف (slug)"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="اختياري" /></Field>
              <Field label="الأيقونة (Emoji)"><Input value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="🌿" /></Field>
              <Field label="الترتيب"><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: +e.target.value })} /></Field>
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
