import { useState } from "react";
import { X, Zap, Smartphone, Star } from "lucide-react";
import { PROJECT_TEMPLATES, ProjectTemplate } from "@/lib/templates";

interface TemplateSelectorProps {
  onSelect: (template: ProjectTemplate) => void;
  onClose:  () => void;
}

const QUICK_START_IDS = [
  "html-react-cdn",
  "ts-starter",
  "python-data",
  "html-threejs",
  "html-p5js",
  "html-chartjs",
];

const LIVE_PREVIEW_IDS = ["expo-starter", "react-native-ts"];

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const quickStart = QUICK_START_IDS
    .map(id => PROJECT_TEMPLATES.find(t => t.id === id))
    .filter((t): t is ProjectTemplate => !!t);

  const moreRunnable = PROJECT_TEMPLATES.filter(
    (t) => t.runnable && !QUICK_START_IDS.includes(t.id)
  );
  const livePreview = LIVE_PREVIEW_IDS
    .map(id => PROJECT_TEMPLATES.find(t => t.id === id))
    .filter((t): t is ProjectTemplate => !!t);
  const mobile = PROJECT_TEMPLATES.filter(
    (t) => !t.runnable && !LIVE_PREVIEW_IDS.includes(t.id)
  );

  const renderCard = (template: ProjectTemplate, compact = false) => (
    <button
      key={template.id}
      data-testid={`template-${template.id}`}
      onMouseEnter={() => setHovered(template.id)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => onSelect(template)}
      className={[
        "text-left rounded-lg border transition-all duration-150 cursor-pointer",
        compact ? "p-3" : "p-4",
        hovered === template.id
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:border-primary/50",
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
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-card border border-border rounded-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-foreground font-mono font-bold text-sm tracking-widest uppercase">
              New Project
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5 font-mono">
              Choose a template to get started
            </p>
          </div>
          <button
            data-testid="button-close-template-selector"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto">

          {/* Section 1: Quick Start (featured 6) */}
          <div className="px-6 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <Star size={13} className="text-[#4ade80]" />
              <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4ade80]/80">
                Quick Start
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground/50">
                — run instantly, results in seconds
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickStart.map(t => renderCard(t))}
            </div>
          </div>

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
                  — phone simulator in the IDE, auto-syncs as you type
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
                            📱 Live Preview
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
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-background/50 shrink-0">
          <p className="text-muted-foreground text-xs font-mono">
            ⚠ Loading a template will replace your current project files.
          </p>
        </div>
      </div>
    </div>
  );
}
