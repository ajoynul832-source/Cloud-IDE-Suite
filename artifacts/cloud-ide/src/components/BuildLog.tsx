import { useEffect, useRef } from "react";
import { AlertTriangle, ExternalLink, Terminal } from "lucide-react";

interface BuildLogProps {
  logs?:   string | null;
  status?: string | null;
  error?:  string | null;
}

const SDK_MISSING_PATTERNS = [
  "flutter: not found",
  "flutter sdk not available",
  "flutter: command not found",
  "ENOENT",
  "503",
  "not available",
  "sdk not installed",
  "build pipeline unavailable",
];

function isSdkMissingError(text: string): boolean {
  const lower = text.toLowerCase();
  return SDK_MISSING_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

export function BuildLog({ logs, status, error }: BuildLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const showSdkHelp = error ? isSdkMissingError(error) : logs ? isSdkMissingError(logs) : false;

  if (!logs && !error) {
    return (
      <div className="h-full bg-[#0d1117] font-mono text-xs p-4 flex flex-col gap-3 text-white/40">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-white/30" />
          <span>No build started yet.</span>
        </div>
        <p className="text-[10px] text-white/25">
          Click <span className="text-white/50 font-semibold">Build APK</span> in the toolbar to compile your Flutter
          or Android project.
        </p>
        <div className="mt-2 space-y-1 text-[10px] text-white/20">
          <p>Supported build targets:</p>
          <p className="pl-2">• Flutter → APK (requires Flutter SDK)</p>
          <p className="pl-2">• Android (Kotlin/Java) → APK (requires Android SDK + Java 17)</p>
          <p className="pl-2">• React Native → Expo Snack preview (no build needed)</p>
        </div>
      </div>
    );
  }

  if (showSdkHelp || (error && !logs)) {
    return (
      <div className="h-full bg-[#0d1117] font-mono text-xs p-4 flex flex-col gap-4">
        {/* Error banner */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-orange-300 font-semibold text-[11px]">Build SDK Not Available</p>
            <p className="text-orange-300/70 text-[10px] leading-relaxed">
              Flutter SDK is not installed in this environment. The build pipeline requires the Flutter SDK on PATH.
            </p>
          </div>
        </div>

        {/* How to enable */}
        <div className="space-y-2">
          <p className="text-white/50 text-[11px] font-semibold">To enable Flutter builds:</p>
          <div className="bg-[#1c2128] rounded p-3 space-y-1 text-[10px]">
            <p className="text-white/40"># Install Flutter SDK</p>
            <p className="text-[#4ade80]">git clone https://github.com/flutter/flutter.git -b stable ~/flutter</p>
            <p className="text-[#4ade80]">export PATH="$PATH:$HOME/flutter/bin"</p>
            <p className="text-white/40 mt-1"># Verify</p>
            <p className="text-[#4ade80]">flutter doctor</p>
          </div>
        </div>

        {/* React Native alternative */}
        <div className="p-3 rounded-lg bg-cyan-500/8 border border-cyan-500/20 text-[10px]">
          <p className="text-cyan-400 font-semibold mb-1">React Native works now!</p>
          <p className="text-cyan-300/60 leading-relaxed">
            Use a React Native template — it generates an Expo Snack link instantly in the Preview tab, no build needed.
          </p>
        </div>

        {/* Docs link */}
        <a
          href="https://docs.flutter.dev/get-started/install"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
        >
          <ExternalLink size={10} />
          Flutter installation docs
        </a>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0d1117] font-mono text-xs overflow-y-auto p-4" ref={containerRef}>
      {status && (
        <div className={[
          "mb-3 px-2 py-1 rounded text-[10px] inline-flex items-center gap-1.5",
          status === "success" ? "bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20" :
          status === "failed"  ? "bg-red-500/10 text-red-400 border border-red-500/20" :
          status === "active"  ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                                 "bg-white/5 text-white/40 border border-white/10",
        ].join(" ")}>
          <span className={[
            "w-1.5 h-1.5 rounded-full",
            status === "success" ? "bg-[#4ade80]" :
            status === "failed"  ? "bg-red-400" :
            status === "active"  ? "bg-yellow-400 animate-pulse" :
                                   "bg-white/30",
          ].join(" ")} />
          {status === "active" ? "Building…" : status === "success" ? "Build complete" : status === "failed" ? "Build failed" : status}
        </div>
      )}
      {logs ? (
        <pre className="text-white/70 whitespace-pre-wrap leading-relaxed">{logs}</pre>
      ) : (
        <span className="text-white/30 italic">Waiting for build output…</span>
      )}
    </div>
  );
}
