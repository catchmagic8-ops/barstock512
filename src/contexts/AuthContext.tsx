import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sendPush } from "@/lib/pushNotifications";
import { setReadOnly } from "@/lib/readOnly";

export type AppRole = "admin" | "staff" | "viewer";
export type AppDepartment = "all" | "bar512" | "konferencje" | "polskie_smaki";

export interface AuthUser {
  id: string;
  username: string;
  role: AppRole;
  department: AppDepartment;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  isGlobalAdmin: boolean;
  isViewer: boolean;
  isAdminFor: (dept: Exclude<AppDepartment, "all">) => boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
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
        if (parsed?.id && parsed?.username && parsed?.role) {
          // Backward compat: older sessions had no department field.
          if (!parsed.department) parsed.department = "all";
          setUser(parsed);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (username, password) => {
    if (!username.trim() || !password) return { ok: false, error: "Podaj nazwę użytkownika i hasło" };
    const { data, error } = await (supabase as any).rpc("verify_user_login", {
      _username: username.trim(),
      _password: password,
    });
    if (error) {
      const msg = /pending approval/i.test(error.message ?? "")
        ? "Konto oczekuje na zatwierdzenie przez administratora"
        : error.message ?? "Logowanie nie udało się";
      return { ok: false, error: msg };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { ok: false, error: "Nieprawidłowa nazwa użytkownika lub hasło" };
    const u: AuthUser = {
      id: row.id,
      username: row.username,
      role: row.role,
      department: (row.department as AppDepartment) ?? "all",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
    return { ok: true };
  }, []);

  const register = useCallback<AuthContextValue["register"]>(async (username, password) => {
    const name = username.trim();
    if (name.length < 2) return { ok: false, error: "Nazwa użytkownika jest za krótka" };
    if (password.length < 4) return { ok: false, error: "Hasło musi mieć min. 4 znaki" };
    const { error } = await (supabase as any).rpc("self_register_user", {
      _username: name,
      _password: password,
    });
    if (error) {
      const msg = /already taken/i.test(error.message ?? "")
        ? "Ta nazwa użytkownika jest już zajęta"
        : error.message ?? "Rejestracja nie udała się";
      return { ok: false, error: msg };
    }
    // Account is created as pending — an admin must approve it before sign in.
    void sendPush("user_pending", {
      title: "Nowe konto do zatwierdzenia",
      body: `${name} czeka na akceptację w panelu administratora.`,
      path: "/bar512/admin",
    });
    return { ok: true };
  }, []);




  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    // Clean legacy session keys from old PasswordGate
    sessionStorage.removeItem("bar-unlocked");
    sessionStorage.removeItem("options-unlocked");
    setUser(null);
  }, []);

  // Viewer = demo/spectator account: full read access, no writes anywhere.
  const isViewer = user?.role === "viewer";
  useEffect(() => {
    setReadOnly(isViewer);
  }, [isViewer]);

  const value = useMemo<AuthContextValue>(() => {
    const isGlobalAdmin = user?.role === "admin" && user?.department === "all";
    const isAdminFor = (dept: Exclude<AppDepartment, "all">) =>
      user?.role === "admin" && (user.department === "all" || user.department === dept);
    return {
      user,
      // `isAdmin` here means "global admin" — used for User Management gates.
      isAdmin: isGlobalAdmin,
      isGlobalAdmin,
      isViewer: user?.role === "viewer",
      isAdminFor,
      loading,
      login,
      register,
      logout,

    };
  }, [user, loading, login, register, logout]);

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