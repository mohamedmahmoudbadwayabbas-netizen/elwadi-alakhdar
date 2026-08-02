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
  signUp: (
    email: string,
    password: string,
    fullName?: string,
    phone?: string,
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithPhone: (phone: string, password?: string) => Promise<{ error?: string }>;
  signUpWithPhone: (
    phone: string,
    password: string,
    fullName?: string,
  ) => Promise<{ error?: string }>;
  signInWithGoogle: (redirectUri?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  claimAdmin: () => Promise<boolean>;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

function normalizePhone(phone: string): string {
  let p = phone.trim().replace(/\s+/g, "");
  if (!p.startsWith("+")) {
    p = p.startsWith("0") ? "+20" + p.slice(1) : "+20" + p;
  }
  return p;
}

function phoneEmail(formattedPhone: string): string {
  return `${formattedPhone.replace("+", "")}@phone.elwadi.local`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // دالة جلب الصلاحيات المعدلة لمعرفة الأخطاء وتجنب الـ silent fail عند تغيير الجهاز
  const fetchRole = async (uid: string | undefined) => {
    if (!uid) {
      setIsAdmin(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();

    if (error) {
      console.error("🚨 [AuthContext] خطأ أثناء جلب صلاحيات الأدمن:", error.message);
    }

    setIsAdmin(!!data);
  };

  // مراقب الحالة المعدل ليتعامل بسلاسة مع الجلسات القادمة من الأجهزة والمتصفحات المختلفة
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      fetchRole(data.session?.user.id).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;

      // أضفنا فحص أحداث الجلسة الإضافية مثل TOKEN_REFRESHED لضمان ثبات الدخول من الأجهزة الأخرى
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

  const value = useMemo<AuthCtx>(
    () => ({
      user: session?.user ?? null,
      session,
      isAdmin,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return error ? { error: translateAuthError(error.message) } : {};
      },
      signUp: async (email, password, fullName, phone) => {
        const redirectTo =
          typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { full_name: fullName, phone: phone },
          },
        });
        if (error) return { error: translateAuthError(error.message) };
        const needsConfirmation = !data.session;
        return { needsConfirmation };
      },
      // ملاحظة أمنية: لا يجوز أبداً توليد كلمة مرور من رقم الهاتف،
      // لأن أي شخص يعرف الرقم يستطيع تخمينها والدخول للحساب.
      // كلمة المرور مطلوبة دائماً ويختارها المستخدم بنفسه.
      signInWithPhone: async (phone, password) => {
        const formattedPhone = normalizePhone(phone);
        if (!password || password.length < 8) {
          return { error: "كلمة المرور مطلوبة (8 أحرف على الأقل)" };
        }
        const { error } = await supabase.auth.signInWithPassword({
          phone: formattedPhone,
          password,
        });
        if (!error) return {};
        const synthEmail = phoneEmail(formattedPhone);
        const { error: inErr } = await supabase.auth.signInWithPassword({
          email: synthEmail,
          password,
        });
        if (inErr) return { error: translateAuthError(inErr.message) };
        return {};
      },
      signUpWithPhone: async (phone, password, fullName) => {
        const formattedPhone = normalizePhone(phone);
        if (!password || password.length < 8) {
          return { error: "اختر كلمة مرور قوية (8 أحرف على الأقل)" };
        }
        const synthEmail = phoneEmail(formattedPhone);
        const { data, error } = await supabase.auth.signUp({
          email: synthEmail,
          password,
          options: { data: { full_name: fullName, phone: formattedPhone } },
        });
        if (error) return { error: translateAuthError(error.message) };
        if (!data.session) {
          await supabase.auth.signInWithPassword({ email: synthEmail, password });
        }
        return {};
      },
      signInWithGoogle: async (redirectUri?: string) => {
        const redirect_uri =
          redirectUri ?? (typeof window !== "undefined" ? window.location.origin : undefined);
        try {
          const result = await lovable.auth.signInWithOAuth("google", { redirect_uri });
          if (result && !result.error) return {};
          // fallback to Supabase OAuth
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: redirect_uri },
          });
          if (error) return { error: translateAuthError(error.message) };
          return {};
        } catch (e) {
          try {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: redirect_uri },
            });
            if (error) return { error: translateAuthError(error.message) };
            return {};
          } catch (err: any) {
            return { error: translateAuthError(err.message) };
          }
        }
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
      },
      claimAdmin: async () => false,
      refreshRole: async () => {
        await fetchRole(session?.user.id);
      },
    }),
    [session, isAdmin, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "البريد أو كلمة المرور غير صحيحة";
  if (m.includes("email not confirmed")) return "يجب تأكيد البريد الإلكتروني أولاً";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "هذا البريد مسجل بالفعل، سجّل الدخول بدلاً من إنشاء حساب";
  if (m.includes("password should be at least")) return "كلمة المرور قصيرة جداً (6 أحرف على الأقل)";
  if (m.includes("rate limit") || m.includes("too many"))
    return "محاولات كثيرة، حاول مرة أخرى بعد قليل";
  if (m.includes("network") || m.includes("fetch")) return "تعذر الاتصال بالخادم، تحقق من الإنترنت";
  if (m.includes("popup") || m.includes("blocked"))
    return "تم حظر النافذة المنبثقة. يرجى السماح بها والمحاولة مجدداً";
  return msg;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
