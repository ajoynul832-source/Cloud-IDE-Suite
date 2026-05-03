import { useState, useCallback } from "react";
import { Package, Search, Plus, Trash2, X, Loader2, ExternalLink, AlertCircle, Check } from "lucide-react";

interface PackageInfo {
  name: string;
  version: string;
  description: string;
}

interface InstalledPackage {
  name: string;
  version: string;
}

interface PackagePanelProps {
  projectId?: string | null;
  onClose: () => void;
}

export function PackagePanel({ projectId, onClose }: PackagePanelProps) {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<PackageInfo[]>([]);
  const [installed, setInstalled] = useState<InstalledPackage[]>([]);
  const [searching, setSearching] = useState(false);
  const [installing,setInstalling]= useState<string | null>(null);
  const [message,   setMessage]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  const searchPackages = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=8`);
      const data = await res.json() as { objects?: { package: { name: string; version: string; description: string } }[] };
      setResults(
        (data.objects ?? []).map((o) => ({
          name: o.package.name,
          version: o.package.version,
          description: o.package.description ?? "",
        }))
      );
    } catch {
      setMessage({ type: "error", text: "Failed to search npm registry" });
    } finally {
      setSearching(false);
    }
  }, [query]);

  const installPackage = useCallback(async (pkg: PackageInfo) => {
    setInstalling(pkg.name);
    setMessage(null);
    try {
      const res = await fetch("/api/packages/install", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pkg.name, version: pkg.version, projectId }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
      setInstalled((prev) => {
        const exists = prev.some((p) => p.name === pkg.name);
        if (exists) return prev.map((p) => p.name === pkg.name ? { ...p, version: pkg.version } : p);
        return [...prev, { name: pkg.name, version: pkg.version }];
      });
      setMessage({ type: "success", text: `Installed ${pkg.name}@${pkg.version}` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Install failed" });
    } finally {
      setInstalling(null);
    }
  }, [projectId]);

  const removePackage = (name: string) => {
    setInstalled((prev) => prev.filter((p) => p.name !== name));
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white/70 text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2">
          <Package size={12} className="text-[#4ade80]" />
          <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">npm Packages</span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/70">
          <X size={12} />
        </button>
      </div>

      <div className="px-2 py-2 bg-amber-500/5 border-b border-amber-500/15 flex items-start gap-1.5 shrink-0">
        <AlertCircle size={10} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-amber-300/60 leading-relaxed">
          Packages are available via CDN in the browser preview and injected via import maps for JS runs.
        </p>
      </div>

      {/* Search */}
      <div className="px-2 py-2 border-b border-white/8 shrink-0">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchPackages()}
              placeholder="Search npm packages…"
              className="w-full bg-[#1c2128] border border-white/10 rounded pl-6 pr-2 py-1.5 text-[11px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4ade80]/40"
            />
          </div>
          <button
            onClick={searchPackages}
            disabled={searching || !query.trim()}
            className="flex items-center justify-center w-7 h-7 rounded border border-white/15 text-white/50 hover:border-[#4ade80]/40 hover:text-[#4ade80] disabled:opacity-30 transition-colors"
          >
            {searching ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mx-2 mt-2 flex items-start gap-1.5 p-2 rounded text-[10px] ${
          message.type === "success"
            ? "bg-[#4ade80]/10 border border-[#4ade80]/20 text-[#4ade80]/80"
            : "bg-red-500/10 border border-red-500/20 text-red-400/80"
        }`}>
          {message.type === "success" ? <Check size={10} className="mt-0.5 shrink-0" /> : <AlertCircle size={10} className="mt-0.5 shrink-0" />}
          {message.text}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Installed */}
        {installed.length > 0 && (
          <div className="px-2 py-2 border-b border-white/8">
            <p className="text-[9px] text-white/25 uppercase mb-1.5">Installed</p>
            {installed.map((pkg) => (
              <div key={pkg.name} className="flex items-center gap-2 py-1 group">
                <div className="w-2 h-2 rounded-full bg-[#4ade80]/60 shrink-0" />
                <span className="flex-1 text-[10px] text-white/70">{pkg.name}</span>
                <span className="text-[9px] text-white/25">{pkg.version}</span>
                <button
                  onClick={() => removePackage(pkg.name)}
                  className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"
                >
                  <Trash2 size={9} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="px-2 py-2 space-y-1">
            <p className="text-[9px] text-white/25 uppercase mb-1.5">Search Results</p>
            {results.map((pkg) => {
              const isInstalled = installed.some((p) => p.name === pkg.name);
              return (
                <div key={pkg.name} className="flex items-start gap-2 p-2 rounded border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-white/80 font-semibold">{pkg.name}</span>
                      <span className="text-[9px] text-white/25">{pkg.version}</span>
                      <a
                        href={`https://npmjs.com/package/${pkg.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/15 hover:text-white/40"
                      >
                        <ExternalLink size={8} />
                      </a>
                    </div>
                    <p className="text-[10px] text-white/40 truncate mt-0.5">{pkg.description}</p>
                  </div>
                  <button
                    onClick={() => installPackage(pkg)}
                    disabled={!!installing || isInstalled}
                    className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold transition-colors ${
                      isInstalled
                        ? "text-[#4ade80]/50 border border-[#4ade80]/20 cursor-default"
                        : "text-white/50 border border-white/15 hover:border-[#4ade80]/40 hover:text-[#4ade80] disabled:opacity-30"
                    }`}
                  >
                    {installing === pkg.name ? (
                      <Loader2 size={9} className="animate-spin" />
                    ) : isInstalled ? (
                      <Check size={9} />
                    ) : (
                      <Plus size={9} />
                    )}
                    {isInstalled ? "Added" : "Add"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!searching && results.length === 0 && installed.length === 0 && (
          <div className="text-center py-8 text-white/20 text-[11px]">
            <Package size={20} className="mx-auto mb-2 opacity-30" />
            Search for npm packages to add to your project
          </div>
        )}
      </div>
    </div>
  );
}
