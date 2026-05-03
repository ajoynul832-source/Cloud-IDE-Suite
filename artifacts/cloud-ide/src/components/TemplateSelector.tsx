import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Smartphone, Star, Search } from "lucide-react";
import { PROJECT_TEMPLATES, ProjectTemplate } from "@/lib/templates";

interface TemplateSelectorProps {
  onSelect: (template: ProjectTemplate) => void;
  onClose:  () => void;
}

const QUICK_START_IDS = [
  "js-algorithms",
  "ts-starter",
  "python-data",
  "python-starter",
  "html-page",
  "html-canvas",
];

const LIVE_PREVIEW_IDS = ["expo-starter", "react-native-ts"];

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [hovered,     setHovered]     = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const q = searchQuery.trim().toLowerCase();

  const matchesSearch = (t: ProjectTemplate) => {
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.language.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  };

  const quickStart = QUICK_START_IDS
    .map(id => PROJECT_TEMPLATES.find(t => t.id === id))
    .filter((t): t is ProjectTemplate => !!t && matchesSearch(t));

  const moreRunnable = PROJECT_TEMPLATES.filter(
    (t) => t.runnable && !QUICK_START_IDS.includes(t.id) && matchesSearch(t),
  );
  const livePreview = LIVE_PREVIEW_IDS
    .map(id => PROJECT_TEMPLATES.find(t => t.id === id))
    .filter((t): t is ProjectTemplate => !!t && matchesSearch(t));
  const mobile = PROJECT_TEMPLATES.filter(
    (t) => !t.runnable && !LIVE_PREVIEW_IDS.includes(t.id) && matchesSearch(t),
  );

  const totalResults = quickStart.length + moreRunnable.length + livePreview.length + mobile.length;

  const renderCard = (template: ProjectTemplate, compact = false) => (
    <motion.button
      key={template.id}
      data-testid={`template-${template.id}`}
      onMouseEnter={() => setHovered(template.id)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => onSelect(template)}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={[
        "text-left rounded-lg border transition-all duration-150 cursor-pointer",
        compact ? "p-3" : "p-4",
        hovered === template.id
          ? "border-[#4ade80] bg-gradient-to-br from-[#4ade80]/15 to-[#4ade80]/5 shadow-[0_8px_32px_rgba(74,222,128,0.15)]"
          : "border-white/12 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span className={["leading-none mt-0.5", compact ? "text-xl" : "text-2xl"].join(" ")}>
          {template.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={["font-mono font-bold text-foreground", compact ? "text-xs" : "text-sm"].join(" ")}>
              {template.name}
            </span>
            <span className={[
              "text-[10px] font-mono px-1.5 py-0.5 rounded border",
              template.runnable
                ? "bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/25"
                : "bg-primary/15 text-primary border-primary/25",
            ].join(" ")}>
              {template.language}
            </span>
          </div>
          {!compact && (
            <p className="text-muted-foreground text-xs leading-relaxed">
              {template.description}
            </p>
          )}
          {compact && (
            <p className="text-muted-foreground text-[10px] leading-tight truncate">
              {template.description}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-gradient-to-b from-[#1c2128] to-[#161b22] border border-white/12 rounded-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-xl"
      >

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0 bg-gradient-to-r from-white/5 to-transparent"
        >
          <div>
            <h2 className="text-white font-mono font-bold text-sm tracking-widest uppercase">
              New Project
            </h2>
            <p className="text-white/40 text-xs mt-0.5 font-mono">
              Choose a template to get started · {PROJECT_TEMPLATES.length} available
            </p>
          </div>
          <motion.button
            data-testid="button-close-template-selector"
            onClick={onClose}
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="text-white/40 hover:text-white/80 transition-colors p-1"
          >
            <X size={18} />
          </motion.button>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="px-6 pt-4 pb-2 shrink-0"
        >
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by name, language, description…"
              className="w-full bg-white/5 border border-white/12 rounded-lg pl-9 pr-3 py-2.5 font-mono text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#4ade80]/40 focus:bg-white/[0.08] transition-all"
            />
            {searchQuery && (
              <motion.button
                onClick={() => setSearchQuery("")}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={12} />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* Search results — flat list */}
          <AnimatePresence mode="wait">
          {q && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-6 py-3"
            >
              {totalResults === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-10 text-center text-sm font-mono text-white/30"
                >
                  No templates match "{searchQuery}"
                </motion.div>
              ) : (
                <>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] font-mono text-white/25 mb-3 uppercase tracking-widest"
                  >
                    {totalResults} result{totalResults !== 1 ? "s" : ""}
                  </motion.p>
                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    {[...quickStart, ...moreRunnable, ...livePreview, ...mobile].map(t => renderCard(t, true))}
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
          </AnimatePresence>

          {/* Normal sections — only shown when not searching */}
          <AnimatePresence mode="wait">
          {!q && (
            <motion.div
              key="sections"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Section 1: Runnable Now (featured 6) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-6 pt-3 pb-2"
              >
                <div className="flex items-center gap-2 mb-3">
                  <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Star size={13} className="text-[#4ade80]" />
                  </motion.div>
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4ade80]/80">
                    Runnable Now
                  </h3>
                  <span className="text-[10px] font-mono text-white/25">
                    — run instantly, results in seconds
                  </span>
                </div>
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {quickStart.map((t, i) => (
                    <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.05 }}>
                      {renderCard(t)}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Section 2: More Runnable */}
              {moreRunnable.length > 0 && (
                <div className="px-6 pt-4 pb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={13} className="text-[#4ade80]/60" />
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4ade80]/50">
                      More Languages
                    </h3>
                    <span className="text-[10px] font-mono text-muted-foreground/40">
                      — also run in the sandbox
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {moreRunnable.map(t => renderCard(t, true))}
                  </div>
                </div>
              )}

              {/* Section 3: Mobile Live Preview */}
              {livePreview.length > 0 && (
                <div className="px-6 pt-4 pb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone size={13} className="text-[#4ade80]" />
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4ade80]/80">
                      Mobile Live Preview
                    </h3>
                    <span className="text-[10px] font-mono text-[#4ade80]/40">
                      — in-browser phone simulator, no installs
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {livePreview.map(t => (
                      <button
                        key={t.id}
                        data-testid={`template-${t.id}`}
                        onMouseEnter={() => setHovered(t.id)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => onSelect(t)}
                        className={[
                          "text-left rounded-lg border-2 transition-all duration-150 cursor-pointer p-4",
                          hovered === t.id
                            ? "border-[#4ade80] bg-[#4ade80]/10"
                            : "border-[#4ade80]/30 bg-[#4ade80]/5 hover:border-[#4ade80]/60",
                        ].join(" ")}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl leading-none mt-0.5">{t.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono font-bold text-foreground text-sm">{t.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/25">
                                {t.language}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-blue-400/10 text-blue-400 border-blue-400/25">
                                📱 In-Browser
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">{t.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Mobile / Build Required */}
              <div className="px-6 pt-4 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone size={13} className="text-amber-400/80" />
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-amber-400/80">
                    Mobile / Build Required
                  </h3>
                  <span className="text-[10px] font-mono text-muted-foreground/50">
                    — needs Flutter or Android SDK to compile
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mobile.map(t => renderCard(t))}
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-background/50 shrink-0 flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-mono">
            ⚠ Loading a template will replace your current project files.
          </p>
          <p className="text-muted-foreground text-[10px] font-mono opacity-50">
            Press Esc to cancel
          </p>
        </div>
      </div>
    </div>
  );
}
