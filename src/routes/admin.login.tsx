import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaf, LogIn } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!loading && user && isAdmin) router.history.push("/admin");
  }, [user, isAdmin, loading, router]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (res.error) return toast.error("بيانات الدخول غير صحيحة");
    toast.success("مرحباً بعودتك");
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elegant">
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
