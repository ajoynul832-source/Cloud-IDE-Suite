import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { RefreshCw, ExternalLink, Smartphone, Monitor, Apple, QrCode, Loader2, Globe } from "lucide-react";
import type { SnackPlatform, SnackSyncData } from "@/hooks/useSnackSync";
import { generateReactNativeWebPreview } from "@/lib/preview-generators";

interface MobilePreviewProps {
  snackData:   SnackSyncData | null;
  embedUrl:    string | null;
  isSyncing:   boolean;
  syncError:   string | null;
  platform:    SnackPlatform;
  setPlatform: (p: SnackPlatform) => void;
  syncNow:     () => void;
  files?:      Record<string, string>;
}

const PLATFORMS: { id: SnackPlatform; label: string; icon: ReactNode }[] = [
  { id: "web",     label: "Web (Live)",  icon: <Monitor    size={11} /> },
  { id: "android", label: "Android",     icon: <Smartphone size={11} /> },
  { id: "ios",     label: "iOS",         icon: <Apple      size={11} /> },
];

export function MobilePreview({
  snackData, embedUrl, isSyncing, syncError, platform, setPlatform, syncNow,
  files,
}: MobilePreviewProps) {

  // ── React Native Web blob URL (Web tab) ───────────────────────────────────
  const [rnwBlobUrl,   setRnwBlobUrl]   = useState<string | null>(null);
  const [rnwPending,   setRnwPending]   = useState(false);
  const [iframeReady,  setIframeReady]  = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blobUrlRef  = useRef<string | null>(null);

  // Regenerate the RNW preview whenever files change (debounced 2 s)
  useEffect(() => {
    if (!files || Object.keys(files).length === 0) return;

    setRnwPending(true);
    setIframeReady(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const html = generateReactNativeWebPreview(files);
      const blob = new Blob([html], { type: "text/html" });
      const url  = URL.createObjectURL(blob);

      // Revoke old blob URL to avoid memory leaks
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = url;

      setRnwBlobUrl(url);
      setRnwPending(false);
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // Only re-run when files change; use JSON comparison for deep equality
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(files)]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const hasFiles = files && Object.keys(files).length > 0;

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">

      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/8 bg-[#161b22]">
        <div className="flex items-center gap-0.5 bg-white/5 rounded-md p-0.5">
          {PLATFORMS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setPlatform(id); setIframeReady(false); }}
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
          {/* Web tab status */}
          {platform === "web" && (
            rnwPending ? (
              <span className="text-[10px] font-mono text-yellow-400/60 flex items-center gap-1">
                <RefreshCw size={9} className="animate-spin" /> Compiling…
              </span>
            ) : rnwBlobUrl ? (
              <span className="text-[10px] font-mono text-[#4ade80]/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse inline-block" />
                Live · RNW
              </span>
            ) : (
              <span className="text-[10px] font-mono text-white/25">Waiting…</span>
            )
          )}

          {/* Android / iOS status (Expo Snack sync) */}
          {platform !== "web" && (
            syncError ? (
              <span className="text-[10px] font-mono text-red-400/70 truncate max-w-[140px]" title={syncError}>
                ✕ Sync failed
              </span>
            ) : isSyncing ? (
              <span className="text-[10px] font-mono text-yellow-400/60 flex items-center gap-1">
                <RefreshCw size={9} className="animate-spin" /> Syncing…
              </span>
            ) : snackData ? (
              <span className="text-[10px] font-mono text-[#4ade80]/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse inline-block" />
                Ready
              </span>
            ) : (
              <span className="text-[10px] font-mono text-white/25">Waiting for sync…</span>
            )
          )}

          {/* Refresh / force sync */}
          <button
            onClick={() => {
              if (platform === "web") {
                // Force-regenerate RNW preview immediately
                if (files && Object.keys(files).length > 0) {
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  setRnwPending(true);
                  setIframeReady(false);
                  const html = generateReactNativeWebPreview(files);
                  const blob = new Blob([html], { type: "text/html" });
                  const url  = URL.createObjectURL(blob);
                  if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
                  blobUrlRef.current = url;
                  setRnwBlobUrl(url);
                  setRnwPending(false);
                }
              } else {
                setIframeReady(false);
                syncNow();
              }
            }}
            title={platform === "web" ? "Reload preview" : "Force sync to Expo"}
            className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={11} className={isSyncing ? "animate-spin" : ""} />
          </button>

          {snackData?.snackUrl && platform !== "web" && (
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

        {/* WEB tab — React Native Web in-browser runner */}
        {platform === "web" && (
          <>
            {hasFiles && rnwBlobUrl ? (
              <>
                {/* Loading overlay */}
                {(!iframeReady || rnwPending) && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#080b0f]">
                    <Loader2 size={20} className="text-[#4ade80]/50 animate-spin" />
                    <p className="text-xs font-mono text-white/40">
                      {rnwPending ? "Compiling React Native app…" : "Loading React Native Web…"}
                    </p>
                    <p className="text-[10px] font-mono text-white/20">
                      {rnwPending ? "Updates auto-apply 2 s after last edit" : "First load fetches CDN libraries"}
                    </p>
                  </div>
                )}
                <iframe
                  key={rnwBlobUrl}
                  src={rnwBlobUrl}
                  onLoad={() => setIframeReady(true)}
                  className="w-full h-full border-0"
                  allow="geolocation; camera; microphone; accelerometer; gyroscope"
                  title="React Native Web Preview"
                />
              </>
            ) : rnwPending ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <Loader2 size={20} className="text-[#4ade80]/50 animate-spin" />
                <p className="text-xs font-mono text-white/40">Compiling…</p>
              </div>
            ) : (
              <WebEmptyState />
            )}
          </>
        )}

        {/* ANDROID / iOS tabs — Expo Go QR code + instructions */}
        {platform !== "web" && (
          snackData ? (
            <DeviceInstructions platform={platform} snackData={snackData} />
          ) : (
            <DeviceEmptyState isSyncing={isSyncing} syncError={syncError} platform={platform} />
          )
        )}
      </div>

      {/* Bottom hint */}
      {platform === "web" && rnwBlobUrl && (
        <div className="shrink-0 px-3 py-1.5 border-t border-white/8 bg-[#161b22] flex items-center gap-2">
          <Globe size={9} className="text-[#4ade80]/40 shrink-0" />
          <p className="text-[10px] font-mono text-white/25 flex-1">
            Running via React Native Web — no Expo needed · auto-updates 2 s after last edit
          </p>
        </div>
      )}
      {platform !== "web" && snackData && (
        <div className="shrink-0 px-3 py-1.5 border-t border-white/8 bg-[#161b22] flex items-center gap-2">
          <p className="text-[10px] font-mono text-white/25 flex-1">
            Powered by Expo Snack · scan QR with Expo Go app
          </p>
          <a
            href={snackData.snackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-[#4ade80]/50 hover:text-[#4ade80] flex items-center gap-1 transition-colors"
          >
            <ExternalLink size={9} /> Snack
          </a>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function WebEmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center p-8">
      <div className="w-16 h-28 rounded-[10px] border-2 border-[#4ade80]/20 flex items-center justify-center bg-[#4ade80]/5">
        <Monitor size={22} className="text-[#4ade80]/30" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-mono text-white/50">React Native Web Preview</p>
        <p className="text-[10px] font-mono text-white/25 leading-relaxed max-w-[220px]">
          Edit any file — the preview compiles automatically 2 seconds after your last change.
        </p>
      </div>
      <div className="text-[10px] font-mono text-white/20 text-left space-y-1 bg-white/3 rounded-lg px-4 py-3 max-w-[220px] w-full">
        <p className="text-white/35 mb-1.5 font-semibold">Supported:</p>
        <p>✓ View, Text, StyleSheet</p>
        <p>✓ TouchableOpacity, Pressable</p>
        <p>✓ ScrollView, FlatList</p>
        <p>✓ useState, useEffect hooks</p>
        <p>✓ Animated, Dimensions</p>
      </div>
    </div>
  );
}

function DeviceEmptyState({
  isSyncing, syncError, platform,
}: {
  isSyncing: boolean;
  syncError: string | null;
  platform: SnackPlatform;
}) {
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
          <p className="text-xs font-mono text-[#4ade80]/60">Uploading to Expo Snack…</p>
          <p className="text-[10px] font-mono text-white/30">QR code will appear shortly.</p>
        </>
      ) : (
        <>
          <p className="text-sm font-mono text-white/40">
            {platform === "android" ? "Android" : "iOS"} Preview
          </p>
          <p className="text-[10px] font-mono text-white/25 leading-relaxed max-w-[220px]">
            The QR code will appear once your code syncs to Expo Snack (takes ~5 s).
          </p>
        </>
      )}
    </div>
  );
}
