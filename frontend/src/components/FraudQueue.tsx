import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, Eye, CheckCircle2, XCircle, ShieldCheck, UserX, RefreshCw } from "lucide-react";
import { api } from "../api";

export const FraudQueue: React.FC = () => {
  const [incidents, setIncidents] = useState([
    {
      id: "FRD-2026-0089",
      timestamp: new Date().toISOString(),
      agent_id: "buyer-hostile-482",
      vector: "AP2 Mandate Nonce Replay Attack",
      verdict: "REJECT_UNTRUSTED",
      status: "QUARANTINED",
      explanation: "Buyer presented a cryptographic mandate containing an authorization nonce that was previously spent 48 seconds ago on transaction txn-live-9014.",
      evidence: [
        "Nonce 'ap2-nonce-984b-consumed' detected in anti-replay bloom filter cache.",
        "Signer public key matches previously known adversarial testing identity 'did:key:z6Mkq...",
        "Request velocity burst observed: 45 queries/min from originating client IP.",
      ],
      mandatory_counter_evidence: [
        "Counter-evidence check: Could client have experienced network partition causing legitimate retry?",
        "Result: Retry payload contains altered shipping address (Seattle vs Portland). Invariant violated — intentional replay confirmed.",
      ],
      recommended_action: "Drop connection with 403 Forbidden; add agent public key to ephemeral hostile reputation blacklist for 24 hours.",
    },
    {
      id: "FRD-2026-0088",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      agent_id: "buyer-scraping-probe-19",
      vector: "Competitive Inventory Scraping Pattern",
      verdict: "THROTTLE_RATE_LIMIT",
      status: "THROTTLED",
      explanation: "Systematic enumeration across 800 footwear SKUs at 200ms intervals matching competitive intelligence crawler heuristics.",
      evidence: [
        "Rapid sequential pagination without standard human shopping hesitation.",
        "Zero add-to-cart or checkout discovery calls.",
      ],
      mandatory_counter_evidence: [
        "Counter-evidence check: Could this be an aggregated search aggregator under legitimate UCP partnership?",
        "Result: No registered Partner Token presented in UCP headers.",
      ],
      recommended_action: "Serve cached catalogue snapshots with 15-minute jitter; apply Cloud Armor rate limiting.",
    },
  ]);

  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const handleTakeAction = async (incidentId: string, action: "APPROVE_OVERRIDE" | "BLOCK_PERMANENTLY") => {
    setActionInProgress(incidentId);
    setActionSuccessMsg(null);
    try {
      await api.takeFraudAction(incidentId, action, `Action triggered from Trust Analyst Console: ${action}`);
      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === incidentId
            ? { ...inc, status: action === "BLOCK_PERMANENTLY" ? "BLACKLISTED" : "OVERRIDDEN" }
            : inc
        )
      );
      setActionSuccessMsg(`Incident ${incidentId} successfully resolved with action: ${action}`);
    } catch {
      // silent
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Trust Analyst: Fraud & Replay Defense Queue</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Operated by <code className="text-amber-300 font-mono font-bold">ag-agent-trust-analyst</code> (A1 authority, zero commercial tools). Displays mandatory counter-evidence alongside each security finding.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3.5 py-2 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800 font-bold shadow-sm">
            {incidents.filter((i) => i.status === "QUARANTINED").length} Active Threats Quarantined
          </span>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-700 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Incidents List */}
      <div className="space-y-6">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all duration-150"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-rose-300 bg-rose-950 px-2.5 py-1 rounded-md border border-rose-800">
                  {inc.id}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">{inc.vector}</h3>
                  <span className="text-xs font-mono text-slate-400">
                    Counterparty: <strong className="text-slate-300">{inc.agent_id}</strong> · {inc.timestamp}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-md bg-rose-950 text-rose-300 border border-rose-800">
                  {inc.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{inc.explanation}</p>

            {/* Evidence & Mandatory Counter-Evidence Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Primary Evidence */}
              <div className="bg-rose-950/20 border border-rose-900/60 p-4 rounded-xl space-y-2.5 shadow-inner">
                <span className="text-[11px] uppercase font-bold text-rose-400 block tracking-wider">
                  Primary Evidence Observed
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {inc.evidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mandatory Counter-Evidence Block */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2.5 shadow-inner">
                <span className="text-[11px] uppercase font-bold text-amber-300 block tracking-wider">
                  Mandatory Adversarial Counter-Evidence
                </span>
                <ul className="space-y-2 text-xs text-slate-300">
                  {inc.mandatory_counter_evidence.map((cev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{cev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendation & Mitigating Action Buttons */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs shadow-inner">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px] block mb-0.5">
                  Prescribed Mitigation
                </span>
                <span className="text-amber-300 text-xs font-medium">{inc.recommended_action}</span>
              </div>

              {inc.status === "QUARANTINED" && (
                <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleTakeAction(inc.id, "APPROVE_OVERRIDE")}
                    disabled={actionInProgress === inc.id}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-all font-medium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Override (False Positive)</span>
                  </button>
                  <button
                    onClick={() => handleTakeAction(inc.id, "BLOCK_PERMANENTLY")}
                    disabled={actionInProgress === inc.id}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-all font-bold shadow-md shadow-rose-600/30"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Enforce 24h Blacklist</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
