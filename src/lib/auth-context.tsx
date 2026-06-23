import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
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
      return error ? { error: error.message } : {};
    },
    signUp: async (email, password) => {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
      return error ? { error: error.message } : {};
    },
    signOut: async () => { await supabase.auth.signOut(); setIsAdmin(false); },
    claimAdmin: async () => false,
    refreshRole: async () => { await fetchRole(session?.user.id); },
  }), [session, isAdmin, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
