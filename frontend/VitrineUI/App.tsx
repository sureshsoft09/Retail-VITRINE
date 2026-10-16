import React, { useState } from "react";
import { Header, NavTab } from "./components/Header";
import { AgentCommerceExchange } from "./components/AgentCommerceExchange";
import { ProductBrain } from "./components/ProductBrain";
import { PromiseInspector } from "./components/PromiseInspector";
import { LedgerExplorer } from "./components/LedgerExplorer";
import { ControlTower } from "./components/ControlTower";
import { FraudQueue } from "./components/FraudQueue";
import { GovernanceConsole } from "./components/GovernanceConsole";
import { useVitrineStore } from "./store";
import {
  PauseCircle,
  CheckCircle2,
  ShieldCheck,
  Bot,
  Sliders,
  ShieldAlert,
  Sparkles,
  Shirt,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("tower");
  const {
    killSwitchActive,
    setKillSwitchActive,
    productHubSection,
    setProductHubSection,
    maxOrderUSD,
    discountCapPct,
    marginFloorPct,
    fraudRecords,
  } = useVitrineStore();

  const quarantinedCount = fraudRecords.filter(
    (r) => r.status === "QUARANTINED"
  ).length;

  const tabMeta: Record<
    NavTab,
    {
      capability: string;
      title: string;
      outcomeQuestion: string;
    }
  > = {
    tower: {
      capability: "Control Tower",
      title: "Agent Commerce Control Tower",
      outcomeQuestion: "How is autonomous commerce performing?",
    },
    brain: {
      capability: "Product Brain",
      title:
        productHubSection === "vto"
          ? "Product Brain · Virtual Try-On Studio"
          : "Product Brain · Agentic Discoverability",
      outcomeQuestion: "Can AI buyer agents & customers discover products?",
    },
    promise: {
      capability: "Promise Intelligence",
      title: "Promise Verification & Margin Intelligence",
      outcomeQuestion: "Can we verify and keep our fulfillment promise?",
    },
    theatre: {
      capability: "Agent Commerce Exchange",
      title: "Inbound Buyer Agent Negotiation & Verified Checkout",
      outcomeQuestion: "Can this autonomous order be fulfilled safely?",
    },
    governance: {
      capability: "Trust & Governance",
      title: "Autonomous Commerce Governance & Guardrails",
      outcomeQuestion: "How much autonomy should commerce have?",
    },
    fraud: {
      capability: "Trust & Governance",
      title: "Buyer Agent Trust & Sentinel Protection",
      outcomeQuestion: "Are we protecting commerce from adversarial agents?",
    },
    ledger: {
      capability: "Audit Ledger",
      title: "Verifiable Commitment & Audit Ledger",
      outcomeQuestion: "Can we prove every autonomous promise we made?",
    },
  };

  const currentMeta = tabMeta[activeTab];

  return (
    <div className="h-screen w-full overflow-hidden bg-[#FAF7F2] text-[#1C1917] flex selection:bg-[#2D6A4F] selection:text-white font-sans antialiased">
      {/* Left Column: Fixed Sidebar Navigation */}
      <Header activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Right Column: Independently Scrollable Main Content Shell */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col min-w-0">
        {/* Top Header — Aligned to the exact same vertical grid as Main Content */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-ivory-300">
          <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
            {/* Left: Capability Badge + View Title + Core Outcome Question */}
            <div className="flex flex-wrap items-center gap-2.5 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#181614] text-white shrink-0">
                {currentMeta.capability}
              </span>
              <h2 className="font-serif font-bold text-base sm:text-lg text-ink-900 leading-snug">
                {currentMeta.title}
              </h2>
              <span className="hidden xl:inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sage-50 text-sage-800 border border-sage-200 shrink-0">
                {currentMeta.outcomeQuestion}
              </span>
            </div>

            {/* Right: Contextual Mode Switchers & Live Agentic Commerce Status */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Contextual Sub-Switcher for Product Brain */}
              {activeTab === "brain" && (
                <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-ivory-200/80 border border-ivory-300 text-xs">
                  <button
                    onClick={() => setProductHubSection("catalog")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                      productHubSection === "catalog"
                        ? "bg-white text-ink-900 shadow-sm"
                        : "text-ink-600 hover:text-ink-900"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sage-700" />
                    <span>Discoverability</span>
                  </button>
                  <button
                    onClick={() => setProductHubSection("vto")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                      productHubSection === "vto"
                        ? "bg-white text-ink-900 shadow-sm"
                        : "text-ink-600 hover:text-ink-900"
                    }`}
                  >
                    <Shirt className="w-3.5 h-3.5 text-berry-700" />
                    <span>Virtual Try-On</span>
                  </button>
                </div>
              )}

              {/* Contextual Sub-Switcher for Trust & Governance */}
              {(activeTab === "governance" || activeTab === "fraud") && (
                <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-ivory-200/80 border border-ivory-300 text-xs">
                  <button
                    onClick={() => setActiveTab("governance")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                      activeTab === "governance"
                        ? "bg-white text-ink-900 shadow-sm"
                        : "text-ink-600 hover:text-ink-900"
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-sage-700" />
                    <span>Autonomy Governance</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("fraud")}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all ${
                      activeTab === "fraud"
                        ? "bg-white text-ink-900 shadow-sm"
                        : "text-ink-600 hover:text-ink-900"
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-clay-600" />
                    <span>Buyer Risk Sentinel ({quarantinedCount})</span>
                  </button>
                </div>
              )}

              {/* Active Autonomy Guardrails Pill */}
              <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-lg bg-ivory-100 border border-ivory-300 text-xs text-ink-700">
                <Bot className="w-3.5 h-3.5 text-sage-700 shrink-0" />
                <span>
                  Autonomy Guardrails:{" "}
                  <strong className="text-ink-900">${maxOrderUSD}</strong> Max ·{" "}
                  <strong className="text-ink-900">{discountCapPct}%</strong>{" "}
                  Discount ·{" "}
                  <strong className="text-ink-900">{marginFloorPct}%</strong>{" "}
                  Margin
                </span>
              </div>

              <button
                onClick={() => setActiveTab("governance")}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-ivory-100 text-ink-800 border border-ivory-300 text-xs font-semibold transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sage-700" />
                <span>Guardrails</span>
              </button>
            </div>
          </div>
        </header>

        {/* Autonomy Halted Banner when active */}
        {killSwitchActive && (
          <div className="bg-clay-600 text-white border-b border-clay-700">
            <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <PauseCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-xs tracking-wide uppercase">
                    AUTONOMOUS AGENT COMMERCE PAUSED — HUMAN-IN-THE-LOOP MODE ACTIVE
                  </div>
                  <p className="text-xs text-clay-100">
                    AI Buyer Agent negotiations are paused at the Commitment Critic gate and routed for manual sign-off.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setKillSwitchActive(false)}
                className="px-3 py-1 rounded-lg bg-white text-clay-700 hover:bg-ivory-100 text-xs font-bold shadow-sm transition-all shrink-0"
              >
                Resume Autonomous Commerce
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area — Aligned on the exact same vertical grid (max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8) */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8 py-6">
          {activeTab === "tower" && <ControlTower onNavigate={setActiveTab} />}
          {activeTab === "brain" && <ProductBrain />}
          {activeTab === "theatre" && <AgentCommerceExchange onNavigate={setActiveTab} />}
          {activeTab === "promise" && <PromiseInspector />}
          {activeTab === "ledger" && <LedgerExplorer />}
          {activeTab === "fraud" && (
            <FraudQueue onSwitchToGovernance={() => setActiveTab("governance")} />
          )}
          {activeTab === "governance" && (
            <GovernanceConsole onSwitchToSentinel={() => setActiveTab("fraud")} />
          )}
        </main>

        {/* Persistent Global Footer — Aligned on the exact same vertical grid */}
        <footer className="border-t border-ivory-300 bg-white py-3.5 text-xs text-ink-600 mt-auto">
          <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="font-serif font-bold text-ink-900 text-sm">
                VITRINE
              </span>
              <span className="text-ink-400">·</span>
              <span className="text-ink-600 font-medium">
                The Agent-Ready Commerce Layer · Agent Commerce Operating System
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sage-50 text-sage-700 border border-sage-200">
                <CheckCircle2 className="w-3 h-3" />
                Commitment Critic Verified
              </span>
              <span className="px-2 py-0.5 rounded-md bg-berry-50 text-berry-700 border border-berry-200">
                AI Buyer Agent Discovery
              </span>
              <span className="px-2 py-0.5 rounded-md bg-gold-50 text-gold-700 border border-gold-200">
                Autonomy Governance
              </span>
              <span className="px-2 py-0.5 rounded-md bg-clay-50 text-clay-700 border border-clay-200">
                Sentinel Risk Hold
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
