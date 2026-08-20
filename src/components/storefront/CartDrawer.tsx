import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart, lineSubtotal, formatWeightLabel } from "@/lib/cart-context";
import { useSettings } from "@/lib/settings-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Banknote,
  Smartphone,
  Building2,
  Copy,
  Truck as TruckIcon,
  Sparkles,
  BookmarkPlus,
  ListOrdered,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "motion/react";
import {
  SubstitutionPreferencePicker,
  type SubstitutionPreference,
} from "./SubstitutionPreferencePicker";
import { ItemSubstitutionSelector } from "./ItemSubstitutionSelector";
import { SaveShoppingListDialog } from "./SaveShoppingListDialog";

type PaymentMethod = "cod" | "instapay" | "bank";

const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "الاسم قصير جداً").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{8,20}$/, "رقم هاتف غير صحيح"),
  address: z.string().trim().min(5, "أدخل عنوان واضح").max(300),
  notes: z.string().trim().max(500).optional(),
  payment_method: z.enum(["cod", "instapay", "bank"]),
  payment_reference: z.string().trim().max(120).optional(),
});

export function CartDrawer() {
  const {
    isOpen,
    setOpen,
    items,
    updateQuantity,
    removeItem,
    totalPrice,
    clear,
    isMerging,
    updateItemPreference,
    savedLists,
  } = useCart();
  const settings = useSettings();
  const [stage, setStage] = useState<"cart" | "checkout">("cart");
  const [saveListOpen, setSaveListOpen] = useState(false);
  const [substitutionPreference, setSubstitutionPreference] =
    useState<SubstitutionPreference>("call_me");
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    address: "",
    notes: "",
    payment_method: "cod" as PaymentMethod,
    payment_reference: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [pay, setPay] = useState<{
    instapay_handle: string | null;
    bank_account_info: string | null;
  }>({ instapay_handle: null, bank_account_info: null });

  // Free shipping tracker calculations
  const freeShipThreshold = Number(settings.free_shipping_threshold || 300);
  const remainingForFreeShip = Math.max(0, freeShipThreshold - totalPrice);
  const freeShipReached = totalPrice >= freeShipThreshold;
  const progressPercent = Math.min(100, Math.round((totalPrice / freeShipThreshold) * 100));

  useEffect(() => {
    if (stage !== "checkout") return;
    (supabase as any).rpc("get_payment_config").then(({ data }: any) => {
      const row = Array.isArray(data) ? data[0] : data;
      if (row)
        setPay({
          instapay_handle: row.instapay_handle ?? null,
          bank_account_info: row.bank_account_info ?? null,
        });
    });
  }, [stage]);

  const handleSubmit = async () => {
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    if (items.length === 0) return;
    if (
      (parsed.data.payment_method === "instapay" || parsed.data.payment_method === "bank") &&
      !parsed.data.payment_reference?.trim()
    ) {
      toast.error("أدخل رقم/مرجع التحويل بعد إتمام الدفع");
      return;
    }
    setSubmitting(true);
    const ref = (() => {
      try {
        return sessionStorage.getItem("store_ref");
      } catch {
        return null;
      }
    })();

    const substitutionLabel =
      substitutionPreference === "call_me"
        ? "[تفضيل البديل: الاتصال هاتفياً بالعميل]"
        : substitutionPreference === "auto_best"
          ? "[تفضيل البديل: اختيار أفضل بديل تلقائياً]"
          : "[تفضيل البديل: عدم الاستبدال وحذف الصنف]";

    const combinedNotes = [substitutionLabel, parsed.data.notes?.trim()].filter(Boolean).join("\n");

    const { error } = await (supabase as any).rpc("create_order", {
      p_customer_name: parsed.data.customer_name,
      p_phone: parsed.data.phone,
      p_address: parsed.data.address,
      p_notes: combinedNotes || null,
      p_items: items.map((i) => ({ id: i.product.id, quantity: i.quantity })),
      p_delivery_zone_id: null,
      p_delivery_method: "delivery",
      p_payment_method: parsed.data.payment_method,
      p_payment_reference: parsed.data.payment_reference?.trim() || null,
      p_coupon_code: null,
      p_ref_source: ref,
    });
    setSubmitting(false);
    if (error) {
      toast.error("تعذّر إرسال الطلب", { description: error.message });
      return;
    }
    toast.success("تم استلام طلبك بنجاح", { description: "سيتواصل معك فريق سمارت ستور قريباً" });
    clear();
    setStage("cart");
    setForm({
      customer_name: "",
      phone: "",
      address: "",
      notes: "",
      payment_method: "cod",
      payment_reference: "",
    });
    setOpen(false);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("تم النسخ"));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="left" className="flex w-full flex-col gap-0 p-0 sm:max-w-md" dir="rtl">
        <SheetHeader className="border-b border-border/60 px-5 py-4 text-start">
          <SheetTitle className="flex items-center gap-2 text-lg font-black font-display">
            {stage === "checkout" && (
              <button
                aria-label="العودة للسلة"
                onClick={() => setStage("cart")}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            )}
            <ShoppingBag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            {stage === "cart" ? "سلة تسوّق سمارت ستور" : "إتمام طلب السوبرماركت"}
          </SheetTitle>
        </SheetHeader>

        {/* Free Shipping Progress Bar Header (Visible in cart stage when items exist) */}
        {stage === "cart" && items.length > 0 && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <TruckIcon className="h-4 w-4 text-emerald-600 animate-bounce" />
                {freeShipReached ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    تهانينا! لقد حصلت على شحن مجاني 🥳🎉
                  </span>
                ) : (
                  <span>
                    باقي{" "}
                    <strong className="text-amber-600 font-black">
                      {remainingForFreeShip.toFixed(2)} ج.م
                    </strong>{" "}
                    على الشحن المجاني! 🚚
                  </span>
                )}
              </span>
              <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                {progressPercent}%
              </span>
            </div>

            <div className="relative h-2.5 w-full rounded-full bg-emerald-950/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  freeShipReached
                    ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                }`}
              />
            </div>
          </div>
        )}

        {isMerging ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-muted-foreground">جاري دمج السلة مع حسابك...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-3xl bg-emerald-500/10 text-4xl shadow-inner">
              🛒
            </div>
            <p className="font-black text-foreground text-base">السلة فارغة حالياً</p>
            <p className="text-xs text-muted-foreground max-w-xs font-bold">
              ابدأ التسوّق الآن واكتشف منتجات السوبرماركت والأغذية الطازجة
            </p>
            <Button
              onClick={() => setOpen(false)}
              className="mt-2 rounded-2xl hero-gradient text-primary-foreground font-black text-xs"
            >
              تصفّح منتجات سمارت ستور
            </Button>
          </div>
        ) : stage === "cart" ? (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <AnimatePresence initial={false}>
                <ul className="space-y-2.5">
                  {items.map((it) => (
                    <motion.li
                      key={it.product.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-xs hover:border-emerald-500/30 transition-all"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary border border-border/40">
                        {it.product.image_url ? (
                          <img
                            src={it.product.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-2xl">🌿</div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="line-clamp-1 text-xs sm:text-sm font-black text-foreground">
                              {it.product.name}
                            </h5>
                            {it.product.is_by_weight && (
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                                وزن تقديري:{" "}
                                {it.selected_weight_label || formatWeightLabel(it.quantity)}
                              </span>
                            )}
                          </div>
                          <button
                            aria-label="حذف المنتج"
                            onClick={() => removeItem(it.product.id)}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* تفضيل البديل لهذا الصنف بالتحديد */}
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <ItemSubstitutionSelector
                            value={it.substitution_preference || substitutionPreference}
                            onChange={(pref) => updateItemPreference(it.product.id, pref)}
                            compact={true}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/60 p-0.5">
                            <button
                              aria-label="تقليل الكمية"
                              onClick={() =>
                                updateQuantity(
                                  it.product.id,
                                  +(it.quantity - (it.product.is_by_weight ? 0.25 : 1)).toFixed(3),
                                )
                              }
                              className="grid h-7 w-7 place-items-center rounded-full hover:bg-background active:scale-90 transition-all"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-12 text-center text-xs font-black">
                              {it.product.is_by_weight
                                ? it.quantity >= 1
                                  ? `${it.quantity} كجم`
                                  : `${Math.round(it.quantity * 1000)} جم`
                                : it.quantity}
                            </span>
                            <button
                              aria-label="زيادة الكمية"
                              onClick={() =>
                                updateQuantity(
                                  it.product.id,
                                  +(it.quantity + (it.product.is_by_weight ? 0.25 : 1)).toFixed(3),
                                )
                              }
                              className="grid h-7 w-7 place-items-center rounded-full hover:bg-background active:scale-90 transition-all"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {lineSubtotal(it.product, it.quantity).toFixed(2)} ج.م
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </AnimatePresence>
            </div>

            <div className="border-t border-border/60 bg-card p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSaveListOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-500/10 hover:bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-all"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  <span>حفظ كقائمة تسوق دورية 📋</span>
                </button>
                {savedLists.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {savedLists.length} قوائم محفوظة
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                <span>إجمالي المنتجات</span>
                <span className="font-mono text-foreground font-extrabold">
                  {totalPrice.toFixed(2)} ج.م
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border/40 pt-2">
                <span className="text-sm font-black text-foreground">المبلغ الإجمالي</span>
                <span className="font-display text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {totalPrice.toFixed(2)} ج.م
                </span>
              </div>

              <Button
                onClick={() => setStage("checkout")}
                className="h-12 w-full rounded-2xl hero-gradient text-sm font-black text-primary-foreground shadow-lg transition-transform hover:scale-[1.01] active:scale-95"
              >
                متابعة إتمام الطلب 🛒
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
              <Field label="الاسم بالكامل">
                <Input
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="اكتب اسمك"
                  className="h-10 rounded-xl font-bold text-xs"
                />
              </Field>
              <Field label="رقم الهاتف">
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  inputMode="tel"
                  className="h-10 rounded-xl font-bold text-xs dir-ltr text-right"
                />
              </Field>
              <Field label="عنوان التوصيل التفصيلي">
                <Textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="المحافظة، المنطقة، الشارع، رقم العقار"
                  className="rounded-xl font-bold text-xs"
                />
              </Field>
              <Field label="ملاحظات المندوب (اختياري)">
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="مثال: يرجى الاتصال عند الباب"
                  className="rounded-xl font-bold text-xs"
                />
              </Field>

              {/* تفضيل بدائل المنتجات عند النقص */}
              <div className="pt-1">
                <SubstitutionPreferencePicker
                  value={substitutionPreference}
                  onChange={setSubstitutionPreference}
                />
              </div>

              <div className="space-y-2 pt-1">
                <span className="block text-xs font-black text-foreground">
                  اختر طريقة الدفع المناسبة:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <PayOption
                    icon={<Banknote className="h-4 w-4" />}
                    label="عند الاستلام"
                    active={form.payment_method === "cod"}
                    onClick={() =>
                      setForm({ ...form, payment_method: "cod", payment_reference: "" })
                    }
                  />
                  <PayOption
                    icon={<Smartphone className="h-4 w-4" />}
                    label="إنستاباي"
                    active={form.payment_method === "instapay"}
                    onClick={() => setForm({ ...form, payment_method: "instapay" })}
                    disabled={!pay.instapay_handle}
                  />
                  <PayOption
                    icon={<Building2 className="h-4 w-4" />}
                    label="تحويل بنكي"
                    active={form.payment_method === "bank"}
                    onClick={() => setForm({ ...form, payment_method: "bank" })}
                    disabled={!pay.bank_account_info}
                  />
                </div>

                {form.payment_method === "instapay" && pay.instapay_handle && (
                  <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
                    <div className="font-bold text-foreground">
                      حوّل المبلغ{" "}
                      <span className="text-emerald-600 font-black">
                        {totalPrice.toFixed(2)} ج.م
                      </span>{" "}
                      على InstaPay:
                    </div>
                    <button
                      type="button"
                      onClick={() => copy(pay.instapay_handle!)}
                      className="flex w-full items-center justify-between rounded-xl bg-background px-3 py-2 font-mono font-bold hover:bg-secondary border border-border/60"
                    >
                      <span>{pay.instapay_handle}</span>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <Input
                      value={form.payment_reference}
                      onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                      placeholder="رقم/مرجع التحويل"
                      className="h-9 rounded-xl text-xs font-bold"
                    />
                  </div>
                )}

                {form.payment_method === "bank" && pay.bank_account_info && (
                  <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
                    <div className="font-bold text-foreground">
                      حوّل المبلغ{" "}
                      <span className="text-emerald-600 font-black">
                        {totalPrice.toFixed(2)} ج.م
                      </span>{" "}
                      إلى الحساب التالي:
                    </div>
                    <pre className="whitespace-pre-wrap rounded-xl bg-background p-3 font-sans leading-relaxed border border-border/60">
                      {pay.bank_account_info}
                    </pre>
                    <Input
                      value={form.payment_reference}
                      onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                      placeholder="رقم/مرجع التحويل"
                      className="h-9 rounded-xl text-xs font-bold"
                    />
                  </div>
                )}

                {form.payment_method === "cod" && (
                  <p className="text-[11px] text-muted-foreground font-bold bg-secondary/40 p-2.5 rounded-xl border border-border/40">
                    ✓ ستقوم بالدفع نقداً للمندوب فور وصول الطلب واستلام الأغذية.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-border/60 bg-card p-4 shadow-xl">
              <Button
                disabled={submitting}
                onClick={handleSubmit}
                className="h-12 w-full rounded-2xl hero-gradient text-sm font-black text-primary-foreground shadow-lg transition-transform hover:scale-[1.01] active:scale-95"
              >
                {submitting ? "جاري إرسال الطلب..." : "تأكيد وإرسال الطلب الآن ✨"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>

      <SaveShoppingListDialog open={saveListOpen} onOpenChange={setSaveListOpen} />
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-extrabold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function PayOption({
  icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-2.5 text-xs font-black transition-all ${
        active
          ? "border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
          : "border-border/70 bg-background text-foreground hover:bg-secondary"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
