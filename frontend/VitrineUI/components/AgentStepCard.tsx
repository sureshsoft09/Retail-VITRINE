import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XOctagon,
  AlertTriangle,
  Sparkles,
  ShoppingBag,
  Search,
  Truck,
  ShieldCheck,
  RefreshCw,
  FileText,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { AgentStep } from "../types";

export const AgentStepCard: React.FC<{ step: AgentStep }> = ({ step }) => {
  const [expanded, setExpanded] = useState(false);

  // Translate step phases into VITRINE Agentic Commerce Intelligence stages
  const getBusinessStageInfo = (agent: string, phase: string) => {
    const key = `${agent} ${phase}`.toUpperCase();
    if (key.includes("INTAKE") || key.includes("SUPERVISOR")) {
      return {
        title: "AI Buyer Agent Intent Intake",
        department: "Agent Commerce Supervisor",
        stageLabel: "1. Buyer Agent Request",
        icon: ShoppingBag,
        badgeStyle: "bg-ivory-100 text-ink-800 border-ivory-300",
        iconBg: "bg-ivory-100 text-ink-800 border-ivory-300",
      };
    }
    if (key.includes("DISCOVER") || key.includes("INTENT")) {
      return {
        title: "Product Brain Discoverability Match",
        department: "Product Brain Intelligence",
        stageLabel: "2. Discoverability & Specs",
        icon: Search,
        badgeStyle: "bg-berry-50 text-berry-800 border-berry-200",
        iconBg: "bg-berry-50 text-berry-700 border-berry-200",
      };
    }
    if (key.includes("PROMISE") || key.includes("ATP")) {
      return {
        title: "Promise Intelligence · ATP & Carrier SLA Check",
        department: "Promise Verification Engine",
        stageLabel: "3. Promise Verification",
        icon: Truck,
        badgeStyle: "bg-sage-50 text-sage-800 border-sage-200",
        iconBg: "bg-sage-50 text-sage-700 border-sage-200",
      };
    }
    if (key.includes("CRITIC") || key.includes("VALIDATE") || key.includes("GATE")) {
      return {
        title: "Commitment Critic · 11-Gate Evaluation",
        department: "Commitment Critic",
        stageLabel: "4. Critic Verification",
        icon: ShieldCheck,
        badgeStyle: "bg-gold-50 text-gold-800 border-gold-300",
        iconBg: "bg-gold-50 text-gold-700 border-gold-200",
      };
    }
    if (key.includes("SUBSTITUT") || key.includes("RECOMMEND")) {
      return {
        title: "Autonomous Alternative Recommendation",
        department: "Product Brain Recovery",
        stageLabel: "5. Autonomous Substitution",
        icon: RefreshCw,
        badgeStyle: "bg-berry-50 text-berry-800 border-berry-200",
        iconBg: "bg-berry-50 text-berry-700 border-berry-200",
      };
    }
    if (key.includes("TRUST") || key.includes("FRAUD") || key.includes("SENTINEL")) {
      return {
        title: "Buyer Agent Trust & Mandate Sentinel",
        department: "Trust & Governance Sentinel",
        stageLabel: "Trust Verification",
        icon: ShieldAlert,
        badgeStyle: "bg-clay-50 text-clay-800 border-clay-300",
        iconBg: "bg-clay-50 text-clay-700 border-clay-200",
      };
    }
    if (key.includes("NEGOTIAT") || key.includes("OFFER")) {
      return {
        title: "Autonomous Commercial Offer & Commitment",
        department: "Agent Commerce Desk",
        stageLabel: "6. Binding Offer",
        icon: FileText,
        badgeStyle: "bg-sage-50 text-sage-800 border-sage-300",
        iconBg: "bg-sage-50 text-sage-700 border-sage-200",
      };
    }
    return {
      title: agent.replace(/^ag-|^orch-/, "").replace(/-/g, " "),
      department: "VITRINE Intelligence",
      stageLabel: phase,
      icon: Building2,
      badgeStyle: "bg-ivory-100 text-ink-700 border-ivory-300",
      iconBg: "bg-ivory-100 text-ink-700 border-ivory-300",
    };
  };

  const statusStyles: Record<
    string,
    { card: string; pill: string; icon: React.ReactNode; label: string }
  > = {
    COMPLETED: {
      card: "border-sage-200 bg-white hover:border-sage-300",
      pill: "bg-sage-50 text-sage-800 border-sage-200",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" />,
      label: "Verified & Approved",
    },
    BLOCKED: {
      card: "border-clay-300 bg-clay-50/40 hover:border-clay-400 ring-1 ring-clay-500/10",
      pill: "bg-clay-100 text-clay-800 border-clay-300",
      icon: <XOctagon className="w-3.5 h-3.5 text-clay-600" />,
      label: "Policy / Stock Hold",
    },
    WARNING: {
      card: "border-gold-300 bg-gold-50/40 hover:border-gold-400",
      pill: "bg-gold-100 text-gold-800 border-gold-300",
      icon: <AlertTriangle className="w-3.5 h-3.5 text-gold-600" />,
      label: "Review Required",
    },
    INFO: {
      card: "border-ivory-300 bg-white hover:border-ivory-400",
      pill: "bg-ivory-100 text-ink-700 border-ivory-300",
      icon: <Sparkles className="w-3.5 h-3.5 text-berry-600" />,
      label: "Completed",
    },
  };

  const stageInfo = getBusinessStageInfo(step.agent, step.phase);
  const StageIcon = stageInfo.icon;
  const statusInfo = statusStyles[step.status] || statusStyles.INFO;

  const formatDataLabel = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      className={`rounded-xl border ${statusInfo.card} p-4 transition-all shadow-enterprise`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${stageInfo.iconBg}`}
          >
            <StageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-ink-900 capitalize">
                {stageInfo.title}
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${stageInfo.badgeStyle}`}
              >
                {stageInfo.department}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.pill}`}
              >
                {statusInfo.icon}
                {statusInfo.label}
              </span>
              <span className="text-xs text-ink-500">
                Step:{" "}
                <strong className="text-ink-800 font-semibold">
                  {stageInfo.stageLabel}
                </strong>
              </span>
            </div>
            <p className="text-sm text-ink-800 mt-1.5 leading-relaxed">
              {step.message}
            </p>
          </div>
        </div>

        {step.data && Object.keys(step.data).length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-ink-700 hover:text-ink-900 flex items-center gap-1.5 bg-ivory-100 hover:bg-ivory-200 px-3 py-1.5 rounded-lg border border-ivory-300 transition-colors shrink-0 font-semibold"
          >
            <span>{expanded ? "Hide Details" : "Order Details"}</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {expanded && step.data && (
        <div className="mt-4 pt-3.5 border-t border-ivory-200 space-y-3 text-xs">
          <div className="bg-ivory-50 p-3.5 rounded-lg border border-ivory-300">
            <span className="text-[10px] uppercase text-ink-500 font-bold block mb-2 tracking-wider">
              Operational Verification Summary
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {Object.entries(step.data).map(([key, val]) => (
                <div
                  key={key}
                  className="bg-white p-2.5 rounded-lg border border-ivory-200"
                >
                  <div className="text-[10px] text-ink-500 font-semibold">
                    {formatDataLabel(key)}
                  </div>
                  <div className="text-xs font-bold text-ink-900 mt-0.5 break-words">
                    {Array.isArray(val)
                      ? val.join(", ")
                      : typeof val === "object" && val !== null
                      ? JSON.stringify(val)
                      : String(val)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
