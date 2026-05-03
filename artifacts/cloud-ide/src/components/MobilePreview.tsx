import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { RefreshCw, ExternalLink, Globe, Loader2, Smartphone, ChevronDown, ChevronUp } from "lucide-react";
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

export function MobilePreview({
  files,
}: MobilePreviewProps) {

  const [rnwBlobUrl,  setRnwBlobUrl]  = useState<string | null>(null);
  const [rnwPending,  setRnwPending]  = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [showFrame,   setShowFrame]   = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blobUrlRef  = useRef<string | null>(null);

  useEffect(() => {
    if (!files || Object.keys(files).length === 0) return;

    setRnwPending(true);
    setIframeReady(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const html = generateReactNativeWebPreview(files);
      const blob = new Blob([html], { type: "text/html" });
      const url  = URL.createObjectURL(blob);

      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = url;

      setRnwBlobUrl(url);
      setRnwPending(false);
    }, 2000);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(files)]);

  useEffect(() => {
    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, []);

  const forceRefresh = () => {
    if (!files || Object.keys(files).length === 0) return;
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
  };

  const hasFiles = files && Object.keys(files).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col bg-[#0d1117]"
    >

      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-[#161b22]">
        <Globe size={11} className="text-[#4ade80]/60 shrink-0" />
        <span className="text-[10px] font-mono text-white/40 flex-1">Live Preview · React Native Web</span>

        {rnwPending ? (
          <span className="text-[10px] font-mono text-yellow-400/60 flex items-center gap-1">
            <RefreshCw size={9} className="animate-spin" /> Compiling…
          </span>
        ) : rnwBlobUrl ? (
          <span className="text-[10px] font-mono text-[#4ade80]/60 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse inline-block" />
            Live
          </span>
        ) : null}

        <button
          onClick={() => setShowFrame((v) => !v)}
          title={showFrame ? "Hide phone frame" : "Show phone frame"}
          className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <Smartphone size={11} />
        </button>

        <button
          onClick={forceRefresh}
          title="Reload preview"
          className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <RefreshCw size={11} className={rnwPending ? "animate-spin" : ""} />
        </button>

        {rnwBlobUrl && (
          <a
            href={rnwBlobUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden relative bg-[#080b0f] flex items-center justify-center">

        {hasFiles && rnwBlobUrl ? (
          showFrame ? (
            /* Phone frame */
            <div className="relative h-full flex items-center justify-center py-4">
              <div className="relative" style={{ height: "min(100%, 620px)", aspectRatio: "9/19.5" }}>
                {/* Phone shell */}
                <div className="absolute inset-0 rounded-[32px] border-[6px] border-[#2d3748] bg-[#1a202c] shadow-2xl shadow-black/80 pointer-events-none z-10">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#2d3748] rounded-b-xl z-20" />
                  {/* Side buttons */}
                  <div className="absolute -left-[9px] top-20 w-[3px] h-8 bg-[#4a5568] rounded-l-sm" />
                  <div className="absolute -left-[9px] top-32 w-[3px] h-12 bg-[#4a5568] rounded-l-sm" />
                  <div className="absolute -left-[9px] top-48 w-[3px] h-12 bg-[#4a5568] rounded-l-sm" />
                  <div className="absolute -right-[9px] top-24 w-[3px] h-16 bg-[#4a5568] rounded-r-sm" />
                </div>
                {/* Iframe inside the frame */}
                <div className="absolute inset-[6px] rounded-[26px] overflow-hidden z-0">
                  {(!iframeReady || rnwPending) && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0d1117]">
                      <Loader2 size={18} className="text-[#4ade80]/50 animate-spin" />
                      <p className="text-[11px] font-mono text-white/40">
                        {rnwPending ? "Compiling…" : "Loading…"}
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
                </div>
              </div>
            </div>
          ) : (
            /* Fullscreen mode */
            <div className="w-full h-full relative">
              {(!iframeReady || rnwPending) && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#080b0f]">
                  <Loader2 size={20} className="text-[#4ade80]/50 animate-spin" />
                  <p className="text-xs font-mono text-white/40">
                    {rnwPending ? "Compiling React Native app…" : "Loading React Native Web…"}
                  </p>
                </div>
              )}
              <iframe
                key={rnwBlobUrl + "-full"}
                src={rnwBlobUrl}
                onLoad={() => setIframeReady(true)}
                className="w-full h-full border-0"
                allow="geolocation; camera; microphone; accelerometer; gyroscope"
                title="React Native Web Preview"
              />
            </div>
          )
        ) : rnwPending ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 size={20} className="text-[#4ade80]/50 animate-spin" />
            <p className="text-xs font-mono text-white/40">Compiling…</p>
          </div>
        ) : (
          <WebEmptyState />
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 px-3 py-1.5 border-t border-white/8 bg-[#161b22] flex items-center gap-2">
        <Globe size={9} className="text-[#4ade80]/40 shrink-0" />
        <p className="text-[10px] font-mono text-white/25 flex-1">
          Runs in-browser via React Native Web · no installs · auto-updates 2 s after edit
        </p>
        <button
          onClick={() => setShowFrame((v) => !v)}
          className="text-[9px] font-mono text-white/30 hover:text-white/60 transition-colors flex items-center gap-0.5"
        >
          {showFrame ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
          {showFrame ? "Full" : "Frame"}
        </button>
      </div>
    </motion.div>
  );
}

function WebEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
      <div className="w-16 h-28 rounded-[10px] border-2 border-[#4ade80]/20 flex items-center justify-center bg-[#4ade80]/5">
        <Smartphone size={22} className="text-[#4ade80]/30" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-mono text-white/50">React Native Web Preview</p>
        <p className="text-[10px] font-mono text-white/25 leading-relaxed max-w-[220px]">
          Edit any file — preview auto-compiles 2 seconds after your last change. No Expo Go needed.
        </p>
      </div>
      <div className="text-[10px] font-mono text-white/20 text-left space-y-1 bg-white/3 rounded-lg px-4 py-3 max-w-[220px] w-full">
        <p className="text-white/35 mb-1.5 font-semibold">Supported APIs:</p>
        <p>✓ View, Text, StyleSheet</p>
        <p>✓ TouchableOpacity, Pressable</p>
        <p>✓ ScrollView, FlatList</p>
        <p>✓ useState, useEffect hooks</p>
        <p>✓ Animated, Dimensions</p>
        <p>✓ Image, TextInput</p>
      </div>
    </div>
  );
}
