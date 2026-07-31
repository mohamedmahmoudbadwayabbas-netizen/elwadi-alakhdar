import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminSupabase as supabase } from "@/integrations/supabase/admin-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Upload, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

type Product = {
  id: string; name: string; description: string | null; category_id: string | null;
  price_per_unit: number; old_price: number | null; image_url: string | null;
  is_by_weight: boolean; unit_label: string; is_popular: boolean; is_on_sale: boolean;
  is_featured: boolean; stock_quantity: number; low_stock_threshold: number;
};
type Category = { id: string; name: string };

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "المنتجات — لوحة التحكم" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ProductsPage,
});

const empty: Partial<Product> = {
  name: "", description: "", category_id: null, price_per_unit: 0, old_price: null,
  image_url: null, is_by_weight: false, unit_label: "قطعة", is_popular: false,
  is_on_sale: false, is_featured: false, stock_quantity: 100, low_stock_threshold: 10,
};

import { normalizeDigits } from "@/lib/i18n-context";
// تحويل الأرقام العربية/الفارسية/الأردية إلى لاتينية
function normalizeNumber(v: string): number {
  if (!v) return 0;
  const n = parseFloat(normalizeDigits(String(v)).replace(/,/g, "."));
  return Number.isFinite(n) ? n : 0;
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("id,name").order("sort_order"),
    ]);
    setProducts((p ?? []) as Product[]);
    setCats((c ?? []) as Category[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing?.name || editing.price_per_unit == null) {
      toast.error("الاسم والسعر مطلوبان"); return;
    }
    const price = Number(editing.price_per_unit);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("السعر يجب أن يكون رقماً موجباً"); return;
    }
    // التحقق من صحة بيانات المنتجات الموزونة
    if (editing.is_by_weight) {
      const unit = (editing.unit_label || "").trim();
      if (!unit) { toast.error("أدخل وحدة الوزن (مثال: كجم، جرام)"); return; }
      const stock = Number(editing.stock_quantity ?? 0);
      if (!Number.isFinite(stock) || stock < 0) {
        toast.error("مخزون المنتج الموزون يجب أن يكون رقماً صحيحاً ≥ 0"); return;
      }
    }
    setSaving(true);
    const payload = {
      name: editing.name!, description: editing.description || null,
      category_id: editing.category_id || null,
      price_per_unit: price,
      old_price: editing.old_price ? Number(editing.old_price) : null,
      image_url: editing.image_url || null,
      is_by_weight: !!editing.is_by_weight,
      unit_label: editing.unit_label || (editing.is_by_weight ? "كجم" : "قطعة"),
      is_popular: !!editing.is_popular, is_on_sale: !!editing.is_on_sale, is_featured: !!editing.is_featured,
      stock_quantity: Number(editing.stock_quantity ?? 0),
      low_stock_threshold: Number(editing.low_stock_threshold ?? 0),
    };
    const res = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success("تم الحفظ");
    setEditing(null); load();
  };


  const remove = async (id: string) => {
    if (!confirm("تأكيد حذف المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("تم الحذف"); load(); }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data, error: signErr } = await supabase.storage
      .from("product-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr || !data?.signedUrl) {
      toast.error(signErr?.message ?? "تعذر إنشاء رابط الصورة");
      setUploading(false);
      return;
    }
    setEditing((e) => ({ ...(e ?? {}), image_url: data.signedUrl }));
    setUploading(false);
    toast.success("تم رفع الصورة");
  };

  const toggleFeatured = async (p: Product) => {
    const { error } = await supabase.from("products").update({ is_featured: !p.is_featured }).eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success(!p.is_featured ? "تم تثبيتها كأكثر مبيعاً" : "تم الإلغاء"); load(); }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-2xl font-bold">المنتجات</h2>
        <Button onClick={() => setEditing({ ...empty })} className="gap-2 rounded-full hero-gradient text-primary-foreground">
          <Plus className="h-4 w-4" /> منتج جديد
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary/40 text-xs">
              <tr>
                <th className="p-3 text-start">المنتج</th>
                <th className="p-3 text-start">السعر</th>
                <th className="p-3 text-start">المخزون</th>
                <th className="p-3 text-start">الأكثر مبيعاً</th>
                <th className="p-3 text-end">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = p.stock_quantity <= p.low_stock_threshold;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-secondary">
                          {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" alt="" /> : <div className="grid h-full w-full place-items-center text-lg">🌿</div>}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-bold">{p.name}</div>
                          <div className="text-[11px] text-muted-foreground">{p.is_by_weight ? "موزون" : p.unit_label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-bold text-primary">{p.price_per_unit.toFixed(2)} ج.م{p.is_by_weight ? "/كجم" : ""}</td>
                    <td className="p-3">
                      <span className={low ? "font-black text-destructive" : ""}>{p.stock_quantity}</span>
                      {low && <span className="ms-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">منخفض</span>}
                    </td>
                    <td className="p-3">
                      <button onClick={() => toggleFeatured(p)} aria-label="featured">
                        <Star className={`h-5 w-5 ${p.is_featured ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                      </button>
                    </td>
                    <td className="p-3 text-end">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا توجد منتجات</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-card !opacity-100" dir="rtl">
          <DialogHeader><DialogTitle className="font-display">{editing?.id ? "تعديل المنتج" : "منتج جديد"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="الاسم" full><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="الوصف" full><Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
              <Field label="التصنيف">
                <Select value={editing.category_id ?? "__none__"} onValueChange={(v) => setEditing({ ...editing, category_id: v === "__none__" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="بدون" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">بدون</SelectItem>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="وحدة العرض"><Input value={editing.unit_label ?? ""} onChange={(e) => setEditing({ ...editing, unit_label: e.target.value })} placeholder="قطعة / كجم" /></Field>
              <Field label={editing.is_by_weight ? "السعر / كجم" : "السعر"}>
                <NumberInput value={editing.price_per_unit ?? 0} onValueChange={(v) => setEditing({ ...editing, price_per_unit: normalizeNumber(v) })} />
              </Field>
              <Field label="السعر القديم (اختياري)">
                <NumberInput value={editing.old_price ?? ""} onValueChange={(v) => setEditing({ ...editing, old_price: v ? normalizeNumber(v) : null })} />
              </Field>
              <Field label="المخزون"><NumberInput decimal={false} value={editing.stock_quantity ?? 0} onValueChange={(v) => setEditing({ ...editing, stock_quantity: normalizeNumber(v) })} /></Field>
              <Field label="حد التنبيه للمخزون المنخفض"><NumberInput decimal={false} value={editing.low_stock_threshold ?? 0} onValueChange={(v) => setEditing({ ...editing, low_stock_threshold: normalizeNumber(v) })} /></Field>

              <div className="sm:col-span-2 grid grid-cols-3 gap-3 rounded-2xl border border-border bg-secondary/30 p-3">
                <Toggle label="موزون (كجم)" checked={!!editing.is_by_weight} onChange={(v) => setEditing({ ...editing, is_by_weight: v, unit_label: v ? "كجم" : (editing.unit_label || "قطعة") })} />
                <Toggle label="الأكثر مبيعاً" checked={!!editing.is_featured} onChange={(v) => setEditing({ ...editing, is_featured: v })} />
                <Toggle label="عرض خاص" checked={!!editing.is_on_sale} onChange={(v) => setEditing({ ...editing, is_on_sale: v })} />
              </div>

              <Field label="صورة المنتج" full>
                <div className="flex items-center gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-secondary">
                    {editing.image_url ? <img src={editing.image_url} className="h-full w-full object-cover" alt="" /> : <div className="grid h-full w-full place-items-center text-2xl">🌿</div>}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold hover:bg-secondary">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? "جارٍ الرفع..." : "رفع صورة"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                  </label>
                  {editing.image_url && (
                    <Input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="رابط الصورة" className="flex-1" />
                  )}
                </div>
              </Field>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>إلغاء</Button>
            <Button onClick={save} disabled={saving} className="hero-gradient text-primary-foreground">
              {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null} حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-bold">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2">
      <Label className="text-xs font-bold">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
