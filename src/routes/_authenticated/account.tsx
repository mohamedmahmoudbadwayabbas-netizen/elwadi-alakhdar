import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-loose";
import { useAuth } from "@/lib/auth-context";
import { PastOrdersList } from "@/components/orders/PastOrdersList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  User,
  MapPin,
  Package,
  LogOut,
  Leaf,
  ArrowRight,
  Loader2,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  ssr: false,
  head: () => ({
    meta: [{ title: "حسابي — سوبرماركت الوادي الأخضر" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user: ctxUser } = Route.useRouteContext();
  const { user: authUser, isAdmin, signOut } = useAuth();
  const user = authUser ?? ctxUser;
  const router = useRouter();
  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    router.history.push("/");
    toast.success("تم تسجيل الخروج");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background via-emerald-50/20 dark:via-emerald-950/10 to-background"
      dir="rtl"
    >
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-sm">
              <Leaf className="h-4 w-4" />
            </div>
            <span className="hidden font-display text-base font-extrabold sm:inline">
              سوبرماركت الوادي الأخضر
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-xs"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" /> لوحة الإدارة
                </Button>
              </Link>
            )}
            <Link
              to="/"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              متابعة التسوق
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* تنبيه مسؤول المتجر إن وجد */}
        {isAdmin && (
          <div className="mb-6 rounded-3xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white font-black text-2xl shadow-sm">
                👑
              </div>
              <div>
                <h3 className="font-black text-base text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <span>حساب مسؤول المتجر (الأدمن)</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    Admin Active
                  </span>
                </h3>
                <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/90 font-semibold leading-relaxed">
                  أنت تسجّل دخولك بحساب مسؤول النظام. يمكنك التحكم بالكامل في الطلبات، المنتجات،
                  العروض، والإعدادات.
                </p>
              </div>
            </div>
            <Link to="/admin" className="w-full sm:w-auto shrink-0">
              <Button className="w-full sm:w-auto rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black gap-2 shadow-sm py-2.5">
                <LayoutDashboard className="h-4 w-4" /> لوحة تحكم المتجر ⚡
              </Button>
            </Link>
          </div>
        )}
        {/* رأس ملف المستخدم */}
        <div className="mb-8 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 bg-card p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-2xl shadow-md">
              {(user.email?.[0] ?? "U").toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-black text-foreground">
                {user.user_metadata?.full_name || "مرحباً بك 🌿"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/40 dark:hover:bg-rose-950/30 text-xs font-bold"
          >
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </Button>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl bg-secondary/60 p-1.5 shadow-inner">
            <TabsTrigger
              value="orders"
              className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <Package className="h-4 w-4 text-emerald-600" />
              <span>طلباتي</span>
            </TabsTrigger>

            <TabsTrigger
              value="addresses"
              className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span>العناوين</span>
            </TabsTrigger>

            <TabsTrigger
              value="profile"
              className="flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4 text-emerald-600" />
              <span>الملف الشخصي</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <OrdersTab userId={user.id} />
          </TabsContent>

          <TabsContent value="addresses" className="mt-6">
            <AddressesTab userId={user.id} />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ProfileTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------- Orders ---------- */
function OrdersTab({ userId }: { userId: string }) {
  return <PastOrdersList userId={userId} />;
}

/* ---------- Address / Profile Location ---------- */
type Address = {
  full_name: string;
  phone: string;
  address: string;
  city: string;
};

function AddressesTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-profile-address", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name,phone,address,city")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? { full_name: "", phone: "", address: "", city: "" }) as Address;
    },
  });
  const [form, setForm] = useState<Address>({ full_name: "", phone: "", address: "", city: "" });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = async () => {
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: form.full_name.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      updated_at: new Date().toISOString(),
    });
    if (error) return toast.error(`تعذر حفظ بيانات العنوان: ${error.message}`);
    await qc.invalidateQueries({ queryKey: ["my-profile-address", userId] });
    toast.success("تم حفظ بيانات العنوان بنجاح");
  };

  if (isLoading) return <Loader />;
  return (
    <Card className="rounded-3xl border border-emerald-100 dark:border-emerald-900/30 bg-card p-6 shadow-sm">
      <h3 className="mb-2 font-display text-lg font-black text-foreground">عنوان التوصيل الافتراضي 📍</h3>
      <p className="mb-5 text-sm text-muted-foreground">قاعدة البيانات الحالية تدعم عنوانًا افتراضيًا واحدًا مرتبطًا بملفك الشخصي.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم الكامل" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
        <Field label="رقم الهاتف" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <div className="sm:col-span-2"><Field label="العنوان" value={form.address} onChange={(v) => setForm({ ...form, address: v })} /></div>
        <Field label="المدينة" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
      </div>
      <div className="mt-6 flex justify-end"><Button onClick={save} className="rounded-xl">حفظ العنوان</Button></div>
    </Card>
  );
}

/* ---------- Profile ---------- */
function ProfileTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({ full_name: "", phone: "" });
  useEffect(() => {
    if (data)
      setForm({
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
      });
  }, [data]);

  const save = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
      })
      .eq("id", userId);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث معلوماتك بنجاح");
    qc.invalidateQueries({ queryKey: ["my-profile", userId] });
  };

  if (isLoading) return <Loader />;

  return (
    <Card className="rounded-3xl border border-emerald-100 dark:border-emerald-900/30 bg-card p-6 shadow-sm">
      <h3 className="mb-5 font-display text-lg font-black">بيانات الملف الشخصي</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="الاسم بالكامل"
          value={form.full_name}
          onChange={(v) => setForm({ ...form, full_name: v })}
        />
        <Field
          label="رقم الهاتف"
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
        />
      </div>
      <Button
        onClick={save}
        className="mt-6 w-full h-11 rounded-2xl hero-gradient text-primary-foreground font-black shadow-md"
      >
        حفظ التغييرات
      </Button>

      <PasswordSection />
    </Card>
  );
}

function Loader() {
  return (
    <div className="grid min-h-48 place-items-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-foreground">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl" />
    </label>
  );
}

/* ---------- تغيير كلمة المرور ---------- */
function PasswordSection() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
    if (next !== confirm) return toast.error("كلمتا المرور غير متطابقتين");
    if (!user?.email) return toast.error("لا يوجد بريد مرتبط بالحساب");

    setSaving(true);
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (verifyErr) {
      setSaving(false);
      return toast.error("كلمة المرور الحالية غير صحيحة");
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث كلمة المرور بنجاح");
    setCurrent("");
    setNext("");
    setConfirm("");
    setOpen(false);
  };

  return (
    <div className="mt-6 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="font-display text-sm font-black">كلمة المرور</h4>
          <p className="text-[11px] text-muted-foreground">
            الحد الأدنى 8 أحرف — استخدم مزيجاً من الحروف والأرقام
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          className="h-10 shrink-0 rounded-2xl font-extrabold"
        >
          {open ? "إلغاء" : "تغيير كلمة المرور"}
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">كلمة المرور الحالية</span>
            <Input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              autoComplete="current-password"
              className="h-10 rounded-xl"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">كلمة المرور الجديدة</span>
            <Input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 rounded-xl"
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">8 أحرف على الأقل</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">تأكيد كلمة المرور الجديدة</span>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="h-10 rounded-xl"
            />
          </label>
          <Button
            type="submit"
            disabled={saving}
            className="h-11 rounded-2xl hero-gradient text-primary-foreground font-black"
          >
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            حفظ كلمة المرور
          </Button>
        </form>
      )}
    </div>
  );
}

