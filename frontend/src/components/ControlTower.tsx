import React from "react";
import { TrendingUp, ShieldCheck, DollarSign, AlertTriangle, Users, Bot } from "lucide-react";

export const ControlTower: React.FC = () => {
  const lostReasons = [
    { reason: "Carrier Cutoff Missed", pct: 42, count: 14, color: "bg-rose-500" },
    { reason: "Margin Floor Violation", pct: 28, count: 9, color: "bg-amber-500" },
    { reason: "ATP Safety Stock Depleted", pct: 18, count: 6, color: "bg-blue-500" },
    { reason: "Max Order Value Exceeded", pct: 12, count: 4, color: "bg-purple-500" },
  ];

  const agentRegistry = [
    { id: "orch-commerce-supervisor", tier: "M", role: "Workload Orchestrator", host: "Vertex AI Agent Engine", tools: 6 },
    { id: "ag-commitment-critic", tier: "A0", role: "Adversarial Verifier", host: "Cloud Run Agents Host", tools: 3 },
    { id: "ag-promise-engine", tier: "A1", role: "Candidate Synthesizer", host: "Cloud Run Agents Host", tools: 4 },
    { id: "ag-substitution-strategist", tier: "A1", role: "Margin-Optimized Fallback", host: "Cloud Run Agents Host", tools: 4 },
    { id: "ag-negotiation-agent", tier: "A2", role: "Commercial Negotiator", host: "Cloud Run Agents Host", tools: 5 },
    { id: "ag-agent-trust-analyst", tier: "A1", role: "Security & Anti-Replay", host: "Cloud Run Agents Host", tools: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold text-[#fbf7f7]">Control Tower: Executive Telemetry</h2>
        </div>
        <p className="text-sm text-[#d1b8c0] mt-1">
          High-level operational metrics aggregated in real-time across autonomous agent transactions.
        </p>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-[#a26769]">
            <span>UCP Negotiation Win Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#fbf7f7] mt-2">74.2%</div>
          <span className="text-xs text-emerald-400 block mt-1">+33.2% vs raw keyword matching</span>
        </div>

        <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-[#a26769]">
            <span>Commitment Health (OTIF)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#fbf7f7] mt-2">98.6%</div>
          <span className="text-xs text-emerald-400 block mt-1">Zero unverified promises committed</span>
        </div>

        <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-[#a26769]">
            <span>Realized Profit Margin</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-[#fbf7f7] mt-2">24.8%</div>
          <span className="text-xs text-[#a26769] block mt-1">Strictly above 18.0% policy floor</span>
        </div>
      </div>

      {/* "Why We Lost" Pareto Chart & Agent Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Why We Lost */}
        <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-[#fbf7f7] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>"Why We Lost" Analysis (Eliminated Turn Breakdown)</span>
            </h3>
            <span className="text-[10px] font-mono text-[#a26769]">33 Abandoned Turns</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {lostReasons.map((item) => (
              <div key={item.reason} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#d1b8c0]">{item.reason}</span>
                  <span className="text-[#a26769] font-bold">
                    {item.pct}% ({item.count} turns)
                  </span>
                </div>
                <div className="w-full bg-[#200e16] rounded-full h-2 overflow-hidden border border-[#3f222d]/40">
                  <div
                    className={`${item.color} h-2 rounded-full`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Agent Registry */}
        <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-[#fbf7f7] flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <span>Active Agent Topology & Authority Grants</span>
            </h3>
            <span className="text-[10px] font-mono text-[#a26769]">6 Registered Agents</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {agentRegistry.map((agent) => (
              <div
                key={agent.id}
                className="p-2.5 rounded-lg bg-[#201017] border border-[#3f222d] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#fbf7f7]">{agent.id}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-900/40 text-purple-300 border border-purple-800">
                      {agent.tier}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#a26769] block mt-0.5">
                    {agent.role} · {agent.host}
                  </span>
                </div>
                <span className="text-[11px] text-[#c9a227] bg-[#2e1a21] px-2 py-0.5 rounded border border-[#4a2433]">
                  {agent.tools} tools granted
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
