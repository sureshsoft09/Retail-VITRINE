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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${passed ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white tracking-tight">
              The 11-Condition Commitment Gate
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic invariant screening evaluated before any AP2 financial commitment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs self-start sm:self-auto">
          <span
            className={`px-3.5 py-1.5 rounded-lg font-bold tracking-wide uppercase shadow-sm ${
              passed
                ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                : "bg-rose-950 text-rose-300 border border-rose-700"
            }`}
          >
            {passed ? "✓ ALL 11 CONDITIONS PASSED — AUTONOMOUS COMMIT ALLOWED" : "⛔ GATE BLOCKED — INVARIANT VIOLATION"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {conditions.map((cond, idx) => {
          return (
            <div
              key={cond.id}
              onClick={() => onConditionClick?.(cond)}
              style={{ animationDelay: `${idx * 50}ms` }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-md ${
                cond.passed
                  ? "bg-slate-950/70 border-emerald-900/60 hover:border-emerald-600/80 text-slate-200"
                  : "bg-rose-950/30 border-rose-800/80 hover:border-rose-600 text-rose-100 ring-1 ring-rose-500/20"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {cond.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold text-white tracking-wide">
                      {cond.id.replace("COND_", "")}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      cond.passed ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-rose-950 text-rose-300 border border-rose-800"
                    }`}
                  >
                    {cond.passed ? "PASS" : "FAIL"}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{cond.description}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">
                  Obs: <strong className="text-white">{String(cond.observed)}</strong>
                </span>
                <span className="text-slate-400">
                  Req: <span className="text-amber-300 font-bold">{String(cond.threshold)}</span>
                </span>
              </div>

              {cond.failure_reason && (
                <p className="mt-2 text-xs text-rose-300 font-medium bg-rose-950/60 p-2 rounded-lg border border-rose-900/60">
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
