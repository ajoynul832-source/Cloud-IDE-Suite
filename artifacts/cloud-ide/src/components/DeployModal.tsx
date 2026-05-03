import { useState, useCallback } from "react";
import { Globe, X, Loader2, Check, Copy, ExternalLink, AlertCircle, Rocket } from "lucide-react";

interface DeployModalProps {
  projectId: string | null;
  projectName: string;
  files: Record<string, string>;
  onClose: () => void;
}

interface DeployResult {
  url: string;
  deployId: string;
  expiresAt: string;
}

export function DeployModal({ projectId, projectName, files, onClose }: DeployModalProps) {
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<DeployResult | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);

  const hasHtml = Object.keys(files).some((f) => f.endsWith(".html") || f.endsWith(".htm"));

  const deploy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, projectName, files }),
      });
      const data = await res.json() as { deploy?: DeployResult; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult(data.deploy!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy failed");
    } finally {
      setLoading(false);
    }
  }, [projectId, projectName, files]);

  const copyUrl = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#4ade80]/15 flex items-center justify-center">
              <Rocket size={14} className="text-[#4ade80]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white/90">Deploy Preview</h3>
              <p className="text-[10px] text-white/35 font-mono">Get a shareable link for your project</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/8 text-white/30 hover:text-white/70">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {!result ? (
            <>
              <div className="bg-[#0d1117] rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-white/70 font-mono">{projectName}</h4>
                <div className="space-y-1">
                  {Object.keys(files).slice(0, 4).map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[10px] font-mono text-white/40">
                      <Globe size={8} className="text-white/20 shrink-0" />
                      {f}
                    </div>
                  ))}
                  {Object.keys(files).length > 4 && (
                    <p className="text-[10px] text-white/25 font-mono">+{Object.keys(files).length - 4} more files</p>
                  )}
                </div>
              </div>

              {!hasHtml && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/8 border border-amber-500/15 rounded-lg">
                  <AlertCircle size={12} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-amber-300/70 leading-relaxed">
                    No HTML file found. Preview works best for web projects (HTML/CSS/JS).
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/8 border border-red-500/15 rounded-lg">
                  <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-red-400/80 leading-relaxed">{error}</p>
                </div>
              )}

              <button
                onClick={deploy}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#4ade80] text-black font-semibold text-sm hover:bg-[#4ade80]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                {loading ? "Deploying…" : "Deploy Preview"}
              </button>

              <p className="text-[10px] text-white/25 text-center font-mono">
                Preview links are temporary (7 days). Sign in for permanent deploys.
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#4ade80]/15 mx-auto">
                <Check size={22} className="text-[#4ade80]" />
              </div>
              <div className="text-center">
                <h4 className="text-sm font-semibold text-white/90 mb-1">Deployed!</h4>
                <p className="text-[10px] text-white/40 font-mono">Your project is live at:</p>
              </div>
              <div className="flex items-center gap-2 bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2.5">
                <span className="flex-1 text-[11px] font-mono text-[#4ade80]/80 truncate">{result.url}</span>
                <button onClick={copyUrl} className="shrink-0 text-white/30 hover:text-white/70 transition-colors">
                  {copied ? <Check size={12} className="text-[#4ade80]" /> : <Copy size={12} />}
                </button>
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-white/30 hover:text-white/70 transition-colors">
                  <ExternalLink size={12} />
                </a>
              </div>
              <p className="text-[10px] text-white/25 text-center font-mono">
                Expires {new Date(result.expiresAt).toLocaleDateString()}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={copyUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/15 text-white/60 hover:border-white/30 hover:text-white/80 transition-colors text-xs font-mono"
                >
                  {copied ? <Check size={12} className="text-[#4ade80]" /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#4ade80]/15 border border-[#4ade80]/25 text-[#4ade80]/80 hover:bg-[#4ade80]/25 transition-colors text-xs font-mono"
                >
                  <ExternalLink size={12} />
                  Open Preview
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
