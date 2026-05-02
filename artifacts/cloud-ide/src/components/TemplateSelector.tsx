import { useState } from "react";
import { X, Zap, Smartphone } from "lucide-react";
import { PROJECT_TEMPLATES, ProjectTemplate } from "@/lib/templates";

interface TemplateSelectorProps {
  onSelect: (template: ProjectTemplate) => void;
  onClose:  () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const runnable = PROJECT_TEMPLATES.filter((t) => t.runnable);
  const mobile   = PROJECT_TEMPLATES.filter((t) => !t.runnable);

  const renderCard = (template: ProjectTemplate) => (
    <button
      key={template.id}
      data-testid={`template-${template.id}`}
      onMouseEnter={() => setHovered(template.id)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => onSelect(template)}
      className={[
        "text-left p-4 rounded-lg border transition-all duration-150 cursor-pointer",
        hovered === template.id
          ? "border-primary bg-primary/10"
          : "border-border bg-background hover:border-primary/50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono font-bold text-foreground text-sm">
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
          <p className="text-muted-foreground text-xs leading-relaxed">
            {template.description}
          </p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-card border border-border rounded-lg shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
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
          {/* Section 1: Run Instantly */}
          <div className="px-6 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-[#4ade80]" />
              <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-[#4ade80]/80">
                Run Instantly
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground/50">
                — executes in the sandbox, no build step
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {runnable.map(renderCard)}
            </div>
          </div>

          {/* Section 2: Mobile / Build Required */}
          <div className="px-6 pt-5 pb-5">
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
              {mobile.map(renderCard)}
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
