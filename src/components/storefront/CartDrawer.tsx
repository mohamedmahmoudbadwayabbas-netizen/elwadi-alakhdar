import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart, lineSubtotal } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "الاسم قصير جداً").max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,20}$/, "رقم هاتف غير صحيح"),
  address: z.string().trim().min(5, "أدخل عنوان واضح").max(300),
  notes: z.string().trim().max(500).optional(),
});

export function CartDrawer() {
  const { isOpen, setOpen, items, updateQuantity, removeItem, totalPrice, clear } = useCart();
  const [stage, setStage] = useState<"cart" | "checkout">("cart");
  const [form, setForm] = useState({ customer_name: "", phone: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة"); return; }
    if (items.length === 0) return;
    setSubmitting(true);
    const ref = (() => { try { return sessionStorage.getItem("alwadi_ref"); } catch { return null; } })();
    const payload = {
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone,
      address: parsed.data.address,
      notes: parsed.data.notes || null,
      ref_source: ref,
      total_price: +totalPrice.toFixed(2),
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
    setForm({ customer_name: "", phone: "", address: "", notes: "" });
    setOpen(false);
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
                        <button onClick={() => removeItem(it.product.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-0.5 rounded-full border border-border bg-secondary/40 p-0.5">
                          <button
                            onClick={() => updateQuantity(it.product.id, +(it.quantity - (it.product.is_by_weight ? 0.25 : 1)).toFixed(3))}
                            className="grid h-7 w-7 place-items-center rounded-full hover:bg-background"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-12 text-center text-xs font-black">
                            {it.product.is_by_weight ? (it.quantity >= 1 ? `${it.quantity}كجم` : `${it.quantity * 1000}جم`) : it.quantity}
                          </span>
                          <button
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
