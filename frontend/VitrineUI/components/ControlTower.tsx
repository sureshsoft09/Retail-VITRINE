import React, { useState } from "react";
import {
  TrendingUp,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Award,
  Bot,
  Cpu,
  ShieldAlert,
  FileCheck2,
  Sliders,
  DollarSign,
  PackageCheck,
  Percent,
  Clock,
  ArrowRight,
  Shirt,
  Radio,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "../api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useVitrineStore } from "../store";
import { NavTab } from "./Header";

interface ControlTowerProps {
  onNavigate?: (tab: NavTab) => void;
}

const conversionComparisonData = [
  {
    stage: "Agent Discovery",
    baseline: 32,
    vitrine: 94,
    delta: "+62% Lift",
    note: "Product Brain 21-point attribute enrichment & Virtual Try-On",
  },
  {
    stage: "ATP Verification",
    baseline: 48,
    vitrine: 91,
    delta: "+43% Lift",
    note: "Autonomous cross-hub ATP routing (DC-North, DC-South & Flagship)",
  },
  {
    stage: "Promise Critic",
    baseline: 41,
    vitrine: 99,
    delta: "+58% Lift",
    note: "11-Gate deterministic SLA, margin floor & cutoff validation",
  },
  {
    stage: "Order Conversion",
    baseline: 38,
    vitrine: 89,
    delta: "+51% Lift",
    note: "Instant autonomous checkout & cryptographic receipt issuance",
  },
];

const revenueTrendData = [
  { day: "Mon", baseline: 34200, protected: 71400, orders: 184, lift: "+$37.2k" },
  { day: "Tue", baseline: 36800, protected: 78900, orders: 202, lift: "+$42.1k" },
  { day: "Wed", baseline: 35100, protected: 82400, orders: 215, lift: "+$47.3k" },
  { day: "Thu", baseline: 39400, protected: 88200, orders: 229, lift: "+$48.8k" },
  { day: "Fri", baseline: 44000, protected: 96500, orders: 254, lift: "+$52.5k" },
  { day: "Sat", baseline: 48200, protected: 108400, orders: 281, lift: "+$60.2k" },
  { day: "Sun", baseline: 41900, protected: 94800, orders: 248, lift: "+$52.9k" },
];

export const ControlTower: React.FC<ControlTowerProps> = ({ onNavigate }) => {
  const {
    ledgerCommitments,
    fraudRecords,
    brainMode,
    setBrainMode,
    setProductHubSection,
    maxOrderUSD,
    discountCapPct,
    marginFloorPct,
    killSwitchActive,
  } = useVitrineStore();

  const [isRunningSentinel, setIsRunningSentinel] = useState(false);
  const [sentinelEvent, setSentinelEvent] = useState<any | null>(null);
  const [architectureExpanded, setArchitectureExpanded] = useState(false);

  const handleRunSentinel = async () => {
    setIsRunningSentinel(true);
    try {
      const res = await api.runSupplierRiskSentinel();
      setSentinelEvent(res);
    } catch (err) {
      console.error("Failed to run supplier sentinel:", err);
    } finally {
      setIsRunningSentinel(false);
    }
  };

  const navigateTo = (tab: NavTab, subSection?: "catalog" | "vto") => {
    if (subSection) {
      setProductHubSection(subSection);
    }
    if (onNavigate) {
      onNavigate(tab);
    }
  };


  const executiveKpis = [
    {
      label: "Revenue Protected",
      value: "$284,920",
      change: "+24.8% vs last month",
      sub: "Saved via autonomous cross-hub routing & agent-accepted alternatives",
      icon: DollarSign,
      badge: "Autonomous Commerce",
      color: "sage",
      targetTab: "theatre" as NavTab,
    },
    {
      label: "Orders Completed",
      value: `${1426 + ledgerCommitments.length}`,
      change: "100% Commitment Critic Verified",
      sub: "AI buyer agent transactions approved with verified warehouse stock",
      icon: Bot,
      badge: "AI Buyer Agents",
      color: "sage",
      targetTab: "theatre" as NavTab,
    },
    {
      label: "Inventory Health",
      value: "96.8%",
      change: "3 Fulfillment Hubs Synced",
      sub: "Live ATP balanced across DC-NORTH, Flagship Store 042 & DC-SOUTH",
      icon: PackageCheck,
      badge: "Promise Verification",
      color: "sage",
      targetTab: "promise" as NavTab,
    },
    {
      label: "Promise Accuracy",
      value: "99.4%",
      change: "Zero Unverified Promises",
      sub: "Every delivery window & margin floor verified by the Commitment Critic",
      icon: Award,
      badge: "Commitment Critic",
      color: "sage",
      targetTab: "promise" as NavTab,
    },
    {
      label: "Products Enhanced",
      value: brainMode === "enriched" ? "92% Agent-Ready" : "41% Raw",
      change: "1,240 Apparel SKUs Indexed",
      sub:
        brainMode === "enriched"
          ? "Product Brain enriched fabric, sizing & care for AI buyer agent discovery"
          : "59% of attributes missing for AI buyer agents — click to enrich",
      icon: Sparkles,
      badge: "Product Discoverability",
      color: brainMode === "enriched" ? "berry" : "gold",
      targetTab: "brain" as NavTab,
    },
    {
      label: "Fraud Prevented",
      value: "$42,680",
      change: `${fraudRecords.length} Adversarial Agents Quarantined`,
      sub: "Hostile buyer bots & replayed payment mandates stopped pre-allocation",
      icon: ShieldAlert,
      badge: "Trust & Sentinel",
      color: "clay",
      targetTab: "fraud" as NavTab,
    },
    {
      label: "Order Conversion",
      value: "89.0%",
      change: "+51.0% vs 38.0% Legacy Store",
      sub: "AI buyer agent inquiries converted into profitable, verified orders",
      icon: Percent,
      badge: "Agent Conversion",
      color: "sage",
      targetTab: "theatre" as NavTab,
    },
    {
      label: "Fulfillment Performance",
      value: "18.4 hrs",
      change: "99.2% Carrier Cutoff SLA",
      sub: "Average dispatch-to-door velocity across autonomous commitments",
      icon: Clock,
      badge: "Promise Intelligence",
      color: "sage",
      targetTab: "promise" as NavTab,
    },
  ];

  const capabilityCards = [
    {
      step: "01",
      title: "Product Brain & Discoverability",
      capability: "Product Brain",
      question: "Can AI buyer agents and customers find our products?",
      description:
        "AI buyer agents reject products with missing measurements or unverified fabric specs. Product Brain enriches raw supplier data (41%) into agent-discoverable intelligence (92%) with Virtual Try-On.",
      outcome: "0 → 3 Agent-Discoverable SKUs · +240% Match Rate",
      icon: Sparkles,
      accent: "border-berry-200 bg-berry-50/35",
      badgeClass: "bg-berry-100 text-berry-800 border-berry-200",
      tab: "brain" as NavTab,
      subSection: "catalog" as const,
      cta: "Open Product Brain",
    },
    {
      step: "02",
      title: "Autonomous Buyer-Merchant Negotiation",
      capability: "Agent Commerce",
      question: "Can this autonomous order be fulfilled safely?",
      description:
        "Orchestrates real-time commerce with inbound AI Buyer Agents—validating stock, negotiating alternatives when primary hubs stock out, and enforcing the 11-point Commitment Critic.",
      outcome: "Autonomous Offer Generation & Critic Verification",
      icon: Bot,
      accent: "border-sage-200 bg-sage-50/35",
      badgeClass: "bg-sage-100 text-sage-800 border-sage-200",
      tab: "theatre" as NavTab,
      cta: "Open Agent Commerce",
    },
    {
      step: "03",
      title: "Promise Verification & Margin Intelligence",
      capability: "Promise Intelligence",
      question: "Can we verify and keep our fulfillment promise?",
      description:
        "Prevents AI hallucinations in fulfillment by verifying real-time Available-to-Promise (ATP), carrier transit cutoffs, supplier reliability, and net unit margin before any offer is issued.",
      outcome: "99.4% Promise Verification Accuracy",
      icon: Cpu,
      accent: "border-sage-200 bg-sage-50/35",
      badgeClass: "bg-sage-100 text-sage-800 border-sage-200",
      tab: "promise" as NavTab,
      cta: "Open Promise Intelligence",
    },
    {
      step: "04",
      title: "Autonomous Commerce Governance",
      capability: "Trust & Governance",
      question: "How much autonomy should commerce have?",
      description:
        `Defines deterministic merchant boundaries for autonomous agents: $${maxOrderUSD} max autonomous order value, ${discountCapPct}% discount cap, ${marginFloorPct}% net margin floor, and instant human-in-the-loop pause.`,
      outcome: "100% Margin & Policy Guardrail Enforcement",
      icon: Sliders,
      accent: "border-gold-200 bg-gold-50/35",
      badgeClass: "bg-gold-100 text-gold-800 border-gold-200",
      tab: "governance" as NavTab,
      cta: "Open Governance Rules",
    },
    {
      step: "05",
      title: "Buyer Agent Trust & Risk Sentinel",
      capability: "Trust & Governance",
      question: "Are we protecting commerce from adversarial agents?",
      description:
        "Inspects inbound buyer agents for replayed authorization mandates, shipping reroutes, and automated inventory scraping—paired with a legitimate VIP buyer fairness check.",
      outcome: "$42,680 Protected · 0% False VIP Declines",
      icon: ShieldAlert,
      accent: "border-clay-200 bg-clay-50/35",
      badgeClass: "bg-clay-100 text-clay-800 border-clay-200",
      tab: "fraud" as NavTab,
      cta: "Open Buyer Sentinel",
    },
    {
      step: "06",
      title: "Immutable Commitment Auditability",
      capability: "Audit Ledger",
      question: "Can we prove every autonomous promise we made?",
      description:
        "Records every Commitment Critic approval, AI buyer agent mandate, fulfillment node lock, and price offer into a verifiable Audit Ledger with downloadable Commitment Certificates.",
      outcome: `${ledgerCommitments.length} Sealed Commitment Certificates`,
      icon: FileCheck2,
      accent: "border-ivory-300 bg-ivory-100/70",
      badgeClass: "bg-ivory-200 text-ink-800 border-ivory-300",
      tab: "ledger" as NavTab,
      cta: "Open Audit Ledger",
    },
  ];

  return (
    <div className="space-y-6">
      {/* CONTROL TOWER HERO — Enterprise Commerce Platform + Agentic Commerce Intelligence */}
      <div className="rounded-2xl bg-gradient-to-br from-[#181614] via-[#211E1B] to-[#1D3B2C] text-white p-6 sm:p-7 shadow-lg border border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#95C9AA]">
                <Bot className="w-3.5 h-3.5" />
                <span>VITRINE Control Tower · Next-Generation Agent Commerce Operating System</span>
              </div>
              <button
                onClick={handleRunSentinel}
                disabled={isRunningSentinel}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4942A]/20 hover:bg-[#D4942A]/30 text-[#F6C867] border border-[#D4942A]/40 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Radio className={`w-3.5 h-3.5 ${isRunningSentinel ? "animate-spin" : "animate-pulse"}`} />
                <span>{isRunningSentinel ? "Querying Supply Chains..." : "Run Supplier Sentinel"}</span>
              </button>
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight">
              Enterprise Commerce Intelligence Built for AI Buyer Agents.
            </h1>
            <p className="text-xs sm:text-sm text-ivory-200 leading-relaxed max-w-3xl">
              Traditional storefronts lose{" "}
              <span className="underline decoration-[#D4942A] font-semibold text-white">
                62% of agentic and high-intent demand
              </span>{" "}
              because catalogs lack structured specs for <strong className="text-white">AI Buyer Agents</strong>, primary fulfillment hubs stock out, or unverified promises erode margin.{" "}
              <strong className="text-white">VITRINE</strong> unifies Product Brain, Promise Verification, the 11-Gate Commitment Critic, and Autonomous Governance into a single operational layer.
            </p>
          </div>

          {/* Right Agentic Conversion Lift Snapshot */}
          <div className="lg:col-span-4 bg-white/[0.06] backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-ivory-300">
                  Agentic Commerce Conversion
                </div>
                <div className="text-xs text-ivory-400 mt-0.5">
                  Legacy Storefront vs. VITRINE Agent OS
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-sage-500/20 text-[#95C9AA] border border-sage-500/30 text-xs font-bold">
                +51% Lift
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <div className="text-[11px] text-ivory-300">Legacy Catalog</div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-ivory-300 mt-0.5">
                  38.0%
                </div>
                <div className="text-[10px] text-clay-300 mt-0.5">
                  Rejected by buyer agents
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#2D6A4F]/30 border border-[#3B7A57]">
                <div className="text-[11px] text-[#95C9AA] font-semibold">
                  VITRINE Agent OS
                </div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-white mt-0.5 flex items-center gap-1">
                  <span>89.0%</span>
                  <ArrowUpRight className="w-4 h-4 text-[#95C9AA]" />
                </div>
                <div className="text-[10px] text-ivory-200 mt-0.5">
                  Critic-verified promises
                </div>
              </div>
            </div>

            <div className="text-[11px] text-ivory-300 flex items-center justify-between pt-0.5">
              <span>Commitment Critic Gate:</span>
              <span className="font-semibold text-[#95C9AA] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {killSwitchActive
                  ? "Paused (Manual Review)"
                  : "11/11 Checks Enforced"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE CLOUD RUN SUPPLIER RISK SENTINEL ALERT */}
      {sentinelEvent && (
        <div className="bg-[#FAF7F2] border-2 border-[#D4942A] rounded-2xl p-5 shadow-md animate-in fade-in space-y-3">
          <div className="flex items-center justify-between border-b border-[#D4942A]/30 pb-3">
            <div className="flex items-center gap-2 text-[#B7791F]">
              <AlertTriangle className="w-5 h-5 text-[#D4942A]" />
              <h3 className="font-serif font-bold text-base text-[#1C1917]">
                Autonomous Disruption Sentinel: Corridor Risk Detected
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4942A]/10 text-[#B7791F] border border-[#D4942A]/30 font-mono">
              Host: Cloud Run · A0 Sentinel
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-[#E8E2D6]">
              <span className="text-[10px] font-bold text-[#78716C] uppercase">Corridor / Node</span>
              <div className="font-bold text-[#1C1917] mt-0.5">{sentinelEvent.corridor || "Suez Transit / DC-SOUTH"}</div>
              <div className="text-[10px] text-[#9E4736] mt-1 font-semibold">Delay: +36 hours projected</div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E8E2D6]">
              <span className="text-[10px] font-bold text-[#78716C] uppercase">Corroborated Intelligence</span>
              <div className="text-[11px] text-[#44403C] mt-0.5">Reuters Maritime + Lloyd's Cargo Feed</div>
              <div className="text-[10px] text-[#2D6A4F] mt-1 font-semibold">Dual-source verified</div>
            </div>
            <div className="p-3 rounded-xl bg-white border border-[#E8E2D6]">
              <span className="text-[10px] font-bold text-[#78716C] uppercase">Autonomous Mitigation</span>
              <div className="text-[11px] text-[#2D6A4F] font-bold mt-0.5">Auto-rerouted to DC-NORTH</div>
              <div className="text-[10px] text-[#78716C] mt-1">Promise SLA protected before checkout</div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: THE 8 EXECUTIVE & AGENTIC COMMERCE KPIs */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-serif font-bold text-xl text-ink-900">
              Autonomous Commerce & Enterprise Performance Scorecard
            </h2>
            <p className="text-xs text-ink-600">
              Live commercial outcomes across AI buyer agent negotiations, Product Brain discoverability, Promise Verification, and Commitment Critic gates.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {brainMode === "raw" && (
              <button
                onClick={() => setBrainMode("enriched")}
                className="px-3 py-1.5 rounded-lg bg-berry-50 hover:bg-berry-100 text-berry-800 border border-berry-200 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-berry-600" />
                <span>Activate Product Brain Enrichment (41% → 92%)</span>
              </button>
            )}
            <span className="text-xs font-medium text-ink-500 bg-white px-3 py-1.5 rounded-lg border border-ivory-300">
              Telemetry Window: <strong className="text-ink-900">Last 30 Days (Live)</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {executiveKpis.map((kpi) => {
            const Icon = kpi.icon;
            const colorMap: Record<
              string,
              {
                cardBorder: string;
                iconBg: string;
                badgeBg: string;
                changeColor: string;
              }
            > = {
              sage: {
                cardBorder: "border-ivory-300 hover:border-sage-400",
                iconBg: "bg-sage-50 text-sage-700 border-sage-200",
                badgeBg: "bg-sage-50 text-sage-700 border-sage-200",
                changeColor: "text-sage-700",
              },
              berry: {
                cardBorder: "border-ivory-300 hover:border-berry-400",
                iconBg: "bg-berry-50 text-berry-700 border-berry-200",
                badgeBg: "bg-berry-50 text-berry-700 border-berry-200",
                changeColor: "text-berry-700",
              },
              gold: {
                cardBorder: "border-gold-300 hover:border-gold-500",
                iconBg: "bg-gold-50 text-gold-700 border-gold-200",
                badgeBg: "bg-gold-50 text-gold-800 border-gold-200",
                changeColor: "text-gold-700",
              },
              clay: {
                cardBorder: "border-ivory-300 hover:border-clay-400",
                iconBg: "bg-clay-50 text-clay-700 border-clay-200",
                badgeBg: "bg-clay-50 text-clay-700 border-clay-200",
                changeColor: "text-clay-700",
              },
            };
            const st = colorMap[kpi.color] || colorMap.sage;

            return (
              <div
                key={kpi.label}
                onClick={() => navigateTo(kpi.targetTab)}
                className={`p-4 sm:p-5 rounded-2xl bg-white border ${st.cardBorder} shadow-enterprise transition-all cursor-pointer group flex flex-col justify-between h-full`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${st.badgeBg}`}
                    >
                      {kpi.badge}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${st.iconBg} group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-ink-600">
                    {kpi.label}
                  </div>
                  <div className="text-2xl font-serif font-bold text-ink-900 mt-0.5">
                    {kpi.value}
                  </div>
                  <div
                    className={`text-xs font-bold mt-1 flex items-center gap-1 ${st.changeColor}`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>{kpi.change}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-ivory-200 flex items-start justify-between gap-2">
                  <p className="text-[11px] text-ink-600 leading-snug">
                    {kpi.sub}
                  </p>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-400 group-hover:text-ink-900 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ENHANCED VISUAL PERFORMANCE HUB (PICTORIAL CHARTS MOVED UP) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Chart: Enhanced Agentic Conversion Funnel */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-ivory-300 shadow-enterprise flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-ink-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sage-700" />
                  <span>AI Buyer Agent Conversion: Legacy Store vs. VITRINE</span>
                </h3>
                <p className="text-xs text-ink-600 mt-0.5">
                  How Product Brain discoverability and Promise Verification lift autonomous conversion from 38% to 89%.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-sage-50 text-sage-800 border border-sage-200 font-bold shrink-0">
                +51% Overall Lift
              </span>
            </div>

            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={conversionComparisonData}
                  margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E6DFD3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="stage"
                    stroke="#57534E"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#57534E"
                    fontSize={11}
                    tickLine={false}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl border border-ivory-300 shadow-lg text-xs space-y-1.5 min-w-[240px]">
                            <div className="font-serif font-bold text-ink-900 border-b border-ivory-200 pb-1 flex items-center justify-between">
                              <span>{data.stage}</span>
                              <span className="text-[10px] font-bold text-sage-800 bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200">
                                {data.delta}
                              </span>
                            </div>
                            <div className="space-y-1 text-[11px] pt-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-ink-500">VITRINE Agent OS:</span>
                                <span className="font-bold text-[#2D6A4F]">{data.vitrine}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-ink-500">Legacy Storefront:</span>
                                <span className="font-semibold text-ink-600">{data.baseline}%</span>
                              </div>
                              <div className="pt-1 border-t border-ivory-100 text-[10px] text-ink-600">
                                {data.note}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="baseline"
                    name="Legacy Storefront (%)"
                    fill="#D6CFC2"
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    dataKey="vitrine"
                    name="VITRINE Agent OS (%)"
                    radius={[5, 5, 0, 0]}
                  >
                    {conversionComparisonData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 3 ? "#2D6A4F" : "#3B7A57"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Enhanced Stage Breakdown Pills with Delta Badges */}
          <div className="mt-3 pt-3 border-t border-ivory-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {conversionComparisonData.map((d) => (
              <div key={d.stage} className="p-2 rounded-lg bg-ivory-50 border border-ivory-200">
                <div className="text-[10px] font-semibold text-ink-500">
                  {d.stage}
                </div>
                <div className="text-xs font-bold text-ink-900 mt-0.5 flex items-center justify-center gap-1">
                  <span>{d.baseline}%</span>
                  <span className="text-ink-400">→</span>
                  <span className="text-sage-800">{d.vitrine}%</span>
                </div>
                <div className="text-[9px] font-bold text-sage-800 mt-0.5">
                  {d.delta}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Chart: Enhanced Weekly Autonomous Revenue Protected */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-ivory-300 shadow-enterprise flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-ink-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-berry-700" />
                  <span>Autonomous Revenue Protected & Verified Commitments</span>
                </h3>
                <p className="text-xs text-ink-600 mt-0.5">
                  GMV captured via AI buyer agent discovery, multi-hub ATP routing, and Commitment Critic sign-off.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-berry-50 text-berry-800 border border-berry-200 font-bold shrink-0">
                $620.6K Weekly GMV
              </span>
            </div>

            {/* Quick Executive Metric Chips */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 rounded-lg bg-[#2D6A4F]/10 border border-[#2D6A4F]/20 text-center">
                <div className="text-[10px] text-sage-800 font-semibold">Weekly GMV</div>
                <div className="text-sm font-bold font-serif text-[#2D6A4F]">$620,600</div>
              </div>
              <div className="p-2 rounded-lg bg-ivory-50 border border-ivory-200 text-center">
                <div className="text-[10px] text-ink-600 font-semibold">Orders Completed</div>
                <div className="text-sm font-bold font-serif text-ink-900">1,613 orders</div>
              </div>
              <div className="p-2 rounded-lg bg-sage-50 border border-sage-200 text-center">
                <div className="text-[10px] text-sage-800 font-semibold">Zero-Hallucination</div>
                <div className="text-sm font-bold font-serif text-sage-800">100% Verified</div>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueTrendData}
                  margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorProtected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E6DFD3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    stroke="#57534E"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#57534E"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `$${Math.round(val / 1000)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl border border-ivory-300 shadow-lg text-xs space-y-1.5 min-w-[230px]">
                            <div className="font-serif font-bold text-ink-900 border-b border-ivory-200 pb-1 flex items-center justify-between">
                              <span>{data.day} Telemetry</span>
                              <span className="text-[10px] font-bold text-sage-800 bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200">
                                {data.orders} Orders
                              </span>
                            </div>
                            <div className="space-y-1 text-[11px] pt-0.5">
                              <div className="flex justify-between items-center">
                                <span className="text-ink-500">Autonomous Protected:</span>
                                <span className="font-bold text-[#2D6A4F]">${data.protected.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-ink-500">Legacy Unassisted:</span>
                                <span className="font-semibold text-ink-600">${data.baseline.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-sage-800 font-bold pt-1 border-t border-ivory-100">
                                <span>Protected Margin Lift:</span>
                                <span>+${(data.protected - data.baseline).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="baseline"
                    name="Legacy Unassisted Checkout"
                    stroke="#A8A29E"
                    fill="#E7E5E4"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="protected"
                    name="VITRINE Autonomous Commerce"
                    stroke="#2D6A4F"
                    fillOpacity={1}
                    fill="url(#colorProtected)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-ivory-200 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-600">
            <span>
              Primary Drivers:{" "}
              <strong className="text-ink-900">
                Promise Routing (42%) · Product Brain (38%) · Substitutions (20%)
              </strong>
            </span>
            <span className="font-bold text-sage-800">
              100% Critic Verified
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: COLLAPSIBLE ACCORDION — HOW CAPABILITIES WORK TOGETHER (DEFAULT: COLLAPSED) */}
      <div className="rounded-2xl bg-white border border-ivory-300 shadow-enterprise overflow-hidden transition-all">
        <button
          onClick={() => setArchitectureExpanded(!architectureExpanded)}
          className="w-full p-5 sm:p-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-ivory-50/70 transition-colors cursor-pointer"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage-50 text-sage-700 border border-sage-200 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sage-800 px-2 py-0.5 rounded-full bg-sage-50 border border-sage-200">
                  System Architecture & Synergy
                </span>
                <span className="text-xs text-ink-500">6 Core Capabilities</span>
              </div>
              <h3 className="font-serif font-bold text-lg text-ink-900 mt-1">
                How Product Brain, Promise Intelligence, Agent Commerce & Commitment Critic Work Together
              </h3>
              <p className="text-xs text-ink-600 mt-0.5">
                End-to-end orchestration connecting category discoverability, ATP promise assurance, buyer agent negotiation, and audit proof.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-xs font-semibold text-sage-800">
              {architectureExpanded ? "Collapse Details" : "Expand 6 Capabilities"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-ivory-100 border border-ivory-300 flex items-center justify-center text-ink-700">
              {architectureExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>
        </button>

        {/* Accordion Body (Only rendered when expanded) */}
        {architectureExpanded && (
          <div className="p-6 pt-0 border-t border-ivory-200 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {capabilityCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.step}
                    onClick={() => navigateTo(card.tab, card.subSection)}
                    className={`p-5 rounded-xl border ${card.accent} hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${card.badgeClass}`}
                        >
                          {card.step} · {card.capability}
                        </span>
                        <Icon className="w-4 h-4 text-ink-700" />
                      </div>
                      <h4 className="font-serif font-bold text-base text-ink-900">
                        {card.title}
                      </h4>
                      <div className="text-xs font-semibold text-sage-800 mt-1">
                        “{card.question}”
                      </div>
                      <p className="text-xs text-ink-600 mt-2 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-ivory-300/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-ink-800">
                        {card.outcome}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-sage-700 group-hover:translate-x-0.5 transition-transform">
                        <span>{card.cta}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: CAPABILITY & GOVERNANCE ALIGNMENT TABLE */}
      <div className="p-6 rounded-2xl bg-white border border-ivory-300 shadow-enterprise">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-serif font-bold text-ink-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sage-700" />
              <span>VITRINE Capability Matrix & Stakeholder Alignment</span>
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              How VITRINE's agentic capabilities serve commercial, merchandising, fulfillment, risk, and audit teams.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-ivory-300 text-ink-500 uppercase text-[10px] tracking-wider bg-ivory-50">
                <th className="py-3 px-4">VITRINE Capability</th>
                <th className="py-3 px-4">Enterprise Stakeholders</th>
                <th className="py-3 px-4">Agentic Intelligence Status</th>
                <th className="py-3 px-4">Verified Outcome</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200 text-ink-800">
              <tr className="hover:bg-ivory-50">
                <td className="py-3 px-4 font-semibold text-ink-900">
                  Product Brain & Virtual Try-On
                </td>
                <td className="py-3 px-4">Category & Merchandising Teams</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-berry-50 text-berry-700 border border-berry-200 font-semibold text-[11px]">
                    {brainMode === "enriched"
                      ? "92% Agent Discoverability Ready"
                      : "41% Raw Catalog (Enrichment Available)"}
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold">
                  3 of 3 Silk SKUs Indexed for AI Buyer Agents
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => navigateTo("brain", "catalog")}
                    className="text-sage-700 hover:text-sage-900 font-bold"
                  >
                    Open Product Brain →
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-ivory-50">
                <td className="py-3 px-4 font-semibold text-ink-900">
                  Promise Intelligence
                </td>
                <td className="py-3 px-4">Fulfillment & Supply Chain Managers</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-sage-50 text-sage-700 border border-sage-200 font-semibold text-[11px]">
                    ATP, Carrier SLA & Margin Engine Active
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold">
                  99.4% Promise Verification Accuracy
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => navigateTo("promise")}
                    className="text-sage-700 hover:text-sage-900 font-bold"
                  >
                    Open Promise Intelligence →
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-ivory-50">
                <td className="py-3 px-4 font-semibold text-ink-900">
                  Agent Commerce & Commitment Critic
                </td>
                <td className="py-3 px-4">Commercial & Order Operations</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-sage-50 text-sage-700 border border-sage-200 font-semibold text-[11px]">
                    11-Gate Commitment Critic Enforced
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold">
                  89.0% AI Buyer Agent Conversion
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => navigateTo("theatre")}
                    className="text-sage-700 hover:text-sage-900 font-bold"
                  >
                    Open Agent Commerce →
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-ivory-50">
                <td className="py-3 px-4 font-semibold text-ink-900">
                  Trust & Governance
                </td>
                <td className="py-3 px-4">Commercial Directors & Risk Teams</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-gold-50 text-gold-800 border border-gold-200 font-semibold text-[11px]">
                    Max ${maxOrderUSD} · Cap {discountCapPct}% · Floor {marginFloorPct}% · {fraudRecords.filter((r) => r.status === "QUARANTINED").length} Risk Holds
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold">
                  $42,680 Protected · 58.4% Avg Margin
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => navigateTo("governance")}
                    className="text-sage-700 hover:text-sage-900 font-bold"
                  >
                    Open Trust & Governance →
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-ivory-50">
                <td className="py-3 px-4 font-semibold text-ink-900">
                  Audit Ledger
                </td>
                <td className="py-3 px-4">Compliance & Finance Controllers</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-sage-50 text-sage-700 border border-sage-200 font-semibold text-[11px]">
                    100% Autonomous Commitments Sealed
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold">
                  {ledgerCommitments.length} Verifiable Commitment Certificates
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => navigateTo("ledger")}
                    className="text-sage-700 hover:text-sage-900 font-bold"
                  >
                    Open Audit Ledger →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
