import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export const ROOT_ADMIN_CREDENTIALS = {
  email: "adminstoresupermarketinvo@gmail.com",
  passwordHash: "ADmin/8",
  role: "super_admin" as const,
  displayName: "المدير العام — سوبرماركت الوادي الأخضر",
};

const STORAGE_KEY_AUTH_USER = "alwadi_supabase_auth_user_v2";

export interface AppUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
    role?: string;
  };
}

export interface AuthCtx {
  user: AppUser | null;
  session: any | null;
  isAdmin: boolean;
  isRootAdmin: boolean;
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
}

export function isRootAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ROOT_ADMIN_CREDENTIALS.email.toLowerCase();
}

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
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize session from persistent state & Supabase
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
        if (saved) {
          const parsed = JSON.parse(saved);
          const isRoot = isRootAdminEmail(parsed.email);
          setCurrentUser(parsed);
          setIsAdmin(isRoot || parsed.role === "super_admin");
          setIsRootAdmin(isRoot);
        }
      }

      // Check active Supabase Auth session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const isRoot = isRootAdminEmail(session.user.email);
          const u: AppUser = {
            id: session.user.id,
            email: session.user.email || "",
            user_metadata: session.user.user_metadata,
          };
          if (!currentUser) {
            setCurrentUser(u);
            setIsAdmin(isRoot || session.user.user_metadata?.role === "admin");
            setIsRootAdmin(isRoot);
          }
        }
      });
    } catch (e) {
      console.warn("Auth initialization error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user: currentUser,
      session: currentUser ? { user: currentUser } : null,
      isAdmin,
      isRootAdmin,
      loading,
      signIn: async (emailInput: string, passwordInput: string) => {
        setLoading(true);
        const email = emailInput.trim().toLowerCase();
        const password = passwordInput;

        // 1. Strict Root Admin credential check
        const isTargetRootAdmin = isRootAdminEmail(email);

        if (isTargetRootAdmin) {
          if (password !== ROOT_ADMIN_CREDENTIALS.passwordHash) {
            setLoading(false);
            return { error: "كلمة المرور غير صحيحة لحساب الإدارة الرئيسي" };
          }

          // Optional: Attempt Supabase signIn if live backend exists
          try {
            await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
          } catch (e) {}

          const adminSessionUser: AppUser = {
            id: "root-admin-elwadi-01",
            email: ROOT_ADMIN_CREDENTIALS.email,
            user_metadata: {
              full_name: ROOT_ADMIN_CREDENTIALS.displayName,
              role: "super_admin",
            },
          };

          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(adminSessionUser));
          }

          setCurrentUser(adminSessionUser);
          setIsAdmin(true);
          setIsRootAdmin(true);
          setLoading(false);
          return {};
        }

        // 2. Regular Customer / Staff login via Supabase Auth
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            setLoading(false);
            return { error: error.message || "فشل تسجيل الدخول" };
          }

          if (data.user) {
            const isUserRoot = isRootAdminEmail(data.user.email);
            const userObj: AppUser = {
              id: data.user.id,
              email: data.user.email || email,
              user_metadata: data.user.user_metadata,
            };

            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userObj));
            }

            setCurrentUser(userObj);
            setIsAdmin(isUserRoot || data.user.user_metadata?.role === "admin");
            setIsRootAdmin(isUserRoot);
          }

          setLoading(false);
          return {};
        } catch (err: any) {
          setLoading(false);
          return { error: err.message || "حدث خطأ أثناء المصادقة عبر Supabase" };
        }
      },
      signUp: async (email: string, password: string, fullName?: string, phone?: string) => {
        setLoading(true);
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                phone: phone,
              },
            },
          });

          if (error) {
            setLoading(false);
            return { error: error.message };
          }

          if (data.user) {
            const userObj: AppUser = {
              id: data.user.id,
              email: data.user.email || email,
              user_metadata: {
                full_name: fullName,
                phone,
              },
            };
            setCurrentUser(userObj);
            setIsAdmin(false);
            setIsRootAdmin(false);
          }

          setLoading(false);
          return { needsConfirmation: false };
        } catch (e: any) {
          setLoading(false);
          return { error: e.message || "فشل إنشاء الحساب" };
        }
      },
      signInWithPhone: async (phone, password) => {
        const formattedPhone = normalizePhone(phone);
        if (!password || password.length < 6) {
          return { error: "كلمة المرور مطلوبة (6 أحرف على الأقل)" };
        }
        const synthEmail = phoneEmail(formattedPhone);
        return value.signIn(synthEmail, password);
      },
      signUpWithPhone: async (phone, password, fullName) => {
        const formattedPhone = normalizePhone(phone);
        if (!password || password.length < 6) {
          return { error: "اختر كلمة مرور قوية (6 أحرف على الأقل)" };
        }
        const synthEmail = phoneEmail(formattedPhone);
        return value.signUp(synthEmail, password, fullName, formattedPhone);
      },
      signInWithGoogle: async () => {
        return { error: "يرجى استخدام البريد الإلكتروني وكلمة المرور لتسجيل الدخول." };
      },
      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) {}

        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY_AUTH_USER);
        }
        setCurrentUser(null);
        setIsAdmin(false);
        setIsRootAdmin(false);
      },
      claimAdmin: async () => false,
      refreshRole: async () => {
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
          if (saved) {
            const parsed = JSON.parse(saved);
            const isRoot = isRootAdminEmail(parsed.email);
            setIsAdmin(isRoot || parsed.role === "super_admin");
            setIsRootAdmin(isRoot);
          }
        }
      },
    }),
    [currentUser, isAdmin, isRootAdmin, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
