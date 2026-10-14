import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  ClipboardCheck,
  AlertCircle,
} from "lucide-react";
import { GateCondition } from "../types";

interface GateChecklistProps {
  conditions: GateCondition[];
  passed: boolean;
  onConditionClick?: (cond: GateCondition) => void;
}

const businessConditionTitles: Record<string, { title: string; category: string }> = {
  COND_01_ATP_AVAILABLE: {
    title: "Available Warehouse Inventory",
    category: "Inventory",
  },
  COND_02_SLA_DEADLINE: {
    title: "On-Time Delivery Schedule",
    category: "Delivery",
  },
  COND_03_SAFETY_STOCK: {
    title: "Safety Stock Reserve Protected",
    category: "Inventory",
  },
  COND_04_MARGIN_FLOOR: {
    title: "Minimum Profit Margin Met",
    category: "Commercial",
  },
  COND_05_DISCOUNT_CAP: {
    title: "Promotional Discount Within Limit",
    category: "Commercial",
  },
  COND_06_MAX_ORDER_VALUE: {
    title: "Order Value Within Approval Limit",
    category: "Commercial",
  },
  COND_07_PROVENANCE_CONFIDENCE: {
    title: "Verified Product Specifications",
    category: "Merchandising",
  },
  COND_08_REGULATORY_COMPLIANCE: {
    title: "Garment Care & Quality Compliance",
    category: "Compliance",
  },
  COND_09_COUNTERPARTY_TRUST: {
    title: "Buyer Account Risk Check",
    category: "Risk Protection",
  },
  COND_10_AP2_MANDATE_VALID: {
    title: "Customer Payment Authorization",
    category: "Payment",
  },
  COND_11_KILL_SWITCH_INACTIVE: {
    title: "Automated Order Approvals Active",
    category: "Operations",
  },
};

export const GateChecklist: React.FC<GateChecklistProps> = ({
  conditions,
  passed,
  onConditionClick,
}) => {
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [replayNonce, setReplayNonce] = useState<number>(0);

  useEffect(() => {
    setRevealedCount(0);
    if (!conditions || conditions.length === 0) return;

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setRevealedCount(current);
      if (current >= conditions.length) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [conditions, replayNonce]);

  const totalCount = conditions.length || 11;
  const isRevealing = revealedCount < totalCount;
  const visibleConditions = conditions.slice(0, revealedCount);
  const passedCount = visibleConditions.filter((c) => c.passed).length;
  const failedCount = visibleConditions.filter((c) => !c.passed).length;

  return (
    <div className="bg-white border border-ivory-300 rounded-2xl p-6 shadow-enterprise-md space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-ivory-200 gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
              isRevealing
                ? "bg-berry-50 text-berry-700 border-berry-200"
                : passed
                ? "bg-sage-50 text-sage-700 border-sage-300"
                : "bg-clay-50 text-clay-700 border-clay-300"
            }`}
          >
            {passed && !isRevealing ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="font-serif font-bold text-xl text-ink-900 tracking-tight">
                Commitment Critic · 11-Gate Promise Verification
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-ivory-100 text-ink-800 border border-ivory-300">
                Deterministic Autonomy Guardrail
              </span>
            </div>
            <p className="text-xs text-ink-600 mt-1">
              Before any autonomous offer is committed to an AI Buyer Agent, the Commitment Critic verifies all 11 inventory, SLA, margin, trust, and governance checks.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ivory-100 border border-ivory-300 text-xs font-semibold text-ink-800">
            <span className="text-ink-500">Critic Gates:</span>
            <span className="font-bold text-ink-900">
              {revealedCount} / {totalCount}
            </span>
            <span className="text-ivory-400">|</span>
            <span className="text-sage-700 font-bold">
              {passedCount} Verified
            </span>
            {failedCount > 0 && (
              <>
                <span className="text-ivory-400">·</span>
                <span className="text-clay-700 font-bold">
                  {failedCount} Blocked
                </span>
              </>
            )}
          </div>

          <button
            onClick={() => setReplayNonce((n) => n + 1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-ivory-100 text-ink-700 border border-ivory-300 transition-colors shadow-sm"
            title="Re-run Commitment Critic verification"
          >
            <RotateCcw className="w-3.5 h-3.5 text-ink-600" />
            Re-Run Critic
          </button>

          <span
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase border shadow-sm ${
              isRevealing
                ? "bg-berry-50 text-berry-800 border-berry-200"
                : passed
                ? "bg-sage-600 text-white border-sage-700"
                : "bg-clay-600 text-white border-clay-700"
            }`}
          >
            {isRevealing
              ? `CRITIC VERIFYING (${revealedCount}/${totalCount})...`
              : passed
              ? "✓ COMMITMENT CRITIC APPROVED"
              : `⛔ CRITIC VETO (${failedCount} GATE${
                  failedCount > 1 ? "S" : ""
                } HELD)`}
          </span>
        </div>
      </div>

      {/* Progress Strip */}
      <div className="bg-ivory-50 border border-ivory-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ClipboardCheck className="w-4 h-4 text-sage-700 shrink-0" />
          <div className="text-xs text-ink-700">
            <span className="font-bold text-ink-900">
              Commitment Critic Law:{" "}
            </span>
            <span>
              Zero unverified promises. Autonomous commerce only executes when 100% of ATP, SLA, margin floor, buyer trust, and governance checks pass.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {conditions.map((cond, i) => {
            const isShown = i < revealedCount;
            return (
              <div
                key={cond.id}
                title={`${
                  businessConditionTitles[cond.id]?.title || cond.id
                }: ${isShown ? (cond.passed ? "Verified" : "Policy Hold") : "Checking"}`}
                className={`h-2.5 w-5 rounded-sm transition-all duration-200 ${
                  !isShown
                    ? "bg-ivory-300"
                    : cond.passed
                    ? "bg-sage-600 shadow-sm"
                    : "bg-clay-600 ring-2 ring-clay-300"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 11-Point Verification Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {conditions.map((cond, idx) => {
          const isVisible = idx < revealedCount;
          const condNumber = String(idx + 1).padStart(2, "0");
          const mapped = businessConditionTitles[cond.id];
          const displayTitle =
            mapped?.title ||
            cond.id
              .replace(/^COND_\d+_/, "")
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
          const displayCategory = mapped?.category || "Policy";

          if (!isVisible) {
            return (
              <div
                key={cond.id}
                className="p-4 rounded-xl border border-dashed border-ivory-300 bg-ivory-50/60 flex flex-col justify-between min-h-[124px] opacity-60 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-400">
                    Check #{condNumber} · {displayTitle}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-ivory-200 text-ink-500">
                    CHECKING...
                  </span>
                </div>
                <div className="text-xs text-ink-400 mt-2">
                  Validating store requirement...
                </div>
              </div>
            );
          }

          return (
            <div
              key={cond.id}
              onClick={() => onConditionClick?.(cond)}
              className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-enterprise-md ${
                cond.passed
                  ? "bg-sage-50/45 border-sage-300 hover:border-sage-500 text-ink-900"
                  : "bg-clay-50/80 border-clay-400 hover:border-clay-600 text-ink-900 ring-2 ring-clay-500/20"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {cond.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-clay-600 shrink-0" />
                    )}
                    <div>
                      <span className="text-xs font-bold text-ink-900 tracking-tight block">
                        {displayTitle}
                      </span>
                      <span className="text-[10px] text-ink-500 font-medium">
                        Check #{condNumber} · {displayCategory}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      cond.passed
                        ? "bg-sage-100 text-sage-800 border-sage-300"
                        : "bg-clay-600 text-white border-clay-700"
                    }`}
                  >
                    {cond.passed ? "VERIFIED" : "POLICY HOLD"}
                  </span>
                </div>

                <p className="text-xs text-ink-700 leading-relaxed mt-1">
                  {cond.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-ivory-200/90 flex items-center justify-between text-xs">
                <span className="text-ink-500">
                  Actual:{" "}
                  <strong
                    className={`font-semibold ${
                      cond.passed ? "text-sage-800" : "text-clay-700"
                    }`}
                  >
                    {String(cond.observed)}
                  </strong>
                </span>
                <span className="text-ink-500">
                  Requirement:{" "}
                  <span className="text-ink-900 font-semibold">
                    {String(cond.threshold)}
                  </span>
                </span>
              </div>

              {cond.failure_reason && (
                <div className="mt-2.5 text-xs text-clay-800 font-semibold bg-clay-100/90 p-2.5 rounded-lg border border-clay-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-clay-700 shrink-0 mt-0.5" />
                  <span>{cond.failure_reason}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
