import React from "react";
import { CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { GateCondition } from "../types";

interface GateChecklistProps {
  conditions: GateCondition[];
  passed: boolean;
  onConditionClick?: (cond: GateCondition) => void;
}

export const GateChecklist: React.FC<GateChecklistProps> = ({
  conditions,
  passed,
  onConditionClick,
}) => {
  return (
    <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-5 h-5 ${passed ? "text-emerald-400" : "text-amber-400"}`} />
          <h3 className="font-semibold text-lg text-[#fbf7f7] tracking-tight">
            The 11-Condition Commitment Gate
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#2e1a21] text-[#a26769] font-mono border border-[#4a2433]">
            Deterministic · Invariant
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#a26769]">Status:</span>
          <span
            className={`px-3 py-1 rounded-md font-bold uppercase ${
              passed
                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                : "bg-rose-950 text-rose-300 border border-rose-800"
            }`}
          >
            {passed ? "ALL 11 CONDITIONS PASSED — AUTONOMOUS COMMIT ALLOWED" : "GATE BLOCKED — HUMAN ESCALATION REQUIRED"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {conditions.map((cond, idx) => {
          return (
            <div
              key={cond.id}
              onClick={() => onConditionClick?.(cond)}
              style={{ animationDelay: `${idx * 60}ms` }}
              className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                cond.passed
                  ? "bg-[#14231b]/60 border-emerald-900/60 hover:border-emerald-700 text-[#e8f0ec]"
                  : "bg-[#291114]/80 border-rose-900 hover:border-rose-700 text-[#f8e8e4] ring-1 ring-rose-500/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {cond.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span className="font-mono text-xs font-semibold">
                    {cond.id.replace("COND_", "")}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    cond.passed ? "bg-emerald-900/40 text-emerald-300" : "bg-rose-900/50 text-rose-300 font-bold"
                  }`}
                >
                  {cond.passed ? "PASS" : "BLOCKED"}
                </span>
              </div>

              <p className="text-xs text-[#d1b8c0] mt-2 line-clamp-1">{cond.description}</p>

              <div className="mt-2 pt-2 border-t border-[#3f222d]/40 flex items-center justify-between text-[11px] font-mono text-[#a26769]">
                <span>
                  Obs: <strong className="text-[#fbf7f7]">{String(cond.observed)}</strong>
                </span>
                <span>
                  Lim: <span className="text-[#c9a227]">{String(cond.threshold)}</span>
                </span>
              </div>
              {cond.failure_reason && (
                <p className="mt-1.5 text-[11px] text-rose-300 font-medium bg-rose-950/40 p-1.5 rounded border border-rose-900/50">
                  ⚠️ {cond.failure_reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
