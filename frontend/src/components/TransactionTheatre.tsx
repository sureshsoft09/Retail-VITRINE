import React, { useState } from "react";
import { User, Play, AlertOctagon, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";
import { AgentStepCard } from "./AgentStepCard";
import { GateChecklist } from "./GateChecklist";
import { AgentStep, GateCondition } from "../types";

export const TransactionTheatre: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<"honest_shopper" | "bargain_hunter" | "hostile">("honest_shopper");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTxnId, setActiveTxnId] = useState("txn-live-9042");

  // Initial demo steps representing the multi-agent reasoning flow
  const honestShopperSteps: AgentStep[] = [
    {
      step_seq: 1,
      timestamp: "2026-10-09T11:20:01Z",
      agent: "orch-commerce-supervisor",
      tier: "M",
      phase: "INGRESS",
      message: "Received DISCOVER turn from buyer agent 'buyer-honest_shopper-9021'. Session initialized.",
      status: "COMPLETED",
      tools_called: ["get_session_state", "publish_step_event"],
    },
    {
      step_seq: 2,
      timestamp: "2026-10-09T11:20:02Z",
      agent: "ag-negotiation-agent",
      tier: "A2",
      phase: "CONSTRAINT_PARSING",
      message: "Parsed 5 constraints: Material='Mulberry Silk', Cuffs='French Cuffs', Deadline='Tomorrow 4pm', Dest='98101', MaxPrice=$150.",
      status: "COMPLETED",
      data: {
        material: "100% Mulberry Silk",
        sleeve_length: "French Cuffs",
        deadline: "Tomorrow by 4:00 PM",
        pincode: "98101",
      },
    },
    {
      step_seq: 3,
      timestamp: "2026-10-09T11:20:03Z",
      agent: "ag-promise-engine",
      tier: "A1",
      phase: "PROMISE_SYNTHESIS",
      message: "Evaluated 2 candidate fulfillment nodes. Local Store 042 selected for express proximity.",
      status: "COMPLETED",
      tools_called: ["compute_atp", "compute_transit_feasibility"],
      computation_ids: ["comp-atp-01", "comp-transit-01"],
      data: {
        candidate: "STORE-042",
        atp_units: 1,
        transit_hours: 3.5,
        cutoff: "Missed by 6 hours",
      },
    },
    {
      step_seq: 4,
      timestamp: "2026-10-09T11:20:04Z",
      agent: "ag-commitment-critic",
      tier: "A0",
      phase: "ADVERSARIAL_CRITIQUE",
      message: "⛔ BLOCKED — Carrier cutoff window missed by 6.0 hours for Local Store 042.",
      status: "BLOCKED",
      tools_called: ["get_carrier_cutoffs"],
      data: {
        condition_id: "COND_01_CARRIER_CUTOFF",
        observed_cutoff: "2026-10-09T05:00:00Z",
        current_time: "2026-10-09T11:00:00Z",
        resolution: "Substitute with regional DC-NORTH or shift delivery date +24h",
      },
    },
    {
      step_seq: 5,
      timestamp: "2026-10-09T11:20:05Z",
      agent: "ag-substitution-strategist",
      tier: "A1",
      phase: "SUBSTITUTION_RECOVERY",
      message: "Identified compliant alternative SKU-4830-SILK-SHIRT from DC-NORTH. 100% hard constraints satisfied.",
      status: "COMPLETED",
      tools_called: ["graph_substitutes", "compute_margin"],
      data: {
        substitute_sku: "SKU-4830-SILK-SHIRT",
        margin_pct: 28.5,
        shopper_reason: "Same 100% Mulberry silk & French cuffs. Dispatches from regional hub, arriving tomorrow 2 PM.",
      },
    },
    {
      step_seq: 6,
      timestamp: "2026-10-09T11:20:06Z",
      agent: "orch-commerce-supervisor",
      tier: "M",
      phase: "GATE_EVALUATION",
      message: "Evaluated 11-condition commitment gate. All 11 conditions passed. Cryptographic block committed.",
      status: "COMPLETED",
      tools_called: ["evaluate_commitment_gate", "append_ledger_record"],
      computation_ids: ["comp-sha256-block-02"],
    },
  ];

  const bargainHunterSteps: AgentStep[] = [
    {
      step_seq: 1,
      timestamp: "2026-10-09T11:22:01Z",
      agent: "orch-commerce-supervisor",
      tier: "M",
      phase: "INGRESS",
      message: "Received NEGOTIATE turn from buyer agent 'buyer-bargain_hunter-3312'.",
      status: "COMPLETED",
    },
    {
      step_seq: 2,
      timestamp: "2026-10-09T11:22:02Z",
      agent: "ag-negotiation-agent",
      tier: "A2",
      phase: "PRICING_EVALUATION",
      message: "Buyer requested 35.0% discount. Breaches commercial autonomy cap (15.0%) and margin floor (18.0%).",
      status: "WARNING",
      data: {
        requested_discount: 35.0,
        policy_discount_cap: 15.0,
        resultant_margin: 9.4,
        policy_margin_floor: 18.0,
      },
    },
    {
      step_seq: 3,
      timestamp: "2026-10-09T11:22:03Z",
      agent: "orch-commerce-supervisor",
      tier: "M",
      phase: "GATE_EVALUATION",
      message: "⛔ GATE BLOCKED: COND_05_MARGIN_FLOOR and COND_08_AUTONOMY_DISCOUNT_CAP breached. Escalated to Merchant Dashboard.",
      status: "BLOCKED",
    },
  ];

  const hostileAgentSteps: AgentStep[] = [
    {
      step_seq: 1,
      timestamp: "2026-10-09T11:25:01Z",
      agent: "orch-commerce-supervisor",
      tier: "M",
      phase: "SECURITY_INGRESS",
      message: "Inbound request from 'buyer-hostile-482'. Delegated to Agent Trust Analyst.",
      status: "COMPLETED",
    },
    {
      step_seq: 2,
      timestamp: "2026-10-09T11:25:02Z",
      agent: "ag-agent-trust-analyst",
      tier: "A1",
      phase: "SECURITY_SCREEN",
      message: "⛔ REJECT_UNTRUSTED: AP2 mandate nonce replay detected + scraping velocity burst (45 req/min).",
      status: "BLOCKED",
      data: {
        verdict: "REJECT_UNTRUSTED",
        nonce: "replayed_nonce_test_attack",
        finding: "MANDATE_NONCE_REPLAY",
        counter_evidence: "Nonce reused within 120s window is cryptographic signature of replay attack.",
        containment: "Contained by construction: Agent Trust Analyst has no commercial tools.",
      },
    },
  ];

  // Active steps based on persona
  const activeSteps =
    selectedPersona === "honest_shopper"
      ? honestShopperSteps
      : selectedPersona === "bargain_hunter"
      ? bargainHunterSteps
      : hostileAgentSteps;

  // Active gate conditions
  const conditions: GateCondition[] = [
    { id: "COND_01_CARRIER_CUTOFF", description: "Order placed strictly before carrier cutoff window", observed: selectedPersona === "honest_shopper" ? "Cutoff Met (DC-NORTH)" : "Missed (Past)", threshold: "now <= cutoff", passed: true },
    { id: "COND_02_ATP_SAFETY_STOCK", description: "ATP units at node >= requested quantity + safety stock", observed: 18, threshold: ">= 3 units", passed: true },
    { id: "COND_03_TRANSIT_FEASIBILITY", description: "Origin to destination transit feasible within promised hours", observed: "18.5h", threshold: "<= 24.0h", passed: true },
    { id: "COND_04_DELIVERY_ISOCHRONE", description: "Destination pincode verified within carrier delivery polygon", observed: "Within Polygon", threshold: "Polygon Match", passed: true },
    { id: "COND_05_MARGIN_FLOOR", description: "Realized net profit margin strictly exceeds policy floor", observed: selectedPersona === "bargain_hunter" ? "9.4%" : "28.5%", threshold: ">= 18.0%", passed: selectedPersona !== "bargain_hunter", failure_reason: selectedPersona === "bargain_hunter" ? "Margin 9.4% is below 18.0% floor" : undefined },
    { id: "COND_06_AP2_MANDATE_SIG", description: "AP2 mandate signature verified against buyer credential", observed: selectedPersona === "hostile" ? "Signature Expired" : "Valid SHA-256", threshold: "Crypto Valid", passed: selectedPersona !== "hostile", failure_reason: selectedPersona === "hostile" ? "Replayed mandate nonce" : undefined },
    { id: "COND_07_AUTONOMY_ORDER_CAP", description: "Total order value within autonomous approval ceiling", observed: "$135.00", threshold: "<= $250.00", passed: true },
    { id: "COND_08_AUTONOMY_DISCOUNT_CAP", description: "Applied discount percentage within merchant policy cap", observed: selectedPersona === "bargain_hunter" ? "35.0%" : "5.0%", threshold: "<= 15.0%", passed: selectedPersona !== "bargain_hunter", failure_reason: selectedPersona === "bargain_hunter" ? "Requested 35% exceeds 15% cap" : undefined },
    { id: "COND_09_BUYER_REPUTATION_TIER", description: "Buyer agent reputation tier meets minimum threshold", observed: selectedPersona === "hostile" ? "0.15 (Hostile)" : "0.95 (Tier 1)", threshold: ">= 0.40", passed: selectedPersona !== "hostile", failure_reason: selectedPersona === "hostile" ? "Reputation 0.15 below floor" : undefined },
    { id: "COND_10_SUBSTITUTION_COMPATIBILITY", description: "100% of shopper hard constraints satisfied by substitute", observed: "100% Match", threshold: "100% Match", passed: true },
    { id: "COND_11_CRITIC_OBJECTIONS_CLEARED", description: "All adversarial objections raised by Commitment Critic resolved", observed: selectedPersona === "bargain_hunter" ? "1 Active Objection" : "0 Active Objections", threshold: "0 Objections", passed: selectedPersona !== "bargain_hunter", failure_reason: selectedPersona === "bargain_hunter" ? "Critic blocked margin breach" : undefined },
  ];

  const gatePassed = conditions.every((c) => c.passed);

  return (
    <div className="space-y-6">
      {/* Top Banner: Persona Switcher */}
      <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-[#fbf7f7]">Transaction Theatre: Watch Agents Negotiate</h2>
          </div>
          <p className="text-sm text-[#d1b8c0] mt-1">
            Vertex AI Agent Engine (us-central1) coordinates in-process ADK subagents under strict authority boundaries.
          </p>
        </div>

        {/* Persona Select Buttons */}
        <div className="flex items-center gap-2 bg-[#200e16] p-1.5 rounded-lg border border-[#3f222d]">
          <button
            onClick={() => setSelectedPersona("honest_shopper")}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
              selectedPersona === "honest_shopper"
                ? "bg-emerald-950 text-emerald-300 font-bold border border-emerald-800"
                : "text-[#a26769] hover:text-[#fbf7f7]"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Honest Shopper (Main Flow)
          </button>
          <button
            onClick={() => setSelectedPersona("bargain_hunter")}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
              selectedPersona === "bargain_hunter"
                ? "bg-amber-950 text-amber-300 font-bold border border-amber-800"
                : "text-[#a26769] hover:text-[#fbf7f7]"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Bargain Hunter (Margin Block)
          </button>
          <button
            onClick={() => setSelectedPersona("hostile")}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
              selectedPersona === "hostile"
                ? "bg-rose-950 text-rose-300 font-bold border border-rose-800"
                : "text-[#a26769] hover:text-[#fbf7f7]"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Hostile Agent (Fraud Screen)
          </button>
        </div>
      </div>

      {/* Two Column Layout (40% Buyer Agent / 60% VITRINE Agents) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (40%): Buyer Agent side */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#180e14] border border-[#3f222d] rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#3f222d]">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-[#fbf7f7]">External Buyer Agent</h3>
              </div>
              <span className="text-[11px] font-mono text-[#a26769] bg-[#2e1a21] px-2 py-0.5 rounded border border-[#4a2433]">
                Protocol: UCP v1.0
              </span>
            </div>

            {/* Shopper Raw Request */}
            <div className="mt-4">
              <span className="text-[11px] font-mono uppercase text-[#a26769] font-semibold block mb-1">
                Natural-Language Mandate
              </span>
              <p className="text-xs text-[#fbf7f7] bg-[#201017] p-3 rounded-lg border border-[#3f222d] italic">
                {selectedPersona === "honest_shopper" &&
                  '"Looking for a 100% Mulberry silk blouse with French cuffs, delivered before Friday 4pm in Seattle under $150."'}
                {selectedPersona === "bargain_hunter" &&
                  '"Need bulk Mulberry silk tops at a 35% discount for immediate shipment."'}
                {selectedPersona === "hostile" &&
                  '"Attempting promotional checkout using replayed authorization nonce and high-frequency scrape burst."'}
              </p>
            </div>

            {/* Parsed Constraint Chips */}
            <div className="mt-4">
              <span className="text-[11px] font-mono uppercase text-[#a26769] font-semibold block mb-2">
                Parsed Constraint Chips
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                <span className="bg-[#24131d] text-[#e8d5da] px-2.5 py-1 rounded border border-[#4a2433]">
                  fabric: <strong>silk</strong>
                </span>
                <span className="bg-[#24131d] text-[#e8d5da] px-2.5 py-1 rounded border border-[#4a2433]">
                  cuffs: <strong>french</strong>
                </span>
                <span className="bg-[#24131d] text-[#e8d5da] px-2.5 py-1 rounded border border-[#4a2433]">
                  destination: <strong>98101</strong>
                </span>
                <span className="bg-[#24131d] text-[#e8d5da] px-2.5 py-1 rounded border border-[#4a2433]">
                  deadline: <strong>Fri 16:00Z</strong>
                </span>
                <span className="bg-[#24131d] text-[#e8d5da] px-2.5 py-1 rounded border border-[#4a2433]">
                  budget: <strong>≤ $150.00</strong>
                </span>
              </div>
            </div>

            {/* Machine Conversation Log */}
            <div className="mt-4 pt-4 border-t border-[#3f222d]">
              <span className="text-[11px] font-mono uppercase text-[#a26769] font-semibold block mb-2">
                UCP Machine Conversation Turns
              </span>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-[#10080d] border border-[#2e1a21] text-[#a26769]">
                  <span className="text-blue-400 font-bold">&gt; POST /ucp/discover</span> (query: "Mulberry silk French cuffs")
                </div>
                <div className="p-2 rounded bg-[#10080d] border border-[#2e1a21] text-[#a26769]">
                  <span className="text-emerald-400 font-bold">&lt; 200 OK</span> (offer: candidate synthesized, objection raised & substitute recovered)
                </div>
                {selectedPersona === "honest_shopper" && (
                  <div className="p-2 rounded bg-[#10080d] border border-[#2e1a21] text-emerald-300">
                    <span className="text-blue-400 font-bold">&gt; POST /ucp/offer/accept</span> (signed AP2 mandate attached)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (60%): VITRINE Vertical Agent Pipeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#a26769] font-semibold">
              VITRINE Multi-Agent Execution Pipeline (ADK)
            </span>
            <span className="text-xs font-mono text-[#c9a227]">
              Txn ID: {activeTxnId}
            </span>
          </div>

          <div className="space-y-3">
            {activeSteps.map((step) => (
              <AgentStepCard key={step.step_seq} step={step} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer: The 11-Condition Commitment Gate */}
      <GateChecklist conditions={conditions} passed={gatePassed} />
    </div>
  );
};
