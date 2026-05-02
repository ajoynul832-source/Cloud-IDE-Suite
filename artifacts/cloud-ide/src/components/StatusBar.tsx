import { Gauge, Home, Circle, Plus, Minus, Type } from "lucide-react";
import { Link } from "wouter";

interface StatusBarProps {
  language?:          string;
  filename?:          string;
  runsRemaining?:     number | null;
  isRunning?:         boolean;
  isBuilding?:        boolean;
  cursorPos?:         { line: number; col: number } | null;
  fontSize?:          number;
  onFontSizeIncrease?: () => void;
  onFontSizeDecrease?: () => void;
}

export function StatusBar({
  language,
  filename,
  runsRemaining,
  isRunning,
  isBuilding,
  cursorPos,
  fontSize,
  onFontSizeIncrease,
  onFontSizeDecrease,
}: StatusBarProps) {
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
          <span className="truncate max-w-[180px] text-white/50" title={filename}>
            {filename.split("/").pop()}
          </span>
        )}

        {cursorPos && (
          <span className="text-white/30" title="Cursor position (line, column)">
            Ln {cursorPos.line}, Col {cursorPos.col}
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

        {/* Font size controls — only shown when a file is open */}
        {filename && onFontSizeIncrease && onFontSizeDecrease && (
          <div className="flex items-center gap-0.5" title="Font size">
            <Type size={9} className="text-white/25 mr-0.5" />
            <button
              onClick={onFontSizeDecrease}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 hover:text-white/70 transition-colors"
              title="Decrease font size"
            >
              <Minus size={8} />
            </button>
            <span className="w-5 text-center text-white/30">{fontSize}</span>
            <button
              onClick={onFontSizeIncrease}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 hover:text-white/70 transition-colors"
              title="Increase font size"
            >
              <Plus size={8} />
            </button>
          </div>
        )}

        {language && (
          <span className="text-white/50">{language}</span>
        )}

        {runsRemaining !== null && runsRemaining !== undefined && (
          <span
            className={["flex items-center gap-1", runsLow ? "text-orange-400" : "text-white/40"].join(" ")}
            title="Code runs remaining today (50/day, resets midnight UTC)"
          >
            <Gauge size={9} />
            {runsRemaining === 0 ? "0 runs left" : `${runsRemaining} runs`}
          </span>
        )}
      </div>
    </div>
  );
}
