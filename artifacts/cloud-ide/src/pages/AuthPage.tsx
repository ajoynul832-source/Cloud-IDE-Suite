import { useState } from "react";
import { Box, Loader2, AlertCircle, Lock, Mail } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center bg-[#0d1117] min-h-screen px-4">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#4ade80]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#4ade80]/15 border border-[#4ade80]/30 flex items-center justify-center">
            <Box className="text-[#4ade80]" size={17} />
          </div>
          <span className="font-mono font-bold text-white text-lg tracking-widest uppercase">
            CloudIDE
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#161b22] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {/* Tab switcher */}
          <div className="grid grid-cols-2 border-b border-white/8">
            {(["login", "register"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={[
                  "py-3 font-mono text-xs font-semibold tracking-widest uppercase transition-colors",
                  mode === m
                    ? "text-[#4ade80] border-b-2 border-[#4ade80]"
                    : "text-white/40 hover:text-white/70",
                ].join(" ")}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-mono text-white/40 mb-1.5 uppercase tracking-widest">
                  Email
                </label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4ade80]/60 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-mono text-white/40 mb-1.5 uppercase tracking-widest">
                  {mode === "register" ? "Password (min. 8 chars)" : "Password"}
                </label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    className="w-full bg-[#0d1117] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#4ade80]/60 transition-colors"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className={[
                  "w-full h-10 rounded-lg font-mono text-sm font-bold transition-all",
                  loading || !email.trim() || !password
                    ? "bg-white/8 text-white/30 cursor-not-allowed"
                    : "bg-[#4ade80] text-black hover:bg-[#4ade80]/90 shadow-[0_0_20px_rgba(74,222,128,0.3)]",
                ].join(" ")}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    {mode === "login" ? "Signing in…" : "Creating account…"}
                  </span>
                ) : (
                  mode === "login" ? "Sign In →" : "Create Account →"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center font-mono text-[10px] text-white/25 mt-5 leading-relaxed">
          Projects and saved files are private to your account.<br />
          No email verification required.
        </p>
      </div>
    </div>
  );
}
