import { useState } from "react";
import { Box, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

type AuthMode = "login" | "register";

interface AuthPageProps {
  onSuccess?: () => void;
}

export default function AuthPage({ onSuccess }: AuthPageProps = {}) {
  const { login, register } = useAuth();
  const [mode,     setMode]     = useState<AuthMode>("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);

    const result = mode === "login"
      ? await login(email.trim(), password)
      : await register(email.trim(), password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      onSuccess?.();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center bg-background rounded-lg px-6 py-8 w-full">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Box className="text-primary" size={22} />
          <span className="font-mono font-bold text-foreground text-lg tracking-widest uppercase">
            CloudIDE
          </span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          <h1 className="font-mono text-sm font-semibold text-foreground mb-5">
            {mode === "login" ? "Sign in to your account" : "Create an account"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">
                Password{mode === "register" && " (min. 8 characters)"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full font-mono text-sm h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? (
                <><Loader2 size={14} className="mr-2 animate-spin" />
                  {mode === "login" ? "Signing in…" : "Creating account…"}
                </>
              ) : (
                mode === "login" ? "Sign in" : "Create account"
              )}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-border text-center">
            <span className="font-mono text-xs text-muted-foreground">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
              className="font-mono text-xs text-primary hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>

        <p className="text-center font-mono text-[10px] text-muted-foreground/50 mt-4">
          Projects are private and tied to your account.
        </p>
      </div>
    </div>
  );
}
