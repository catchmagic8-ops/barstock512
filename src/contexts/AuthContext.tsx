import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "staff";

export interface AuthUser {
  id: string;
  username: string;
  role: AppRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "sheraton-auth-user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed?.id && parsed?.username && parsed?.role) setUser(parsed);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (username, password) => {
    if (!username.trim() || !password) return { ok: false, error: "Enter username and password" };
    const { data, error } = await (supabase as any).rpc("verify_user_login", {
      _username: username.trim(),
      _password: password,
    });
    if (error) return { ok: false, error: error.message ?? "Login failed" };
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { ok: false, error: "Invalid username or password" };
    const u: AuthUser = { id: row.id, username: row.username, role: row.role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    // Clean legacy session keys from old PasswordGate
    sessionStorage.removeItem("bar-unlocked");
    sessionStorage.removeItem("options-unlocked");
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAdmin: user?.role === "admin", loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function useIsAdmin(): boolean {
  return useAuth().isAdmin;
}