import { NumberInput } from "@/components/ui/number-input";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Ticket, Percent, DollarSign } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  uses_count: number | null;
  expires_at: string | null;
  is_active: boolean;
  first_order_only: boolean;
};

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "الكوبونات — لوحة التحكم" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: CouponsPage,
});

function CouponsPage() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Coupon[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("حذف الكوبون؟")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم الحذف"); load(); }
  };

  const toggle = async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><Ticket className="h-6 w-6 text-accent" /> الكوبونات</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-full hero-gradient text-primary-foreground"><Plus className="h-4 w-4" /> كوبون جديد</Button>
          </DialogTrigger>
          <CouponDialog onSaved={() => { setOpen(false); load(); }} />
        </Dialog>
      </div>

      {loading ? (
        <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">لا توجد كوبونات بعد</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-bold tracking-wider">{c.code}</div>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    {c.discount_type === "percent" ? <Percent className="h-3.5 w-3.5" /> : <DollarSign className="h-3.5 w-3.5" />}
                    خصم {c.discount_value}{c.discount_type === "percent" ? "%" : " ج.م"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={c.is_active} onCheckedChange={() => toggle(c)} />
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>الحد الأدنى: {c.min_order_amount ?? "—"} ج.م</span>
                <span>الاستخدامات: {c.uses_count ?? 0}/{c.max_uses ?? "∞"}</span>
                <span>الانتهاء: {c.expires_at ? new Date(c.expires_at).toLocaleDateString("ar-EG") : "—"}</span>
                <span>{c.first_order_only ? "للطلب الأول فقط" : "متاح للجميع"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CouponDialog({ onSaved }: { onSaved: () => void }) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState<number>(10);
  const [minOrder, setMinOrder] = useState<string>("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expires, setExpires] = useState<string>("");
  const [firstOnly, setFirstOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!code.trim()) return toast.error("أدخل كود الكوبون");
    setSaving(true);
    const { error } = await supabase.from("coupons").insert({
      code: code.trim().toUpperCase(),
      discount_type: type,
      discount_value: value,
      min_order_amount: minOrder ? +minOrder : null,
      max_uses: maxUses ? +maxUses : null,
      expires_at: expires ? new Date(expires).toISOString() : null,
      first_order_only: firstOnly,
      is_active: true,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("تم إنشاء الكوبون"); onSaved(); }
  };

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>كوبون جديد</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <label className="block"><span className="mb-1 block text-xs font-bold">الكود</span>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1 block text-xs font-bold">نوع الخصم</span>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">نسبة %</SelectItem>
                <SelectItem value="fixed">قيمة ثابتة</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="block"><span className="mb-1 block text-xs font-bold">القيمة</span>
            <NumberInput value={value} onValueChange={(v) => setValue(parseFloat(v) || 0)} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1 block text-xs font-bold">الحد الأدنى (ج.م)</span>
            <NumberInput value={minOrder} onValueChange={setMinOrder} placeholder="0" />
          </label>
          <label className="block"><span className="mb-1 block text-xs font-bold">أقصى استخدامات</span>
            <NumberInput decimal={false} value={maxUses} onValueChange={setMaxUses} placeholder="∞" />
          </label>
        </div>
        <label className="block"><span className="mb-1 block text-xs font-bold">تاريخ الانتهاء</span>
          <Input type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </label>
        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <span className="text-sm font-bold">للطلب الأول فقط</span>
          <Switch checked={firstOnly} onCheckedChange={setFirstOnly} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={saving} className="gap-2 rounded-full hero-gradient text-primary-foreground">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} إنشاء
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
