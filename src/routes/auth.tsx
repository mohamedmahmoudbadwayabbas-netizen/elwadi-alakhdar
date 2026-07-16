import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, LogIn, UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme-context";

function safeRelative(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/account";
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — الوادي الأخضر" },
      { name: "description", content: "سجّل دخولك أو أنشئ حساباً جديداً في متجر الوادي الأخضر" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signIn, signUp, signInWithGoogle, loading } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = safeRelative(next ?? "/account");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      // Use href for arbitrary paths (e.g. /.lovable/oauth/consent?...).
      if (dest === "/account") navigate({ to: "/account" });
      else window.location.href = dest;
    }
  }, [user, loading, navigate, dest]);


  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password);
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success(mode === "signin" ? "مرحباً بعودتك!" : "تم إنشاء الحساب! تحقق من بريدك");
  };

  const handleGoogle = async () => {
    setBusy(true);
    // Preserve the intended destination through the OAuth round-trip by
    // pointing redirect_uri back at /auth with the same `next`.
    const redirectUri = typeof window !== "undefined"
      ? `${window.location.origin}/auth${next ? `?next=${encodeURIComponent(next)}` : ""}`
      : undefined;
    const res = await signInWithGoogle(redirectUri);
    setBusy(false);
    if (res.error && res.error !== "__CANCELLED__") toast.error(res.error);
  };

  const authBg = theme.auth_bg_url ?? theme.marble_bg_url;
  return (
    <div
      className="grid min-h-screen place-items-center px-4"
      style={{
        backgroundColor: "#FAF9F6",
        backgroundImage: authBg
          ? `url(${authBg})`
          : "radial-gradient(at 20% 0%, rgba(3,98,51,0.07) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(229,83,0,0.06) 0px, transparent 50%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      dir="rtl"
    >
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2.5">
          <div
            className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #036233, #024a26)" }}
          >
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <div className="font-display text-xl font-bold" style={{ color: "#036233" }}>الوادي الأخضر</div>
            <div className="text-[11px] text-muted-foreground">سوبر ماركت وعطارة</div>
          </div>
        </Link>

        <div
          className="rounded-3xl p-7"
          style={{
            background: "linear-gradient(180deg, #FFFFFF 0%, #FAF9F6 100%)",
            border: "2px solid #C9A86B",
            boxShadow: "0 18px 50px -18px rgba(3,98,51,0.25), inset 0 0 0 1px rgba(201,168,107,0.25)",
          }}
        >
          <h1 className="text-center font-display text-xl font-bold">
            {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </h1>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {mode === "signin" ? "مرحباً بعودتك إلى متجرك المفضل" : "انضم إلينا واستمتع بمميزات حصرية"}
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={busy}
            className="mt-5 h-11 w-full rounded-xl text-sm font-bold"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            متابعة بحساب جوجل
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-muted-foreground">أو</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handle} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">البريد الإلكتروني</span>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">كلمة المرور</span>
              <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </label>
            <Button type="submit" disabled={busy} className="mt-2 h-11 w-full rounded-xl text-base font-bold text-white transition-transform hover:scale-[1.02] active:scale-95" style={{ background: "linear-gradient(135deg, #036233, #024a26)" }}>
              {mode === "signin" ? <><LogIn className="me-2 h-4 w-4" />{busy ? "جارٍ الدخول..." : "دخول"}</> : <><UserPlus className="me-2 h-4 w-4" />{busy ? "جارٍ الإنشاء..." : "إنشاء الحساب"}</>}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 block w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "ليس لديك حساب؟ سجّل الآن" : "لديك حساب بالفعل؟ سجّل دخولك"}
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground">
          بإنشائك للحساب، أنت توافق على شروط الاستخدام وسياسة الخصوصية.
        </p>
      </div>
    </div>
  );
}
