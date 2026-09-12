import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { RoleRow, UserStatus } from "@/lib/types";

type SignResult = { error?: string };

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: RoleRow | null;
  status: UserStatus | null;
  isPrincipal: boolean;
  isApprovedStaff: boolean;
  refreshRole: () => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<SignResult>;
  signIn: (email: string, password: string) => Promise<SignResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchRole(userId: string): Promise<RoleRow | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role, status, approved_by, approved_at, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return (data as RoleRow | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<RoleRow | null>(null);
  const mounted = useRef(true);

  const applyUser = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (nextSession?.user) {
      const r = await fetchRole(nextSession.user.id);
      if (mounted.current) setRole(r);
    } else {
      setRole(null);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      await applyUser(data.session);
      if (mounted.current) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applyUser(nextSession);
    });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, [applyUser]);

  // Re-check the authoritative role/status when the tab regains focus so a
  // suspension/approval is reflected promptly (RLS also enforces on the server).
  useEffect(() => {
    function onFocus(): void {
      const uid = session?.user?.id;
      if (uid) void fetchRole(uid).then((r) => mounted.current && setRole(r));
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [session?.user?.id]);

  const refreshRole = useCallback(async () => {
    const uid = session?.user?.id;
    if (uid) {
      const r = await fetchRole(uid);
      if (mounted.current) setRole(r);
    }
  }, [session?.user?.id]);

  const signUp = useCallback<AuthContextValue["signUp"]>(async (fullName, email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return error ? { error: error.message } : {};
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const status = role?.status ?? null;
    const isPrincipal = role?.role === "principal" && status === "approved";
    const isApprovedStaff = status === "approved" && (role?.role === "teacher" || role?.role === "principal");
    return {
      loading,
      session,
      user: session?.user ?? null,
      role,
      status,
      isPrincipal,
      isApprovedStaff,
      refreshRole,
      signUp,
      signIn,
      signOut,
    };
  }, [loading, session, role, refreshRole, signUp, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
