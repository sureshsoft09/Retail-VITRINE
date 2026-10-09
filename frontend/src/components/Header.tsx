import React from "react";
import { Sparkles, Cpu, Layers, Lock, TrendingUp, ShieldAlert, Sliders, Server } from "lucide-react";

export type NavTab = "theatre" | "brain" | "promise" | "ledger" | "tower" | "fraud" | "governance";

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: "theatre", label: "Transaction Theatre", icon: Cpu },
    { id: "brain", label: "Product Brain", icon: Sparkles },
    { id: "promise", label: "Promise Inspector", icon: Layers },
    { id: "ledger", label: "Ledger Explorer", icon: Lock },
    { id: "tower", label: "Control Tower", icon: TrendingUp },
    { id: "fraud", label: "Fraud Defense", icon: ShieldAlert },
    { id: "governance", label: "Governance & Autonomy", icon: Sliders },
  ];

  return (
    <header className="border-b border-[#3f222d] bg-[#14090f]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6d2e46] to-[#2e1a21] border border-[#a26769]/40 flex items-center justify-center font-bold text-amber-300 shadow-md">
              V
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-[#fbf7f7] tracking-tight">VITRINE</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  UCP · AP2 · A2A
                </span>
              </div>
              <p className="text-[11px] text-[#a26769] hidden sm:block">
                Verifiable Multi-Agent Autonomous Commerce Platform
              </p>
            </div>
          </div>

          {/* Infrastructure Health Indicators */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-[#a26769]">
            <span className="flex items-center gap-1.5 bg-[#200e16] px-2.5 py-1 rounded-full border border-[#3f222d]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>us-central1</span>
            </span>
            <span className="flex items-center gap-1.5 bg-[#200e16] px-2.5 py-1 rounded-full border border-[#3f222d]">
              <Server className="w-3 h-3 text-purple-400" />
              <span>Agent Engine + Cloud Run (1 + 1)</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center space-x-1 overflow-x-auto py-2 border-t border-[#2e1a21]/60 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as NavTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#3f222d] text-amber-300 font-bold border border-[#6d2e46] shadow-sm"
                    : "text-[#d1b8c0] hover:text-[#fbf7f7] hover:bg-[#200e16]"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-[#a26769]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
