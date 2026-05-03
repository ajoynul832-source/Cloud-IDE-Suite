import { RefreshCw, ExternalLink, Smartphone, Monitor, Apple } from "lucide-react";
import type { SnackPlatform, SnackSyncData } from "@/hooks/useSnackSync";

interface MobilePreviewProps {
  snackData:   SnackSyncData | null;
  embedUrl:    string | null;
  isSyncing:   boolean;
  syncError:   string | null;
  platform:    SnackPlatform;
  setPlatform: (p: SnackPlatform) => void;
  syncNow:     () => void;
}

const PLATFORMS: { id: SnackPlatform; label: string; icon: React.ReactNode }[] = [
  { id: "android", label: "Android", icon: <Smartphone size={11} /> },
  { id: "ios",     label: "iOS",     icon: <Apple      size={11} /> },
  { id: "web",     label: "Web",     icon: <Monitor    size={11} /> },
];

export function MobilePreview({
  snackData, embedUrl, isSyncing, syncError, platform, setPlatform, syncNow,
}: MobilePreviewProps) {
  return (
    <div className="h-full flex flex-col bg-[#0d1117]">

      {/* Top bar — platform switcher + sync status */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/8 bg-[#161b22]">
        <div className="flex items-center gap-0.5 bg-white/5 rounded-md p-0.5">
          {PLATFORMS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setPlatform(id)}
              className={[
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all",
                platform === id
                  ? "bg-[#4ade80]/15 text-[#4ade80] shadow"
                  : "text-white/35 hover:text-white/60",
              ].join(" ")}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {syncError ? (
            <span className="text-[10px] font-mono text-red-400/70 truncate max-w-[140px]" title={syncError}>
              ✕ {syncError}
            </span>
          ) : isSyncing ? (
            <span className="text-[10px] font-mono text-yellow-400/60 flex items-center gap-1">
              <RefreshCw size={9} className="animate-spin" /> Syncing…
            </span>
          ) : snackData ? (
            <span className="text-[10px] font-mono text-[#4ade80]/60 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse inline-block" />
              Live
            </span>
          ) : (
            <span className="text-[10px] font-mono text-white/25">Waiting for sync…</span>
          )}

          <button
            onClick={syncNow}
            title="Force sync now"
            className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Phone frame area */}
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-[#080b0f] relative">
        {snackData && embedUrl ? (
          <PhoneFrame isSyncing={isSyncing}>
            <iframe
              key={embedUrl}
              src={embedUrl}
              className="w-full h-full border-0"
              allow="geolocation; camera; microphone; accelerometer; gyroscope"
              title="Expo Snack Preview"
            />
          </PhoneFrame>
        ) : (
          <EmptyState isSyncing={isSyncing} syncError={syncError} />
        )}
      </div>

      {/* Footer — QR code + links */}
      {snackData && (
        <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-t border-white/8 bg-[#161b22]">
          <img
            src={snackData.qrUrl}
            alt="QR Code"
            className="w-11 h-11 rounded bg-white p-0.5 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-white/40 leading-relaxed">
              Scan with <span className="text-white/60">Expo Go</span> to test on your real device
            </p>
            <a
              href={snackData.snackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-[#4ade80]/60 hover:text-[#4ade80] flex items-center gap-1 transition-colors"
            >
              <ExternalLink size={9} />
              Open in Expo Snack
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function PhoneFrame({
  children,
  isSyncing,
}: {
  children: React.ReactNode;
  isSyncing: boolean;
}) {
  return (
    <div className="relative select-none" style={{ width: 260, height: 520 }}>
      {/* Phone body */}
      <div
        className="absolute inset-0 rounded-[38px] bg-[#1c1c1e]"
        style={{
          boxShadow: "0 0 0 2px #3a3a3c, 0 0 0 3px #111, 0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        {/* Volume buttons (left) */}
        <div className="absolute left-[-3px] top-[88px]  w-[3px] h-8  bg-[#2c2c2e] rounded-l-[2px]" />
        <div className="absolute left-[-3px] top-[136px] w-[3px] h-12 bg-[#2c2c2e] rounded-l-[2px]" />
        <div className="absolute left-[-3px] top-[204px] w-[3px] h-12 bg-[#2c2c2e] rounded-l-[2px]" />

        {/* Power button (right) */}
        <div className="absolute right-[-3px] top-[148px] w-[3px] h-16 bg-[#2c2c2e] rounded-r-[2px]" />

        {/* Front camera */}
        <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#2c2c2e] rounded-full border border-[#111] z-10" />

        {/* Screen */}
        <div
          className="absolute rounded-[26px] overflow-hidden bg-black"
          style={{ inset: "13px 10px" }}
        >
          {children}

          {/* Syncing overlay */}
          {isSyncing && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-20 transition-opacity">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw size={18} className="text-[#4ade80]/70 animate-spin" />
                <span className="text-[10px] font-mono text-white/50">Updating preview…</span>
              </div>
            </div>
          )}
        </div>

        {/* Home indicator bar */}
        <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-20 h-[3px] bg-white/20 rounded-full" />
      </div>
    </div>
  );
}

function EmptyState({ isSyncing, syncError }: { isSyncing: boolean; syncError: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center p-8 max-w-xs">
      {/* Faint phone outline */}
      <div className="w-16 h-28 rounded-[10px] border-2 border-white/10 flex items-center justify-center">
        <Smartphone size={24} className="text-white/15" />
      </div>

      {syncError ? (
        <>
          <p className="text-xs font-mono text-red-400/70">Expo Snack sync failed</p>
          <p className="text-[10px] font-mono text-white/30 break-all">{syncError}</p>
          <p className="text-[10px] font-mono text-white/20">Check your internet connection and try again.</p>
        </>
      ) : isSyncing ? (
        <>
          <p className="text-xs font-mono text-[#4ade80]/60 animate-pulse">Uploading to Expo Snack…</p>
          <p className="text-[10px] font-mono text-white/30">Your app will appear here in a moment.</p>
        </>
      ) : (
        <>
          <p className="text-sm font-mono text-white/40">React Native Preview</p>
          <p className="text-[10px] font-mono text-white/25 leading-relaxed">
            Edit any file to sync your app to<br />
            Expo's cloud and see it here live.
          </p>
          <div className="mt-1 text-[10px] font-mono text-white/20 text-left space-y-1">
            <p>✓ Web simulator — runs in this panel</p>
            <p>✓ Android / iOS tabs above</p>
            <p>✓ QR code — test on real device</p>
            <p>✓ Auto-syncs as you type</p>
          </div>
        </>
      )}
    </div>
  );
}
