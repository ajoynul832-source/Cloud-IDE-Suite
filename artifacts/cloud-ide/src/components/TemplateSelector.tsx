import { useState } from "react";
import { X } from "lucide-react";
import { PROJECT_TEMPLATES, ProjectTemplate } from "@/lib/templates";

interface TemplateSelectorProps {
  onSelect: (template: ProjectTemplate) => void;
  onClose: () => void;
}

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[80vh] flex flex-col bg-card border border-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-foreground font-mono font-bold text-sm tracking-widest uppercase">
              New Project
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5 font-mono">
              Choose a mobile development framework to get started
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

        {/* Template grid */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROJECT_TEMPLATES.map((template) => (
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-foreground text-sm">
                      {template.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                      {template.language}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-background/50">
          <p className="text-muted-foreground text-xs font-mono">
            Files will replace the current project. Export your work first if needed.
          </p>
        </div>
      </div>
    </div>
  );
}
