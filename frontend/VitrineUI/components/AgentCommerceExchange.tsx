import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  Send,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  DollarSign,
  PackageCheck,
  ArrowRight,
  Clock,
  RotateCcw,
  Sliders,
  Check,
  Lock,
  PauseCircle,
  UserCheck,
} from "lucide-react";
import { api } from "../api";
import { TransactionResponse, GateResult, AgentStep } from "../types";
import { useVitrineStore } from "../store";

type PersonaId = "honest" | "bargain" | "hostile";

interface PersonaConfig {
  id: PersonaId;
  name: string;
  role: string;
  avatarBg: string;
  badge: string;
  badgeColor: string;
  defaultPrompt: string;
  sku: string;
  qty: number;
  discountPct: number;
  deadline: string;
  pincode: string;
  city: string;
}

const PERSONAS: Record<PersonaId, PersonaConfig> = {
  honest: {
    id: "honest",
    name: "Nordstrom VIP Styling Concierge",
    role: "Inbound Buyer Personal Concierge Agent",
    avatarBg: "bg-[#2D6A4F]",
    badge: "VIP Authentic Buyer",
    badgeColor: "bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/30",
    defaultPrompt:
      "Find an Ivory Mulberry Silk Blouse in Size M for our VIP client. Must arrive in Seattle tomorrow before 4:00 PM for an executive dinner. Authorized price up to $130 with standard 10% VIP loyalty rate.",
    sku: "SKU-4829-SILK-BLOUSE",
    qty: 1,
    discountPct: 10,
    deadline: "Tomorrow by 4:00 PM",
    pincode: "98101",
    city: "Seattle, WA",
  },
  bargain: {
    id: "bargain",
    name: "Boutique Procurement Agent #204",
    role: "Wholesale Price-Discovery Buyer Bot",
    avatarBg: "bg-[#B7791F]",
    badge: "Aggressive Negotiator",
    badgeColor: "bg-[#B7791F]/10 text-[#B7791F] border-[#B7791F]/30",
    defaultPrompt:
      "Procuring 4 Mulberry Silk Blouses for boutique stock. Offering immediate settlement if discounted 35% ($83.20/unit). 2-day delivery acceptable.",
    sku: "SKU-4829-SILK-BLOUSE",
    qty: 4,
    discountPct: 35,
    deadline: "2-Day Priority",
    pincode: "98101",
    city: "Seattle, WA",
  },
  hostile: {
    id: "hostile",
    name: "Unverified Checkout Bot #902",
    role: "Adversarial Ingress Bot",
    avatarBg: "bg-[#9E4736]",
    badge: "High Threat Score (98%)",
    badgeColor: "bg-[#9E4736]/10 text-[#9E4736] border-[#9E4736]/30",
    defaultPrompt:
      "Executing immediate checkout for 1 Silk Blouse using previously signed authorization mandate #AUTH-REPLAYED-991. Destination redirect to unverified freight locker #402.",
    sku: "SKU-4829-SILK-BLOUSE",
    qty: 1,
    discountPct: 15,
    deadline: "Overnight Express",
    pincode: "97204",
    city: "Portland Locker",
  },
};

export const AgentCommerceExchange: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>("honest");
  const [customPrompt, setCustomPrompt] = useState(PERSONAS.honest.defaultPrompt);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [txnResult, setTxnResult] = useState<TransactionResponse | null>(null);
  const [isCommitted, setIsCommitted] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [committedRecord, setCommittedRecord] = useState<any | null>(null);

  const {
    killSwitchActive,
    marginFloorPct,
    maxOrderUSD,
    discountCapPct,
    addHostileFraudRecord,
    appendLedgerCommitment,
  } = useVitrineStore();

  const handleSelectPersona = (pId: PersonaId) => {
    setSelectedPersona(pId);
    setCustomPrompt(PERSONAS[pId].defaultPrompt);
    setHasStarted(false);
    setTxnResult(null);
    setAgentSteps([]);
    setIsCommitted(false);
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    setHasStarted(true);
    setIsCommitted(false);
    setCommittedRecord(null);
    setAgentSteps([]);
    setCurrentStepIndex(0);

    const persona = PERSONAS[selectedPersona];

    try {
      // 1. Call real Cloud Run BFF /api/transactions
      const response = await api.startTransaction({
        buyer_agent_id: persona.name,
        sku: persona.sku,
        quantity: persona.qty,
        requested_discount_pct: persona.discountPct,
        delivery_pincode: persona.pincode,
        scenario: persona.id,
        custom_prompt: customPrompt,
      });

      setTxnResult(response);

      // Extract step events
      const steps = response.step_events || [];
      setAgentSteps(steps);

      // Animate steps streaming in sequentially
      for (let i = 0; i <= steps.length; i++) {
        await new Promise((r) => setTimeout(r, 450));
        setCurrentStepIndex(i);
      }

      // If hostile scenario, link to Fraud Queue
      if (selectedPersona === "hostile") {
        addHostileFraudRecord({
          threat_score: 98,
          verdict: "QUARANTINED",
          status: "QUARANTINED",
          explanation:
            "Replayed AP2 Payment Mandate #AUTH-REPLAYED-991 with unauthorized destination redirect to freight locker.",
          evidence: [
            "Nonce previously redeemed in ORD-2026-8812",
            "Buyer agent reputation score: 0.12 (adversarial signature match)",
            "Unregistered freight drop-box pincode 97204",
          ],
          mandatory_counter_evidence: [
            "Counterparty IP registered to residential ISP",
            "No prior chargeback history on payment token root",
          ],
        });
      }
    } catch (err) {
      console.error("Transaction execution failed:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCommitOrder = async () => {
    if (!txnResult?.active_offer || killSwitchActive) return;
    setIsCommitting(true);

    const offer = txnResult.active_offer;
    const fulfilment = offer.fulfilment_promise;

    try {
      const commitPayload = {
        txn_id: txnResult.txn_id,
        sku: offer.sku,
        quantity: 1,
        unit_price: offer.unit_price,
        fulfilment_node_id: fulfilment?.fulfilment_node_id || "DC-NORTH",
        carrier_id: fulfilment?.carrier || "FedEx Priority Overnight",
        buyer_agent_id: PERSONAS[selectedPersona].name,
        mandate_id: `MANDATE-${Date.now().toString(36).toUpperCase()}`,
      };

      // Call Cloud Run UCP accept or BFF commit
      const res = await api.acceptUCPOffer(offer.offer_id, commitPayload);
      const record = res.record || res;

      setIsCommitted(true);
      setCommittedRecord(record);

      // Append to global Zustand store so Audit Ledger updates live!
      if (record) {
        appendLedgerCommitment(record);
      }
    } catch (err) {
      console.error("Order commit failed:", err);
    } finally {
      setIsCommitting(false);
    }
  };

  const activePersona = PERSONAS[selectedPersona];
  const activeOffer = txnResult?.active_offer;
  const objections = txnResult?.objections || [];
  const gateResult = txnResult?.gate_result;

  return (
    <div className="space-y-6">
      {/* HEADER & QUICK CONSOLE */}
      <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8E2D6] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E8E2D6] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#7A2E3B]/10 text-[#7A2E3B]">
                <Bot className="w-5 h-5" />
              </span>
              <h2 className="font-serif font-bold text-xl text-[#1C1917]">
                Agent Commerce Exchange
              </h2>
            </div>
            <p className="text-xs text-[#78716C] mt-0.5">
              Live machine-to-machine protocol: Inbound Buyer Agent negotiation, inventory reservation, and 11-gate verified checkout.
            </p>
          </div>

          {/* Persona Quick Select */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-[#78716C] uppercase tracking-wider mr-1">
              Select Inbound Buyer:
            </span>
            {(["honest", "bargain", "hostile"] as PersonaId[]).map((pId) => {
              const p = PERSONAS[pId];
              const isSelected = selectedPersona === pId;
              return (
                <button
                  key={pId}
                  onClick={() => handleSelectPersona(pId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#1C1917] text-white border-[#1C1917] shadow-xs"
                      : "bg-white text-[#44403C] border-[#E8E2D6] hover:bg-[#F2EDE3]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.avatarBg}`} />
                  <span>{p.name.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt Input & Execution Bar */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#78716C] flex items-center justify-between">
            <span>Inbound Buyer Agent Request Prompt</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md border ${activePersona.badgeColor}`}>
              {activePersona.badge}
            </span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Enter inbound buyer agent prompt or instructions..."
              className="flex-1 bg-white px-4 py-2.5 rounded-xl border border-[#E8E2D6] text-xs font-medium text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/20 focus:border-[#2D6A4F]"
            />
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 ${
                isExecuting
                  ? "bg-[#78716C] cursor-not-allowed"
                  : "bg-[#2D6A4F] hover:bg-[#255740]"
              }`}
            >
              {isExecuting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Negotiating via Agents...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Buyer Agent Request</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* STAGE ZERO-STATE (WHEN NOT YET RUN) */}
      {!hasStarted && (
        <div className="bg-white rounded-2xl border border-[#E8E2D6] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F7F3EB] border border-[#E8E2D6] flex items-center justify-center mx-auto text-[#78716C]">
            <Bot className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-serif font-bold text-lg text-[#1C1917]">
              Ready for Inbound Commerce
            </h3>
            <p className="text-xs text-[#78716C] leading-relaxed">
              Select an inbound buyer persona above or customize the prompt, then click{" "}
              <strong className="text-[#1C1917]">"Send Buyer Agent Request"</strong> to watch the live machine-to-machine negotiation and multi-agent fulfillment critic.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button
              onClick={() => {
                handleSelectPersona("honest");
                setTimeout(handleExecute, 100);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#2D6A4F]/10 hover:bg-[#2D6A4F]/20 text-[#2D6A4F] border border-[#2D6A4F]/30 text-xs font-semibold"
            >
              Try VIP Styling Shopper (Honest)
            </button>
            <button
              onClick={() => {
                handleSelectPersona("bargain");
                setTimeout(handleExecute, 100);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#B7791F]/10 hover:bg-[#B7791F]/20 text-[#B7791F] border border-[#B7791F]/30 text-xs font-semibold"
            >
              Try 35% Discount (Margin Veto)
            </button>
            <button
              onClick={() => {
                handleSelectPersona("hostile");
                setTimeout(handleExecute, 100);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#9E4736]/10 hover:bg-[#9E4736]/20 text-[#9E4736] border border-[#9E4736]/30 text-xs font-semibold"
            >
              Try Replay Attack (Quarantine)
            </button>
          </div>
        </div>
      )}

      {/* LIVE TWO-COLUMN STAGE (WHEN ACTIVE) */}
      {hasStarted && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 40%: INBOUND EXTERNAL BUYER AGENT CHAT */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E8E2D6] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full ${activePersona.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                >
                  BA
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                    <span>{activePersona.name}</span>
                    <span className="text-[10px] text-[#78716C] font-normal">
                      (Client Agent)
                    </span>
                  </div>
                  <div className="text-[10px] text-[#78716C]">{activePersona.role}</div>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${activePersona.badgeColor}`}>
                {activePersona.badge}
              </span>
            </div>

            {/* Conversation Flow */}
            <div className="space-y-3 font-sans text-xs">
              {/* Buyer Prompt Bubble */}
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D6] space-y-2">
                <div className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">
                  Buyer Agent Inbound Transmission
                </div>
                <p className="text-[#1C1917] font-medium leading-relaxed">
                  "{customPrompt}"
                </p>
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-[#78716C]">
                  <div>SKU: <span className="font-mono text-[#1C1917]">{activePersona.sku}</span></div>
                  <div>Qty: <span className="font-bold text-[#1C1917]">{activePersona.qty}</span></div>
                  <div>Discount: <span className="font-bold text-[#1C1917]">{activePersona.discountPct}%</span></div>
                  <div>Cutoff: <span className="font-bold text-[#1C1917]">{activePersona.deadline}</span></div>
                </div>
              </div>

              {/* Merchant Acknowledgment */}
              {currentStepIndex >= 1 && (
                <div className="p-3.5 rounded-2xl bg-[#2D6A4F]/5 border border-[#2D6A4F]/20 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>VITRINE Merchant Host Response</span>
                  </div>
                  <p className="text-[#2D6A4F] leading-relaxed">
                    Request received. Routing to autonomous multi-agent pipeline: Ingress validation, ATP stock check across nodes, and 11-gate Commitment Critic evaluation.
                  </p>
                </div>
              )}

              {/* Objection / Counter-offer notification if blocked */}
              {objections.length > 0 && currentStepIndex >= 3 && (
                <div className="p-3.5 rounded-2xl bg-[#9E4736]/10 border border-[#9E4736]/30 space-y-1.5 animate-in shake">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#9E4736] uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Critic Objection Raised</span>
                  </div>
                  <p className="text-xs text-[#9E4736] font-medium leading-relaxed">
                    {objections[0].summary}
                  </p>
                  <div className="text-[11px] text-[#1C1917] font-bold pt-1">
                    Autonomous Resolution: {objections[0].suggested_resolution}
                  </div>
                </div>
              )}

              {/* Final Verified Settlement Status */}
              {activeOffer && currentStepIndex >= agentSteps.length && (
                <div className="p-3.5 rounded-2xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#2D6A4F] uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Commercial Offer Generated</span>
                    </span>
                    <span className="font-mono text-[10px] font-bold text-[#2D6A4F]">
                      {activeOffer.offer_id}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[#44403C]">Agreed Price:</span>
                    <span className="font-serif font-black text-lg text-[#1C1917]">
                      ${activeOffer.unit_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#78716C] border-t border-[#2D6A4F]/20 pt-1.5">
                    Ready for AP2 cryptographic mandate signature and immutable ledger sealing.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT 60%: VITRINE MERCHANT MULTI-AGENT EXECUTION PIPELINE */}
          <div className="lg:col-span-7 space-y-5">
            {/* Multi-Agent Execution Pipeline */}
            <div className="bg-white rounded-2xl border border-[#E8E2D6] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-pulse" />
                  <h3 className="font-serif font-bold text-base text-[#1C1917]">
                    Autonomous Merchant Agent Pipeline
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#78716C]">
                  Vertex AI & Cloud Run Host
                </span>
              </div>

              <div className="space-y-2">
                {agentSteps.map((step, idx) => {
                  const isVisible = idx < currentStepIndex;
                  if (!isVisible) return null;

                  return (
                    <div
                      key={step.step_id || idx}
                      className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D6] text-xs space-y-1.5 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[11px] text-[#1C1917]">
                            {step.agent_id}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#1C1917]/5 text-[#44403C] border border-[#E8E2D6]">
                            {step.authority_tier || "A1"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#78716C]">
                          {step.elapsed_ms ? `${step.elapsed_ms}ms` : "0.3s"}
                        </span>
                      </div>
                      <p className="text-[#44403C] leading-snug">{step.detail || step.message}</p>
                    </div>
                  );
                })}

                {isExecuting && (
                  <div className="p-3 rounded-xl bg-[#FAF7F2] border border-dashed border-[#E8E2D6] text-center text-xs text-[#78716C] animate-pulse">
                    Synthesizing next agent action...
                  </div>
                )}
              </div>
            </div>

            {/* 11-CONDITION DETERMINISTIC COMMITMENT CRITIC */}
            {gateResult && (
              <div className="bg-white rounded-2xl border border-[#E8E2D6] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#1C1917]">
                      Commitment Critic: 11-Gate Deterministic Evaluation
                    </h4>
                    <p className="text-[10px] text-[#78716C]">
                      A strict mathematical conjunction — all 11 conditions must hold, never a weighted average.
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      gateResult.all_passed
                        ? "bg-[#2D6A4F]/10 text-[#2D6A4F] border-[#2D6A4F]/30"
                        : "bg-[#9E4736]/10 text-[#9E4736] border-[#9E4736]/30"
                    }`}
                  >
                    {gateResult.all_passed ? "11 / 11 PASSED" : "GATE VETOED"}
                  </span>
                </div>

                {/* Staggered Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {(gateResult.conditions || []).map((cond: any, idx: number) => {
                    const passed = cond.passed;
                    return (
                      <div
                        key={cond.id || idx}
                        className={`p-2 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                          passed
                            ? "bg-[#2D6A4F]/5 border-[#2D6A4F]/20 text-[#2D6A4F]"
                            : "bg-[#9E4736]/10 border-[#9E4736]/30 text-[#9E4736]"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          {passed ? (
                            <Check className="w-3.5 h-3.5 shrink-0 text-[#2D6A4F]" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 shrink-0 text-[#9E4736]" />
                          )}
                          <span className="truncate font-medium">{cond.description || cond.id}</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold shrink-0">
                          {passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COMMIT & SEAL ON AUDIT LEDGER */}
            {activeOffer && (
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E2D6] p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8E2D6] pb-3">
                  <div>
                    <div className="text-xs font-bold text-[#1C1917] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      <span>Cryptographic Mandate & Ledger Commit</span>
                    </div>
                    <div className="text-[10px] text-[#78716C]">
                      Autonomous contract binding: Signed AP2 mandate and permanent SHA-256 seal.
                    </div>
                  </div>
                  {killSwitchActive && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#9E4736] text-white">
                      AUTONOMY PAUSED
                    </span>
                  )}
                </div>

                {isCommitted ? (
                  <div className="p-4 rounded-xl bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#2D6A4F]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Order Committed & Sealed to Ledger!</span>
                    </div>
                    <p className="text-[11px] text-[#44403C]">
                      Transaction has been recorded on the immutable SHA-256 BigQuery Ledger. View full audit trail in the <strong>Audit Ledger</strong> tab.
                    </p>
                    {committedRecord?.current_hash && (
                      <div className="text-[10px] font-mono bg-white p-2 rounded-lg border border-[#2D6A4F]/20 text-[#2D6A4F] break-all">
                        Block Hash: {committedRecord.current_hash}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleCommitOrder}
                    disabled={isCommitting || killSwitchActive}
                    className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 ${
                      killSwitchActive
                        ? "bg-[#78716C] cursor-not-allowed"
                        : isCommitting
                        ? "bg-[#255740] cursor-wait"
                        : "bg-[#2D6A4F] hover:bg-[#255740]"
                    }`}
                  >
                    {killSwitchActive ? (
                      <>
                        <PauseCircle className="w-4 h-4" />
                        <span>Autonomous Commitment Suspended by Kill Switch</span>
                      </>
                    ) : isCommitting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>Signing AP2 Mandate & Sealing Ledger...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Sign AP2 Mandate & Commit to Immutable Ledger</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
