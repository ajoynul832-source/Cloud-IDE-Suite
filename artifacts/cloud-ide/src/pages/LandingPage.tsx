import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import {
  Box, Play, Zap, Globe, Smartphone, Code2, GitBranch, Share2,
  ChevronRight, Terminal, Check, Star, Cpu, Eye, BarChart2,
  ArrowRight, Layers, Braces, FileCode, Sparkles, Rocket,
  Command, Wand2, Database,
} from "lucide-react";

// ── Animated canvas particle background ─────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight * 1.2;

    const DOTS = 80;
    const dots = Array.from({ length: DOTS }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }));

    let animId: number;
    let frame = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);

      // Connection lines
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(74,222,128,${(1 - dist / 130) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
        // Move
        dots[i].x += dots[i].vx;
        dots[i].y += dots[i].vy;
        if (dots[i].x < 0 || dots[i].x > W) dots[i].vx *= -1;
        if (dots[i].y < 0 || dots[i].y > H) dots[i].vy *= -1;

        // Draw dot
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dots[i].r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(74,222,128,0.25)";
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight * 1.2;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-60"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

// ── Typewriter hero demo ─────────────────────────────────────────────────────

const DEMO = [
  {
    id: "js", label: "JavaScript", icon: "⚡", color: "#f0db4f",
    file: "index.js",
    code: `// Click Run ▶ or press Ctrl+Enter
const nums = [1,2,3,4,5,6,7,8,9,10];

console.log("Evens:  ", nums.filter(n => n%2===0));
console.log("Squares:", nums.map(n => n*n));
console.log("Sum:    ", nums.reduce((a,b)=>a+b,0));

async function main() {
  await new Promise(r => setTimeout(r, 80));
  console.log("Done ✓");
}
main();`,
    output: ["Evens:   [ 2, 4, 6, 8, 10 ]", "Squares: [ 1, 4, 9, 16, 25, 36, 49, 64, 81, 100 ]", "Sum:     55", "Done ✓"],
  },
  {
    id: "py", label: "Python", icon: "🐍", color: "#4ade80",
    file: "main.py",
    code: `# Python — real Linux server, zero setup
import math, statistics

data = [72,88,91,65,77,84,59,95,68,82]
print(f"Mean:   {statistics.mean(data):.1f}")
print(f"Median: {statistics.median(data):.1f}")
print(f"Stdev:  {statistics.stdev(data):.2f}")

primes = [n for n in range(2,30)
          if all(n%i for i in range(2,n))]
print("Primes:", primes)`,
    output: ["Mean:   78.1", "Median: 80.0", "Stdev:  11.72", "Primes: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]"],
  },
  {
    id: "cpp", label: "C++", icon: "⚙️", color: "#38bdf8",
    file: "main.cpp",
    code: `// g++ -std=c++17 on the server
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
  vector<int> v = {5,2,8,1,9,3,7,4,6};
  sort(v.begin(), v.end());
  cout << "Sorted: ";
  for (int x : v) cout << x << " ";
  cout << "\\nCompiled & ran ✓\\n";
}`,
    output: ["Sorted: 1 2 3 4 5 6 7 8 9", "Compiled & ran ✓", "exit 0  ·  1.3s compile"],
  },
  {
    id: "html", label: "HTML", icon: "🌐", color: "#fb923c",
    file: "index.html",
    code: `<!-- Live preview — no server round-trip -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background:#0d1117; color:#e6edf3;
           font-family:monospace; padding:2rem; }
    h1 { color:#4ade80; font-size:2rem; }
    button { background:#4ade80; color:#000;
             border:none; padding:.5rem 1rem;
             border-radius:8px; cursor:pointer; }
  </style>
</head>
<body>
  <h1>Hello CloudIDE ✓</h1>
  <button onclick="alert('It works!')">Click me</button>
</body></html>`,
    output: ["→ Rendered as a live iframe", "→ No server round-trip", "→ Edit and see instantly"],
  },
];

function HeroDemo() {
  const [tab, setTab]   = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const demo = DEMO[tab];

  useEffect(() => { setDisplayed(""); setCharIdx(0); }, [tab]);
  useEffect(() => {
    if (charIdx >= demo.code.length) return;
    const t = setTimeout(() => {
      setDisplayed(demo.code.slice(0, charIdx + 1));
      setCharIdx(i => i + 1);
    }, 11);
    return () => clearTimeout(t);
  }, [charIdx, demo.code]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1200 }}
      className="w-full max-w-[520px]"
    >
      <div className="w-full rounded-2xl border border-white/10 bg-[#161b22] shadow-[0_32px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(74,222,128,0.05),0_0_80px_rgba(74,222,128,0.04)] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1c2128] border-b border-white/8">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-[#4ade80]/80" />
          <div className="ml-3 flex-1 bg-[#0d1117] rounded px-2.5 py-0.5 text-[10px] font-mono text-white/25 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]/50" />
            {demo.file}
          </div>
          <div className="flex items-center gap-1.5 bg-[#4ade80] text-black text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-[0_0_12px_rgba(74,222,128,0.5)]">
            <Play size={8} fill="black" />Run
          </div>
        </div>

        {/* Language tabs */}
        <div className="flex border-b border-white/8 bg-[#161b22]">
          {DEMO.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setTab(i)}
              className={[
                "flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono transition-all border-b-2",
                tab === i
                  ? "text-white border-[#4ade80] bg-white/5"
                  : "text-white/30 border-transparent hover:text-white/60 hover:bg-white/[0.03]",
              ].join(" ")}
            >
              <span>{d.icon}</span>
              <span className="hidden sm:block">{d.label}</span>
            </button>
          ))}
        </div>

        {/* Code */}
        <div className="px-4 py-3 min-h-[155px] bg-[#0d1117] relative">
          {/* Line numbers */}
          <div className="absolute left-0 top-0 pt-3 pb-3 flex flex-col items-end pr-3 pl-2 select-none pointer-events-none">
            {displayed.split("\n").map((_, i) => (
              <span key={i} className="text-[10px] font-mono text-white/10 leading-relaxed">{i + 1}</span>
            ))}
          </div>
          <pre className="text-[11px] font-mono text-[#4ade80] leading-relaxed whitespace-pre-wrap break-words pl-8">
            {displayed}<span className="animate-pulse opacity-80">▋</span>
          </pre>
        </div>

        {/* Output */}
        <div className="border-t border-white/8 px-4 py-2.5 bg-[#0a0e14] space-y-0.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-[10px] font-mono text-[#4ade80]/70">Output</span>
          </div>
          {demo.output.map((line, i) => (
            <span key={i} className="block text-[10px] font-mono text-white/45 leading-relaxed">{line}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Animated counter ─────────────────────────────────────────────────────────

function AnimatedStat({ value, label, color }: { value: string; label: string; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center"
    >
      <div className={`text-3xl font-black font-mono ${color} mb-1`}>{value}</div>
      <div className="text-xs text-white/40 font-mono">{label}</div>
    </motion.div>
  );
}

// ── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ icon, color, title, desc, delay }: {
  icon: React.ReactNode; color: string; title: string; desc: string; delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative bg-[#161b22] border rounded-xl p-6 transition-all duration-300 overflow-hidden cursor-default ${color} ${hovered ? "shadow-lg" : ""}`}
    >
      {hovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      )}
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="font-bold text-white mb-2 text-sm leading-snug">{title}</h3>
      <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ── Floating glow orbs ───────────────────────────────────────────────────────

function GlowOrbs() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-150px] left-1/4 w-[700px] h-[700px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)" }}
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute top-[100px] right-[-100px] w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)" }}
      />
      <motion.div
        animate={{ x: [0, 15, 0], y: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        className="absolute bottom-0 left-[-100px] w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.04) 0%, transparent 70%)" }}
      />
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const COMPARE_ROWS = [
  { label: "Python execution",        cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "C / C++ compilation",     cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "Bash / Perl scripting",   cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "React / Vue CDN preview", cloudide: true,  codepen: true,  jsfiddle: false, stackblitz: true  },
  { label: "Three.js / p5.js preview",cloudide: true,  codepen: true,  jsfiddle: false, stackblitz: false },
  { label: "CSS live preview",        cloudide: true,  codepen: true,  jsfiddle: true,  stackblitz: false },
  { label: "Markdown rendering",      cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "APK / Mobile builder",    cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "Fork & share projects",   cloudide: true,  codepen: true,  jsfiddle: true,  stackblitz: false },
  { label: "Version history",         cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
];

const FEATURES = [
  {
    icon: <Zap size={18} className="text-yellow-400" />,
    color: "border-yellow-400/15 hover:border-yellow-400/40 hover:shadow-yellow-400/5",
    title: "Under 1 second to first output",
    desc: "No Docker. No containers. No cold starts. Click Run and output streams in real time.",
  },
  {
    icon: <Cpu size={18} className="text-blue-400" />,
    color: "border-blue-400/15 hover:border-blue-400/40 hover:shadow-blue-400/5",
    title: "7 languages, real server execution",
    desc: "JS, TypeScript, Python, Bash, Perl, C, C++ all run on a real Linux server — not emulated.",
  },
  {
    icon: <Eye size={18} className="text-purple-400" />,
    color: "border-purple-400/15 hover:border-purple-400/40 hover:shadow-purple-400/5",
    title: "10+ instant browser previews",
    desc: "HTML, React 18, Vue 3, Three.js 3D, p5.js, Chart.js, CSS — rendered client-side, zero latency.",
  },
  {
    icon: <Smartphone size={18} className="text-cyan-400" />,
    color: "border-cyan-400/15 hover:border-cyan-400/40 hover:shadow-cyan-400/5",
    title: "React Native live preview + APK builder",
    desc: "React Native runs live in-browser. Flutter & Kotlin projects queue a real cloud APK build.",
  },
  {
    icon: <GitBranch size={18} className="text-orange-400" />,
    color: "border-orange-400/15 hover:border-orange-400/40 hover:shadow-orange-400/5",
    title: "Project versions & restore",
    desc: "Every save creates a named snapshot. Roll back any project to any point in history instantly.",
  },
  {
    icon: <Share2 size={18} className="text-pink-400" />,
    color: "border-pink-400/15 hover:border-pink-400/40 hover:shadow-pink-400/5",
    title: "Share, fork, explore",
    desc: "Every project gets a public link. Anyone can view, run, and fork — no account needed to view.",
  },
  {
    icon: <Layers size={18} className="text-green-400" />,
    color: "border-green-400/15 hover:border-green-400/40 hover:shadow-green-400/5",
    title: "50+ production-ready templates",
    desc: "Algorithms, React CDN, Vue 3, Three.js 3D, p5.js, Chart.js — all runnable immediately.",
  },
  {
    icon: <Star size={18} className="text-amber-400" />,
    color: "border-amber-400/15 hover:border-amber-400/40 hover:shadow-amber-400/5",
    title: "CodeMirror 6 editor",
    desc: "Syntax highlighting, bracket matching, auto-indent, word wrap, font controls — full IDE feel.",
  },
  {
    icon: <BarChart2 size={18} className="text-red-400" />,
    color: "border-red-400/15 hover:border-red-400/40 hover:shadow-red-400/5",
    title: "Built-in run analytics",
    desc: "Shared projects track views, unique visitors, fork count, and run count automatically.",
  },
];

const LANG_GRID = [
  { icon: "⚡", name: "JavaScript",   sub: "Node.js · ESM",        color: "text-yellow-400", bg: "bg-yellow-400/8  border-yellow-400/15", runnable: true  },
  { icon: "📘", name: "TypeScript",   sub: "tsx runner",            color: "text-blue-400",   bg: "bg-blue-400/8    border-blue-400/15",   runnable: true  },
  { icon: "🐍", name: "Python",       sub: "python3 · stdlib",     color: "text-green-400",  bg: "bg-green-400/8   border-green-400/15",  runnable: true  },
  { icon: "🐚", name: "Bash",         sub: "bash · coreutils",     color: "text-lime-400",   bg: "bg-lime-400/8    border-lime-400/15",   runnable: true  },
  { icon: "🔬", name: "Perl",         sub: "perl -w",              color: "text-violet-400", bg: "bg-violet-400/8  border-violet-400/15", runnable: true  },
  { icon: "⚙️", name: "C",            sub: "gcc · c11 · -lm",      color: "text-sky-400",    bg: "bg-sky-400/8     border-sky-400/15",    runnable: true  },
  { icon: "🔩", name: "C++",          sub: "g++ · c++17 · STL",   color: "text-indigo-400", bg: "bg-indigo-400/8  border-indigo-400/15", runnable: true  },
  { icon: "🌐", name: "HTML",         sub: "live iframe preview",  color: "text-orange-400", bg: "bg-orange-400/8  border-orange-400/15", runnable: false },
  { icon: "🎨", name: "CSS",          sub: "live elements",        color: "text-pink-400",   bg: "bg-pink-400/8    border-pink-400/15",   runnable: false },
  { icon: "📝", name: "Markdown",     sub: "rendered HTML",        color: "text-purple-400", bg: "bg-purple-400/8  border-purple-400/15", runnable: false },
  { icon: "⚛️", name: "React",         sub: "CDN + JSX Babel",      color: "text-sky-400",    bg: "bg-sky-400/8     border-sky-400/15",    runnable: false },
  { icon: "🟢", name: "Vue 3",         sub: "CDN composition",      color: "text-emerald-400",bg: "bg-emerald-400/8 border-emerald-400/15", runnable: false },
  { icon: "🎲", name: "Three.js",     sub: "WebGL 3D preview",     color: "text-violet-400", bg: "bg-violet-400/8  border-violet-400/15", runnable: false },
  { icon: "🐦", name: "Flutter",      sub: "APK build pipeline",   color: "text-cyan-400",   bg: "bg-cyan-400/8    border-cyan-400/15",   runnable: null  },
  { icon: "⚛",  name: "React Native", sub: "RNW live preview",     color: "text-blue-300",   bg: "bg-blue-300/8    border-blue-300/15",   runnable: null  },
  { icon: "🤖", name: "Android",      sub: "Kotlin · APK build",   color: "text-green-300",  bg: "bg-green-300/8   border-green-300/15",  runnable: null  },
];

const PLANS = [
  {
    name: "Free", price: "$0", period: "forever",
    badge: null,
    gradient: "from-white/[0.04] to-transparent",
    borderClass: "border-white/10 hover:border-white/20",
    features: [
      "50 runs per day (resets midnight UTC)",
      "All 7 execution languages",
      "All live preview formats",
      "50+ starter templates",
      "Public share links",
      "Fork community projects",
      "File tree + multi-tab editor",
    ],
    cta: "Start coding free",
    href: "/ide",
    ctaStyle: "border border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80] hover:text-black font-semibold",
  },
  {
    name: "Pro", price: "$9", period: "per month",
    badge: "Most popular",
    gradient: "from-[#4ade80]/8 to-transparent",
    borderClass: "border-[#4ade80]/40 hover:border-[#4ade80]/60",
    features: [
      "Unlimited runs per day",
      "Everything in Free",
      "Unlimited saved projects",
      "Full version history",
      "Private projects",
      "APK build queue (priority)",
      "Priority support",
    ],
    cta: "Coming soon",
    href: "/auth",
    ctaStyle: "bg-[#4ade80] text-black font-bold hover:bg-[#22c55e] cursor-not-allowed opacity-80 shadow-[0_0_24px_rgba(74,222,128,0.3)]",
  },
];

const STEPS = [
  {
    n: "01", icon: <Globe size={17} className="text-[#4ade80]" />,
    color: "border-[#4ade80]/20 bg-[#4ade80]/5",
    title: "Open the IDE — no install",
    desc: "The editor opens instantly with working JavaScript. No account. No extensions.",
  },
  {
    n: "02", icon: <Braces size={17} className="text-blue-400" />,
    color: "border-blue-400/20 bg-blue-400/5",
    title: "Pick your language",
    desc: "Switch between JS, TypeScript, Python, Bash, C/C++, HTML or pick a template.",
  },
  {
    n: "03", icon: <Play size={17} fill="currentColor" className="text-[#4ade80]" />,
    color: "border-[#4ade80]/20 bg-[#4ade80]/5",
    title: "Click Run — or Ctrl+Enter",
    desc: "Output streams to the console in real time. HTML renders as a live preview.",
  },
  {
    n: "04", icon: <Share2 size={17} className="text-pink-400" />,
    color: "border-pink-400/20 bg-pink-400/5",
    title: "Share in one click",
    desc: "Sign in free to save, version, and generate a public link anyone can fork.",
  },
];

// ── Section heading helper ───────────────────────────────────────────────────

function SectionBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block font-mono text-xs border px-3 py-1 rounded-full mb-4 ${color}`}>
      {label}
    </span>
  );
}

// ── IDE window preview for features section ──────────────────────────────────

function IDEWindowPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 40 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:block relative"
    >
      {/* Glow */}
      <div className="absolute -inset-10 bg-gradient-to-r from-[#4ade80]/10 via-transparent to-blue-500/10 rounded-3xl blur-3xl pointer-events-none" />
      <div className="relative rounded-2xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.7)]">
        {/* Titlebar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/8">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80]/70" />
          </div>
          <span className="text-[10px] font-mono text-white/25">CloudIDE — workspace</span>
          <div className="flex items-center gap-1">
            {["PREVIEW", "CONSOLE", "TERMINAL"].map(t => (
              <span key={t} className="text-[8px] font-mono text-white/20 px-1.5 py-0.5 border border-white/8 rounded">{t}</span>
            ))}
          </div>
        </div>
        {/* Body */}
        <div className="flex h-48">
          {/* Sidebar */}
          <div className="w-10 border-r border-white/8 bg-[#161b22]/50 flex flex-col items-center py-3 gap-3">
            {[FileCode, GitBranch, Database, Sparkles].map((Icon, i) => (
              <Icon key={i} size={12} className={i === 0 ? "text-[#4ade80]" : "text-white/20"} />
            ))}
          </div>
          {/* File tree */}
          <div className="w-28 border-r border-white/8 bg-[#161b22]/30 py-2 px-2 space-y-1">
            <div className="text-[8px] font-mono text-white/25 uppercase tracking-widest mb-2">Explorer</div>
            {["src/", "  App.tsx", "  main.tsx", "index.html", "package.json"].map((f, i) => (
              <div key={i} className={`text-[9px] font-mono truncate ${i === 1 ? "text-[#4ade80] bg-[#4ade80]/8 rounded px-1" : "text-white/30 px-1"}`}>{f}</div>
            ))}
          </div>
          {/* Editor */}
          <div className="flex-1 bg-[#0d1117] p-3 overflow-hidden">
            {[
              { indent: 0, text: "import React from 'react';", color: "text-purple-400" },
              { indent: 0, text: "", color: "" },
              { indent: 0, text: "export function App() {", color: "text-white/60" },
              { indent: 2, text: "const [count, setCount] = useState(0);", color: "text-white/50" },
              { indent: 2, text: "return (", color: "text-white/40" },
              { indent: 4, text: "<button onClick={() => setCount(c=>c+1)}>", color: "text-[#4ade80]/70" },
              { indent: 6, text: "Count: {count}", color: "text-orange-300/70" },
              { indent: 4, text: "</button>", color: "text-[#4ade80]/70" },
            ].map((l, i) => (
              <div key={i} className="flex">
                <span className="text-[8px] font-mono text-white/10 w-4 mr-2 text-right shrink-0">{i + 1}</span>
                <span className={`text-[9px] font-mono ${l.color}`} style={{ paddingLeft: l.indent * 6 }}>{l.text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-[#1c2128] border-t border-white/8">
          <span className="text-[8px] font-mono text-white/25">Ln 6, Col 12</span>
          <span className="text-[8px] font-mono text-[#4ade80]/50">TypeScript</span>
          <span className="text-[8px] font-mono text-white/20">48 runs</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ["rgba(13,17,23,0)", "rgba(13,17,23,0.95)"]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans selection:bg-[#4ade80]/30 overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <motion.nav
        style={{ backgroundColor: navBg }}
        className="fixed top-0 w-full z-50 border-b border-white/[0.06] backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-5 h-15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 bg-[#4ade80] blur-md opacity-40 rounded-full" />
              <Box className="relative text-[#4ade80]" size={20} />
            </div>
            <span className="font-mono font-black text-white tracking-widest uppercase text-sm">
              Cloud<span className="text-[#4ade80]">IDE</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-[13px] text-white/45">
            {[["Features", "#features"], ["Languages", "#languages"], ["How it works", "#how-it-works"], ["Pricing", "#pricing"]].map(([label, href]) => (
              <a key={href} href={href} className="hover:text-white transition-colors">{label}</a>
            ))}
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth" className="hidden md:block text-[13px] text-white/45 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/ide"
              className="flex items-center gap-1.5 bg-[#4ade80] text-black text-[13px] font-bold px-4 py-2 rounded-full hover:bg-[#22c55e] transition-all hover:shadow-[0_0_20px_rgba(74,222,128,0.4)]"
            >
              <Play size={10} fill="black" />
              Start coding
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20 pb-16 px-5">
        {/* Background */}
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(74,222,128,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.8) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          <ParticleCanvas />
          <GlowOrbs />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0d1117] to-transparent" />
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-[#4ade80]/10 border border-[#4ade80]/25 rounded-full px-3.5 py-1.5 text-xs font-mono text-[#4ade80] mb-7"
              >
                <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
                No install required — zero setup, runs in your browser
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl md:text-[72px] font-black leading-[1.02] tracking-tight mb-6"
              >
                Code.{" "}
                <span className="relative inline-block">
                  <span className="text-[#4ade80]">Run.</span>
                  <motion.span
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -inset-2 bg-[#4ade80]/10 rounded-xl blur-lg"
                  />
                </span>
                <br />
                <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  Ship from anywhere.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-[17px] text-white/50 mb-9 max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                A full cloud IDE that executes{" "}
                <span className="text-white/80 font-medium">JS, TS, Python, Bash, C/C++</span>{" "}
                server-side, renders{" "}
                <span className="text-white/80 font-medium">React, Vue 3, Three.js, HTML</span>{" "}
                live in-browser, and builds Flutter &amp; Android APKs.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-7"
              >
                <Link
                  href="/ide"
                  className="group flex items-center justify-center gap-2.5 bg-[#4ade80] text-black font-bold px-8 py-4 rounded-full text-[15px] hover:bg-[#22c55e] transition-all hover:scale-[1.03] shadow-[0_0_40px_rgba(74,222,128,0.3)] hover:shadow-[0_0_60px_rgba(74,222,128,0.45)]"
                >
                  <Play size={14} fill="black" />
                  Start coding free
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    →
                  </motion.span>
                </Link>
                <Link
                  href="/explore"
                  className="flex items-center justify-center gap-2 border border-white/12 text-white/60 px-7 py-4 rounded-full text-[15px] hover:border-white/30 hover:text-white hover:bg-white/[0.04] transition-all"
                >
                  Browse projects
                  <ChevronRight size={14} />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-5 justify-center lg:justify-start flex-wrap"
              >
                {["Free forever", "50 runs/day", "No credit card", "No install"].map((t) => (
                  <div key={t} className="flex items-center gap-1.5 text-[11px] text-white/30 font-mono">
                    <Check size={10} className="text-[#4ade80]/60" />
                    {t}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right */}
            <div className="flex-1 w-full flex justify-center lg:justify-end">
              <HeroDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────────────── */}
      <section className="relative border-y border-white/[0.06] py-7 px-5 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <AnimatedStat value="7"   label="Execution languages" color="text-yellow-400" />
          <AnimatedStat value="15+" label="Preview formats"      color="text-blue-400"  />
          <AnimatedStat value="50+" label="Starter templates"    color="text-[#4ade80]" />
          <AnimatedStat value="<1s" label="Time to first output" color="text-pink-400"  />
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-18">
            <SectionBadge label="Features" color="text-[#4ade80] border-[#4ade80]/20 bg-[#4ade80]/8" />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-black mb-4"
            >
              Everything you need.{" "}
              <span className="text-white/30">Nothing you don&apos;t.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/45 text-lg max-w-xl mx-auto"
            >
              Built for speed. Every feature ships you faster than any alternative.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 0.06} />
            ))}
          </div>
        </div>
      </section>

      {/* ── LANGUAGES ───────────────────────────────────────────────────────── */}
      <section id="languages" className="py-28 px-5 bg-[#090d12] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-30"
            style={{ background: "radial-gradient(ellipse, rgba(56,189,248,0.06) 0%, transparent 70%)" }} />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <SectionBadge label="Language Support" color="text-blue-400 border-blue-400/20 bg-blue-400/8" />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black mb-4"
            >
              15 languages.{" "}
              <span className="text-[#4ade80]">One editor.</span>
            </motion.h2>
            <p className="text-white/45 text-lg">7 execute server-side · 7 render live in the browser · 3 build mobile APKs</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-5">
            {LANG_GRID.map((lang, i) => (
              <motion.div
                key={lang.name}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                <Link
                  href="/ide"
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border ${lang.bg} hover:scale-[1.04] hover:shadow-lg transition-all duration-200 cursor-pointer group`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl">{lang.icon}</span>
                    {lang.runnable === true && (
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/20">run</span>
                    )}
                    {lang.runnable === null && (
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-orange-400/15 text-orange-400 border border-orange-400/20">build</span>
                    )}
                    {lang.runnable === false && (
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-purple-400/15 text-purple-400 border border-purple-400/20">preview</span>
                    )}
                  </div>
                  <span className={`text-[13px] font-semibold ${lang.color} group-hover:brightness-110`}>{lang.name}</span>
                  <span className="text-[9px] text-white/30 font-mono leading-tight">{lang.sub}</span>
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-xs font-mono text-white/20 mt-5">
            ⚡ run = server execution · 👁 preview = browser render · 🔨 build = APK queue
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <SectionBadge label="How it works" color="text-orange-400 border-orange-400/20 bg-orange-400/8" />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black mb-4"
            >
              Up and running in seconds
            </motion.h2>
            <p className="text-white/45 text-lg">No account required. Sign up only when you want to save.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`flex gap-5 p-6 bg-[#161b22] border border-white/8 rounded-2xl hover:border-white/15 transition-all hover:bg-[#161b22]/80 group`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${s.color} group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#4ade80]/40 block mb-1 tracking-widest">{s.n}</span>
                  <h3 className="font-bold text-white mb-1.5 text-[15px]">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IDE PREVIEW SHOWCASE ─────────────────────────────────────────────── */}
      <section className="py-28 px-5 bg-[#090d12] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 w-[600px] h-[600px] opacity-20"
            style={{ background: "radial-gradient(circle, rgba(74,222,128,0.08) 0%, transparent 60%)" }} />
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <SectionBadge label="The Editor" color="text-[#4ade80] border-[#4ade80]/20 bg-[#4ade80]/8" />
            <h2 className="text-4xl md:text-5xl font-black mb-5 leading-[1.1]">
              A real IDE,<br />
              <span className="text-[#4ade80]">in your browser.</span>
            </h2>
            <p className="text-white/50 text-[16px] leading-relaxed mb-8">
              CodeMirror 6 with syntax highlighting, bracket matching, multi-cursor, auto-indent,
              word wrap, font controls, and 4 color themes. Everything you expect from a desktop IDE.
            </p>
            <div className="space-y-3 mb-8">
              {[
                { icon: <Command size={14} className="text-[#4ade80]" />, text: "Command palette with Ctrl+Shift+P" },
                { icon: <Wand2 size={14} className="text-blue-400" />, text: "Prettier formatting with Ctrl+Shift+F" },
                { icon: <GitBranch size={14} className="text-orange-400" />, text: "Git push/pull with a GitHub PAT" },
                { icon: <Sparkles size={14} className="text-purple-400" />, text: "AI assistant — ask, refactor, explain" },
                { icon: <Rocket size={14} className="text-pink-400" />, text: "One-click deploy to preview URL" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-white/55">
                  <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  {text}
                </div>
              ))}
            </div>
            <Link
              href="/ide"
              className="inline-flex items-center gap-2 text-[#4ade80] text-sm font-mono hover:gap-3 transition-all"
            >
              Open the IDE <ArrowRight size={14} />
            </Link>
          </motion.div>
          <IDEWindowPreview />
        </div>
      </section>

      {/* ── COMPARE ─────────────────────────────────────────────────────────── */}
      <section className="py-28 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <SectionBadge label="Comparison" color="text-pink-400 border-pink-400/20 bg-pink-400/8" />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black mb-4"
            >
              Why CloudIDE wins on{" "}
              <span className="text-[#4ade80]">language breadth</span>
            </motion.h2>
            <p className="text-white/45 text-lg">No free tool runs as many languages and previews as many formats.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto rounded-2xl border border-white/8 shadow-2xl"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8 bg-[#161b22]">
                  <th className="text-left px-5 py-4 font-mono text-xs text-white/30 font-normal">Feature</th>
                  <th className="px-4 py-4 font-mono text-xs text-[#4ade80] font-bold">CloudIDE</th>
                  <th className="px-4 py-4 font-mono text-xs text-white/25 font-normal hidden sm:table-cell">CodePen</th>
                  <th className="px-4 py-4 font-mono text-xs text-white/25 font-normal hidden md:table-cell">JSFiddle</th>
                  <th className="px-4 py-4 font-mono text-xs text-white/25 font-normal hidden lg:table-cell">StackBlitz</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr key={row.label} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                    <td className="px-5 py-3.5 text-sm text-white/55 font-mono">{row.label}</td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="w-5 h-5 rounded-full bg-[#4ade80]/15 border border-[#4ade80]/30 flex items-center justify-center mx-auto">
                        <Check size={11} className="text-[#4ade80]" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                      {row.codepen
                        ? <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto"><Check size={11} className="text-white/30" /></div>
                        : <span className="text-white/15 text-sm font-mono">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center hidden md:table-cell">
                      {row.jsfiddle
                        ? <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto"><Check size={11} className="text-white/30" /></div>
                        : <span className="text-white/15 text-sm font-mono">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                      {row.stackblitz
                        ? <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto"><Check size={11} className="text-white/30" /></div>
                        : <span className="text-white/15 text-sm font-mono">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
          <p className="text-center text-xs font-mono text-white/20 mt-4">Free tier data · Subject to change</p>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-5 bg-[#090d12] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
            style={{ background: "radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)" }} />
        </div>
        <div className="max-w-3xl mx-auto relative">
          <div className="text-center mb-16">
            <SectionBadge label="Pricing" color="text-violet-400 border-violet-400/20 bg-violet-400/8" />
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black mb-4"
            >
              Simple pricing
            </motion.h2>
            <p className="text-white/45 text-lg">Free for solo devs. Pro for when you&apos;re serious.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className={`relative bg-gradient-to-b ${plan.gradient} bg-[#161b22] border-2 ${plan.borderClass} rounded-2xl p-8 transition-all hover:-translate-y-1`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-[#4ade80] text-black text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-[0_4px_16px_rgba(74,222,128,0.5)]">
                      {plan.badge}
                    </span>
                  </div>
                )}
                {plan.badge && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-[#4ade80]/20 pointer-events-none" style={{ background: "radial-gradient(ellipse at top, rgba(74,222,128,0.04), transparent 60%)" }} />
                )}

                <div className="mb-7">
                  <div className="text-[10px] text-white/35 font-mono mb-2 uppercase tracking-widest">{plan.name}</div>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black">{plan.price}</span>
                    <span className="text-white/30 text-sm pb-2">/ {plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/60">
                      <div className="w-4 h-4 rounded-full bg-[#4ade80]/12 border border-[#4ade80]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={9} className="text-[#4ade80]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center py-3.5 px-5 rounded-full text-sm transition-all ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-32 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {/* Animated gradient mesh */}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(74,222,128,0.07) 0%, transparent 70%)" }}
          />
          <div className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px)`,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <div className="max-w-2xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mb-7"
          >
            <div className="flex items-center gap-2 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-full px-4 py-2 text-xs font-mono text-[#4ade80]">
              <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
              Live now · Zero downtime
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-5xl md:text-[64px] font-black mb-5 leading-[1.05]"
          >
            Ready to start{" "}
            <span className="text-[#4ade80]">building?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/45 text-[17px] mb-11 leading-relaxed"
          >
            No installs. No setup. No credit card. Open the editor and run your
            first line of code in under 5 seconds — completely free.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/ide"
              className="inline-flex items-center justify-center gap-2.5 bg-[#4ade80] text-black font-bold px-10 py-4.5 rounded-full text-[16px] hover:bg-[#22c55e] transition-all hover:scale-[1.03] shadow-[0_0_50px_rgba(74,222,128,0.25)] hover:shadow-[0_0_70px_rgba(74,222,128,0.4)]"
            >
              <Terminal size={17} />
              Open the IDE — it&apos;s free
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 border border-white/12 text-white/55 px-8 py-4 rounded-full text-[15px] hover:border-white/30 hover:text-white hover:bg-white/[0.04] transition-all"
            >
              <Eye size={14} />
              Browse community projects
            </Link>
          </motion.div>

          <p className="mt-7 text-xs font-mono text-white/20">
            Free forever · 50 runs/day · No credit card · Open in 1 click
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-16 px-5 bg-[#090d12]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#4ade80] blur-sm opacity-40 rounded-full" />
                  <Box size={18} className="relative text-[#4ade80]" />
                </div>
                <span className="font-mono font-black tracking-widest uppercase text-white text-sm">
                  Cloud<span className="text-[#4ade80]">IDE</span>
                </span>
              </div>
              <p className="text-sm text-white/30 leading-relaxed">
                A browser-based cloud IDE with real execution, live previews, and a mobile APK builder.
              </p>
              <div className="flex items-center gap-1.5 mt-4 text-[11px] font-mono text-white/25">
                <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
                All systems operational
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 text-sm">
              <div>
                <div className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-4">Product</div>
                <div className="space-y-2.5">
                  <Link href="/ide"     className="block text-white/45 hover:text-white transition-colors">IDE</Link>
                  <Link href="/explore" className="block text-white/45 hover:text-white transition-colors">Explore</Link>
                  <a href="#pricing"    className="block text-white/45 hover:text-white transition-colors">Pricing</a>
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-4">Languages</div>
                <div className="space-y-2.5">
                  {["JavaScript", "Python", "C / C++", "TypeScript", "Bash"].map(l => (
                    <Link key={l} href="/ide" className="block text-white/45 hover:text-white transition-colors">{l}</Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-white/25 uppercase tracking-widest mb-4">Account</div>
                <div className="space-y-2.5">
                  <Link href="/auth" className="block text-white/45 hover:text-white transition-colors">Sign in</Link>
                  <Link href="/auth" className="block text-white/45 hover:text-white transition-colors">Register</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-7 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/20 font-mono">
            <span>© {new Date().getFullYear()} CloudIDE. All rights reserved.</span>
            <span>Built with React · CodeMirror 6 · Framer Motion</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
