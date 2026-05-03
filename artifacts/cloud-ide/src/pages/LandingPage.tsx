import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Box, Play, Zap, Globe, Smartphone, Code2, GitBranch, Share2,
  ChevronRight, Terminal, Check, Star, Cpu, Eye, BarChart2,
  ArrowRight, Layers, Braces, FileCode,
} from "lucide-react";

// ── Hero demo — language tabs + typewriter ─────────────────────────────────────

const DEMO = [
  {
    id: "js", label: "JavaScript", icon: "⚡", color: "#f0db4f",
    file: "index.js",
    code: `// Click Run ▶ or press Ctrl+Enter
const nums = [1,2,3,4,5,6,7,8,9,10];

console.log("Evens:  ", nums.filter(n => n % 2 === 0));
console.log("Squares:", nums.map(n => n * n));
console.log("Sum:    ", nums.reduce((a,b) => a+b, 0));

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
async function main() {
  await delay(100);
  console.log("Done ✓");
}
main();`,
    output: ["Evens:   [2, 4, 6, 8, 10]", "Squares: [1, 4, 9, 16, 25, 36, 49, 64, 81, 100]", "Sum:     55", "Done ✓"],
  },
  {
    id: "py", label: "Python", icon: "🐍", color: "#4ade80",
    file: "main.py",
    code: `# Python — runs on a real server, zero setup
import math

primes = [n for n in range(2, 60)
          if all(n % i for i in range(2, n))]
print("Primes:", primes)

def fib(n):
    a, b = 0, 1
    while a < n:
        print(a, end=" ")
        a, b = b, a+b
    print()

print("Fibonacci:")
fib(200)
print(f"π = {math.pi:.10f}")`,
    output: ["Primes: [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59]", "Fibonacci:", "0 1 1 2 3 5 8 13 21 34 55 89 144", "π = 3.1415926536"],
  },
  {
    id: "cpp", label: "C++", icon: "⚙️", color: "#38bdf8",
    file: "main.cpp",
    code: `// C++ — compiled on the server with g++ -std=c++17
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
  vector<int> v = {5, 2, 8, 1, 9, 3, 7, 4, 6};
  sort(v.begin(), v.end());

  cout << "Sorted: ";
  for (int x : v) cout << x << " ";
  cout << "\\n";

  auto it = lower_bound(v.begin(), v.end(), 7);
  cout << "First >= 7: " << *it << "\\n";
  return 0;
}`,
    output: ["Sorted: 1 2 3 4 5 6 7 8 9", "First >= 7: 7", "exit code 0  ·  compiled in 1.2s"],
  },
  {
    id: "html", label: "HTML", icon: "🌐", color: "#fb923c",
    file: "index.html",
    code: `<!-- HTML — live preview in the right panel -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background:#0d1117; color:#e6edf3;
           font-family:monospace; padding:24px; }
    h1   { color:#4ade80; font-size:2em; }
    .tag { background:#4ade80/20; color:#4ade80;
           padding:2px 8px; border-radius:4px; }
  </style>
</head>
<body>
  <h1>Hello from CloudIDE ✓</h1>
  <p>Renders as a live <span class="tag">preview</span>.</p>
</body>
</html>`,
    output: ["→ Rendered as a live preview in the right panel", "→ Edit and see changes instantly"],
  },
];

function HeroDemo() {
  const [tab, setTab]       = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");

  const demo = DEMO[tab];

  useEffect(() => {
    setDisplayed("");
    setCharIdx(0);
  }, [tab]);

  useEffect(() => {
    if (charIdx < demo.code.length) {
      const t = setTimeout(() => {
        setDisplayed(demo.code.slice(0, charIdx + 1));
        setCharIdx(i => i + 1);
      }, 12);
      return () => clearTimeout(t);
    }
  }, [charIdx, demo.code]);

  return (
    <div className="w-full max-w-xl rounded-xl border border-white/10 bg-[#161b22] shadow-2xl overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1c2128] border-b border-white/8">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-2 text-[10px] font-mono text-white/20">{demo.file}</span>
        <div className="ml-auto flex items-center gap-1.5 bg-[#4ade80] text-black text-[10px] font-bold px-2 py-0.5 rounded">
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
              "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono transition-colors border-b-2",
              tab === i
                ? "text-white border-[#4ade80] bg-white/5"
                : "text-white/30 border-transparent hover:text-white/60",
            ].join(" ")}
          >
            <span>{d.icon}</span>
            <span className="hidden sm:block">{d.label}</span>
          </button>
        ))}
      </div>

      {/* Code area */}
      <div className="px-4 py-3 min-h-[160px] bg-[#0d1117] overflow-hidden">
        <pre className="text-[11px] font-mono text-green-400 leading-relaxed whitespace-pre-wrap break-words">
          {displayed}
          <span className="animate-pulse">▋</span>
        </pre>
      </div>

      {/* Output */}
      <div className="border-t border-white/8 px-4 py-2.5 bg-[#0d1117]/80 space-y-0.5">
        <span className="text-[10px] font-mono text-[#4ade80] block mb-1">▶ Output</span>
        {demo.output.map((line, i) => (
          <span key={i} className="block text-[10px] font-mono text-white/50 leading-relaxed">{line}</span>
        ))}
      </div>
    </div>
  );
}

// ── Comparison data ────────────────────────────────────────────────────────────

const COMPARE_ROWS = [
  { label: "Python execution",       cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "C / C++ compilation",    cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "Bash / Perl scripting",  cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "CSS live preview",       cloudide: true,  codepen: true,  jsfiddle: true,  stackblitz: false },
  { label: "Markdown rendering",     cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "SVG live preview",       cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "APK / Mobile builder",   cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "Fork & share projects",  cloudide: true,  codepen: true,  jsfiddle: true,  stackblitz: false },
  { label: "Version history",        cloudide: true,  codepen: false, jsfiddle: false, stackblitz: false },
  { label: "Free tier",              cloudide: true,  codepen: true,  jsfiddle: true,  stackblitz: true  },
];

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Zap size={20} className="text-yellow-400" />,
    color: "border-yellow-400/20 hover:border-yellow-400/50 hover:bg-yellow-400/5",
    title: "Under 1 second to first output",
    desc: "No Docker. No containers. No cold starts. Click Run and output streams in real time — instantly.",
  },
  {
    icon: <Cpu size={20} className="text-blue-400" />,
    color: "border-blue-400/20 hover:border-blue-400/50 hover:bg-blue-400/5",
    title: "7 languages, server-side execution",
    desc: "JS, TypeScript, Python, Bash, Perl, C, and C++ all run on a real Linux server — not emulated in the browser.",
  },
  {
    icon: <Eye size={20} className="text-purple-400" />,
    color: "border-purple-400/20 hover:border-purple-400/50 hover:bg-purple-400/5",
    title: "5 instant browser previews",
    desc: "HTML, CSS (on real elements), Markdown, JSON (syntax highlighted), and SVG — rendered client-side with zero latency.",
  },
  {
    icon: <Smartphone size={20} className="text-cyan-400" />,
    color: "border-cyan-400/20 hover:border-cyan-400/50 hover:bg-cyan-400/5",
    title: "Flutter & Android APK builder",
    desc: "Write Flutter or Kotlin code and queue a real cloud APK build. The only browser IDE that does this.",
  },
  {
    icon: <GitBranch size={20} className="text-orange-400" />,
    color: "border-orange-400/20 hover:border-orange-400/50 hover:bg-orange-400/5",
    title: "Project versions & restore",
    desc: "Every explicit save creates a named snapshot. Roll back any project to any point in its history instantly.",
  },
  {
    icon: <Share2 size={20} className="text-pink-400" />,
    color: "border-pink-400/20 hover:border-pink-400/50 hover:bg-pink-400/5",
    title: "Share, fork, and explore",
    desc: "Every project gets a public link. Anyone can view, run, and fork it — no account required to view.",
  },
  {
    icon: <Layers size={20} className="text-green-400" />,
    color: "border-green-400/20 hover:border-green-400/50 hover:bg-green-400/5",
    title: "24 production-ready templates",
    desc: "Algorithms, data structures, API mocks, regex playground, CSS animations, SVG art, and more — all runnable immediately.",
  },
  {
    icon: <BarChart2 size={20} className="text-red-400" />,
    color: "border-red-400/20 hover:border-red-400/50 hover:bg-red-400/5",
    title: "Built-in run analytics",
    desc: "Every shared project tracks views, unique visitors, fork count, and run count. Know exactly how your code performs.",
  },
  {
    icon: <Star size={20} className="text-amber-400" />,
    color: "border-amber-400/20 hover:border-amber-400/50 hover:bg-amber-400/5",
    title: "CodeMirror 6 editor",
    desc: "Syntax highlighting, bracket matching, auto-indent, word wrap, font size controls, cursor position — full IDE experience.",
  },
];

// ── Language grid ──────────────────────────────────────────────────────────────

const LANG_GRID = [
  // Runnable
  { icon: "⚡", name: "JavaScript",   sub: "Node.js · ESM",        color: "text-yellow-400", bg: "bg-yellow-400/8  border-yellow-400/15", runnable: true  },
  { icon: "📘", name: "TypeScript",   sub: "tsx runner",            color: "text-blue-400",   bg: "bg-blue-400/8    border-blue-400/15",   runnable: true  },
  { icon: "🐍", name: "Python",       sub: "python3 · stdlib",     color: "text-green-400",  bg: "bg-green-400/8   border-green-400/15",  runnable: true  },
  { icon: "🐚", name: "Bash",         sub: "bash · coreutils",     color: "text-lime-400",   bg: "bg-lime-400/8    border-lime-400/15",   runnable: true  },
  { icon: "🔬", name: "Perl",         sub: "perl -w",              color: "text-violet-400", bg: "bg-violet-400/8  border-violet-400/15", runnable: true  },
  { icon: "⚙️", name: "C",            sub: "gcc · c11 · -lm",      color: "text-sky-400",    bg: "bg-sky-400/8     border-sky-400/15",    runnable: true  },
  { icon: "🔩", name: "C++",          sub: "g++ · c++17 · -lm",    color: "text-indigo-400", bg: "bg-indigo-400/8  border-indigo-400/15", runnable: true  },
  // Preview
  { icon: "🌐", name: "HTML",         sub: "live iframe preview",  color: "text-orange-400", bg: "bg-orange-400/8  border-orange-400/15", runnable: false },
  { icon: "🎨", name: "CSS",          sub: "live styled elements", color: "text-pink-400",   bg: "bg-pink-400/8    border-pink-400/15",   runnable: false },
  { icon: "📝", name: "Markdown",     sub: "rendered to HTML",     color: "text-purple-400", bg: "bg-purple-400/8  border-purple-400/15", runnable: false },
  { icon: "📋", name: "JSON",         sub: "syntax highlighted",   color: "text-yellow-300", bg: "bg-yellow-300/8  border-yellow-300/15", runnable: false },
  { icon: "🖼️", name: "SVG",          sub: "rendered preview",     color: "text-teal-400",   bg: "bg-teal-400/8    border-teal-400/15",   runnable: false },
  // Mobile
  { icon: "🐦", name: "Flutter",      sub: "APK build pipeline",   color: "text-cyan-400",   bg: "bg-cyan-400/8    border-cyan-400/15",   runnable: null  },
  { icon: "⚛",  name: "React Native", sub: "Expo Snack preview",   color: "text-blue-300",   bg: "bg-blue-300/8    border-blue-300/15",   runnable: null  },
  { icon: "🤖", name: "Android",      sub: "Kotlin · APK build",   color: "text-green-300",  bg: "bg-green-300/8   border-green-300/15",  runnable: null  },
];

// ── Pricing ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: "Free", price: "$0", period: "forever",
    badge: null, color: "border-white/10",
    features: [
      "50 runs per day (resets midnight UTC)",
      "All 7 execution languages",
      "All 5 live preview formats",
      "24 starter templates",
      "Public share links",
      "Fork community projects",
      "File tree + multi-tab editor",
    ],
    cta: "Start coding free",
    href: "/ide",
    ctaStyle: "border border-[#4ade80]/50 text-[#4ade80] hover:bg-[#4ade80] hover:text-black",
  },
  {
    name: "Pro", price: "$9", period: "per month",
    badge: "Most popular",
    color: "border-[#4ade80]/50",
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
    ctaStyle: "bg-[#4ade80] text-black font-bold hover:bg-[#4ade80]/90 cursor-not-allowed opacity-80",
  },
];

// ── Steps ──────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01", icon: <Globe size={18} className="text-[#4ade80]" />,
    title: "Open the IDE — no install",
    desc: "The editor opens instantly with working JavaScript code. No account required. No extension to install.",
  },
  {
    n: "02", icon: <Braces size={18} className="text-blue-400" />,
    title: "Pick your language",
    desc: "Switch between JS, TypeScript, Python, Bash, C/C++, or open a template — all from the same editor.",
  },
  {
    n: "03", icon: <Play size={18} fill="currentColor" className="text-[#4ade80]" />,
    title: "Click Run or press Ctrl+Enter",
    desc: "Output streams to the console in real time. HTML renders as a live preview. CSS applies to real elements.",
  },
  {
    n: "04", icon: <Share2 size={18} className="text-pink-400" />,
    title: "Share it — one click",
    desc: "Sign in free to save, version, and generate a public link. Anyone can fork and extend your code.",
  },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [compareOpen, setCompareOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans selection:bg-[#4ade80]/30">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#0d1117]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="text-[#4ade80]" size={20} />
            <span className="font-mono font-bold text-white tracking-widest uppercase text-sm">CloudIDE</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
            <a href="#features"     className="hover:text-white transition-colors">Features</a>
            <a href="#languages"    className="hover:text-white transition-colors">Languages</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing"      className="hover:text-white transition-colors">Pricing</a>
            <Link href="/explore"   className="hover:text-white transition-colors">Explore</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="hidden md:block text-sm text-white/50 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/ide"
              className="flex items-center gap-1.5 bg-[#4ade80] text-black text-sm font-bold px-4 py-1.5 rounded-full hover:bg-[#4ade80]/90 transition-colors"
            >
              <Play size={11} fill="black" />
              Start coding
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#4ade80]/6 blur-[140px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/3 blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-14">
            {/* Left */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-full px-3 py-1 text-xs font-mono text-[#4ade80] mb-6">
                <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
                No install required — zero setup, runs in your browser
              </div>

              <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-5">
                Code.{" "}
                <span className="text-[#4ade80]">Run.</span>
                <br />
                Ship from anywhere.
              </h1>

              <p className="text-lg text-white/55 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                A full cloud IDE that executes{" "}
                <span className="text-white font-semibold">JS, TS, Python, Bash, Perl, C, C++</span>{" "}
                server-side and previews{" "}
                <span className="text-white font-semibold">HTML, CSS, Markdown, JSON &amp; SVG</span>{" "}
                live in the browser — with a Flutter &amp; Android APK builder built in.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
                <Link
                  href="/ide"
                  className="flex items-center justify-center gap-2 bg-[#4ade80] text-black font-bold px-7 py-3.5 rounded-full text-base hover:bg-[#4ade80]/90 transition-all hover:scale-105 shadow-[0_0_30px_rgba(74,222,128,0.25)]"
                >
                  <Play size={15} fill="black" />
                  Start coding free
                </Link>
                <Link
                  href="/explore"
                  className="flex items-center justify-center gap-2 border border-white/15 text-white/70 px-7 py-3.5 rounded-full text-base hover:border-white/40 hover:text-white transition-colors"
                >
                  Browse projects
                  <ChevronRight size={14} />
                </Link>
              </div>

              <p className="text-xs text-white/25 font-mono">
                Free forever · 50 runs/day · No credit card
              </p>
            </div>

            {/* Right — live demo */}
            <div className="flex-1 w-full flex justify-center lg:justify-end">
              <HeroDemo />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST STATS BAR ──────────────────────────────────────── */}
      <section className="border-y border-white/6 bg-white/[0.02] py-5 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: "7",   label: "Execution languages",  color: "text-yellow-400" },
            { val: "12",  label: "Preview formats",       color: "text-blue-400"  },
            { val: "24",  label: "Starter templates",     color: "text-green-400" },
            { val: "<1s", label: "Time to first output",  color: "text-pink-400"  },
          ].map(s => (
            <div key={s.label}>
              <div className={`text-2xl font-black font-mono ${s.color} mb-0.5`}>{s.val}</div>
              <div className="text-xs text-white/40 font-mono">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block font-mono text-xs text-[#4ade80] border border-[#4ade80]/20 bg-[#4ade80]/8 px-3 py-1 rounded-full mb-4">
              Features
            </span>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Everything you need.{" "}
              <span className="text-white/40">Nothing you don't.</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Built for speed. Every feature ships you faster than any alternative.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className={`bg-[#161b22] border rounded-xl p-6 transition-all duration-200 ${f.color}`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LANGUAGES ────────────────────────────────────────────── */}
      <section id="languages" className="py-24 px-4 border-t border-white/6 bg-[#0a0f14]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block font-mono text-xs text-blue-400 border border-blue-400/20 bg-blue-400/8 px-3 py-1 rounded-full mb-4">
              Language Support
            </span>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              12 languages.<br />
              <span className="text-[#4ade80]">One editor.</span>
            </h2>
            <p className="text-white/50 text-lg">
              7 execute server-side · 5 render live in the browser · 3 build mobile APKs
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {LANG_GRID.map(lang => (
              <Link
                key={lang.name}
                href="/ide"
                className={`flex flex-col items-start gap-2 p-4 rounded-xl border ${lang.bg} hover:scale-[1.03] transition-transform cursor-pointer`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">{lang.icon}</span>
                  {lang.runnable === true && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-[#4ade80]/15 text-[#4ade80] border border-[#4ade80]/20">
                      run
                    </span>
                  )}
                  {lang.runnable === null && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-orange-400/15 text-orange-400 border border-orange-400/20">
                      build
                    </span>
                  )}
                  {lang.runnable === false && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-purple-400/15 text-purple-400 border border-purple-400/20">
                      preview
                    </span>
                  )}
                </div>
                <span className={`text-sm font-semibold ${lang.color}`}>{lang.name}</span>
                <span className="text-[9px] text-white/30 font-mono leading-tight">{lang.sub}</span>
              </Link>
            ))}
          </div>

          <p className="text-center text-xs font-mono text-white/25 mt-4">
            ⚡ run = executes on the server · 👁 preview = renders in the browser · 🔨 build = queues an APK build
          </p>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 border-t border-white/6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block font-mono text-xs text-orange-400 border border-orange-400/20 bg-orange-400/8 px-3 py-1 rounded-full mb-4">
              How it works
            </span>
            <h2 className="text-3xl md:text-5xl font-black mb-4">Up and running in seconds</h2>
            <p className="text-white/50 text-lg">No account required. Sign up only when you want to save.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex gap-4 p-6 bg-[#161b22] border border-white/8 rounded-xl hover:border-white/15 transition-colors">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    {s.icon}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px flex-1 bg-white/8 my-1" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#4ade80]/50 block mb-1">{s.n}</span>
                  <h3 className="font-bold text-white mb-1.5">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARE ──────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/6 bg-[#0a0f14]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block font-mono text-xs text-pink-400 border border-pink-400/20 bg-pink-400/8 px-3 py-1 rounded-full mb-4">
              Comparison
            </span>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              Why CloudIDE wins on{" "}
              <span className="text-[#4ade80]">language breadth</span>
            </h2>
            <p className="text-white/50 text-lg">
              No free tool runs as many languages and previews as many formats.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.03]">
                  <th className="text-left px-4 py-3 font-mono text-xs text-white/40 font-normal">Feature</th>
                  <th className="px-4 py-3 font-mono text-xs text-[#4ade80] font-bold">CloudIDE</th>
                  <th className="px-4 py-3 font-mono text-xs text-white/30 font-normal hidden sm:table-cell">CodePen</th>
                  <th className="px-4 py-3 font-mono text-xs text-white/30 font-normal hidden md:table-cell">JSFiddle</th>
                  <th className="px-4 py-3 font-mono text-xs text-white/30 font-normal hidden lg:table-cell">StackBlitz</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row, i) => (
                  <tr
                    key={row.label}
                    className={[
                      "border-b border-white/5 transition-colors hover:bg-white/[0.02]",
                      i % 2 === 0 ? "" : "bg-white/[0.01]",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3 text-sm text-white/60 font-mono">{row.label}</td>
                    <td className="px-4 py-3 text-center">
                      <Check size={15} className="text-[#4ade80] mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {row.codepen
                        ? <Check size={15} className="text-white/30 mx-auto" />
                        : <span className="text-white/15 font-mono text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      {row.jsfiddle
                        ? <Check size={15} className="text-white/30 mx-auto" />
                        : <span className="text-white/15 font-mono text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {row.stackblitz
                        ? <Check size={15} className="text-white/30 mx-auto" />
                        : <span className="text-white/15 font-mono text-sm">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs font-mono text-white/20 mt-4">
            All data based on free tier · Subject to change
          </p>
        </div>
      </section>

      {/* ── TEMPLATES ────────────────────────────────────────────── */}
      <section id="templates" className="py-24 px-4 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block font-mono text-xs text-amber-400 border border-amber-400/20 bg-amber-400/8 px-3 py-1 rounded-full mb-4">
              Templates
            </span>
            <h2 className="text-3xl md:text-5xl font-black mb-4">24 templates. All runnable.</h2>
            <p className="text-white/50 text-lg">Pick a starter and be writing real code in under 5 seconds.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
            {[
              { icon: "⚡", name: "JavaScript",    color: "text-yellow-400 bg-yellow-400/8  border-yellow-400/15" },
              { icon: "📘", name: "TypeScript",    color: "text-blue-400   bg-blue-400/8    border-blue-400/15"   },
              { icon: "🐍", name: "Python",        color: "text-green-400  bg-green-400/8   border-green-400/15"  },
              { icon: "🌐", name: "HTML Page",     color: "text-orange-400 bg-orange-400/8  border-orange-400/15" },
              { icon: "🎨", name: "CSS Animations",color: "text-pink-400   bg-pink-400/8    border-pink-400/15"   },
              { icon: "🖥️", name: "HTML Canvas",   color: "text-teal-400   bg-teal-400/8    border-teal-400/15"   },
              { icon: "🧮", name: "Algorithms",    color: "text-indigo-400 bg-indigo-400/8  border-indigo-400/15" },
              { icon: "🐚", name: "Bash Script",   color: "text-lime-400   bg-lime-400/8    border-lime-400/15"   },
              { icon: "⚙️", name: "C Program",     color: "text-sky-400    bg-sky-400/8     border-sky-400/15"    },
              { icon: "🔩", name: "C++ Program",   color: "text-violet-400 bg-violet-400/8  border-violet-400/15" },
              { icon: "🔌", name: "API Mock",      color: "text-emerald-400 bg-emerald-400/8 border-emerald-400/15"},
              { icon: "🔍", name: "Regex Playground",color:"text-red-400   bg-red-400/8     border-red-400/15"    },
              { icon: "🧱", name: "Data Structures",color:"text-amber-400  bg-amber-400/8   border-amber-400/15"  },
              { icon: "📊", name: "Python Data",   color: "text-cyan-400   bg-cyan-400/8    border-cyan-400/15"   },
              { icon: "📋", name: "JSON Explorer", color: "text-yellow-300 bg-yellow-300/8  border-yellow-300/15" },
              { icon: "🎭", name: "SVG Art",       color: "text-fuchsia-400 bg-fuchsia-400/8 border-fuchsia-400/15"},
              { icon: "📄", name: "Markdown",      color: "text-purple-400 bg-purple-400/8  border-purple-400/15" },
              { icon: "🔬", name: "Perl Script",   color: "text-rose-400   bg-rose-400/8    border-rose-400/15"   },
              { icon: "🐦", name: "Flutter",       color: "text-cyan-400   bg-cyan-400/8    border-cyan-400/15"   },
              { icon: "⚛",  name: "React Native",  color: "text-blue-300   bg-blue-300/8    border-blue-300/15"   },
              { icon: "🤖", name: "Android",       color: "text-green-300  bg-green-300/8   border-green-300/15"  },
              { icon: "🍎", name: "iOS Swift",     color: "text-red-400    bg-red-400/8     border-red-400/15"    },
              { icon: "🦋", name: "Kotlin",        color: "text-purple-300 bg-purple-300/8  border-purple-300/15" },
              { icon: "📱", name: "Ionic/Angular", color: "text-blue-500   bg-blue-500/8    border-blue-500/15"   },
            ].map(t => (
              <Link
                key={t.name}
                href="/ide"
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${t.color} hover:scale-105 transition-transform cursor-pointer`}
              >
                <span className="text-2xl">{t.icon}</span>
                <span className="text-[11px] font-semibold text-center leading-tight">{t.name}</span>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/ide"
              className="inline-flex items-center gap-2 text-sm font-mono text-[#4ade80]/70 hover:text-[#4ade80] transition-colors"
            >
              Browse all templates in the IDE
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 border-t border-white/6 bg-[#0a0f14]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block font-mono text-xs text-violet-400 border border-violet-400/20 bg-violet-400/8 px-3 py-1 rounded-full mb-4">
              Pricing
            </span>
            <h2 className="text-3xl md:text-5xl font-black mb-4">Simple pricing</h2>
            <p className="text-white/50 text-lg">Free for solo devs. Pro for when you're serious.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`relative bg-[#161b22] border-2 ${plan.color} rounded-2xl p-8`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#4ade80] text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-6">
                  <div className="text-xs text-white/40 font-mono mb-1 uppercase tracking-widest">{plan.name}</div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-5xl font-black">{plan.price}</span>
                    <span className="text-white/35 text-sm pb-1.5">/ {plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                      <Check size={13} className="text-[#4ade80] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-3 px-5 rounded-full text-sm transition-all ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────── */}
      <section className="py-28 px-4 border-t border-white/6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#4ade80]/5 blur-[100px]" />
        </div>
        <div className="max-w-2xl mx-auto relative">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-full px-4 py-1.5 text-xs font-mono text-[#4ade80]">
              <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
              Live now · Zero downtime
            </div>
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-5 leading-tight">
            Ready to start building?
          </h2>
          <p className="text-white/45 text-lg mb-10 leading-relaxed">
            No installs. No setup. No credit card. Open the editor and run your first line
            of code in under 5 seconds — completely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ide"
              className="inline-flex items-center justify-center gap-2.5 bg-[#4ade80] text-black font-bold px-10 py-4 rounded-full text-lg hover:bg-[#4ade80]/90 transition-all hover:scale-105 shadow-[0_0_40px_rgba(74,222,128,0.2)]"
            >
              <Terminal size={18} />
              Open the IDE — it's free
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 border border-white/15 text-white/60 px-8 py-4 rounded-full text-base hover:border-white/35 hover:text-white transition-colors"
            >
              <Eye size={15} />
              Browse community projects
            </Link>
          </div>
          <p className="mt-6 text-xs font-mono text-white/20">
            Free forever · 50 runs/day · No credit card · Open the IDE in 1 click
          </p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/6 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Box size={18} className="text-[#4ade80]" />
                <span className="font-mono font-bold tracking-widest uppercase text-white">CloudIDE</span>
              </div>
              <p className="text-sm text-white/30 max-w-xs leading-relaxed">
                A browser-based cloud IDE with real execution, live previews, and a mobile APK builder.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-3">Product</div>
                <div className="space-y-2">
                  <Link href="/ide"     className="block text-white/50 hover:text-white transition-colors">IDE</Link>
                  <Link href="/explore" className="block text-white/50 hover:text-white transition-colors">Explore</Link>
                  <a href="#templates"  className="block text-white/50 hover:text-white transition-colors">Templates</a>
                  <a href="#pricing"    className="block text-white/50 hover:text-white transition-colors">Pricing</a>
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-3">Languages</div>
                <div className="space-y-2">
                  {["JavaScript", "Python", "C / C++", "Bash", "TypeScript"].map(l => (
                    <Link key={l} href="/ide" className="block text-white/50 hover:text-white transition-colors">{l}</Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-3">Account</div>
                <div className="space-y-2">
                  <Link href="/auth"    className="block text-white/50 hover:text-white transition-colors">Sign in</Link>
                  <Link href="/auth"    className="block text-white/50 hover:text-white transition-colors">Register</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/25 font-mono">
            <span>© {new Date().getFullYear()} CloudIDE. All rights reserved.</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
