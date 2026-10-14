import React, { useEffect, useState } from "react";
import {
  Compass,
  Sparkles,
  Cpu,
  ShieldCheck,
  FileCheck2,
  Sliders,
  ShieldAlert,
  Bot,
  Activity,
  PauseCircle,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Radio,
  Lock,
} from "lucide-react";
import { api } from "../api";
import { ServiceHealth } from "../types";
import { useVitrineStore } from "../store";

export type NavTab =
  | "tower"
  | "theatre"
  | "brain"
  | "promise"
  | "fraud"
  | "ledger"
  | "governance";

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const [bffHealth, setBffHealth] = useState<ServiceHealth | null>(null);
  const [ucpHealth, setUcpHealth] = useState<ServiceHealth | null>(null);
  const [showUCPModal, setShowUCPModal] = useState(false);
  const [ucpManifest, setUcpManifest] = useState<any | null>(null);
  const [loadingManifest, setLoadingManifest] = useState(false);

  const {
    killSwitchActive,
    setKillSwitchActive,
    maxOrderUSD,
    marginFloorPct,
    brainMode,
    fraudRecords,
    ledgerCommitments,
  } = useVitrineStore();

  useEffect(() => {
    let mounted = true;
    api
      .checkHealth()
      .then((h) => {
        if (mounted) {
          setBffHealth(h.bff);
          setUcpHealth(h.ucp);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenUCPModal = async () => {
    setShowUCPModal(true);
    if (!ucpManifest) {
      setLoadingManifest(true);
      try {
        const data = await api.getUCPCapabilities();
        setUcpManifest(data);
      } catch (err) {
        console.error("Failed to fetch UCP manifest:", err);
      } finally {
        setLoadingManifest(false);
      }
    }
  };

  const navGroups = [
    {
      group: "COMMERCE INTELLIGENCE",
      items: [
        {
          id: "tower" as NavTab,
          label: "Control Tower",
          sub: "Executive Telemetry & Pulse",
          badge: "89% Win Rate",
          badgeColor: "bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20",
          icon: Compass,
        },
        {
          id: "theatre" as NavTab,
          label: "Agent Commerce Exchange",
          sub: "Inbound Buyer Negotiation",
          badge: "Live Watch",
          badgeColor: "bg-[#7A2E3B]/10 text-[#7A2E3B] border-[#7A2E3B]/20",
          icon: Bot,
        },
      ],
    },
    {
      group: "CATALOG & PROMISE ASSURANCE",
      items: [
        {
          id: "brain" as NavTab,
          label: "Product Brain",
          sub: "Agentic Discoverability & Specs",
          badge: brainMode === "enriched" ? "92% Ready" : "41% Raw",
          badgeColor:
            brainMode === "enriched"
              ? "bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20"
              : "bg-[#B7791F]/10 text-[#B7791F] border-[#B7791F]/20",
          icon: Sparkles,
        },
        {
          id: "promise" as NavTab,
          label: "Promise Intelligence",
          sub: "Zero-Hallucination ATP & SLA",
          badge: "0-Hallucinate",
          badgeColor: "bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/20",
          icon: Cpu,
        },
      ],
    },
    {
      group: "TRUST, AUDIT & GOVERNANCE",
      items: [
        {
          id: "fraud" as NavTab,
          label: "Buyer Trust Sentinel",
          sub: "Ingress Defense & Anti-Replay",
          badge: `${fraudRecords.length} Quarantined`,
          badgeColor: "bg-[#9E4736]/10 text-[#9E4736] border-[#9E4736]/20",
          icon: ShieldAlert,
        },
        {
          id: "ledger" as NavTab,
          label: "Audit Ledger",
          sub: "Cryptographic SHA-256 Proof",
          badge: `${ledgerCommitments.length} Sealed`,
          badgeColor: "bg-[#1C1917]/10 text-[#1C1917] border-[#1C1917]/20",
          icon: FileCheck2,
        },
        {
          id: "governance" as NavTab,
          label: "Governance Guardrails",
          sub: "Commercial Dials & Controls",
          badge: killSwitchActive ? "PAUSED" : "Active Dial",
          badgeColor: killSwitchActive
            ? "bg-[#9E4736] text-white border-transparent"
            : "bg-[#B7791F]/10 text-[#B7791F] border-[#B7791F]/20",
          icon: Sliders,
        },
      ],
    },
  ];

  return (
    <>
      {/* STATIC PERMANENT LEFT SIDEBAR */}
      <aside className="w-64 h-screen sticky top-0 flex flex-col justify-between shrink-0 border-r border-[#E8E2D6] bg-[#F7F3EB] select-none z-40 shadow-xs">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#E8E2D6] bg-[#F2EDE3]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-white shadow-xs">
              <span className="font-serif font-black text-lg">V</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base tracking-tight text-[#1C1917]">
                  VITRINE
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-[#2D6A4F]/10 text-[#2D6A4F] uppercase border border-[#2D6A4F]/20">
                  Agent OS
                </span>
              </div>
              <p className="text-[10px] text-[#78716C] font-medium leading-none mt-0.5">
                The Agent-Ready Commerce Layer
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navGroups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <div className="px-2.5 py-1 text-[9.5px] font-bold tracking-wider text-[#A8A29E] uppercase font-mono">
                {grp.group}
              </div>
              {grp.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all ${
                      active
                        ? "bg-[#2D6A4F] text-white shadow-xs font-semibold"
                        : "hover:bg-[#EAE4D7] text-[#44403C]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? "text-white" : "text-[#78716C]"
                        }`}
                      />
                      <div className="min-w-0 truncate">
                        <div
                          className={`text-xs truncate ${
                            active ? "text-white font-bold" : "font-medium text-[#1C1917]"
                          }`}
                        >
                          {item.label}
                        </div>
                        <div
                          className={`text-[9.5px] truncate ${
                            active ? "text-white/80" : "text-[#78716C]"
                          }`}
                        >
                          {item.sub}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 border ${
                        active
                          ? "bg-white/20 text-white border-white/30"
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* BOTTOM PINNED COMMERCIAL SAFETY CONTROLS */}
        <div className="p-3 border-t border-[#E8E2D6] bg-[#F2EDE3] space-y-2.5">
          {/* Master Kill Switch */}
          <div
            className={`p-2.5 rounded-xl border transition-all ${
              killSwitchActive
                ? "bg-[#9E4736]/10 border-[#9E4736]/30 text-[#9E4736]"
                : "bg-white border-[#E8E2D6] text-[#1C1917]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-[#78716C]">
                Autonomy Kill Switch
              </span>
              <button
                onClick={() => setKillSwitchActive(!killSwitchActive)}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                  killSwitchActive ? "bg-[#9E4736]" : "bg-[#2D6A4F]"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    killSwitchActive ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {killSwitchActive ? (
                <>
                  <PauseCircle className="w-3.5 h-3.5 text-[#9E4736]" />
                  <span className="text-[#9E4736]">COMMERCE PAUSED</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span className="text-[#2D6A4F]">AUTONOMOUS ARMED</span>
                </>
              )}
            </div>
          </div>

          {/* Policy Summary */}
          <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-mono text-[#78716C]">
            <div className="bg-white p-1.5 rounded-lg border border-[#E8E2D6]">
              Floor: <span className="font-bold text-[#1C1917]">{marginFloorPct}% Net</span>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-[#E8E2D6]">
              Max: <span className="font-bold text-[#1C1917]">${maxOrderUSD}</span>
            </div>
          </div>

          {/* Live Services & UCP Badge */}
          <div className="flex items-center justify-between text-[10px] text-[#78716C] pt-1">
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  bffHealth ? "bg-[#2D6A4F] animate-pulse" : "bg-[#B7791F]"
                }`}
              />
              <span className="font-medium">
                BFF {bffHealth?.latency_ms ? `${bffHealth.latency_ms}ms` : "Cloud Run"}
              </span>
            </div>

            <button
              onClick={handleOpenUCPModal}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white hover:bg-[#EAE4D7] border border-[#E8E2D6] text-[9.5px] font-semibold text-[#1C1917] transition-all"
            >
              <Globe className="w-2.5 h-2.5 text-[#2D6A4F]" />
              <span>UCP Spec</span>
            </button>
          </div>
        </div>
      </aside>

      {/* UCP DISCOVERY MODAL */}
      {showUCPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E8E2D6] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#2D6A4F]" />
                <h3 className="font-serif font-bold text-lg text-[#1C1917]">
                  Universal Commerce Protocol (UCP) Discovery
                </h3>
              </div>
              <button
                onClick={() => setShowUCPModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs text-[#44403C]">
              <p className="leading-relaxed">
                VITRINE exposes machine-readable capability discovery at{" "}
                <code className="bg-[#FAF7F2] px-1.5 py-0.5 rounded border border-[#E8E2D6] font-mono text-[#2D6A4F]">
                  /.well-known/ucp
                </code>{" "}
                for autonomous buyer agents using the Universal Commerce Protocol.
              </p>

              {loadingManifest ? (
                <div className="p-8 text-center text-[#78716C] animate-pulse">
                  Querying Cloud Run UCP Gateway...
                </div>
              ) : (
                <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E2D6] font-mono text-[11px] overflow-x-auto text-[#1C1917] max-h-64">
                  <pre>{JSON.stringify(ucpManifest, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E8E2D6]">
              <button
                onClick={() => setShowUCPModal(false)}
                className="px-4 py-2 rounded-xl bg-[#2D6A4F] text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
