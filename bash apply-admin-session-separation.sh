#!/usr/bin/env bash
# سكريبت تطبيق فصل جلسة الأدمن عن جلسة العميل
# شغّله من جذر المستودع داخل GitHub Codespaces terminal

set -e

echo "==> إنشاء الفرع الجديد..."
git checkout main
git pull origin main
git checkout -b feature/admin-session-separation

echo "==> كتابة الملفات..."

mkdir -p src/integrations/supabase
cat > src/integrations/supabase/admin-client.ts << 'FILE_EOF'
// عميل Supabase مخصص لجلسة لوحة التحكم فقط.
// نفس المشروع (نفس URL والمفتاح) بس بمفتاح تخزين مختلف في المتصفح،
// عشان جلسة الأدمن تكون مستقلة تماماً عن جلسة العميل في نفس المتصفح.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }
    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createAdminSupabaseClient() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(', ')}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase Admin] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storageKey: 'sb-admin-auth-token',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

let _adminSupabase: ReturnType<typeof createAdminSupabaseClient> | undefined;

export const adminSupabase = new Proxy({} as ReturnType<typeof createAdminSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_adminSupabase) _adminSupabase = createAdminSupabaseClient();
    return Reflect.get(_adminSupabase, prop, receiver);
  },
});

FILE_EOF

mkdir -p src/lib
cat > src/lib/admin-auth-context.tsx << 'FILE_EOF'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { adminSupabase } from "@/integrations/supabase/admin-client";

type AdminAuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthCtx | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (uid: string | undefined) => {
    if (!uid) {
      setIsAdmin(false);
      return;
    }
    const { data, error } = await adminSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      console.error("🚨 [AdminAuthContext] خطأ أثناء جلب صلاحيات الأدمن:", error.message);
    }
    setIsAdmin(!!data);
  };

  useEffect(() => {
    let mounted = true;

    adminSupabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      fetchRole(data.session?.user.id).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const { data: sub } = adminSupabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "USER_UPDATED" ||
        event === "TOKEN_REFRESHED"
      ) {
        setSession(s);
        setTimeout(() => {
          if (mounted) fetchRole(s?.user.id);
        }, 0);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AdminAuthCtx>(() => ({
    user: session?.user ?? null,
    session,
    isAdmin,
    loading,
    signIn: async (email, password) => {
      const { error } = await adminSupabase.auth.signInWithPassword({ email, password });
      return error ? { error: translateAuthError(error.message) } : {};
    },
    signOut: async () => {
      await adminSupabase.auth.signOut();
      setIsAdmin(false);
    },
    refreshRole: async () => {
      await fetchRole(session?.user.id);
    },
  }), [session, isAdmin, loading]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "البريد أو كلمة المرور غير صحيحة";
  if (m.includes("email not confirmed")) return "يجب تأكيد البريد الإلكتروني أولاً";
  if (m.includes("rate limit") || m.includes("too many")) return "محاولات كثيرة، حاول مرة أخرى بعد قليل";
  if (m.includes("network") || m.includes("fetch")) return "تعذر الاتصال بالخادم، تحقق من الإنترنت";
  return msg;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

FILE_EOF

mkdir -p src/routes
cat > src/routes/admin.tsx << 'FILE_EOF'
import { createFileRoute, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth-context";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ColorModeProvider } from "@/lib/color-mode-context";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { ShieldAlert, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة التحكم — الوادي الأخضر" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner />
    </AdminAuthProvider>
  );
}

function AdminLayoutInner() {
  const { user, isAdmin, loading } = useAdminAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoginRoute = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginRoute) return;
    if (!loading && !user) router.history.push("/admin/login");
  }, [user, loading, router, isLoginRoute]);

  if (isLoginRoute) return <Outlet />;

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="max-w-sm rounded-3xl border border-border bg-card p-8 text-center shadow-elegant">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold">وصول مرفوض</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            حسابك غير مخوّل بالوصول إلى لوحة التحكم.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ColorModeProvider storageKey="admin-color-mode" defaultMode="dark">
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background" dir="rtl">
          <AdminSidebar />
          <SidebarInset className="flex-1">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
              <SidebarTrigger />
              <span className="font-display text-sm font-bold text-muted-foreground">لوحة التحكم</span>
              <div className="mr-auto">
                <ColorModeToggle />
              </div>
            </header>
            <main className="flex-1">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ColorModeProvider>
  );
}

FILE_EOF

cat > src/routes/admin.login.tsx << 'FILE_EOF'
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth-context";
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
  const { user, isAdmin, signIn, loading } = useAdminAuth();
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

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (res.error) return toast.error("بيانات الدخول غير صحيحة");
    toast.success("مرحباً بعودتك");
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

FILE_EOF

echo "==> استبدال supabase بـ adminSupabase في باقي ملفات الأدمن..."

for f in src/routes/admin.*.tsx; do
  base=$(basename "$f")
  if [ "$base" != "admin.tsx" ] && [ "$base" != "admin.login.tsx" ]; then
    sed -i \
      's|import { supabase } from "@/integrations/supabase/client"|import { adminSupabase as supabase } from "@/integrations/supabase/admin-client"|g' \
      "$f"
    echo "   عُدّل: $f"
  fi
done

if [ -d "src/components/admin" ]; then
  find src/components/admin -type f \( -name "*.tsx" -o -name "*.ts" \) | while read -r f; do
    sed -i \
      's|import { supabase } from "@/integrations/supabase/client"|import { adminSupabase as supabase } from "@/integrations/supabase/admin-client"|g' \
      "$f"
    echo "   عُدّل: $f"
  done
fi

echo "==> فحص الأخطاء البرمجية..."
npx tsc --noEmit || echo "⚠️  فيه تحذيرات TypeScript، راجعها قبل الدمج"

echo "==> الحفظ والرفع..."
git add -A
git commit -m "فصل جلسة تسجيل دخول الأدمن عن جلسة العميل"
git push -u origin feature/admin-session-separation

echo "==> فتح Pull Request..."
gh pr create \
  --title "فصل جلسة الأدمن عن جلسة العميل" \
  --body "إضافة adminSupabase client مستقل بمفتاح تخزين مختلف، وAdminAuthProvider/useAdminAuth منفصلين، وتحديث admin.tsx وadmin.login.tsx وكل صفحات الأدمن." \
  --base main \
  --head feature/admin-session-separation

echo "✅ تم! افتح رابط الـ PR اللي ظهر فوق وراجعه قبل الدمج."