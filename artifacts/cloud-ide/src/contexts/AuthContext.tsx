import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from "react";
import { LogIn, X } from "lucide-react";

export interface AuthUser {
  userId:        string;
  email:         string;
  oauthProvider: string | null;
}

interface AuthContextValue {
  user:                 AuthUser | null;
  isLoading:            boolean;
  sessionExpired:       boolean;
  dismissSessionExpiry: () => void;
  login:    (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, password: string) => Promise<{ error?: string }>;
  logout:   () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Dispatched by any hook that receives a 401 while a user session is active */
export const SESSION_EXPIRED_EVENT = "cloud-ide:session-expired";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,           setUser]           = useState<AuthUser | null>(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

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

  // Listen for session-expired events dispatched by API hooks
  useEffect(() => {
    const handler = () => {
      setUser((prev) => {
        if (prev !== null) setSessionExpired(true);
        return null;
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, []);

  const dismissSessionExpiry = useCallback(() => setSessionExpired(false), []);

  const login = useCallback(async (email: string, password: string) => {
    const res  = await fetch("/api/auth/login", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ email, password }),
    });
    const data = await res.json() as { user?: AuthUser; error?: string };
    if (!res.ok) return { error: data.error ?? "Login failed" };
    if (data.user) {
      setUser(data.user);
      setSessionExpired(false);
    }
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
    if (data.user) {
      setUser(data.user);
      setSessionExpired(false);
    }
    return {};
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setSessionExpired(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, sessionExpired, dismissSessionExpiry, login, register, logout }}>
      {children}

      {/* Session-expired banner — shown when a previously valid cookie has expired mid-session */}
      {sessionExpired && (
        <div
          role="alert"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3
                     bg-card border border-destructive/60 shadow-xl rounded-lg px-4 py-3
                     font-mono text-xs text-foreground max-w-sm w-full"
        >
          <LogIn size={14} className="text-destructive shrink-0" />
          <span className="flex-1">
            Session expired —{" "}
            <button
              onClick={dismissSessionExpiry}
              className="text-primary underline underline-offset-2 hover:no-underline"
            >
              sign in again
            </button>{" "}
            to save your work.
          </span>
          <button
            onClick={dismissSessionExpiry}
            className="text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
