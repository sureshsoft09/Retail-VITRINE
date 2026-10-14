import React, { useState } from "react";
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
  const [decisionBanner, setDecisionBanner] = useState<string | null>(null);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              1. Suspicious Orders
            </div>
            <div className="text-xl font-serif font-bold text-clay-700 mt-1">
              {heldCount} Held in Queue
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5">
              Stopped before stock lock
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              2. Risk Events
            </div>
            <div className="text-xl font-serif font-bold text-ink-900 mt-1">
              {fraudRecords.length} Investigated
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5">
              100% screened at checkout
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              3. Unauthorized Activity
            </div>
            <div className="text-xl font-serif font-bold text-sage-700 mt-1">
              ${totalExposureProtected.toLocaleString()} Saved
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5">
              Zero inventory lost to fraud
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              4. Protection Decisions
            </div>
            <div className="text-xl font-serif font-bold text-ink-900 mt-1">
              0% False Declines
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5">
              VIP fairness checks active
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-500">
              5. Investigation Results
            </div>
            <div className="text-xl font-serif font-bold text-sage-700 mt-1">
              2-Step Verified
            </div>
            <div className="text-[11px] text-ink-600 mt-0.5">
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

      {/* SECTION 2: SUSPICIOUS ORDERS QUEUE & INVESTIGATION RESULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Risk Event Queue */}
        <div className="lg:col-span-5 space-y-3.5">
          <div>
            <h3 className="font-serif font-bold text-lg text-ink-900">
              Suspicious Orders & Risk Events Queue
            </h3>
            <p className="text-xs text-ink-600">
              Select a flagged order or inquiry to review investigation results and take action.
            </p>
          </div>

          {fraudRecords.map((rec) => {
            const isSelected = rec.id === activeAlert?.id;
            const badge = getStatusBadge(rec.status);
            return (
              <div
                key={rec.id}
                onClick={() => setSelectedAlertId(rec.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#1C1917] text-white border-[#1C1917] shadow-md"
                    : "bg-white hover:bg-ivory-50 text-ink-900 border-ivory-300 shadow-enterprise"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isSelected
                        ? "bg-white/15 text-white border-white/25"
                        : badge.style
                    }`}
                  >
                    {badge.label}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      rec.threat_score >= 85
                        ? isSelected
                          ? "text-[#FCA5A5]"
                          : "text-clay-700"
                        : isSelected
                        ? "text-[#F6C867]"
                        : "text-gold-700"
                    }`}
                  >
                    Risk Score: {rec.threat_score}/100
                  </span>
                </div>

                <div className="font-serif font-bold text-sm leading-snug">
                  {rec.vector}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    isSelected ? "text-ivory-300" : "text-ink-600"
                  }`}
                >
                  Order Ref: <strong>{rec.txn_id}</strong> · Account:{" "}
                  {rec.buyer_agent_id}
                </div>

                <div
                  className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                    isSelected
                      ? "border-white/15 text-ivory-300"
                      : "border-ivory-200 text-ink-500"
                  }`}
                >
                  <span>
                    Value at Risk:{" "}
                    <strong
                      className={isSelected ? "text-white" : "text-ink-900"}
                    >
                      ${rec.financial_exposure_usd.toFixed(2)}
                    </strong>
                  </span>
                  <span className="font-semibold">View Investigation →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 7 Cols: Detailed Investigation Results & Protection Decisions */}
        {activeAlert && (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-ivory-300 p-6 shadow-enterprise-md space-y-5 self-start">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ivory-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-clay-700">
                    Case #{activeAlert.id} · Order {activeAlert.txn_id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      getStatusBadge(activeAlert.status).style
                    }`}
                  >
                    {getStatusBadge(activeAlert.status).label}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl text-ink-900 mt-1">
                  {activeAlert.vector}
                </h3>
                <p className="text-xs text-ink-600 mt-0.5">
                  Buyer Account:{" "}
                  <strong className="text-ink-900">
                    {activeAlert.buyer_agent_id}
                  </strong>{" "}
                  · Authorization Ref:{" "}
                  <strong className="text-ink-900">
                    {activeAlert.mandate_id}
                  </strong>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-clay-50 border border-clay-200 text-center shrink-0">
                <div className="text-[10px] font-bold uppercase text-clay-700">
                  Risk Severity
                </div>
                <div className="text-xl font-serif font-bold text-clay-800">
                  {activeAlert.threat_score} / 100
                </div>
              </div>
            </div>

            {/* Executive Summary of the Risk Event */}
            <div className="p-4 rounded-xl bg-ivory-50 border border-ivory-200 text-xs space-y-1.5">
              <div className="font-bold text-ink-900 flex items-center gap-1.5">
                <FileSearch className="w-4 h-4 text-clay-700" />
                <span>What Happened (Unauthorized Activity Summary)</span>
              </div>
              <p className="text-ink-700 leading-relaxed">
                {activeAlert.explanation}
              </p>
            </div>

            {/* Two-Column Investigation Results: Confirmed Risk Findings vs Customer Fairness Check */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Confirmed Risk Findings */}
              <div className="p-4 rounded-xl bg-clay-50/50 border border-clay-200 space-y-2.5">
                <div className="font-bold text-clay-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-clay-700" />
                  <span>Confirmed Risk Indicators</span>
                </div>
                <ul className="space-y-2 text-ink-800">
                  {activeAlert.evidence.map((ev, i) => (
                    <li
                      key={i}
                      className="p-2.5 rounded-lg bg-white border border-clay-200 leading-relaxed"
                    >
                      • {ev}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mandatory Legitimate Customer Check */}
              <div className="p-4 rounded-xl bg-sage-50/50 border border-sage-200 space-y-2.5">
                <div className="font-bold text-sage-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-sage-700" />
                  <span>Legitimate Customer Fairness Check</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-sage-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-ink-500">
                    Could This Be an Honest Mistake?
                  </div>
                  <p className="text-ink-800 leading-relaxed">
                    {activeAlert.innocence_hypothesis}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-sage-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-clay-700">
                    Investigation Finding:
                  </div>
                  <p className="text-ink-800 leading-relaxed font-medium">
                    {activeAlert.falsification_proof}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommended Protection Decision */}
            <div className="p-4 rounded-xl bg-ivory-100 border border-ivory-300 text-xs">
              <span className="font-bold text-ink-900">
                Recommended Protection Action:{" "}
              </span>
              <span className="text-ink-700">
                {activeAlert.recommended_action}
              </span>
            </div>

            {/* Protection Decision Action Buttons */}
            <div className="pt-2 border-t border-ivory-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold text-ink-700">
                Record Protection Decision:
              </span>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() =>
                    handleProtectionDecision(
                      activeAlert,
                      "OVERRIDDEN",
                      "Order Approved (Customer Verified)"
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-sage-600 hover:bg-sage-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Order Override</span>
                </button>

                <button
                  onClick={() =>
                    handleProtectionDecision(
                      activeAlert,
                      "THROTTLED",
                      "Account Inquiry Speed Restricted"
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Restrict Account Speed</span>
                </button>

                <button
                  onClick={() =>
                    handleProtectionDecision(
                      activeAlert,
                      "BLACKLISTED",
                      "Buyer Account Blocked & Order Cancelled"
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-clay-600 hover:bg-clay-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Block Account & Cancel Order</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
