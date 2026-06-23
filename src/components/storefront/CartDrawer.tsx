import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart, lineSubtotal } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Banknote, Smartphone, Building2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

type PaymentMethod = "cod" | "instapay" | "bank";

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "الاسم قصير جداً").max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,20}$/, "رقم هاتف غير صحيح"),
  address: z.string().trim().min(5, "أدخل عنوان واضح").max(300),
  notes: z.string().trim().max(500).optional(),
  payment_method: z.enum(["cod", "instapay", "bank"]),
  payment_reference: z.string().trim().max(120).optional(),
});

export function CartDrawer() {
  const { isOpen, setOpen, items, updateQuantity, removeItem, totalPrice, clear } = useCart();
  const [stage, setStage] = useState<"cart" | "checkout">("cart");
  const [form, setForm] = useState({
    customer_name: "", phone: "", address: "", notes: "",
    payment_method: "cod" as PaymentMethod, payment_reference: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [pay, setPay] = useState<{ instapay_handle: string | null; bank_account_info: string | null }>({ instapay_handle: null, bank_account_info: null });

  useEffect(() => {
    if (stage !== "checkout") return;
    supabase.from("store_settings").select("instapay_handle,bank_account_info").limit(1).maybeSingle()
      .then(({ data }) => { if (data) setPay(data as typeof pay); });
  }, [stage]);

  const handleSubmit = async () => {
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة"); return; }
    if (items.length === 0) return;
    if ((parsed.data.payment_method === "instapay" || parsed.data.payment_method === "bank") && !parsed.data.payment_reference?.trim()) {
      toast.error("أدخل رقم/مرجع التحويل بعد إتمام الدفع");
      return;
    }
    setSubmitting(true);
    const ref = (() => { try { return sessionStorage.getItem("alwadi_ref"); } catch { return null; } })();
    const payload = {
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      notes: parsed.data.notes || null,
      ref_source: ref,
      total_price: +totalPrice.toFixed(2),
      payment_method: parsed.data.payment_method,
      payment_reference: parsed.data.payment_reference?.trim() || null,
      items: items.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        unit_label: i.product.unit_label,
        is_by_weight: i.product.is_by_weight,
        price_per_unit: i.product.price_per_unit,
        quantity: i.quantity,
        subtotal: +lineSubtotal(i.product, i.quantity).toFixed(2),
      })),
    };
    const { error } = await supabase.from("orders").insert(payload);
    setSubmitting(false);
    if (error) { toast.error("تعذّر إرسال الطلب", { description: error.message }); return; }
    toast.success("تم استلام طلبك بنجاح", { description: "سيتواصل معك فريق الوادي الأخضر قريباً" });
    clear();
    setStage("cart");
    setForm({ customer_name: "", phone: "", address: "", notes: "", payment_method: "cod", payment_reference: "" });
    setOpen(false);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("تم النسخ"));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="left" className="flex w-full flex-col gap-0 p-0 sm:max-w-md" dir="rtl">
        <SheetHeader className="border-b px-5 py-4 text-start">
          <SheetTitle className="flex items-center gap-2 text-lg font-black">
            {stage === "checkout" && (
              <button aria-label="العودة للسلة" onClick={() => setStage("cart")} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary">
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            )}
            <ShoppingBag className="h-5 w-5 text-primary" />
            {stage === "cart" ? "سلة المشتريات" : "إتمام الطلب"}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-secondary text-4xl">🛒</div>
            <p className="font-bold text-foreground">السلة فارغة</p>
            <p className="text-sm text-muted-foreground">ابدأ التسوّق وأضف منتجاتك المفضلة</p>
            <Button onClick={() => setOpen(false)} className="mt-2 rounded-full hero-gradient text-primary-foreground">
              تصفّح المنتجات
            </Button>
          </div>
        ) : stage === "cart" ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <ul className="space-y-2.5">
                {items.map((it) => (
                  <li key={it.product.id} className="flex gap-3 rounded-2xl border border-border bg-card p-2.5">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {it.product.image_url ? (
                        <img src={it.product.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-2xl">🌿</div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{it.product.name}</h5>
                        <button aria-label="حذف المنتج" onClick={() => removeItem(it.product.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-0.5 rounded-full border border-border bg-secondary/40 p-0.5">
                          <button
                            aria-label="تقليل الكمية"
                            onClick={() => updateQuantity(it.product.id, +(it.quantity - (it.product.is_by_weight ? 0.25 : 1)).toFixed(3))}
                            className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-12 text-center text-xs font-black">
                            {it.product.is_by_weight ? (it.quantity >= 1 ? `${it.quantity}كجم` : `${it.quantity * 1000}جم`) : it.quantity}
                          </span>
                          <button
                            aria-label="زيادة الكمية"
                            onClick={() => updateQuantity(it.product.id, +(it.quantity + (it.product.is_by_weight ? 0.25 : 1)).toFixed(3))}
                            className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-sm font-black text-primary">
                          {lineSubtotal(it.product, it.quantity).toFixed(2)} ج.م
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t bg-card p-4 shadow-lift">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الإجمالي</span>
                <span className="font-display text-2xl font-bold text-primary">{totalPrice.toFixed(2)} ج.م</span>
              </div>
              <Button onClick={() => setStage("checkout")} className="h-12 w-full rounded-2xl hero-gradient text-base font-black text-primary-foreground shadow-card">
                إتمام الطلب
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              <Field label="الاسم بالكامل">
                <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="اكتب اسمك" />
              </Field>
              <Field label="رقم الهاتف">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" inputMode="tel" />
              </Field>
              <Field label="عنوان التوصيل">
                <Textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="المحافظة، المنطقة، الشارع، رقم العقار" />
              </Field>
              <Field label="ملاحظات (اختياري)">
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="أي ملاحظات للطلب" />
              </Field>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-foreground">طريقة الدفع</span>
                <div className="grid grid-cols-3 gap-2">
                  <PayOption icon={<Banknote className="h-4 w-4" />} label="عند الاستلام" active={form.payment_method === "cod"} onClick={() => setForm({ ...form, payment_method: "cod", payment_reference: "" })} />
                  <PayOption icon={<Smartphone className="h-4 w-4" />} label="إنستاباي" active={form.payment_method === "instapay"} onClick={() => setForm({ ...form, payment_method: "instapay" })} disabled={!pay.instapay_handle} />
                  <PayOption icon={<Building2 className="h-4 w-4" />} label="تحويل بنكي" active={form.payment_method === "bank"} onClick={() => setForm({ ...form, payment_method: "bank" })} disabled={!pay.bank_account_info} />
                </div>

                {form.payment_method === "instapay" && pay.instapay_handle && (
                  <div className="space-y-2 rounded-2xl border border-accent/30 bg-accent/5 p-3 text-xs">
                    <div className="font-bold text-foreground">حوّل المبلغ <span className="text-primary">{totalPrice.toFixed(2)} ج.م</span> على InstaPay:</div>
                    <button type="button" onClick={() => copy(pay.instapay_handle!)} className="flex w-full items-center justify-between rounded-xl bg-background px-3 py-2 font-mono font-bold hover:bg-secondary">
                      <span>{pay.instapay_handle}</span><Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <Input value={form.payment_reference} onChange={(e) => setForm({ ...form, payment_reference: e.target.value })} placeholder="رقم/مرجع التحويل" />
                  </div>
                )}

                {form.payment_method === "bank" && pay.bank_account_info && (
                  <div className="space-y-2 rounded-2xl border border-accent/30 bg-accent/5 p-3 text-xs">
                    <div className="font-bold text-foreground">حوّل المبلغ <span className="text-primary">{totalPrice.toFixed(2)} ج.م</span> إلى الحساب التالي:</div>
                    <pre className="whitespace-pre-wrap rounded-xl bg-background p-3 font-sans leading-relaxed">{pay.bank_account_info}</pre>
                    <Input value={form.payment_reference} onChange={(e) => setForm({ ...form, payment_reference: e.target.value })} placeholder="رقم/مرجع التحويل" />
                  </div>
                )}

                {form.payment_method === "cod" && (
                  <p className="text-[11px] text-muted-foreground">ستدفع نقداً عند استلام الطلب من المندوب.</p>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-secondary/40 p-3 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span>{items.length} منتج</span>
                  <span className="text-primary">{totalPrice.toFixed(2)} ج.م</span>
                </div>
              </div>
            </div>
            <div className="border-t bg-card p-4">
              <Button disabled={submitting} onClick={handleSubmit} className="h-12 w-full rounded-2xl hero-gradient text-base font-black text-primary-foreground shadow-card">
                {submitting ? "جارٍ الإرسال..." : "تأكيد وإرسال الطلب"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function PayOption({ icon, label, active, onClick, disabled }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 text-xs font-bold transition ${
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:bg-secondary"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

