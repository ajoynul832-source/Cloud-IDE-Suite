import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Box, Play, Zap, Globe, Smartphone, Code2, GitBranch, Share2, ChevronRight, Terminal, FileCode, Check } from "lucide-react";

const CODE_SNIPPETS = [
  `// JavaScript — runs instantly
const nums = [1,2,3,4,5];
const doubled = nums.map(n => n * 2);
console.log("Doubled:", doubled);
// → Doubled: [2, 4, 6, 8, 10]`,
  `# Python — zero setup
import math
primes = [n for n in range(2,50)
          if all(n%i for i in range(2,n))]
print("Primes:", primes)`,
  `<!-- HTML — live preview
<!DOCTYPE html>
<html>
<body style="background:#0d1117;color:#58a6ff">
  <h1>Hello from Cloud IDE!</h1>
  <p>Edit and see changes instantly.</p>
</body>
</html>`,
];

function TypewriterCode() {
  const [snippetIdx, setSnippetIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [charIdx, setCharIdx] = useState(0);

  const current = CODE_SNIPPETS[snippetIdx];

  useEffect(() => {
    if (charIdx < current.length) {
      const t = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx + 1));
        setCharIdx(i => i + 1);
      }, 18);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setSnippetIdx(i => (i + 1) % CODE_SNIPPETS.length);
        setDisplayed("");
        setCharIdx(0);
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [charIdx, current]);

  return (
    <pre className="text-sm font-mono text-left leading-relaxed whitespace-pre-wrap break-words text-green-400">
      {displayed}
      <span className="animate-pulse text-primary">▋</span>
    </pre>
  );
}

const FEATURES = [
  {
    icon: <Zap size={22} className="text-yellow-400" />,
    title: "Instant Execution",
    desc: "Click Run and see output in under a second. No installs, no config, no waiting.",
  },
  {
    icon: <Code2 size={22} className="text-blue-400" />,
    title: "10 Languages Ready",
    desc: "JS, TS, Python, Bash, Perl, C/C++ execute server-side. HTML, CSS, Markdown, JSON and SVG render live in the preview panel.",
  },
  {
    icon: <Smartphone size={22} className="text-green-400" />,
    title: "Mobile APK Builder",
    desc: "Write Flutter or Android code and compile a real APK — straight from the browser.",
  },
  {
    icon: <Globe size={22} className="text-purple-400" />,
    title: "Live Previews",
    desc: "HTML renders as a live page. CSS applies to real elements. Markdown renders to styled HTML. JSON gets a syntax-highlighted viewer.",
  },
  {
    icon: <GitBranch size={22} className="text-orange-400" />,
    title: "Project Versions",
    desc: "Save named snapshots of your work and restore any version with one click.",
  },
  {
    icon: <Share2 size={22} className="text-pink-400" />,
    title: "Share Instantly",
    desc: "Generate a public link to your project. Anyone can view and fork your code.",
  },
];

const TEMPLATES = [
  { icon: "⚡", name: "JavaScript",  color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  { icon: "🔷", name: "TypeScript",  color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/20" },
  { icon: "🐍", name: "Python",      color: "text-green-400",  bg: "bg-green-400/10 border-green-400/20" },
  { icon: "🌐", name: "HTML",        color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/20" },
  { icon: "🎨", name: "CSS",         color: "text-pink-400",   bg: "bg-pink-400/10 border-pink-400/20" },
  { icon: "📄", name: "Markdown",    color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/20" },
  { icon: "🐚", name: "Bash",        color: "text-lime-400",   bg: "bg-lime-400/10 border-lime-400/20" },
  { icon: "⚙️", name: "C / C++",     color: "text-sky-400",    bg: "bg-sky-400/10 border-sky-400/20" },
  { icon: "🐦", name: "Flutter",     color: "text-cyan-400",   bg: "bg-cyan-400/10 border-cyan-400/20" },
  { icon: "⚛",  name: "React Native",color: "text-blue-300",  bg: "bg-blue-300/10 border-blue-300/20" },
  { icon: "🤖", name: "Android",     color: "text-green-300",  bg: "bg-green-300/10 border-green-300/20" },
  { icon: "🍎", name: "iOS Swift",   color: "text-red-400",    bg: "bg-red-400/10 border-red-400/20" },
];

const STEPS = [
  { n: "01", title: "Open the IDE", desc: "No account needed. The editor opens instantly with working JavaScript code." },
  { n: "02", title: "Write your code", desc: "Full Monaco editor with syntax highlighting, autocomplete, and error detection." },
  { n: "03", title: "Click Run", desc: "Output streams to the Console in real time. HTML renders as a live preview." },
  { n: "04", title: "Save & share", desc: "Sign in to save projects, create versions, and share public links." },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    color: "border-border",
    badge: null,
    features: [
      "50 runs per day",
      "JS, TS, Python, Bash, Perl, C/C++, HTML, CSS, Markdown, SVG",
      "Unlimited file edits",
      "3 saved projects",
      "Public share links",
    ],
    cta: "Start for free",
    ctaStyle: "border border-primary text-primary hover:bg-primary hover:text-black",
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    color: "border-primary",
    badge: "Most popular",
    features: [
      "Unlimited runs",
      "All languages + APK builds",
      "Unlimited saved projects",
      "Version history",
      "Private projects",
      "Priority support",
    ],
    cta: "Coming soon",
    ctaStyle: "bg-primary text-black font-bold hover:bg-primary/90",
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#0d1117]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="text-[#4ade80]" size={20} />
            <span className="font-mono font-bold text-white tracking-widest uppercase text-sm">CloudIDE</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#templates" className="hover:text-white transition-colors">Templates</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="hidden md:block text-sm text-white/60 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/ide"
              className="flex items-center gap-1.5 bg-[#4ade80] text-black text-sm font-bold px-4 py-1.5 rounded-full hover:bg-[#4ade80]/90 transition-colors"
            >
              <Play size={12} fill="black" />
              Start coding
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#4ade80]/5 blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Left — text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-full px-3 py-1 text-xs font-mono text-[#4ade80] mb-6">
                <span className="w-1.5 h-1.5 bg-[#4ade80] rounded-full animate-pulse" />
                No install required — runs in your browser
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-4">
                Code. Run. Build.
                <br />
                <span className="text-[#4ade80]">Ship from anywhere.</span>
              </h1>

              <p className="text-lg text-white/60 mb-8 max-w-xl mx-auto lg:mx-0">
                A full cloud IDE that runs JS, TS, Python, Bash, Perl, C/C++ and previews HTML,
                CSS, Markdown, JSON &amp; SVG — with a Flutter &amp; Android APK builder built in.
                No setup. Open and code.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/ide"
                  className="flex items-center justify-center gap-2 bg-[#4ade80] text-black font-bold px-6 py-3 rounded-full text-base hover:bg-[#4ade80]/90 transition-all hover:scale-105"
                >
                  <Play size={15} fill="black" />
                  Start coding free
                </Link>
                <a
                  href="#how-it-works"
                  className="flex items-center justify-center gap-2 border border-white/20 text-white/80 px-6 py-3 rounded-full text-base hover:border-white/50 transition-colors"
                >
                  See how it works
                  <ChevronRight size={14} />
                </a>
              </div>

              <p className="mt-4 text-xs text-white/30 font-mono">
                Free forever · 50 runs/day · No credit card
              </p>
            </div>

            {/* Right — code window */}
            <div className="flex-1 w-full max-w-lg">
              <div className="rounded-xl border border-white/10 bg-[#161b22] shadow-2xl overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1c2128] border-b border-white/8">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="ml-3 text-xs font-mono text-white/30">cloudide.app</span>
                  <div className="ml-auto flex items-center gap-2 bg-[#4ade80] text-black text-[10px] font-bold px-2.5 py-0.5 rounded">
                    <Play size={8} fill="black" />
                    Run
                  </div>
                </div>
                {/* Code area */}
                <div className="p-4 min-h-[220px] bg-[#0d1117]">
                  <TypewriterCode />
                </div>
                {/* Console output */}
                <div className="border-t border-white/8 px-4 py-3 bg-[#0d1117]/80 font-mono text-xs text-white/50">
                  <span className="text-[#4ade80]">▶ Output</span>
                  <span className="ml-2 text-white/40">Doubled: [2, 4, 6, 8, 10]</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything you need. Nothing you don't.</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Built for speed. Every feature ships you faster than any alternative.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-[#161b22] border border-white/8 rounded-xl p-6 hover:border-white/20 transition-colors">
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 border-t border-white/6 bg-[#0a0f14]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Up and running in seconds</h2>
            <p className="text-white/50 text-lg">No account required to start. Sign up only when you want to save.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STEPS.map(s => (
              <div key={s.n} className="flex gap-4 p-5 bg-[#161b22] border border-white/8 rounded-xl">
                <span className="text-3xl font-black text-[#4ade80]/20 font-mono shrink-0 leading-none mt-1">{s.n}</span>
                <div>
                  <h3 className="font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEMPLATES ────────────────────────────────────────────────────── */}
      <section id="templates" className="py-20 px-4 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Start with a template</h2>
            <p className="text-white/50 text-lg">Pick a starter and be writing real code in under 5 seconds.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TEMPLATES.map(t => (
              <Link
                key={t.name}
                href="/ide"
                className={`flex flex-col items-center gap-2 p-5 rounded-xl border ${t.bg} hover:scale-105 transition-transform cursor-pointer`}
              >
                <span className="text-3xl">{t.icon}</span>
                <span className={`text-sm font-semibold ${t.color}`}>{t.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 border-t border-white/6 bg-[#0a0f14]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Simple pricing</h2>
            <p className="text-white/50 text-lg">Free for solo devs. Pro for when you're serious.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name} className={`relative bg-[#161b22] border-2 ${plan.color} rounded-2xl p-7`}>
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4ade80] text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-5">
                  <div className="text-sm text-white/50 font-mono mb-1">{plan.name}</div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-white/40 text-sm pb-1">/ {plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check size={14} className="text-[#4ade80] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/ide"
                  className={`block text-center py-2.5 px-5 rounded-full text-sm transition-all ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Ready to start building?
          </h2>
          <p className="text-white/50 text-lg mb-8">
            No installs. No setup. Open the editor and run your first line of code in seconds.
          </p>
          <Link
            href="/ide"
            className="inline-flex items-center gap-2 bg-[#4ade80] text-black font-bold px-8 py-4 rounded-full text-lg hover:bg-[#4ade80]/90 transition-all hover:scale-105"
          >
            <Terminal size={18} />
            Open the IDE — it's free
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/6 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <Box size={16} className="text-[#4ade80]" />
            <span className="font-mono font-bold tracking-widest uppercase text-white/50">CloudIDE</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/ide" className="hover:text-white transition-colors">IDE</Link>
            <Link href="/explore" className="hover:text-white transition-colors">Explore</Link>
            <Link href="/auth" className="hover:text-white transition-colors">Sign in</Link>
          </div>
          <span>© {new Date().getFullYear()} CloudIDE. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
