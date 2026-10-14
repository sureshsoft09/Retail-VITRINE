import React, { useState } from "react";
import { TrendingUp, ShieldCheck, DollarSign, AlertTriangle, Users, Bot, Radio, CheckCircle, Activity } from "lucide-react";
import { api } from "../api";

export const ControlTower: React.FC = () => {
  const [isRunningSentinel, setIsRunningSentinel] = useState(false);
  const [sentinelEvent, setSentinelEvent] = useState<any | null>(null);

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

  const lostReasons = [
    { reason: "Carrier Cutoff Missed", pct: 42, count: 14, color: "bg-rose-500" },
    { reason: "Margin Floor Violation", pct: 28, count: 9, color: "bg-amber-500" },
    { reason: "ATP Safety Stock Depleted", pct: 18, count: 6, color: "bg-sky-500" },
    { reason: "Max Order Value Exceeded", pct: 12, count: 4, color: "bg-indigo-500" },
  ];

  const agentRegistry = [
    { id: "orch-commerce-supervisor", tier: "M", role: "Workload Orchestrator", host: "Vertex AI Agent Engine", tools: 6 },
    { id: "ag-commitment-critic", tier: "A0", role: "Adversarial Verifier", host: "Cloud Run Agents Host", tools: 3 },
    { id: "ag-promise-engine", tier: "A1", role: "Candidate Synthesizer", host: "Cloud Run Agents Host", tools: 4 },
    { id: "ag-substitution-strategist", tier: "A1", role: "Margin-Optimized Fallback", host: "Cloud Run Agents Host", tools: 4 },
    { id: "ag-negotiation-agent", tier: "A2", role: "Commercial Negotiator", host: "Cloud Run Agents Host", tools: 5 },
    { id: "ag-agent-trust-analyst", tier: "A1", role: "Security & Anti-Replay", host: "Cloud Run Agents Host", tools: 2 },
    { id: "sent-supplier-risk-watch", tier: "A0", role: "Autonomous Disruption Sentinel", host: "Cloud Run Agents Host", tools: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Control Tower: Executive Telemetry</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            High-level operational metrics aggregated in real-time across autonomous agent transactions.
          </p>
        </div>

        <button
          onClick={handleRunSentinel}
          disabled={isRunningSentinel}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-xs font-mono font-bold shadow-lg shadow-indigo-600/30 transition-all shrink-0"
        >
          <Radio className={`w-3.5 h-3.5 ${isRunningSentinel ? "animate-pulse text-amber-400" : ""}`} />
          {isRunningSentinel ? "Scanning Supply Chains..." : "Run Autonomous Supplier Sentinel"}
        </button>
      </div>

      {/* Live Sentinel Disruption Alert Card */}
      {sentinelEvent && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-5 shadow-2xl animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white font-mono">
                Cloud Run Sentinel Alert: {sentinelEvent.supplier_id || "SUP-MILAN-SILK-01"}
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              {sentinelEvent.circuit_breaker_tripped ? "CIRCUIT BREAKER TRIPPED (Two-Source Rule)" : "DISRUPTION MITIGATED"}
            </span>
          </div>

          <p className="text-xs text-slate-300 font-mono">
            {sentinelEvent.summary || "Two-source confirmed logistics shutdown across independent sources. SKU circuit breaker TRIPPED."}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
            <div>
              <span className="text-slate-500">Severity: </span>
              <span className="text-rose-400 font-bold">{sentinelEvent.severity || "HIGH"}</span>
            </div>
            <div>
              <span className="text-slate-500">Verified Sources: </span>
              <span className="text-emerald-400 font-bold">
                {(sentinelEvent.sources || ["reuters.com", "lloydsloadinglist.com"]).join(" + ")}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Autonomous Mitigation: </span>
              <span className="text-indigo-300 font-bold">Auto-diverted orders to DC-NORTH safety stock</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-semibold">UCP Negotiation Win Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">74.2%</div>
          <span className="text-xs text-emerald-400 font-medium block mt-1">+33.2% vs raw keyword matching</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-semibold">Commitment Health (OTIF)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">98.6%</div>
          <span className="text-xs text-emerald-400 font-medium block mt-1">Zero unverified promises committed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-semibold">Realized Profit Margin</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-white mt-2">24.8%</div>
          <span className="text-xs text-slate-400 font-medium block mt-1">Strictly above 18.0% policy floor</span>
        </div>
      </div>

      {/* "Why We Lost" Pareto Chart & Agent Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Why We Lost */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>"Why We Lost" Analysis (Eliminated Turn Breakdown)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              33 Abandoned Turns
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {lostReasons.map((item) => (
              <div key={item.reason} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-medium">{item.reason}</span>
                  <span className="text-slate-400 font-bold">
                    {item.pct}% ({item.count} turns)
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 shadow-inner">
                  <div
                    className={`${item.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Agent Registry */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Active Agent Topology & Authority Grants</span>
            </h3>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              6 Registered Agents
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {agentRegistry.map((agent) => (
              <div
                key={agent.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between shadow-inner"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{agent.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {agent.tier}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-1">
                    {agent.role} · <span className="text-slate-300">{agent.host}</span>
                  </span>
                </div>
                <span className="text-xs text-amber-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 font-bold">
                  {agent.tools} tools
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
