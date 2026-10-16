import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XOctagon,
  Search,
  UserCheck,
  Ban,
  Clock,
  DollarSign,
  FileSearch,
  PlusCircle,
  X,
  ArrowRight,
} from "lucide-react";
import { useVitrineStore, EnterpriseFraudRecord } from "../store";

interface FraudQueueProps {
  onSwitchToGovernance?: () => void;
}

export const FraudQueue: React.FC<FraudQueueProps> = ({
  onSwitchToGovernance,
}) => {
  const { fraudRecords, updateFraudRecordStatus, addHostileFraudRecord } =
    useVitrineStore();

  const [selectedAlertId, setSelectedAlertId] = useState<string>(
    fraudRecords[0]?.id || "RSK-2026-0089"
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [decisionBanner, setDecisionBanner] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeAlert =
    fraudRecords.find((r) => r.id === selectedAlertId) || fraudRecords[0];

  const handleProtectionDecision = (
    record: EnterpriseFraudRecord,
    newStatus: EnterpriseFraudRecord["status"],
    actionLabel: string
  ) => {
    updateFraudRecordStatus(record.id, newStatus);
    setDecisionBanner(
      `Trust Sentinel Decision Applied for ${record.id} (Order ${record.txn_id}): ${actionLabel}`
    );
  };

  const handleSimulateSuspiciousOrder = () => {
    const created = addHostileFraudRecord({
      vector: "Unauthorized AI Buyer Agent Mandate Replay & Freight Reroute",
      explanation:
        "External buyer agent attempted to place an express order for 2x Mulberry Silk Blouses using a replayed mandate signature while rerouting freight to an unverified warehouse.",
    });
    setSelectedAlertId(created.id);
    setDecisionBanner(
      `Unauthorized Buyer Agent Activity #${created.txn_id} intercepted by Trust Sentinel and placed in quarantine.`
    );
  };

  const getStatusBadge = (status: EnterpriseFraudRecord["status"]) => {
    switch (status) {
      case "QUARANTINED":
        return {
          label: "Held by Trust Sentinel",
          style: "bg-clay-100 text-clay-800 border-clay-300",
        };
      case "THROTTLED":
        return {
          label: "Agent Rate Restricted",
          style: "bg-gold-100 text-gold-800 border-gold-300",
        };
      case "BLACKLISTED":
        return {
          label: "Agent Mandate Revoked",
          style: "bg-ink-900 text-white border-ink-900",
        };
      case "OVERRIDDEN":
        return {
          label: "Verified & Released",
          style: "bg-sage-100 text-sage-800 border-sage-300",
        };
    }
  };

  const heldCount = fraudRecords.filter(
    (r) => r.status === "QUARANTINED"
  ).length;
  const totalExposureProtected = fraudRecords.reduce(
    (sum, r) => sum + (r.financial_exposure_usd || 0),
    42147
  );

  return (
    <div className="space-y-7">
      {/* TOP HEADER: TRUST & GOVERNANCE — BUYER AGENT TRUST SENTINEL */}
      <div className="bg-white border border-ivory-300 rounded-2xl p-6 shadow-enterprise-md space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-ivory-200 pb-5">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-clay-50 text-clay-800 border border-clay-200">
                Trust & Governance · Buyer Agent Trust Sentinel
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gold-50 text-gold-800 border border-gold-200">
                Autonomous Threat Defense
              </span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-ink-900 mt-1.5">
              Buyer Agent Trust & Protection: Are We Protecting Autonomous Commerce?
            </h2>
            <p className="text-xs text-ink-600 mt-1 max-w-3xl">
              Verifies external AI Buyer Agent identities, spending mandates, and behavioral velocity—intercepting mandate replays, unauthorized freight reroutes, and adversarial inventory scraping before stock is locked, while protecting legitimate VIP concierge retries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onSwitchToGovernance && (
              <button
                onClick={onSwitchToGovernance}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-ivory-100 hover:bg-ivory-200 text-ink-800 border border-ivory-300 text-xs font-bold transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-sage-700" />
                <span>Autonomy Governance Rules</span>
              </button>
            )}
            <button
              onClick={handleSimulateSuspiciousOrder}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1917] hover:bg-ink-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#F6C867]" />
              <span>Simulate Hostile Agent Attempt</span>
            </button>
          </div>
        </div>

        {/* THE 5 REQUIRED RISK & PROTECTION PILLARS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              1. Suspicious Orders
            </div>
            <div className="text-lg font-serif font-bold text-clay-700 mt-1">
              {heldCount} Held in Queue
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              Stopped before stock lock
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              2. Risk Events
            </div>
            <div className="text-lg font-serif font-bold text-ink-900 mt-1">
              {fraudRecords.length} Investigated
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              100% screened at checkout
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              3. Unauthorized Activity
            </div>
            <div className="text-lg font-serif font-bold text-sage-700 mt-1">
              ${totalExposureProtected.toLocaleString()} Saved
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              Zero inventory lost to fraud
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              4. Protection Decisions
            </div>
            <div className="text-lg font-serif font-bold text-ink-900 mt-1">
              0% False Declines
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              VIP fairness checks active
            </div>
          </div>

          <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 flex flex-col justify-between h-full col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              5. Investigation Results
            </div>
            <div className="text-lg font-serif font-bold text-sage-700 mt-1">
              2-Step Verified
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5 leading-snug">
              Risk proof + fairness review
            </div>
          </div>
        </div>

        {decisionBanner && (
          <div className="p-3.5 rounded-xl bg-sage-50 border border-sage-200 text-sage-900 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
              <span>{decisionBanner}</span>
            </div>
            <button
              onClick={() => setDecisionBanner(null)}
              className="text-xs underline text-sage-700"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: SUSPICIOUS ORDERS DIRECTORY (FULL-WIDTH + SLIDE-OVER FORENSIC DRAWER) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-clay-800 px-2.5 py-0.5 rounded-full bg-clay-50 border border-clay-200">
                Threat Forensics · Sentinel Queue
              </span>
              <span className="text-xs font-semibold text-ink-500">
                {fraudRecords.length} Incidents Logged
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl text-ink-900 mt-1">
              Suspicious Orders & Risk Events Directory
            </h3>
            <p className="text-xs text-ink-600 mt-0.5">
              Full-width security queue. Click any incident to open the forensic investigation drawer, inspect evidence proofs, and apply defense actions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSimulateSuspiciousOrder}
              className="px-4 py-2 rounded-xl bg-clay-700 hover:bg-clay-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Simulate Unauthorized Order</span>
            </button>
          </div>
        </div>

        {/* Quick Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pb-1">
          {[
            { id: "ALL", label: `All Incidents (${fraudRecords.length})` },
            { id: "QUARANTINED", label: `Held in Quarantine (${heldCount})` },
            { id: "THROTTLED", label: "Throttled Rate-Limits" },
            { id: "OVERRIDDEN", label: "Verified & Released" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`text-[11px] px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                filterStatus === f.id
                  ? "bg-clay-100 text-clay-900 border-clay-300 font-bold"
                  : "bg-white hover:bg-ivory-100 text-ink-700 border-ivory-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Full-Width 3-Column Risk Incident Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fraudRecords
            .filter((rec) => filterStatus === "ALL" || rec.status === filterStatus)
            .map((rec) => {
              const badge = getStatusBadge(rec.status);
              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-enterprise flex flex-col justify-between hover:shadow-enterprise-md hover:border-ivory-400 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.style}`}
                      >
                        {badge.label}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          rec.threat_score >= 85
                            ? "bg-clay-100 text-clay-800 border border-clay-300"
                            : "bg-gold-100 text-gold-800 border border-gold-300"
                        }`}
                      >
                        Threat: {rec.threat_score}/100
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-base text-ink-900 leading-snug group-hover:text-clay-800 transition-colors">
                      {rec.vector}
                    </h4>
                    <div className="text-[11px] text-ink-500 mt-1">
                      Case #{rec.id} · Order Ref: <strong className="text-ink-700">{rec.txn_id}</strong>
                    </div>
                    <div className="text-[11px] text-ink-500">
                      Buyer Account: <strong className="text-ink-700">{rec.buyer_agent_id}</strong>
                    </div>

                    <p className="text-xs text-ink-600 mt-2 line-clamp-2 leading-relaxed">
                      {rec.explanation}
                    </p>

                    {/* Value at Risk & Recommended Defense Preview */}
                    <div className="mt-4 pt-3 border-t border-ivory-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-ink-500">Financial Exposure:</span>
                        <span className="font-serif font-bold text-ink-900">
                          ${rec.financial_exposure_usd.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-ink-500">Evidence Proofs:</span>
                        <span className="font-semibold text-clay-700">
                          {rec.evidence.length} Indicators Flagged
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button: Open Slide-Over Drawer */}
                  <div className="mt-5 pt-3 border-t border-ivory-200">
                    <button
                      onClick={() => {
                        setSelectedAlertId(rec.id);
                        setIsDrawerOpen(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Review Forensic Investigation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* RESPONSIVE FORENSIC INVESTIGATION MODAL */}
      {isDrawerOpen && activeAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto">
          {/* Backdrop with click-to-close */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Responsive Modal Container - Auto-compacts to content height */}
          <div className="relative w-full max-w-2xl lg:max-w-4xl my-auto max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-ivory-300 flex flex-col z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header - Compact */}
            <div className="px-5 py-3.5 border-b border-ivory-200 flex items-start justify-between bg-ivory-50/60 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-clay-800 px-2 py-0.5 rounded-full bg-clay-100 border border-clay-300">
                    Case #{activeAlert.id} · Order {activeAlert.txn_id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      getStatusBadge(activeAlert.status).style
                    }`}
                  >
                    {getStatusBadge(activeAlert.status).label}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-clay-100 text-clay-800 border border-clay-300">
                    Risk: {activeAlert.threat_score}/100
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-ink-900">
                  {activeAlert.vector}
                </h3>
                <p className="text-[11px] text-ink-600">
                  Buyer Account: <strong className="text-ink-900">{activeAlert.buyer_agent_id}</strong> · Financial Exposure:{" "}
                  <strong className="text-clay-700">${activeAlert.financial_exposure_usd.toFixed(2)} USD</strong>
                </p>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-ivory-200 text-ink-600 hover:text-ink-900 transition-colors cursor-pointer"
                title="Close drawer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: Compact Forensic Breakdown */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Executive Summary */}
              <div className="p-3 rounded-xl bg-ivory-50 border border-ivory-200 text-xs space-y-1">
                <div className="font-bold text-ink-900 flex items-center gap-1.5 text-[11px]">
                  <FileSearch className="w-3.5 h-3.5 text-clay-700" />
                  <span>Unauthorized Activity Summary</span>
                </div>
                <p className="text-ink-700 text-[11px] leading-relaxed">
                  {activeAlert.explanation}
                </p>
              </div>

              {/* Two-Column Investigation: Risk Indicators vs Fairness Check */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Confirmed Risk Findings */}
                <div className="p-3 rounded-xl bg-clay-50/50 border border-clay-200 space-y-2">
                  <div className="font-bold text-clay-900 flex items-center gap-1.5 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-clay-700" />
                    <span>Confirmed Risk Indicators</span>
                  </div>
                  <ul className="space-y-1.5 text-ink-800">
                    {activeAlert.evidence.map((ev, i) => (
                      <li
                        key={i}
                        className="p-2 rounded-lg bg-white border border-clay-200 leading-snug text-[11px]"
                      >
                        • {ev}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mandatory Legitimate Customer Check */}
                <div className="p-3 rounded-xl bg-sage-50/50 border border-sage-200 space-y-2">
                  <div className="font-bold text-sage-900 flex items-center gap-1.5 text-[11px]">
                    <UserCheck className="w-3.5 h-3.5 text-sage-700" />
                    <span>Legitimate Customer Fairness Check</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-sage-200 space-y-0.5">
                    <div className="text-[9px] font-bold uppercase text-ink-500">
                      Could This Be an Honest Mistake?
                    </div>
                    <p className="text-ink-800 text-[11px] leading-relaxed">
                      {activeAlert.innocence_hypothesis}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-sage-200 space-y-0.5">
                    <div className="text-[9px] font-bold uppercase text-clay-700">
                      Investigation Finding:
                    </div>
                    <p className="text-ink-800 text-[11px] leading-relaxed font-medium">
                      {activeAlert.falsification_proof}
                    </p>
                  </div>
                </div>
              </div>

              {/* Protection Decision Actions & Recommendation Container */}
              <div className="p-3.5 rounded-xl bg-ivory-50 border border-ivory-200 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-ink-900">
                    Recommended: <span className="font-normal text-ink-700">{activeAlert.recommended_action}</span>
                  </span>
                  <span className="text-[10px] text-ink-500 uppercase font-semibold">Choose Final Verdict:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      handleProtectionDecision(
                        activeAlert,
                        "OVERRIDDEN",
                        "Order Approved (Customer Verified)"
                      );
                      setIsDrawerOpen(false);
                    }}
                    className="p-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Release</span>
                  </button>

                  <button
                    onClick={() => {
                      handleProtectionDecision(
                        activeAlert,
                        "THROTTLED",
                        "Account Inquiry Speed Restricted"
                      );
                      setIsDrawerOpen(false);
                    }}
                    className="p-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Throttle Rate Limit</span>
                  </button>

                  <button
                    onClick={() => {
                      handleProtectionDecision(
                        activeAlert,
                        "BLACKLISTED",
                        "Buyer Account Blocked & Order Cancelled"
                      );
                      setIsDrawerOpen(false);
                    }}
                    className="p-2 rounded-xl bg-clay-600 hover:bg-clay-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Block & Cancel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer - Compact */}
            <div className="px-5 py-3 border-t border-ivory-200 bg-ivory-50 flex items-center justify-between">
              <span className="text-xs text-ink-500">
                Press <kbd className="px-1.5 py-0.5 bg-white border border-ivory-300 rounded text-[10px]">Esc</kbd> or click outside to close
              </span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
