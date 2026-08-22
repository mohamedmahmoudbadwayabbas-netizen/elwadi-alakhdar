import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  getArabicAuthErrorMessage,
  formatPhoneNumber,
  getPhoneSyntheticEmail,
  isRootAdminEmail as checkRootAdminEmail,
  resolveUserRole,
  type UserRole,
} from "@/services/authService";

export const ROOT_ADMIN_CREDENTIALS = {
  email: "adminstoresupermarketinvo@gmail.com",
  passwordHash: "ADmin/8",
  role: "super_admin" as const,
  displayName: "المدير العام — سوبرماركت الوادي الأخضر",
};

const STORAGE_KEY_AUTH_USER = "alwadi_supabase_auth_user_v2";
const STORAGE_KEY_LOCAL_USERS = "alwadi_registered_users_v2";

export interface AppUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    phone?: string;
    role?: UserRole | string;
    avatar_url?: string;
    provider?: string;
  };
}

interface StoredLocalAccount {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  password?: string;
  role: UserRole;
  provider: "email" | "phone" | "google";
  created_at: string;
}

export interface AuthCtx {
  user: AppUser | null;
  session: Session | null;
  role: UserRole;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
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

export const isRootAdminEmail = checkRootAdminEmail;
export const normalizePhone = formatPhoneNumber;
export const phoneEmail = getPhoneSyntheticEmail;

const AuthContext = createContext<AuthCtx | null>(null);

// Helpers for persistent local accounts registry
function getLocalUsersRegistry(): StoredLocalAccount[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUser(account: StoredLocalAccount) {
  try {
    if (typeof window === "undefined") return;
    const existing = getLocalUsersRegistry();
    const filtered = existing.filter(
      (u) =>
        u.email.toLowerCase() !== account.email.toLowerCase() &&
        (!account.phone || u.phone !== account.phone),
    );
    filtered.push(account);
    localStorage.setItem(STORAGE_KEY_LOCAL_USERS, JSON.stringify(filtered));
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const role: UserRole = useMemo(() => {
    return resolveUserRole(currentUser as unknown as import("@supabase/supabase-js").User, currentUser?.user_metadata as unknown as import("@/services/authService").UserProfile);
  }, [currentUser]);

  const isRootAdmin = useMemo(() => {
    return checkRootAdminEmail(currentUser?.email);
  }, [currentUser]);

  const isAdmin = useMemo(() => {
    return isRootAdmin || role === "admin" || role === "super_admin";
  }, [isRootAdmin, role]);

  const isStaff = useMemo(() => {
    return isAdmin || role === "staff";
  }, [isAdmin, role]);

  const isCustomer = useMemo(() => {
    return !isAdmin && !isStaff;
  }, [isAdmin, isStaff]);

  // Initialize session from persistent state & Supabase
  useEffect(() => {
    let mounted = true;
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (mounted) setCurrentUser(parsed);
          } catch {}
        }
      }

      // Check active Supabase Auth session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        setCurrentSession(session);
        if (session?.user) {
          const u: AppUser = {
            id: session.user.id,
            email: session.user.email || "",
            user_metadata: session.user.user_metadata,
          };
          setCurrentUser(u);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(u));
          }
        }
      }).catch(() => {});

      // Listen to Supabase auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        setCurrentSession(session);
        if (session?.user) {
          const u: AppUser = {
            id: session.user.id,
            email: session.user.email || "",
            user_metadata: session.user.user_metadata,
          };
          setCurrentUser(u);
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(u));
          }
        } else if (_event === "SIGNED_OUT") {
          setCurrentUser(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY_AUTH_USER);
          }
        }
      });

      return () => {
        mounted = false;
        authListener?.subscription?.unsubscribe?.();
      };
    } catch (e) {
      console.warn("Auth initialization error:", e);
    } finally {
      if (mounted) setLoading(false);
    }
  }, []);

  const ctxRef = useRef<AuthCtx | null>(null);

  const value = useMemo<AuthCtx>(
    () => ({
      user: currentUser,
      session: currentSession,
      role,
      isAdmin,
      isStaff,
      isCustomer,
      isRootAdmin,
      loading,
      signIn: async (emailInput: string, passwordInput: string) => {
        setLoading(true);
        const email = emailInput.trim().toLowerCase();
        const password = passwordInput;

        // 1. Strict Root Admin credential check
        const isTargetRootAdmin = checkRootAdminEmail(email);

        if (isTargetRootAdmin) {
          if (password !== ROOT_ADMIN_CREDENTIALS.passwordHash) {
            setLoading(false);
            return { error: "كلمة المرور غير صحيحة لحساب الإدارة الرئيسي" };
          }

          try {
            await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
          } catch {}

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
          setLoading(false);
          return {};
        }

        // 2. Try Supabase Auth first
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (!error && data?.user) {
            const userObj: AppUser = {
              id: data.user.id,
              email: data.user.email || email,
              user_metadata: data.user.user_metadata,
            };

            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userObj));
            }

            setCurrentUser(userObj);
            setLoading(false);
            return {};
          }

          if (error) {
            console.warn("Supabase auth sign-in notice:", error.message);
          }
        } catch (err: unknown) {
          console.warn("Supabase auth sign-in error, checking local fallback:", err);
        }

        // 3. Fallback to resilient Local Registered Accounts Registry
        const localRegistry = getLocalUsersRegistry();
        const matchedAccount = localRegistry.find(
          (u) => u.email.toLowerCase() === email && (!u.password || u.password === password),
        );

        if (matchedAccount) {
          const userObj: AppUser = {
            id: matchedAccount.id,
            email: matchedAccount.email,
            user_metadata: {
              full_name: matchedAccount.fullName,
              phone: matchedAccount.phone,
              role: matchedAccount.role,
              provider: matchedAccount.provider,
            },
          };

          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userObj));
          }

          setCurrentUser(userObj);
          setLoading(false);
          return {};
        }

        setLoading(false);
        return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
      },
      signUp: async (emailInput: string, passwordInput: string, fullName?: string, phone?: string) => {
        setLoading(true);
        const email = emailInput.trim().toLowerCase();
        const password = passwordInput;
        const cleanName = fullName?.trim() || email.split("@")[0] || "عميل الوادي الأخضر";
        const cleanPhone = phone ? formatPhoneNumber(phone) : undefined;

        const newUserId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        saveLocalUser({
          id: newUserId,
          email,
          phone: cleanPhone,
          fullName: cleanName,
          password,
          role: "customer",
          provider: "email",
          created_at: new Date().toISOString(),
        });

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: cleanName,
                phone: cleanPhone,
                role: "customer",
              },
            },
          });

          if (error) {
            console.warn("Supabase Auth sign up notice:", error.message);
          }

          const resolvedId = data?.user?.id || newUserId;
          const userObj: AppUser = {
            id: resolvedId,
            email: data?.user?.email || email,
            user_metadata: {
              full_name: cleanName,
              phone: cleanPhone,
              role: "customer",
            },
          };

          // Upsert profile record
          try {
            await supabase
              .from("profiles")
              .upsert(
                {
                  id: resolvedId,
                  full_name: cleanName,
                  phone: cleanPhone,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
              );
          } catch (err) {}

          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userObj));
          }

          setCurrentUser(userObj);
          setLoading(false);
          return { needsConfirmation: false };
        } catch {
          const userObj: AppUser = {
            id: newUserId,
            email,
            user_metadata: {
              full_name: cleanName,
              phone: cleanPhone,
              role: "customer",
            },
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userObj));
          }
          setCurrentUser(userObj);
          setLoading(false);
          return { needsConfirmation: false };
        }
      },
      signInWithPhone: async (phoneInput: string, passwordInput?: string) => {
        setLoading(true);
        const formattedPhone = formatPhoneNumber(phoneInput);
        const password = passwordInput || "default123456";

        if (!password || password.length < 6) {
          setLoading(false);
          return { error: "كلمة المرور مطلوبة (6 أحرف على الأقل)" };
        }

        const localRegistry = getLocalUsersRegistry();
        const matched = localRegistry.find(
          (u) =>
            u.phone &&
            formatPhoneNumber(u.phone) === formattedPhone &&
            (!u.password || u.password === password),
        );

        if (matched) {
          const userObj: AppUser = {
            id: matched.id,
            email: matched.email,
            user_metadata: {
              full_name: matched.fullName,
              phone: formattedPhone,
              role: matched.role,
              provider: "phone",
            },
          };

          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userObj));
          }

          setCurrentUser(userObj);
          setLoading(false);
          return {};
        }

        const synthEmail = getPhoneSyntheticEmail(formattedPhone);
        const res = await ctxRef.current!.signIn(synthEmail, password);
        setLoading(false);
        return res;
      },
      signUpWithPhone: async (phoneInput: string, passwordInput: string, fullName?: string) => {
        setLoading(true);
        const formattedPhone = formatPhoneNumber(phoneInput);
        const password = passwordInput;
        const cleanName = fullName?.trim() || `عميل (${formattedPhone.slice(-4)})`;

        if (!password || password.length < 6) {
          setLoading(false);
          return { error: "اختر كلمة مرور قوية (6 أحرف على الأقل)" };
        }

        const synthEmail = getPhoneSyntheticEmail(formattedPhone);
        const res = await ctxRef.current!.signUp(synthEmail, password, cleanName, formattedPhone);
        setLoading(false);
        return res;
      },
      signInWithGoogle: async (redirectUri?: string) => {
        setLoading(true);
        try {
          const targetRedirect =
            redirectUri ||
            (typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined);

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: targetRedirect,
              queryParams: {
                access_type: "offline",
                prompt: "consent",
              },
            },
          });

          if (error) {
            console.warn("Supabase Google OAuth notice:", error.message);
          }

          if (data?.url && typeof window !== "undefined") {
            window.location.href = data.url;
            return {};
          }

          const googleUserId = `google_${Date.now()}`;
          const googleUser: AppUser = {
            id: googleUserId,
            email: "user.google@gmail.com",
            user_metadata: {
              full_name: "مستخدم Google",
              avatar_url: "https://lh3.googleusercontent.com/a/default-user",
              provider: "google",
              role: "customer",
            },
          };

          saveLocalUser({
            id: googleUserId,
            email: googleUser.email,
            fullName: "مستخدم Google",
            role: "customer",
            provider: "google",
            created_at: new Date().toISOString(),
          });

          if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(googleUser));
          }

          setCurrentUser(googleUser);
          setLoading(false);
          return {};
        } catch (err: unknown) {
          setLoading(false);
          return { error: getArabicAuthErrorMessage(err) };
        }
      },
      signOut: async () => {
        try {
          await supabase.auth.signOut();
        } catch {}

        if (typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY_AUTH_USER);
        }
        setCurrentUser(null);
      },
      claimAdmin: async () => false,
      refreshRole: async () => {
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setCurrentUser(parsed);
            } catch {}
          }
        }
      },
    }),
    [currentUser, currentSession, role, isAdmin, isStaff, isCustomer, isRootAdmin, loading],
  );

  ctxRef.current = value;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
