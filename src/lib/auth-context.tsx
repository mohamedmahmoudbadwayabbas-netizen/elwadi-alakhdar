import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  claimAdmin: () => Promise<boolean>;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (uid: string | undefined) => {
    if (!uid) { setIsAdmin(false); return; }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      fetchRole(data.session?.user.id).finally(() => setLoading(false));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setSession(s);
      setTimeout(() => fetchRole(s?.user.id), 0);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user: session?.user ?? null,
    session,
    isAdmin,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? { error: translateAuthError(error.message) } : {};
    },
    signUp: async (email, password) => {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
      return error ? { error: translateAuthError(error.message) } : {};
    },
    signInWithGoogle: async () => {
      const redirect_uri = typeof window !== "undefined" ? window.location.origin : undefined;
      try {
        const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
        if (result.error) {
          const msg = result.error instanceof Error ? result.error.message : String(result.error);
          // Cancellation by user — don't show as an error
          if (/cancel/i.test(msg)) return { error: "__CANCELLED__" };
          return { error: translateAuthError(msg) };
        }
        return {};
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/cancel/i.test(msg)) return { error: "__CANCELLED__" };
        return { error: translateAuthError(msg) };
      }
    },
    signOut: async () => { await supabase.auth.signOut(); setIsAdmin(false); },
    claimAdmin: async () => false,
    refreshRole: async () => { await fetchRole(session?.user.id); },
  }), [session, isAdmin, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "البريد أو كلمة المرور غير صحيحة";
  if (m.includes("email not confirmed")) return "يجب تأكيد البريد الإلكتروني أولاً";
  if (m.includes("user already registered") || m.includes("already registered")) return "هذا البريد مسجل بالفعل، سجّل الدخول بدلاً من إنشاء حساب";
  if (m.includes("password should be at least")) return "كلمة المرور قصيرة جداً (6 أحرف على الأقل)";
  if (m.includes("rate limit") || m.includes("too many")) return "محاولات كثيرة، حاول مرة أخرى بعد قليل";
  if (m.includes("network") || m.includes("fetch")) return "تعذر الاتصال بالخادم، تحقق من الإنترنت";
  if (m.includes("popup") || m.includes("blocked")) return "تم حظر النافذة المنبثقة. يرجى السماح بها والمحاولة مجدداً";
  return msg;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
