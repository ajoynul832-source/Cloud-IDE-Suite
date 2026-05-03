import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Eye, EyeOff, Save, X, KeyRound, AlertCircle } from "lucide-react";

export interface EnvVar {
  key: string;
  value: string;
}

interface EnvPanelProps {
  projectId?: string | null;
  onClose: () => void;
  onEnvChange: (vars: EnvVar[]) => void;
  initialVars?: EnvVar[];
}

const LOCAL_KEY = "cloudide_env_vars";

export function EnvPanel({ projectId, onClose, onEnvChange, initialVars }: EnvPanelProps) {
  const [vars,    setVars]    = useState<EnvVar[]>(initialVars ?? []);
  const [shown,   setShown]   = useState<Set<number>>(new Set());
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [newKey,  setNewKey]  = useState("");
  const [newVal,  setNewVal]  = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as EnvVar[];
        setVars(parsed);
        onEnvChange(parsed);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleShow = (i: number) => {
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const addVar = useCallback(() => {
    const k = newKey.trim().replace(/[^A-Z0-9_]/gi, "_").toUpperCase();
    if (!k) return;
    setVars((prev) => {
      const exists = prev.findIndex((v) => v.key === k);
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = { key: k, value: newVal };
        return next;
      }
      return [...prev, { key: k, value: newVal }];
    });
    setNewKey("");
    setNewVal("");
  }, [newKey, newVal]);

  const removeVar = (i: number) => {
    setVars((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateVar = (i: number, field: "key" | "value", val: string) => {
    setVars((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: field === "key" ? val.toUpperCase() : val };
      return next;
    });
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(vars));
    onEnvChange(vars);

    if (projectId) {
      try {
        await fetch(`/api/projects/${projectId}/env`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vars }),
        });
      } catch {}
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [vars, projectId, onEnvChange]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full bg-[#0d1117] text-white/70 text-xs font-mono"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-[#161b22] shrink-0">
        <div className="flex items-center gap-2">
          <KeyRound size={12} className="text-[#4ade80]" />
          <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">Environment Variables</span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/70">
          <X size={12} />
        </button>
      </div>

      <div className="px-2 py-2 bg-amber-500/5 border-b border-amber-500/15 flex items-start gap-1.5 shrink-0">
        <AlertCircle size={10} className="text-amber-400 mt-0.5 shrink-0" />
        <p className="text-[10px] text-amber-300/60 leading-relaxed">
          Variables are injected as <code className="text-amber-300/80">process.env.KEY</code> in JS/TS/Python runs. Stored locally in browser.
        </p>
      </div>

      {/* Add new */}
      <div className="px-2 py-2 border-b border-white/8 shrink-0 space-y-1.5">
        <p className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Add Variable</p>
        <div className="flex gap-1.5">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value.toUpperCase())}
            placeholder="KEY"
            onKeyDown={(e) => e.key === "Enter" && addVar()}
            className="w-28 bg-[#1c2128] border border-white/10 rounded px-2 py-1 text-[11px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4ade80]/40 font-mono"
          />
          <input
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder="value"
            onKeyDown={(e) => e.key === "Enter" && addVar()}
            className="flex-1 bg-[#1c2128] border border-white/10 rounded px-2 py-1 text-[11px] text-white/80 placeholder-white/20 focus:outline-none focus:border-[#4ade80]/40"
          />
          <button
            onClick={addVar}
            disabled={!newKey.trim()}
            className="flex items-center justify-center w-7 h-7 rounded bg-[#4ade80]/15 border border-[#4ade80]/30 text-[#4ade80] hover:bg-[#4ade80]/25 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {vars.length === 0 && (
          <div className="text-center py-8 text-white/20 text-[11px]">
            No environment variables yet
          </div>
        )}
        {vars.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5 group">
            <input
              value={v.key}
              onChange={(e) => updateVar(i, "key", e.target.value)}
              className="w-24 bg-[#1c2128] border border-white/10 rounded px-1.5 py-1 text-[10px] text-[#4ade80]/80 font-mono focus:outline-none focus:border-[#4ade80]/40"
            />
            <input
              value={v.value}
              type={shown.has(i) ? "text" : "password"}
              onChange={(e) => updateVar(i, "value", e.target.value)}
              className="flex-1 bg-[#1c2128] border border-white/10 rounded px-1.5 py-1 text-[10px] text-white/60 font-mono focus:outline-none focus:border-white/20"
            />
            <button
              onClick={() => toggleShow(i)}
              className="w-5 h-5 flex items-center justify-center rounded text-white/20 hover:text-white/50 transition-colors"
            >
              {shown.has(i) ? <EyeOff size={10} /> : <Eye size={10} />}
            </button>
            <button
              onClick={() => removeVar(i)}
              className="w-5 h-5 flex items-center justify-center rounded text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="px-2 py-2 border-t border-white/8 shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold transition-all ${
            saved
              ? "bg-[#4ade80]/20 border border-[#4ade80]/30 text-[#4ade80]"
              : "bg-[#4ade80]/15 border border-[#4ade80]/25 text-[#4ade80]/80 hover:bg-[#4ade80]/25"
          }`}
        >
          <Save size={11} />
          {saving ? "Saving…" : saved ? "Saved!" : "Save Variables"}
        </button>
      </div>
    </motion.div>
  );
}
