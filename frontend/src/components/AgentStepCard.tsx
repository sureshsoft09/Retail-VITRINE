import React, { useState } from "react";
import { ChevronDown, ChevronUp, Bot, Shield, Wrench, Binary, Layers } from "lucide-react";
import { AgentStep } from "../types";

export const AgentStepCard: React.FC<{ step: AgentStep }> = ({ step }) => {
  const [expanded, setExpanded] = useState(false);

  const tierColors = {
    A0: "bg-rose-900/60 text-rose-300 border-rose-700", // May block, never acts
    A1: "bg-amber-900/60 text-amber-300 border-amber-700", // Evaluates options
    A2: "bg-emerald-900/60 text-emerald-300 border-emerald-700", // Negotiates & commits
    M: "bg-purple-900/60 text-purple-300 border-purple-700", // Coordinator
  };

  const statusBorder = {
    COMPLETED: "border-emerald-800/60 bg-[#160d13]/80",
    BLOCKED: "border-rose-700 bg-[#240e16]",
    WARNING: "border-amber-700 bg-[#241a10]",
    INFO: "border-[#3f222d] bg-[#160d13]/80",
  }[step.status];

  return (
    <div className={`rounded-xl border ${statusBorder} p-4 transition-all shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2e1a21] border border-[#4a2433] flex items-center justify-center text-[#d1b8c0] shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#fbf7f7]">{step.agent}</span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  tierColors[step.tier] || "bg-gray-800 text-gray-300 border-gray-700"
                }`}
              >
                {step.tier}
              </span>
              <span className="text-[11px] font-mono text-[#a26769]">Phase: {step.phase}</span>
            </div>
            <p className="text-sm text-[#e8d5da] mt-1 font-medium">{step.message}</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-mono text-[#a26769] hover:text-[#fbf7f7] flex items-center gap-1 bg-[#2e1a21] px-2.5 py-1 rounded border border-[#4a2433] transition-colors"
        >
          {expanded ? "Collapse" : "Audit Chain"}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-[#3f222d] space-y-3 font-mono text-xs text-[#d1b8c0]">
          {step.data && (
            <div className="bg-[#0f070b] p-3 rounded border border-[#2e1a21] overflow-x-auto">
              <span className="text-[10px] uppercase text-[#a26769] font-bold block mb-1">
                Structured Telemetry Payload
              </span>
              <pre className="text-[11px] text-amber-200/90 whitespace-pre-wrap">
                {JSON.stringify(step.data, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
            <div className="bg-[#201017] p-2 rounded border border-[#3f222d] flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              <span>Tools: {step.tools_called?.join(", ") || "In-process deterministic"}</span>
            </div>
            <div className="bg-[#201017] p-2 rounded border border-[#3f222d] flex items-center gap-2">
              <Binary className="w-3.5 h-3.5 text-emerald-400" />
              <span>Computation: Verified math</span>
            </div>
            <div className="bg-[#201017] p-2 rounded border border-[#3f222d] flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Guardrails: Model Armor active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
