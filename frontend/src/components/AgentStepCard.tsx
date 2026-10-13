import React, { useState } from "react";
import { ChevronDown, ChevronUp, Bot, Shield, Wrench, Binary, Layers } from "lucide-react";
import { AgentStep } from "../types";

export const AgentStepCard: React.FC<{ step: AgentStep }> = ({ step }) => {
  const [expanded, setExpanded] = useState(false);

  const tierColors: Record<string, string> = {
    A0: "bg-rose-950/80 text-rose-300 border-rose-700/80", // May block, never acts
    A1: "bg-amber-950/80 text-amber-300 border-amber-700/80", // Evaluates options
    A2: "bg-emerald-950/80 text-emerald-300 border-emerald-700/80", // Negotiates & commits
    M: "bg-purple-950/80 text-purple-300 border-purple-700/80", // Coordinator
  };

  const statusBorder: Record<string, string> = {
    COMPLETED: "border-emerald-800/70 bg-slate-900/90",
    BLOCKED: "border-rose-800/80 bg-rose-950/30",
    WARNING: "border-amber-800/80 bg-amber-950/30",
    INFO: "border-slate-800 bg-slate-900/80",
  };

  return (
    <div className={`rounded-xl border ${statusBorder[step.status] || "border-slate-800 bg-slate-900"} p-5 transition-all shadow-md hover:shadow-lg`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 shadow-inner">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-white">{step.agent}</span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  tierColors[step.tier] || "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {step.tier}
              </span>
              <span className="text-xs font-mono text-slate-400">Phase: <strong className="text-slate-300">{step.phase}</strong></span>
            </div>
            <p className="text-sm text-slate-200 mt-1.5 font-medium leading-relaxed">{step.message}</p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors shrink-0 font-medium"
        >
          <span>{expanded ? "Collapse" : "Audit Chain"}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 font-mono text-xs text-slate-300">
          {step.data && (
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 overflow-x-auto shadow-inner">
              <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1.5 tracking-wider">
                Structured Telemetry Payload
              </span>
              <pre className="text-xs text-amber-300 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(step.data, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2 text-slate-300">
              <Wrench className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">Tools: {step.tools_called?.join(", ") || "In-process deterministic"}</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2 text-slate-300">
              <Binary className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Computation: Pure Math</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Guardrails: Verified Invariants</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
