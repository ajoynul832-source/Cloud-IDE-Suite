import { useEffect, useRef } from "react";
import { AlertTriangle, ExternalLink, Terminal, CheckCircle, Smartphone, Globe, Code } from "lucide-react";

interface BuildLogProps {
  logs?:        string | null;
  status?:      string | null;
  error?:       string | null;
  projectType?: string;
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
  "FLUTTER_DISABLED",
  "CAPACITOR_DISABLED",
  "ANDROID_DISABLED",
];

function isSdkMissingError(text: string): boolean {
  const lower = text.toLowerCase();
  return SDK_MISSING_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

// ─── Build capabilities overview (shown before any build) ─────────────────────

function BuildCapabilities() {
  const capabilities = [
    {
      icon: "💙",
      name: "Flutter",
      badge: "APK",
      badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      desc: "Native Android APK from Dart code",
      requirement: "Flutter SDK on PATH",
      works: false,
    },
    {
      icon: "🤖",
      name: "Android (Kotlin/Java)",
      badge: "APK",
      badgeColor: "text-green-400 bg-green-400/10 border-green-400/20",
      desc: "Native Android APK via Gradle",
      requirement: "Android SDK + Java 17",
      works: false,
    },
    {
      icon: "🌐",
      name: "HTML / JS / TS",
      badge: "APK",
      badgeColor: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      desc: "Wrap web app in native shell via Capacitor",
      requirement: "Capacitor CLI + Android SDK",
      works: false,
    },
    {
      icon: "⚛️",
      name: "React Native",
      badge: "PREVIEW",
      badgeColor: "text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/20",
      desc: "Live phone preview via Expo Snack",
      requirement: "Works now — no SDK needed",
      works: true,
    },
  ];

  return (
    <div className="h-full bg-[#0d1117] font-mono text-xs p-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Terminal size={13} className="text-white/30" />
        <span className="text-white/50 text-[11px]">Build Log</span>
        <span className="text-white/20 text-[10px]">— no build started yet</span>
      </div>

      {/* React Native works now */}
      <div className="mb-4 p-3 rounded-lg bg-[#4ade80]/8 border border-[#4ade80]/15">
        <div className="flex items-center gap-2 mb-1">
          <Smartphone size={12} className="text-[#4ade80]" />
          <span className="text-[#4ade80] text-[11px] font-semibold">React Native → Works right now</span>
        </div>
        <p className="text-[#4ade80]/50 text-[10px] leading-relaxed">
          Choose a React Native template and click <strong className="text-[#4ade80]/70">Preview</strong> — instant
          phone simulator via Expo Snack. No SDK install, no build queue.
        </p>
      </div>

      {/* All build types */}
      <div className="space-y-2 mb-4">
        <p className="text-[9px] uppercase tracking-widest text-white/25 mb-2">All supported build targets</p>
        {capabilities.map((cap) => (
          <div key={cap.name} className={[
            "flex items-start gap-3 p-2.5 rounded-lg border",
            cap.works
              ? "border-[#4ade80]/15 bg-[#4ade80]/5"
              : "border-white/8 bg-white/[0.02]",
          ].join(" ")}>
            <span className="text-sm shrink-0 mt-0.5">{cap.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white/60 text-[11px] font-medium">{cap.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${cap.badgeColor}`}>
                  {cap.badge}
                </span>
                {cap.works && (
                  <span className="text-[9px] text-[#4ade80]/60 flex items-center gap-1">
                    <CheckCircle size={8} /> Available
                  </span>
                )}
              </div>
              <p className="text-white/30 text-[10px] mt-0.5">{cap.desc}</p>
              <p className="text-white/20 text-[9px] mt-0.5 italic">{cap.requirement}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Self-host call to action */}
      <div className="p-3 rounded-lg bg-amber-500/8 border border-amber-500/15">
        <div className="flex items-center gap-2 mb-1.5">
          <Globe size={11} className="text-amber-400" />
          <span className="text-amber-400 text-[11px] font-semibold">Want Flutter/Android/Capacitor builds?</span>
        </div>
        <p className="text-amber-300/50 text-[10px] leading-relaxed mb-2">
          Self-host CloudIDE using <code className="text-amber-300/70">Dockerfile.sdk</code> — it pre-installs all
          SDKs and enables APK builds for every language.
        </p>
        <div className="bg-[#1c2128] rounded p-2 text-[10px] space-y-0.5">
          <p className="text-white/30"># Clone + self-host with all SDKs</p>
          <p className="text-[#4ade80]/70">docker compose up -d   # uses Dockerfile.sdk</p>
          <p className="text-white/20 mt-1">See DEPLOY.md for full instructions</p>
        </div>
      </div>
    </div>
  );
}

// ─── SDK missing error banner ─────────────────────────────────────────────────

function SdkMissingView({ error, type }: { error?: string | null; type?: string }) {
  const isCapacitor = type === "capacitor" || error?.includes("Capacitor");
  const isFlutter   = type === "flutter"   || (!isCapacitor && (error?.includes("flutter") || error?.includes("Flutter")));

  return (
    <div className="h-full bg-[#0d1117] font-mono text-xs p-4 flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
        <AlertTriangle size={14} className="text-orange-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-orange-300 font-semibold text-[11px]">
            {isCapacitor ? "Capacitor SDK Not Available" : "Build SDK Not Available"}
          </p>
          <p className="text-orange-300/70 text-[10px] leading-relaxed">
            {isCapacitor
              ? "Capacitor + Android SDK is not installed on this server. HTML/JS/TS → APK builds require self-hosting."
              : "Flutter SDK is not installed in this environment. APK builds require self-hosting with the SDK image."}
          </p>
        </div>
      </div>

      {/* Quick fix */}
      <div className="space-y-2">
        <p className="text-white/50 text-[11px] font-semibold flex items-center gap-2">
          <Code size={11} />
          To enable {isCapacitor ? "HTML/JS → APK" : isFlutter ? "Flutter APK" : "APK"} builds:
        </p>
        <div className="bg-[#1c2128] rounded p-3 space-y-1 text-[10px]">
          <p className="text-white/30"># Step 1: Clone CloudIDE</p>
          <p className="text-[#4ade80]">git clone https://github.com/your-org/cloudide && cd cloudide</p>
          <p className="text-white/30 mt-1"># Step 2: Set up environment</p>
          <p className="text-[#4ade80]">cp .env.example .env  # fill in JWT_SECRET + DB password</p>
          <p className="text-white/30 mt-1"># Step 3: Build image with all SDKs (~25 min first time)</p>
          <p className="text-[#4ade80]">docker compose up -d  # uses Dockerfile.sdk automatically</p>
          <p className="text-white/30 mt-1"># SDK image includes:</p>
          <p className="text-white/20">  Flutter SDK + Android SDK + Capacitor + Java 17</p>
        </div>
      </div>

      {/* Alternative for React Native */}
      <div className="p-3 rounded-lg bg-cyan-500/8 border border-cyan-500/20 text-[10px]">
        <p className="text-cyan-400 font-semibold mb-1 flex items-center gap-1.5">
          <Smartphone size={10} />
          React Native works right now — no build needed
        </p>
        <p className="text-cyan-300/60 leading-relaxed">
          Switch to a React Native template → click Preview → instant phone simulator via Expo Snack.
          No SDK, no queue, no waiting.
        </p>
      </div>

      {isFlutter && (
        <a
          href="https://docs.flutter.dev/get-started/install"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
        >
          <ExternalLink size={10} />
          Flutter installation docs
        </a>
      )}
      {isCapacitor && (
        <a
          href="https://capacitorjs.com/docs/getting-started/environment-setup"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[10px] text-white/30 hover:text-white/60 transition-colors"
        >
          <ExternalLink size={10} />
          Capacitor environment setup docs
        </a>
      )}
    </div>
  );
}

// ─── Main BuildLog component ──────────────────────────────────────────────────

export function BuildLog({ logs, status, error, projectType }: BuildLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const showSdkHelp = error
    ? isSdkMissingError(error)
    : logs
      ? isSdkMissingError(logs)
      : false;

  // No build started yet → show capabilities overview
  if (!logs && !error) {
    return <BuildCapabilities />;
  }

  // SDK missing → show self-hosting instructions
  if (showSdkHelp || (error && !logs)) {
    return <SdkMissingView error={error} type={projectType} />;
  }

  // Active / completed build log
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
          {status === "active"  ? "Building…" :
           status === "success" ? "Build complete — APK ready" :
           status === "failed"  ? "Build failed" : status}
          {projectType && projectType !== "web" && (
            <span className="ml-1 text-white/30">
              ({projectType === "capacitor" ? "HTML/JS → APK" : projectType})
            </span>
          )}
        </div>
      )}

      {status === "success" && (
        <div className="mb-3 flex items-center gap-2 p-2.5 rounded bg-[#4ade80]/8 border border-[#4ade80]/15">
          <CheckCircle size={12} className="text-[#4ade80]" />
          <span className="text-[#4ade80] text-[11px]">
            APK built successfully — click <strong>Download APK</strong> in the toolbar to get your app
          </span>
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
