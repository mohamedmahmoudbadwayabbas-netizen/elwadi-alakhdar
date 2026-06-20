import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — الوادي الأخضر" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user, isAdmin, signIn, signUp, claimAdmin, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) router.history.push("/admin");
  }, [user, isAdmin, loading, router]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    if (res.error) {
      toast.error(res.error);
      setBusy(false);
      return;
    }
    // After sign-up or sign-in, try to claim admin if none exists yet
    const claimed = await claimAdmin();
    if (claimed) toast.success("تم تعيينك كأول مسؤول للمتجر");
    else if (mode === "signup") toast.success("تم إنشاء الحساب — اطلب من المسؤول منحك صلاحية أدمن");
    else toast.success("مرحباً بعودتك");
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elegant">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl hero-gradient text-primary-foreground shadow-elegant">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-xl font-bold">الوادي الأخضر</div>
            <div className="text-[11px] text-muted-foreground">لوحة الإدارة</div>
          </div>
        </div>

        <div className="mb-5 flex rounded-2xl border border-border bg-secondary/40 p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${
                mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {m === "signin" ? "تسجيل دخول" : "حساب جديد"}
            </button>
          ))}
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
            {mode === "signin" ? <LogIn className="me-2 h-4 w-4" /> : <UserPlus className="me-2 h-4 w-4" />}
            {busy ? "جارٍ المعالجة..." : mode === "signin" ? "دخول" : "إنشاء الحساب"}
          </Button>
        </form>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          أول مستخدم يُسجَّل يحصل تلقائياً على صلاحية الأدمن.
          <br />
          <Link to="/" className="font-bold text-primary">← العودة للمتجر</Link>
        </p>
      </div>
    </div>
  );
}
