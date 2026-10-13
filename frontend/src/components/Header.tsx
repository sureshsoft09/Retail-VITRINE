import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Cpu,
  Layers,
  Lock,
  TrendingUp,
  ShieldAlert,
  Sliders,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { api } from "../api";
import { ServiceHealth } from "../types";

export type NavTab = "theatre" | "brain" | "promise" | "ledger" | "tower" | "fraud" | "governance";

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  fraudCount?: number;
  ledgerCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, fraudCount = 1, ledgerCount = 2 }) => {
  const [bffHealth, setBffHealth] = useState<ServiceHealth | null>(null);
  const [ucpHealth, setUcpHealth] = useState<ServiceHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchHealth = async () => {
      setIsChecking(true);
      try {
        const { bff, ucp } = await api.checkHealth();
        if (mounted) {
          setBffHealth(bff);
          setUcpHealth(ucp);
        }
      } catch {
        // silent
      } finally {
        if (mounted) setIsChecking(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const tabs = [
    { id: "theatre", label: "Transaction Theatre", icon: Cpu, badge: "Vertex AI" },
    { id: "brain", label: "Product Brain", icon: Sparkles, badge: "Gemini Vision" },
    { id: "promise", label: "Promise Inspector", icon: Layers, badge: "Deterministic" },
    { id: "ledger", label: "Ledger Explorer", icon: Lock, badge: ledgerCount > 0 ? `${ledgerCount} Blocks` : undefined },
    { id: "tower", label: "Control Tower", icon: TrendingUp },
    { id: "fraud", label: "Fraud Defense", icon: ShieldAlert, badge: fraudCount > 0 ? `${fraudCount} Alert` : undefined },
    { id: "governance", label: "Governance & Autonomy", icon: Sliders },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0c101a]/95 backdrop-blur-md sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 border border-indigo-400/30 flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-indigo-600/30 tracking-tight">
              V
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-extrabold text-xl text-white tracking-tight">
                  VITRINE
                </h1>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 shadow-sm">
                  UCP · AP2 · A2A
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Verifiable Multi-Agent Autonomous Commerce Platform
              </p>
            </div>
          </div>

          {/* Infrastructure Health Indicators */}
          <div className="flex items-center gap-2.5 text-xs font-mono">
            {/* Cloud Run BFF */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                bffHealth
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/80"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
              title={`Cloud Run BFF: ${bffHealth?.latency_ms || "—"}ms`}
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">BFF</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {bffHealth && <span className="text-[10px] text-emerald-400 font-bold">{bffHealth.latency_ms}ms</span>}
            </div>

            {/* Cloud Run UCP */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                ucpHealth
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/80"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
              title={`Cloud Run UCP: ${ucpHealth?.latency_ms || "—"}ms`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold">UCP</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              {ucpHealth && <span className="text-[10px] text-indigo-300 font-bold">{ucpHealth.latency_ms}ms</span>}
            </div>

            {/* Live Region Badge */}
            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>us-central1</span>
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex space-x-1.5 overflow-x-auto pb-3 pt-1 scrollbar-none border-t border-slate-800/80 mt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id as NavTab)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : tab.id === "fraud"
                        ? "bg-rose-950 text-rose-300 border border-rose-800"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
