import { useState } from "react";
import { Box, Loader2, AlertCircle, Lock, Mail } from "lucide-react";
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

        {/* OAuth divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[10px] font-mono text-white/25 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* GitHub sign-in */}
        <a
          href="/api/auth/github"
          className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-lg border border-white/10 bg-[#161b22] hover:bg-white/5 hover:border-white/20 transition-all text-sm text-white/70 font-mono font-semibold"
        >
          <GithubIcon />
          Continue with GitHub
        </a>

        {/* Footer note */}
        <p className="text-center font-mono text-[10px] text-white/25 mt-5 leading-relaxed">
          Projects and saved files are private to your account.<br />
          No email verification required.
        </p>
      </div>
    </div>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white/60">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
