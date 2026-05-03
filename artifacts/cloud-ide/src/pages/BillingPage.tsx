import { useState } from "react";
import { Link } from "wouter";
import { Zap, Check, Box, ArrowLeft, CreditCard, Gauge, Calendar, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  highlight: boolean;
  features: string[];
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    features: [
      "50 code runs/day",
      "5 projects",
      "Community Explore gallery",
      "All languages (JS, TS, Python, C++, …)",
      "HTML/CSS live preview",
      "1-day version history",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$9",
    period: "/ month",
    highlight: true,
    badge: "Most Popular",
    features: [
      "Unlimited code runs",
      "Unlimited projects",
      "AI code assistant",
      "Interactive terminal",
      "Git push/pull (GitHub PAT)",
      "Deploy preview URLs",
      "30-day version history",
      "Priority support",
    ],
  },
  {
    id: "team",
    name: "Team",
    price: "$29",
    period: "/ month",
    highlight: false,
    badge: "Coming Soon",
    features: [
      "Everything in Pro",
      "Real-time collaboration",
      "Shared team projects",
      "Custom domains",
      "SSO / SAML",
      "Dedicated support",
    ],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const [currentPlan] = useState<string>("free");

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <div className="border-b border-white/8 bg-[#161b22]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/ide" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm font-mono">
              <ArrowLeft size={13} />
              Back to IDE
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Box size={16} className="text-[#4ade80]" />
              <span className="font-mono font-bold text-white text-sm tracking-widest uppercase">CloudIDE</span>
            </div>
          </div>
          {user && (
            <span className="text-[11px] font-mono text-white/30">{user.email}</span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Usage */}
        {user && (
          <div className="bg-[#161b22] border border-white/8 rounded-xl p-6 mb-10">
            <h2 className="text-sm font-semibold text-white/80 mb-4 flex items-center gap-2">
              <Gauge size={14} className="text-[#4ade80]" />
              Current Usage
              <span className="ml-auto text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 capitalize">
                {currentPlan} plan
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <UsageStat label="Code Runs Today" value={12} max={50} unit="runs" />
              <UsageStat label="Projects" value={3} max={5} unit="projects" />
              <UsageStat label="Storage" value={2.1} max={10} unit="MB" />
            </div>
          </div>
        )}

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-3">Simple, transparent pricing</h1>
          <p className="text-white/40 text-sm">Start free. Upgrade when you need more power.</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border p-6 flex flex-col transition-all ${
                plan.highlight
                  ? "border-[#4ade80]/40 bg-[#4ade80]/5 shadow-[0_0_30px_rgba(74,222,128,0.08)]"
                  : "border-white/8 bg-[#161b22]"
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  plan.highlight
                    ? "bg-[#4ade80] text-black"
                    : "bg-white/10 text-white/40"
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-bold text-white mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-white/60">
                    <Check size={12} className="text-[#4ade80] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.id === currentPlan ? (
                <div className="py-2 rounded-lg border border-[#4ade80]/30 text-center text-[#4ade80]/70 text-sm font-semibold">
                  Current Plan
                </div>
              ) : plan.badge === "Coming Soon" ? (
                <div className="py-2 rounded-lg border border-white/10 text-center text-white/30 text-sm font-semibold cursor-not-allowed">
                  Coming Soon
                </div>
              ) : (
                <button
                  onClick={() => alert("Payment integration coming soon. CloudIDE is currently in beta — Pro features are free during beta.")}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "bg-[#4ade80] text-black hover:bg-[#4ade80]/90"
                      : "border border-white/20 text-white/60 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {plan.highlight ? "Upgrade to Pro" : "Get Started"}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-lg font-bold text-white/80 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "What counts as a code run?",
                a: "Every time you click Run (or press Ctrl+Enter), that's one run. HTML/CSS/Markdown previews are free — only backend execution counts.",
              },
              {
                q: "Do I lose my projects if I downgrade?",
                a: "No. Your projects are safe. You just won't be able to create new ones above the limit until you free up space or upgrade.",
              },
              {
                q: "Is there a student discount?",
                a: "Yes! Email us with your .edu address for 50% off Pro. We're committed to making coding accessible to everyone.",
              },
              {
                q: "When will Team plan be available?",
                a: "We're targeting Q2 2025 for Team plan. Sign up for the waitlist and you'll get early access pricing.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-[#161b22] border border-white/8 rounded-lg p-4">
                <p className="text-sm font-semibold text-white/80 mb-2">{q}</p>
                <p className="text-[13px] text-white/45 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-12 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-white/25 text-[12px]">
            <CreditCard size={12} />
            <span>Secure payments via Stripe · Cancel anytime · No hidden fees</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-white/20 text-[11px]">
            <Calendar size={10} />
            <span>During beta, all Pro features are available for free.</span>
          </div>
          <a
            href="mailto:hello@cloudide.dev"
            className="inline-flex items-center gap-1 text-[11px] text-white/25 hover:text-white/50 transition-colors"
          >
            <ExternalLink size={9} />
            Questions? hello@cloudide.dev
          </a>
        </div>
      </div>
    </div>
  );
}

function UsageStat({ label, value, max, unit }: { label: string; value: number; max: number; unit: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const isHigh = pct >= 80;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-white/40 font-mono">{label}</span>
        <span className="text-[11px] font-mono text-white/60">
          {value} / {max} {unit}
        </span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-orange-400" : "bg-[#4ade80]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
