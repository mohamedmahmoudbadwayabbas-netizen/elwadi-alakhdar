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

