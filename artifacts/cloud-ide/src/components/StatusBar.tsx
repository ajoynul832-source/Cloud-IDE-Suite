import { Gauge, Home, Circle } from "lucide-react";
import { Link } from "wouter";

interface StatusBarProps {
  language?:      string;
  filename?:      string;
  runsRemaining?: number | null;
  isRunning?:     boolean;
  isBuilding?:    boolean;
}

export function StatusBar({ language, filename, runsRemaining, isRunning, isBuilding }: StatusBarProps) {
  const runsLow = runsRemaining !== null && runsRemaining !== undefined && runsRemaining < 5;

  return (
    <div className="h-6 bg-[#1c2128] border-t border-white/8 flex items-center justify-between px-3 shrink-0 select-none">
      {/* Left */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-white/70 transition-colors"
          title="Back to home"
        >
          <Home size={10} />
          <span>Home</span>
        </Link>

        <span className="w-px h-3 bg-white/10" />

        {filename && (
          <span className="truncate max-w-[200px] text-white/50" title={filename}>
            {filename.split("/").pop()}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
        {isRunning && (
          <span className="flex items-center gap-1 text-yellow-400">
            <Circle size={7} className="fill-yellow-400 animate-pulse" />
            Running
          </span>
        )}
        {isBuilding && (
          <span className="flex items-center gap-1 text-primary">
            <Circle size={7} className="fill-primary animate-pulse" />
            Building
          </span>
        )}

        {language && (
          <span className="text-white/50">{language}</span>
        )}

        {runsRemaining !== null && runsRemaining !== undefined && (
          <span
            className={["flex items-center gap-1", runsLow ? "text-orange-400" : "text-white/40"].join(" ")}
            title="Runs remaining today"
          >
            <Gauge size={9} />
            {runsRemaining === 0 ? "0 runs left" : `${runsRemaining} runs`}
          </span>
        )}
      </div>
    </div>
  );
}
