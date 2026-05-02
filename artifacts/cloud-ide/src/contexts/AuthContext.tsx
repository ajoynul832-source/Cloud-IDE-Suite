import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from "react";

export interface AuthUser {
  userId:        string;
  email:         string;
  oauthProvider: string | null;
}

interface AuthContextValue {
  user:      AuthUser | null;
  isLoading: boolean;
  login:     (email: string, password: string) => Promise<{ error?: string }>;
  register:  (email: string, password: string) => Promise<{ error?: string }>;
  logout:    () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check if session cookie is still valid
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user?: AuthUser } | null) => {
        if (d?.user) setUser(d.user);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res  = await fetch("/api/auth/login", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ email, password }),
    });
    const data = await res.json() as { user?: AuthUser; error?: string };
    if (!res.ok) return { error: data.error ?? "Login failed" };
    if (data.user) setUser(data.user);
    return {};
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res  = await fetch("/api/auth/register", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ email, password }),
    });
    const data = await res.json() as { user?: AuthUser; error?: string };
    if (!res.ok) return { error: data.error ?? "Registration failed" };
    if (data.user) setUser(data.user);
    return {};
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
