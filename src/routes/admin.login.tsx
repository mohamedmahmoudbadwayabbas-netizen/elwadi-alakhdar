import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "تسجيل دخول الإدارة — الوادي الأخضر" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const { user, isAdmin, signIn, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [bg, setBg] = useState<{ pattern: string | null; floating: string | null }>({ pattern: null, floating: null });

  useEffect(() => {
    supabase
      .from("store_settings_public" as any)
      .select("login_bg_pattern,floating_element_image")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBg({ pattern: (data as any).login_bg_pattern ?? null, floating: (data as any).floating_element_image ?? null });
      });
  }, []);

  useEffect(() => {
    if (!loading && user && isAdmin) router.history.push("/admin");
  }, [user, isAdmin, loading, router]);

  // ── تسجيل الدخول: بعد نجاح الدخول، نتحقق فوراً من صلاحية الأدمن ──
  // بدل ما نستنى الـ useEffect (اللي بيعتمد على تحديث isAdmin في الـ context
  // وممكن ياخد وقت أو مايتحدّثش أوي)، بنتأكد بأنفسنا هنا ونسجّل خروج أي
  // مستخدم مش أدمن فوراً مع رسالة واضحة، بدل ما يفضل واقف في صفحة اللوجين
  // من غير أي تفسير.
  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    const res = await signIn(email, password);
    if (res.error) {
      setBusy(false);
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();

    setBusy(false);

    if (roleError) {
      toast.error("تعذر التحقق من صلاحياتك، حاول مرة أخرى");
      return;
    }

    if (!roleData) {
      await supabase.auth.signOut();
      toast.error("هذا الحساب غير مصرّح له بالدخول للوحة الإدارة");
      return;
    }

    toast.success("مرحباً بعودتك");
    router.history.push("/admin");
  };

  return (
    <div
      className={`relative grid min-h-screen place-items-center px-4 ${bg.pattern ? "bg-cover bg-center" : "bg-background"}`}
      style={bg.pattern ? { backgroundImage: `url(${bg.pattern})` } : undefined}
      dir="rtl"
    >
      {bg.pattern && <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />}
      <div className="relative w-full max-w-md overflow-visible rounded-3xl border border-white/40 bg-card/80 p-8 shadow-elegant backdrop-blur-xl">
        {bg.floating && (
          <img
            src={bg.floating}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -top-12 -right-10 h-32 w-32 select-none object-contain drop-shadow-xl rotate-12"
          />
        )}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-elegant">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-xl font-bold">الوادي الأخضر</div>
            <div className="text-[11px] text-muted-foreground">دخول لوحة الإدارة</div>
          </div>
        </div>
        <form onSubmit={handle} className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">البريد الإلكتروني</span>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold">كلمة المرور</span>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          <Button type="submit" disabled={busy} className="mt-2 h-11 w-full rounded-xl hero-gradient text-base font-bold text-primary-foreground">
            <LogIn className="me-2 h-4 w-4" />
            {busy ? "جارٍ الدخول..." : "دخول"}
          </Button>
        </form>
        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          هذه الصفحة مخصصة لإدارة المتجر فقط.
        </p>
      </div>
    </div>
  );
}
