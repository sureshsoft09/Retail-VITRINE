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
  X,
  Globe,
  Terminal,
  FileCode,
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
  const [showUCPModal, setShowUCPModal] = useState(false);
  const [ucpManifest, setUcpManifest] = useState<any | null>(null);
  const [isLoadingManifest, setIsLoadingManifest] = useState(false);

  const handleOpenUCPModal = async () => {
    setShowUCPModal(true);
    if (!ucpManifest) {
      setIsLoadingManifest(true);
      try {
        const manifest = await api.getUCPCapabilities();
        setUcpManifest(manifest);
      } catch (err) {
        console.error("Failed to load UCP manifest:", err);
      } finally {
        setIsLoadingManifest(false);
      }
    }
  };

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

            {/* Cloud Run UCP (Click to inspect Machine Capabilities) */}
            <button
              onClick={handleOpenUCPModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/20 ${
                ucpHealth
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/80"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
              title="Click to view live Universal Commerce Protocol (UCP) Discovery Manifest"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-semibold">UCP</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              {ucpHealth && <span className="text-[10px] text-indigo-300 font-bold">{ucpHealth.latency_ms}ms</span>}
            </button>

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

      {/* UCP Capability Discovery Modal */}
      {showUCPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <Globe className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-white text-sm font-mono">Universal Commerce Protocol (UCP)</h3>
                  <span className="text-xs text-slate-400 font-mono">Live Machine-to-Machine Discovery Manifest</span>
                </div>
              </div>
              <button
                onClick={() => setShowUCPModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 font-mono text-xs">
              {isLoadingManifest ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                  <Activity className="w-6 h-6 animate-spin text-indigo-400" />
                  <span>Fetching live UCP capabilities from Cloud Run...</span>
                </div>
              ) : ucpManifest ? (
                <>
                  <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Merchant Name</span>
                      <span className="text-white font-bold">{ucpManifest.merchant?.name || "VITRINE Merchant"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Protocol Version</span>
                      <span className="text-emerald-400 font-bold">{ucpManifest.ucp_version || "1.0.0-draft"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Standardized Region</span>
                      <span className="text-indigo-300 font-bold">{ucpManifest.merchant?.region || "us-central1"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Payment Protocols</span>
                      <span className="text-amber-300 font-bold">{(ucpManifest.supported_payment_protocols || ["urn:ap2:mandate:v1"]).join(", ")}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-slate-300 font-bold mb-2 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-indigo-400" />
                      <span>Supported Machine Capabilities</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(ucpManifest.capabilities || []).map((cap: string) => (
                        <span
                          key={cap}
                          className="px-2.5 py-1 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-800/80 text-[11px]"
                        >
                          {cap.replace("urn:ucp:capability:", "")}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-slate-300 font-bold mb-2 flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-emerald-400" />
                      <span>Exposed Protocol Endpoints</span>
                    </h4>
                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                      {Object.entries(ucpManifest.endpoints || {}).map(([name, endpoint]) => (
                        <div key={name} className="flex items-center justify-between px-3.5 py-2 border-b border-slate-900 last:border-b-0 text-[11px]">
                          <span className="text-slate-400 uppercase font-semibold">{name}</span>
                          <span className="text-emerald-400 font-bold">{String(endpoint)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-rose-400">
                  Unable to load live UCP discovery manifest from Cloud Run.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center text-slate-400 text-[11px] font-mono">
              <span>Endpoint: https://vitrine-ucp-285078287322.us-central1.run.app/.well-known/ucp</span>
              <button
                onClick={() => setShowUCPModal(false)}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
