import { useState } from "react";
import { RefreshCw, ExternalLink, Smartphone, Monitor, Apple, QrCode, Loader2 } from "lucide-react";
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
  { id: "web",     label: "Web (Live)",  icon: <Monitor    size={11} /> },
  { id: "android", label: "Android",     icon: <Smartphone size={11} /> },
  { id: "ios",     label: "iOS",         icon: <Apple      size={11} /> },
];

export function MobilePreview({
  snackData, embedUrl, isSyncing, syncError, platform, setPlatform, syncNow,
}: MobilePreviewProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Reset loaded state when embed URL changes
  const handleLoad = () => setIframeLoaded(true);

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">

      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/8 bg-[#161b22]">
        <div className="flex items-center gap-0.5 bg-white/5 rounded-md p-0.5">
          {PLATFORMS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setPlatform(id); setIframeLoaded(false); }}
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
            onClick={() => { setIframeLoaded(false); syncNow(); }}
            title="Force sync now"
            className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
          </button>

          {snackData?.snackUrl && (
            <a
              href={snackData.snackUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in Expo Snack"
              className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 overflow-hidden relative bg-[#080b0f]">

        {/* WEB tab — full-size iframe (Expo web runner needs room to render) */}
        {platform === "web" && (
          <>
            {snackData && embedUrl ? (
              <>
                {/* Loading overlay shown while iframe compiles */}
                {!iframeLoaded && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#080b0f]">
                    <Loader2 size={24} className="text-[#4ade80]/50 animate-spin" />
                    <p className="text-xs font-mono text-white/40">Compiling your app…</p>
                    <p className="text-[10px] font-mono text-white/20">This takes 10–20 seconds on first load</p>
                  </div>
                )}
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  onLoad={handleLoad}
                  className="w-full h-full border-0"
                  allow="geolocation; camera; microphone; accelerometer; gyroscope"
                  title="Expo Snack Preview"
                />
              </>
            ) : (
              <EmptyState isSyncing={isSyncing} syncError={syncError} />
            )}
          </>
        )}

        {/* ANDROID / iOS tabs — QR code + instructions */}
        {platform !== "web" && (
          snackData ? (
            <DeviceInstructions platform={platform} snackData={snackData} />
          ) : (
            <EmptyState isSyncing={isSyncing} syncError={syncError} />
          )
        )}
      </div>

      {/* Bottom hint for web tab */}
      {platform === "web" && snackData && (
        <div className="shrink-0 px-3 py-1.5 border-t border-white/8 bg-[#161b22] flex items-center gap-2">
          <p className="text-[10px] font-mono text-white/25 flex-1">
            Running via React Native Web · edits sync after 3s
          </p>
          <a
            href={snackData.snackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-[#4ade80]/50 hover:text-[#4ade80] flex items-center gap-1 transition-colors"
          >
            <ExternalLink size={9} /> Open in Snack
          </a>
        </div>
      )}
    </div>
  );
}

function DeviceInstructions({
  platform,
  snackData,
}: {
  platform: SnackPlatform;
  snackData: SnackSyncData;
}) {
  const label = platform === "android" ? "Android" : "iPhone / iPad";
  const store = platform === "android" ? "Google Play" : "App Store";

  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 p-6 text-center">
      {snackData.qrUrl ? (
        <div className="bg-white rounded-2xl p-3 shadow-lg shadow-black/60">
          <img src={snackData.qrUrl} alt="QR Code" className="w-40 h-40 block" />
        </div>
      ) : (
        <div className="w-40 h-40 rounded-2xl border-2 border-white/10 flex items-center justify-center">
          <QrCode size={56} className="text-white/15" />
        </div>
      )}

      <div className="space-y-3 max-w-[220px]">
        <p className="text-xs font-mono text-white/60 font-semibold">
          Test on your {label}
        </p>
        <div className="text-[10px] font-mono text-white/30 space-y-1.5 text-left">
          <p>1. Install <span className="text-white/55">Expo Go</span> from {store}</p>
          <p>2. Open Expo Go → <span className="text-white/55">Scan QR Code</span></p>
          <p>3. Point camera at the code above</p>
          <p>4. Your app runs live on your device</p>
        </div>
      </div>

      <a
        href={snackData.snackUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-mono text-[#4ade80]/60 hover:text-[#4ade80] flex items-center gap-1.5 transition-colors"
      >
        <ExternalLink size={9} />
        Open in Expo Snack (full editor)
      </a>
    </div>
  );
}

function EmptyState({ isSyncing, syncError }: { isSyncing: boolean; syncError: string | null }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
      <div className="w-16 h-28 rounded-[10px] border-2 border-white/10 flex items-center justify-center">
        <Smartphone size={24} className="text-white/15" />
      </div>

      {syncError ? (
        <>
          <p className="text-xs font-mono text-red-400/70">Sync failed</p>
          <p className="text-[10px] font-mono text-white/30 break-all max-w-xs">{syncError}</p>
        </>
      ) : isSyncing ? (
        <>
          <Loader2 size={18} className="text-[#4ade80]/50 animate-spin" />
          <p className="text-xs font-mono text-[#4ade80]/60">Uploading to Expo…</p>
          <p className="text-[10px] font-mono text-white/30">Your app will appear here shortly.</p>
        </>
      ) : (
        <>
          <p className="text-sm font-mono text-white/40">React Native Preview</p>
          <p className="text-[10px] font-mono text-white/25 leading-relaxed max-w-[220px]">
            Edit any file — the preview syncs automatically after 3 seconds.
          </p>
          <div className="text-[10px] font-mono text-white/20 text-left space-y-1">
            <p>▶ <span className="text-white/35">Web (Live)</span> — runs right here in this panel</p>
            <p>▶ <span className="text-white/35">Android/iOS</span> — scan QR with Expo Go app</p>
          </div>
        </>
      )}
    </div>
  );
}
