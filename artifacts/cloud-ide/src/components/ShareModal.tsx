import { useState, useEffect } from "react";
import { X, Copy, Check, ExternalLink, Loader2, Share2, Eye } from "lucide-react";
import { Button } from "./ui/button";

interface ShareStats {
  totalViews:  number;
  uniqueViews: number;
  forksCount:  number;
  runsCount:   number;
}

interface ShareModalProps {
  projectId:   string;
  projectName: string;
  onClose:     () => void;
}

function fmtCount(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export function ShareModal({ projectId, projectName, onClose }: ShareModalProps) {
  const [shareUrl,     setShareUrl]     = useState<string | null>(null);
  const [shareId,      setShareId]      = useState<string | null>(null);
  const [stats,        setStats]        = useState<ShareStats | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [isCopied,     setIsCopied]     = useState(false);

  const fullUrl = shareUrl ? `${window.location.origin}${shareUrl}` : null;

  // Whenever we have a shareId (from generate or from re-opening), fetch live stats
  useEffect(() => {
    if (!shareId) return;
    let cancelled = false;
    setIsLoadingStats(true);
    fetch(`/api/share/${shareId}/stats`)
      .then((r) => r.json())
      .then((data: ShareStats & { error?: string }) => {
        if (!cancelled && !data.error) setStats(data);
      })
      .catch(() => { /* non-critical */ })
      .finally(() => { if (!cancelled) setIsLoadingStats(false); });
    return () => { cancelled = true; };
  }, [shareId]);

  async function generate() {
    setIsGenerating(true);
    setError(null);
    try {
      const res  = await fetch(`/api/projects/${projectId}/share`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
      });
      const data = await res.json() as {
        shareUrl?: string;
        shareId?:  string;
        stats?:    ShareStats;
        error?:    string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to generate link");
      setShareUrl(data.shareUrl ?? null);
      setShareId(data.shareId  ?? null);
      if (data.stats) setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyLink() {
    if (!fullUrl) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
    } catch {
      const input = document.createElement("input");
      input.value = fullUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-2xl w-[460px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Share2 size={14} className="text-primary" />
            <span className="font-mono text-sm font-semibold text-foreground">Share Project</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              Sharing:{" "}
              <span className="text-foreground font-semibold">{projectName}</span>
            </p>
            <p className="mt-1.5 text-xs font-mono text-muted-foreground leading-relaxed">
              Anyone with the link can <span className="text-foreground">view</span>,{" "}
              <span className="text-foreground">run</span>, and{" "}
              <span className="text-foreground">fork</span> this project.
              They cannot edit the original.
            </p>
          </div>

          {!shareUrl && (
            <Button
              onClick={generate}
              disabled={isGenerating}
              className="w-full font-mono text-xs h-9 bg-primary text-primary-foreground"
            >
              {isGenerating ? (
                <><Loader2 size={12} className="mr-1.5 animate-spin" />Generating link…</>
              ) : (
                <><Share2 size={12} className="mr-1.5" />Generate Share Link</>
              )}
            </Button>
          )}

          {error && (
            <p className="text-xs font-mono text-destructive">{error}</p>
          )}

          {shareUrl && fullUrl && (
            <div className="space-y-3">
              {/* URL display */}
              <div className="flex items-center gap-2 bg-background border border-border rounded px-3 py-2.5">
                <span className="flex-1 font-mono text-xs text-foreground truncate" title={fullUrl}>
                  {fullUrl}
                </span>
              </div>

              {/* View stats */}
              {(isLoadingStats || stats) && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                  <Eye size={10} className="shrink-0" />
                  {isLoadingStats && !stats ? (
                    <span>Loading stats…</span>
                  ) : stats ? (
                    <span>
                      {fmtCount(stats.totalViews)} views · {fmtCount(stats.uniqueViews)} unique
                      {stats.forksCount > 0 && ` · ${fmtCount(stats.forksCount)} forks`}
                      {stats.runsCount  > 0 && ` · ${fmtCount(stats.runsCount)} runs`}
                    </span>
                  ) : null}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={copyLink}
                  variant={isCopied ? "default" : "outline"}
                  size="sm"
                  className="flex-1 font-mono text-xs h-8"
                >
                  {isCopied ? (
                    <><Check size={12} className="mr-1.5 text-primary-foreground" />Copied!</>
                  ) : (
                    <><Copy size={12} className="mr-1.5" />Copy Link</>
                  )}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="font-mono text-xs h-8 px-3"
                >
                  <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={12} className="mr-1.5" />
                    Preview
                  </a>
                </Button>
              </div>

              <p className="text-[10px] font-mono text-muted-foreground">
                This link is permanent and will always show the latest version of the project.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
