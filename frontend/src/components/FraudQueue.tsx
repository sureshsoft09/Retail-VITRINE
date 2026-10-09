import React from "react";
import { ShieldAlert, AlertTriangle, Eye, CheckCircle2, XCircle } from "lucide-react";

export const FraudQueue: React.FC = () => {
  const incidents = [
    {
      id: "FRD-2026-0089",
      timestamp: "2026-10-09T11:25:02Z",
      agent_id: "buyer-hostile-482",
      vector: "AP2 Mandate Nonce Replay",
      verdict: "REJECT_UNTRUSTED",
      explanation: "Buyer presented a cryptographic mandate containing an authorization nonce that was previously spent 48 seconds ago on transaction txn-live-9014.",
      evidence: [
        "Nonce 'ap2-nonce-984b-consumed' found in Redis anti-replay cache (TTL: 300s).",
        "Signer public key matches previously known testing identity 'did:key:z6Mkq...",
        "Request velocity burst observed: 45 queries/min from originating client IP.",
      ],
      mandatory_counter_evidence: [
        "Counter-evidence check: Could client have experienced network partition causing legitimate retry?",
        "Result: Retry payload contains altered shipping address (Seattle vs Portland). Invariant violated — intentional replay confirmed.",
      ],
      recommended_action: "Drop connection with 401 Unauthorized; add agent public key to ephemeral hostile reputation list for 24 hours.",
    },
    {
      id: "FRD-2026-0088",
      timestamp: "2026-10-09T09:14:22Z",
      agent_id: "buyer-scraping-probe-19",
      vector: "Competitive Inventory Scraping Pattern",
      verdict: "THROTTLE_RATE_LIMIT",
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
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h2 className="text-xl font-bold text-[#fbf7f7]">Trust Analyst: Fraud & Replay Defense Queue</h2>
        </div>
        <p className="text-sm text-[#d1b8c0] mt-1">
          Operated by <code className="text-amber-300">ag-agent-trust-analyst</code> (A1 authority, zero commercial tools). Displays mandatory counter-evidence alongside each security finding.
        </p>
      </div>

      {/* Incidents List */}
      <div className="space-y-6">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#3f222d]/60 gap-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded border border-rose-800">
                  {inc.id}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-[#fbf7f7]">{inc.vector}</h3>
                  <span className="text-[11px] font-mono text-[#a26769]">
                    Counterparty: <strong className="text-[#d1b8c0]">{inc.agent_id}</strong> · {inc.timestamp}
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 self-start sm:self-auto">
                {inc.verdict}
              </span>
            </div>

            <p className="text-xs text-[#d1b8c0] leading-relaxed">{inc.explanation}</p>

            {/* Evidence & Mandatory Counter-Evidence Split Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Primary Evidence */}
              <div className="bg-[#1f0e15] border border-rose-900/60 p-4 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-rose-400 block tracking-wider">
                  Primary Evidence Observed
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#e8d5da]">
                  {inc.evidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mandatory Counter-Evidence Block */}
              <div className="bg-[#101915] border border-emerald-900/60 p-4 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">
                  Mandatory Counter-Evidence & Fair-Defense Check
                </span>
                <ul className="space-y-1.5 text-[11px] text-[#d1e8dc]">
                  {inc.mandatory_counter_evidence.map((cev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{cev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="p-3 rounded-lg bg-[#201017] border border-[#3f222d] text-xs font-mono text-[#c9a227] flex items-center gap-2">
              <span className="font-bold text-[#fbf7f7]">Action Taken:</span>
              <span>{inc.recommended_action}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
