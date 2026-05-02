import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Compass,
  Eye,
  GitFork,
  Play,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/hooks/useProjects";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExploreProject {
  shareId:     string;
  title:       string;
  projectType: string;
  totalViews:  number;
  uniqueViews: number;
  forksCount:  number;
  runsCount:   number;
  score:       number;
  createdAt:   string;
}

interface ExploreResponse {
  projects: ExploreProject[];
  hasMore:  boolean;
  error?:   string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANG_META: Record<string, { label: string; color: string }> = {
  javascript:   { label: "JavaScript",   color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
  typescript:   { label: "TypeScript",   color: "bg-blue-500/15   text-blue-400   border-blue-500/25"   },
  python:       { label: "Python",       color: "bg-green-500/15  text-green-400  border-green-500/25"  },
  flutter:      { label: "Flutter",      color: "bg-cyan-500/15   text-cyan-400   border-cyan-500/25"   },
  "react-native": { label: "React Native", color: "bg-cyan-500/15 text-cyan-400   border-cyan-500/25"   },
  android:      { label: "Android",      color: "bg-green-600/15  text-green-500  border-green-600/25"  },
  html:         { label: "HTML",         color: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
};

function langMeta(projectType: string) {
  return LANG_META[projectType.toLowerCase()] ?? { label: projectType, color: "bg-primary/15 text-primary border-primary/25" };
}

function fmtCount(n: number): string {
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

const PAGE_SIZE = 20;

// ─── Explore Card ─────────────────────────────────────────────────────────────

function ExploreCard({
  project,
  onForkDone,
}: {
  project:    ExploreProject;
  onForkDone: () => void;
}) {
  const [, navigate]   = useLocation();
  const { saveProject } = useProjects();
  const [isForking, setIsForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);

  const meta      = langMeta(project.projectType);
  const sharedUrl = `/p/${project.shareId}`;

  const handleOpen = () => navigate(sharedUrl);

  const handleFork = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsForking(true);
    setForkError(null);
    try {
      const res  = await fetch(`/api/share/${project.shareId}`);
      const data = await res.json() as { project?: { name: string; projectType: string; files: Record<string, string> }; error?: string };
      if (!res.ok || !data.project) throw new Error(data.error ?? "Failed to fetch project");

      const saved = await saveProject(
        `Fork of ${data.project.name}`,
        data.project.projectType,
        data.project.files,
      );
      if (!saved) throw new Error("Could not save fork");

      // record event (non-blocking)
      fetch(`/api/share/${project.shareId}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "fork" }),
      }).catch(() => {});

      onForkDone();
      navigate("/");
    } catch (err) {
      setForkError(err instanceof Error ? err.message : "Fork failed");
    } finally {
      setIsForking(false);
    }
  }, [project, saveProject, navigate, onForkDone]);

  return (
    <div
      onClick={handleOpen}
      className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer"
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <h3
          className="font-mono text-sm font-semibold text-foreground truncate leading-tight group-hover:text-primary transition-colors"
          title={project.title}
        >
          {project.title}
        </h3>
        <span
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border shrink-0 ${meta.color}`}
        >
          {meta.label}
        </span>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
          <Eye size={10} className="shrink-0" />
          {fmtCount(project.totalViews)} views · {fmtCount(project.uniqueViews)} unique
        </span>
        {project.forksCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
            <GitFork size={10} className="shrink-0" />
            {fmtCount(project.forksCount)}
          </span>
        )}
        {project.runsCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
            <Play size={10} className="shrink-0" />
            {fmtCount(project.runsCount)}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border mx-4" />

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="flex-1 font-mono text-xs h-7 hover:text-primary hover:border-primary"
        >
          Open →
        </Button>
        <Button
          size="sm"
          disabled={isForking}
          onClick={handleFork}
          className="font-mono text-xs h-7 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isForking ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <><GitFork size={11} className="mr-1" />Fork</>
          )}
        </Button>
      </div>

      {forkError && (
        <p className="px-4 pb-3 text-[10px] font-mono text-destructive truncate">{forkError}</p>
      )}
    </div>
  );
}

// ─── Explore Page ─────────────────────────────────────────────────────────────

export default function Explore() {
  const [, navigate] = useLocation();

  const [items,     setItems]     = useState<ExploreProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [hasMore,   setHasMore]   = useState(true);
  const offsetRef   = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (offset: number, replace = false) => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/explore?limit=${PAGE_SIZE}&offset=${offset}`);
      const data = await res.json() as ExploreResponse;
      if (!res.ok) throw new Error(data.error ?? "Failed to load projects");
      setItems((prev) => replace ? data.projects : [...prev, ...data.projects]);
      setHasMore(data.hasMore);
      offsetRef.current = offset + data.projects.length;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load explore feed");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Initial load
  useEffect(() => {
    fetchPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          fetchPage(offsetRef.current);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, fetchPage]);

  const isEmpty = !isLoading && items.length === 0 && !error;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="h-12 bg-card border-b border-border flex items-center px-4 gap-3 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <Box className="text-primary" size={16} />
          <span className="font-mono font-bold text-foreground text-sm tracking-widest uppercase hidden sm:block">
            CloudIDE
          </span>
        </div>
        <div className="w-px h-5 bg-border shrink-0" />
        <div className="flex items-center gap-1.5 text-primary font-mono text-sm">
          <Compass size={14} />
          <span className="font-semibold">Explore</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft size={12} />
          Back to IDE
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-mono text-xl font-bold text-foreground">
            Explore Projects
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            Discover shared projects from the community. Open, run, or fork anything.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-mono text-sm mb-6">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Empty */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Compass size={48} className="text-muted-foreground/30 mb-4" />
            <p className="font-mono text-muted-foreground text-sm">No shared projects yet.</p>
            <p className="font-mono text-muted-foreground/60 text-xs mt-1">
              Create and share a project to see it here.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="mt-4 font-mono text-xs"
            >
              Open IDE
            </Button>
          </div>
        )}

        {/* Grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((project) => (
              <ExploreCard
                key={project.shareId}
                project={project}
                onForkDone={() => {}}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              Loading…
            </div>
          </div>
        )}

        {/* End of feed */}
        {!hasMore && items.length > 0 && !isLoading && (
          <p className="text-center font-mono text-xs text-muted-foreground/50 py-6">
            — end of results —
          </p>
        )}
      </div>
    </div>
  );
}
