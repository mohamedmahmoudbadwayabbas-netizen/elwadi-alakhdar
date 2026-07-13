import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  User, MapPin, Package, Heart, LogOut, Plus, Trash2, Leaf, ArrowRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "حسابي — الوادي الأخضر" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user: ctxUser } = Route.useRouteContext();
  const { user: authUser, signOut } = useAuth();
  const user = authUser ?? ctxUser;
  const router = useRouter();
  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.history.push("/");
    toast.success("تم تسجيل الخروج");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl hero-gradient text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="hidden font-display text-base font-bold sm:inline">الوادي الأخضر</span>
          </Link>
          <Link to="/" className="text-xs font-bold text-primary hover:underline">
            <ArrowRight className="me-1 inline h-3.5 w-3.5" />
            متابعة التسوق
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">حسابي</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-1.5 rounded-full text-xs">
            <LogOut className="h-3.5 w-3.5" /> خروج
          </Button>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl bg-secondary/50 p-1">
            <TabsTrigger value="orders" className="flex-col gap-1 rounded-xl py-2 text-[11px] data-[state=active]:bg-background"><Package className="h-4 w-4" />طلباتي</TabsTrigger>
            <TabsTrigger value="addresses" className="flex-col gap-1 rounded-xl py-2 text-[11px] data-[state=active]:bg-background"><MapPin className="h-4 w-4" />العناوين</TabsTrigger>
            <TabsTrigger value="wishlist" className="flex-col gap-1 rounded-xl py-2 text-[11px] data-[state=active]:bg-background"><Heart className="h-4 w-4" />المفضلة</TabsTrigger>
            <TabsTrigger value="profile" className="flex-col gap-1 rounded-xl py-2 text-[11px] data-[state=active]:bg-background"><User className="h-4 w-4" />الملف</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-5"><OrdersTab userId={user.id} /></TabsContent>
          <TabsContent value="addresses" className="mt-5"><AddressesTab userId={user.id} /></TabsContent>
          <TabsContent value="wishlist" className="mt-5"><WishlistTab userId={user.id} /></TabsContent>
          <TabsContent value="profile" className="mt-5"><ProfileTab userId={user.id} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------- Orders ---------- */
function OrdersTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total_price, items, payment_method")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // اشتراك فوري لتحديث حالة الطلب عند تغييرها من الأدمن
  useEffect(() => {
    const channel = supabase
      .channel(`orders-user-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["my-orders", userId] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, qc]);

  const cancelOrder = async (id: string) => {
    if (!confirm("هل تريد بالتأكيد إلغاء هذا الطلب؟")) return;
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return toast.error(error.message || "تعذّر إلغاء الطلب");
    toast.success("تم إلغاء الطلب");
    qc.invalidateQueries({ queryKey: ["my-orders", userId] });
  };

  if (isLoading) return <Loader />;
  if (!data?.length) return <Empty icon={Package} text="لم تقم بأي طلب بعد" cta={{ label: "ابدأ التسوق", to: "/" }} />;

  const CANCELLABLE = new Set(["new", "processing", "pending", "confirmed"]);

  return (
    <div className="space-y-3">
      {data.map((o) => {
        const items = Array.isArray(o.items)
          ? (o.items as Array<{ name?: string; quantity?: number; price?: number; unit_label?: string }>)
          : [];
        const canCancel = CANCELLABLE.has(o.status);
        return (
          <Card key={o.id} className="rounded-2xl border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold">#{o.id.slice(0, 8)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <div className="font-display text-lg font-bold text-primary">{Number(o.total_price).toFixed(2)} ج.م</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{o.payment_method === "cod" ? "دفع عند الاستلام" : o.payment_method}</div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="mt-3 space-y-1.5 rounded-xl bg-secondary/40 p-3">
                <div className="mb-1 text-[10px] font-bold text-muted-foreground">المنتجات ({items.length})</div>
                {items.map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                    <span className="line-clamp-1 font-bold text-foreground">
                      {i.name ?? "منتج"}
                      <span className="ms-1 text-muted-foreground">×{i.quantity ?? 1}{i.unit_label ? ` ${i.unit_label}` : ""}</span>
                    </span>
                    {i.price != null && (
                      <span className="shrink-0 font-bold text-primary">{Number(i.price).toFixed(2)} ج.م</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canCancel && (
              <div className="mt-3 flex justify-end border-t border-border pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => cancelOrder(o.id)}
                  className="gap-1.5 rounded-full text-[11px] text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> إلغاء الطلب
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}


function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "قيد المراجعة", cls: "bg-amber-100 text-amber-700" },
    confirmed: { label: "مؤكد", cls: "bg-blue-100 text-blue-700" },
    delivering: { label: "قيد التوصيل", cls: "bg-purple-100 text-purple-700" },
    delivered: { label: "تم التسليم", cls: "bg-green-100 text-green-700" },
    cancelled: { label: "ملغي", cls: "bg-red-100 text-red-700" },
  };
  const m = map[status] ?? { label: status, cls: "bg-muted text-foreground" };
  return <Badge className={`${m.cls} rounded-full text-[10px]`}>{m.label}</Badge>;
}

/* ---------- Addresses ---------- */
type Address = {
  id: string; label: string; full_name: string; phone: string;
  area: string; street: string; building: string; apartment: string;
  notes: string | null; is_default: boolean;
};

function AddressesTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Address> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-addresses", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses").select("*").eq("user_id", userId)
        .order("is_default", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
  });

  const save = async () => {
    if (!editing) return;
    const payload = {
      user_id: userId,
      label: editing.label || "المنزل",
      full_name: editing.full_name || "",
      phone: editing.phone || "",
      area: editing.area || "",
      street: editing.street || "",
      building: editing.building || "",
      apartment: editing.apartment || "",
      notes: editing.notes ?? null,
      is_default: editing.is_default ?? false,
    };
    const { error } = editing.id
      ? await supabase.from("addresses").update(payload).eq("id", editing.id)
      : await supabase.from("addresses").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["my-addresses", userId] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: ["my-addresses", userId] });
  };

  const setDefault = async (id: string) => {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-addresses", userId] });
  };

  if (isLoading) return <Loader />;

  if (editing) {
    return (
      <Card className="rounded-2xl border-border p-5">
        <h3 className="mb-4 font-display text-base font-bold">{editing.id ? "تعديل العنوان" : "عنوان جديد"}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="العنوان (مثل: المنزل)" value={editing.label} onChange={(v) => setEditing({ ...editing, label: v })} />
          <Field label="الاسم الكامل" value={editing.full_name} onChange={(v) => setEditing({ ...editing, full_name: v })} />
          <Field label="رقم الهاتف" value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} />
          <Field label="المنطقة" value={editing.area} onChange={(v) => setEditing({ ...editing, area: v })} />
          <Field label="الشارع" value={editing.street} onChange={(v) => setEditing({ ...editing, street: v })} />
          <Field label="رقم العقار" value={editing.building} onChange={(v) => setEditing({ ...editing, building: v })} />
          <Field label="الشقة / الدور" value={editing.apartment} onChange={(v) => setEditing({ ...editing, apartment: v })} />
        </div>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-bold">ملاحظات للمندوب</span>
          <Textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} rows={2} />
        </label>
        <label className="mt-3 flex items-center gap-2.5">
          <Switch checked={editing.is_default ?? false} onCheckedChange={(v) => setEditing({ ...editing, is_default: v })} />
          <span className="text-xs font-bold">جعله العنوان الافتراضي</span>
        </label>
        <div className="mt-5 flex gap-2">
          <Button onClick={save} className="flex-1 rounded-xl hero-gradient text-primary-foreground">حفظ</Button>
          <Button variant="outline" onClick={() => setEditing(null)} className="rounded-xl">إلغاء</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={() => setEditing({})} className="w-full gap-1.5 rounded-xl hero-gradient text-primary-foreground transition-transform hover:scale-[1.01] active:scale-95">
        <Plus className="h-4 w-4" /> إضافة عنوان جديد
      </Button>
      {!data?.length ? <Empty icon={MapPin} text="لم تضف أي عنوان بعد" /> : (
        data.map((a) => (
          <Card key={a.id} className="rounded-2xl border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{a.label}</span>
                  {a.is_default && <Badge className="rounded-full bg-primary text-[10px] text-primary-foreground">افتراضي</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.full_name} • {a.phone}</p>
                <p className="mt-1 text-xs text-foreground">{[a.area, a.street, a.building, a.apartment].filter(Boolean).join(" - ")}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setEditing(a)} className="h-7 px-2 text-[11px]">تعديل</Button>
                {!a.is_default && <Button size="sm" variant="ghost" onClick={() => setDefault(a.id)} className="h-7 px-2 text-[11px]">افتراضي</Button>}
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)} className="h-7 px-2 text-[11px] text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold">{label}</span>
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/* ---------- Wishlist ---------- */
function WishlistTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
      queryKey: ["my-wishlist", userId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("wishlists")
          .select("id, product_id, products(id, name, price_per_unit, image_url, unit_label)")
          .eq("user_id", userId);
        if (error) throw error;
        return data;
      },
  });

  const remove = async (id: string) => {
    await supabase.from("wishlists").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-wishlist", userId] });
  };

  if (isLoading) return <Loader />;
  if (!data?.length) return <Empty icon={Heart} text="قائمة المفضلة فارغة" cta={{ label: "تصفح المنتجات", to: "/" }} />;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.map((w) => {
        const raw = w.products as unknown;
        const p = (Array.isArray(raw) ? raw[0] : raw) as
          | { id: string; name: string; price_per_unit: number; image_url: string | null; unit_label: string | null }
          | null
          | undefined;
        if (!p) return null;
        return (
          <Card key={w.id} className="flex items-center gap-3 rounded-2xl border-border p-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
              {p.image_url && <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <Link to="/products/$productId" params={{ productId: p.id }} className="line-clamp-1 text-sm font-bold hover:text-primary">{p.name}</Link>
              <div className="mt-1 font-display text-base font-bold text-primary">{Number(p.price_per_unit).toFixed(2)} ج.م{p.unit_label ? ` / ${p.unit_label}` : ""}</div>
            </div>

            <Button size="sm" variant="ghost" onClick={() => remove(w.id)} className="h-8 w-8 shrink-0 p-0 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Profile ---------- */
function ProfileTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({ full_name: "", phone: "", birth_date: "" });
  useEffect(() => {
    if (data) setForm({ full_name: data.full_name ?? "", phone: data.phone ?? "", birth_date: data.birth_date ?? "" });
  }, [data]);

  const save = async () => {
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, phone: form.phone, birth_date: form.birth_date || null,
    }).eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث ملفك");
    qc.invalidateQueries({ queryKey: ["my-profile", userId] });
  };

  if (isLoading) return <Loader />;

  return (
    <Card className="rounded-2xl border-border p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="الاسم الكامل" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
        <Field label="رقم الهاتف" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-xs font-bold">تاريخ الميلاد (اختياري)</span>
          <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
        </label>
      </div>
      <Button onClick={save} className="mt-5 w-full rounded-xl hero-gradient text-primary-foreground transition-transform hover:scale-[1.01] active:scale-95">
        حفظ التغييرات
      </Button>
    </Card>
  );
}

/* ---------- Helpers ---------- */
function Loader() {
  return <div className="grid place-items-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
}

function Empty({ icon: Icon, text, cta }: { icon: typeof Package; text: string; cta?: { label: string; to: string } }) {
  return (
    <Card className="grid place-items-center gap-3 rounded-2xl border-dashed border-border py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-muted-foreground"><Icon className="h-6 w-6" /></div>
      <p className="text-sm text-muted-foreground">{text}</p>
      {cta && <Link to={cta.to}><Button size="sm" className="rounded-full hero-gradient text-primary-foreground">{cta.label}</Button></Link>}
    </Card>
  );
}
