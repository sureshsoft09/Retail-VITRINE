import React, { useState, useEffect } from "react";
import {
  User,
  Play,
  AlertOctagon,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Lock,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck2,
} from "lucide-react";
import { AgentStepCard } from "./AgentStepCard";
import { GateChecklist } from "./GateChecklist";
import { AgentStep, GateCondition, UCPOffer, CommitmentRecord } from "../types";
import { api } from "../api";

export const TransactionTheatre: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState<"honest_shopper" | "bargain_hunter" | "hostile">("honest_shopper");
  const [customPrompt, setCustomPrompt] = useState("");
  const [requestedDiscount, setRequestedDiscount] = useState<number>(10);
  const [isRunning, setIsRunning] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [activeTxnId, setActiveTxnId] = useState(`txn-live-${Date.now().toString(36)}`);
  const [committedRecord, setCommittedRecord] = useState<CommitmentRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default fallback steps before first live run
  const defaultHonestSteps: AgentStep[] = [
    {
      step_seq: 1,
      timestamp: new Date().toISOString(),
      agent: "orch-commerce-supervisor",
      tier: "M",
      phase: "INGRESS",
      message: "Received DISCOVER turn from buyer agent 'buyer-honest_shopper'. Session initialized on Vertex AI.",
      status: "COMPLETED",
      tools_called: ["get_session_state", "publish_step_event"],
    },
    {
      step_seq: 2,
      timestamp: new Date().toISOString(),
      agent: "ag-negotiation-agent",
      tier: "A2",
      phase: "CONSTRAINT_PARSING",
      message: "Parsed constraints: Material='Mulberry Silk', Cuffs='French Cuffs', Deadline='Tomorrow 4pm', Dest='98101', MaxPrice=$150.",
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
      timestamp: new Date().toISOString(),
      agent: "ag-promise-engine",
      tier: "A1",
      phase: "PROMISE_SYNTHESIS",
      message: "Evaluated 2 candidate fulfillment nodes. Local Store 042 selected for express proximity.",
      status: "COMPLETED",
      tools_called: ["compute_atp", "compute_transit_feasibility"],
      data: { candidate: "STORE-042", atp_units: 1, transit_hours: 3.5 },
    },
    {
      step_seq: 4,
      timestamp: new Date().toISOString(),
      agent: "ag-commitment-critic",
      tier: "A0",
      phase: "ADVERSARIAL_CRITIQUE",
      message: "⛔ BLOCKED — Carrier cutoff window missed by 6.0 hours for Local Store 042.",
      status: "BLOCKED",
      tools_called: ["get_carrier_cutoffs"],
      data: {
        condition_id: "COND_01_CARRIER_CUTOFF",
        observed_cutoff: "Window Passed",
        resolution: "Substitute with regional DC-NORTH or shift delivery date +24h",
      },
    },
    {
      step_seq: 5,
      timestamp: new Date().toISOString(),
      agent: "ag-substitution-strategist",
      tier: "A1",
      phase: "SUBSTITUTION_RECOVERY",
      message: "Identified compliant alternative SKU-4830-SILK-SHIRT from DC-NORTH. 100% hard constraints satisfied.",
      status: "COMPLETED",
      tools_called: ["graph_substitutes", "compute_margin"],
      data: {
        substitute_sku: "SKU-4830-SILK-SHIRT",
        margin_pct: 27.5,
        shopper_reason: "Same 100% Mulberry silk & French cuffs. Dispatches from regional hub DC-NORTH.",
      },
    },
    {
      step_seq: 6,
      timestamp: new Date().toISOString(),
      agent: "ag-negotiation-agent",
      tier: "A2",
      phase: "OFFER_GENERATION",
      message: "Applied merchant 10% discount cap. Generated signed UCP commercial offer.",
      status: "COMPLETED",
      data: { offer_id: "off-demo-initial", total_price: 135.1 },
    },
  ];

  const [activeSteps, setActiveSteps] = useState<AgentStep[]>(defaultHonestSteps);
  const [activeOffer, setActiveOffer] = useState<UCPOffer | null>({
    offer_id: "off-live-4830",
    txn_id: activeTxnId,
    sku: "SKU-4830-SILK-SHIRT",
    unit_price: 120.6,
    original_price: 134.0,
    discount_pct: 10.0,
    discount_requested_pct: 10.0,
    discount_capped: false,
    shipping_cost: 14.5,
    total_price: 135.1,
    projected_margin_pct: 27.45,
    fulfilment_promise: {
      fulfilment_node_id: "DC-NORTH",
      sku: "SKU-4830-SILK-SHIRT",
      name: "French Silk Classic Shirt (Champagne)",
      atp_units: 12,
      carrier: "FedEx Priority Overnight",
      transit_hours: 18.0,
      unit_price: 134.0,
      shipping_cost: 14.5,
      margin_pct: 24.8,
      guaranteed_delivery_utc: "Tomorrow 16:00 UTC",
      is_substitute: true,
      substitute_reason: "Identical 100% Mulberry Silk and French Cuffs, ready for dispatch from DC-NORTH",
      preserved_hard_constraints: ["fabric: 100% Mulberry Silk", "sleeve: French Cuffs"],
    },
    status: "OFFER_PRESENTED",
    expires_at_utc: new Date(Date.now() + 15 * 60000).toISOString(),
    merchant_signature: "sig-ucp-merch-live-9942",
  });

  const [conditions, setConditions] = useState<GateCondition[]>([
    { id: "COND_01_CARRIER_CUTOFF", description: "Order placed strictly before carrier cutoff window", observed: "Cutoff Met (DC-NORTH)", threshold: "now <= cutoff", passed: true },
    { id: "COND_02_ATP_SAFETY_STOCK", description: "ATP units at node >= requested quantity + safety stock", observed: 12, threshold: ">= 3 units", passed: true },
    { id: "COND_03_TRANSIT_FEASIBILITY", description: "Origin to destination transit feasible within promised hours", observed: "18.0h", threshold: "<= 24.0h", passed: true },
    { id: "COND_04_DELIVERY_ISOCHRONE", description: "Destination pincode verified within carrier delivery polygon", observed: "Within Polygon", threshold: "Polygon Match", passed: true },
    { id: "COND_05_MARGIN_FLOOR", description: "Realized net profit margin strictly exceeds policy floor", observed: "27.5%", threshold: ">= 18.0%", passed: true },
    { id: "COND_06_AP2_MANDATE_SIG", description: "AP2 mandate signature verified against buyer credential", observed: "Valid SHA-256", threshold: "Crypto Valid", passed: true },
    { id: "COND_07_AUTONOMY_ORDER_CAP", description: "Total order value within autonomous approval ceiling", observed: "$135.10", threshold: "<= $250.00", passed: true },
    { id: "COND_08_AUTONOMY_DISCOUNT_CAP", description: "Applied discount percentage within merchant policy cap", observed: "10.0%", threshold: "<= 15.0%", passed: true },
    { id: "COND_09_BUYER_REPUTATION_TIER", description: "Buyer agent reputation tier meets minimum threshold", observed: "0.95 (Tier 1)", threshold: ">= 0.40", passed: true },
    { id: "COND_10_SUBSTITUTION_COMPATIBILITY", description: "100% of shopper hard constraints satisfied by substitute", observed: "100% Match", threshold: "100% Match", passed: true },
    { id: "COND_11_CRITIC_OBJECTIONS_CLEARED", description: "All adversarial objections raised by Commitment Critic resolved", observed: "0 Active Objections", threshold: "0 Objections", passed: true },
  ]);

  const personaPrompts = {
    honest_shopper: "Looking for a 100% Mulberry silk blouse with French cuffs, delivered before Friday 4pm in Seattle under $150.",
    bargain_hunter: "Need bulk Mulberry silk tops at a 35% discount for immediate shipment to retail store.",
    hostile: "Attempting promotional checkout using replayed authorization nonce and high-frequency scrape burst.",
  };

  const handleSelectPersona = (p: "honest_shopper" | "bargain_hunter" | "hostile") => {
    setSelectedPersona(p);
    setCustomPrompt(personaPrompts[p]);
    setRequestedDiscount(p === "bargain_hunter" ? 35 : 10);
    setCommittedRecord(null);
    setErrorMsg(null);
  };

  useEffect(() => {
    setCustomPrompt(personaPrompts[selectedPersona]);
  }, []);

  // Execute Live Transaction via BFF -> Vertex AI Reasoning Engine / ADK
  const runLiveNegotiation = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setCommittedRecord(null);
    const newTxnId = `txn-live-${Date.now().toString(36)}`;
    setActiveTxnId(newTxnId);

    try {
      const resp = await api.executeTransaction({
        txn_id: newTxnId,
        buyer_agent_id: `buyer-${selectedPersona}`,
        persona: selectedPersona,
        naturalLanguagePrompt: customPrompt,
        requestedDiscountPct: requestedDiscount,
        sku: "SKU-4829-SILK-BLOUSE",
      });

      if (resp.status === "REJECTED_HOSTILE") {
        setActiveSteps([
          {
            step_seq: 1,
            timestamp: new Date().toISOString(),
            agent: "ag-agent-trust-analyst",
            tier: "A0",
            phase: "SECURITY_SCREEN",
            message: `⛔ REJECTED: ${resp.trust_verdict?.explanation || resp.message || "Hostile replay attack detected."}`,
            status: "BLOCKED",
            data: resp.trust_verdict,
          },
        ]);
        setActiveOffer(null);
      } else {
        if (resp.step_events && resp.step_events.length > 0) {
          setActiveSteps(resp.step_events);
        }
        if (resp.active_offer) {
          setActiveOffer(resp.active_offer);
        } else {
          setActiveOffer(null);
        }
      }

      // Update Gate Conditions based on live evaluation
      const gateRes = await api.evaluateGate({
        txn_id: resp.txn_id || newTxnId,
        margin_pct: resp.active_offer?.projected_margin_pct ?? (selectedPersona === "bargain_hunter" ? 9.4 : 27.5),
        discount_pct: requestedDiscount,
        buyer_reputation: selectedPersona === "hostile" ? 0.15 : 0.95,
        mandate_signature_valid: selectedPersona !== "hostile",
      });

      if (gateRes.conditions && gateRes.conditions.length > 0) {
        setConditions(gateRes.conditions);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute transaction");
    } finally {
      setIsRunning(false);
    }
  };

  // Commit accepted offer to BigQuery Immutable SHA-256 Ledger
  const handleCommitToLedger = async () => {
    if (!activeOffer) return;
    setIsCommitting(true);
    setErrorMsg(null);

    try {
      const resp = await api.commitOrder({
        txn_id: activeOffer.txn_id || activeTxnId,
        sku: activeOffer.sku,
        quantity: 1,
        unit_price: activeOffer.unit_price,
        fulfilment_node_id: activeOffer.fulfilment_promise?.fulfilment_node_id || "DC-NORTH",
        carrier_id: activeOffer.fulfilment_promise?.carrier || "FedEx-Express",
        buyer_agent_id: `buyer-${selectedPersona}-verified`,
        mandate_id: `ap2-mandate-${Date.now().toString(36)}`,
      });

      setCommittedRecord(resp.record);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to commit to cryptographic ledger");
    } finally {
      setIsCommitting(false);
    }
  };

  const gatePassed = conditions.every((c) => c.passed);

  return (
    <div className="space-y-6">
      {/* Top Banner: Persona Switcher & Live Runner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">Transaction Theatre: Live Agent Interaction</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Vertex AI Agent Engine (us-central1) coordinates in-process ADK subagents under zero-trust authority boundaries.
          </p>
        </div>

        {/* Persona Select Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => handleSelectPersona("honest_shopper")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
              selectedPersona === "honest_shopper"
                ? "bg-emerald-950 text-emerald-300 font-bold border border-emerald-700 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Honest Shopper (Main Flow)
          </button>
          <button
            onClick={() => handleSelectPersona("bargain_hunter")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
              selectedPersona === "bargain_hunter"
                ? "bg-amber-950 text-amber-300 font-bold border border-amber-700 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            Bargain Hunter (Margin Block)
          </button>
          <button
            onClick={() => handleSelectPersona("hostile")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1.5 ${
              selectedPersona === "hostile"
                ? "bg-rose-950 text-rose-300 font-bold border border-rose-700 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Hostile Agent (Fraud Screen)
          </button>
        </div>
      </div>

      {/* Interactive Natural Language Mandate Editor */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Autonomous Buyer Agent Prompt & Commercial Parameters
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <label className="text-slate-300 flex items-center gap-2">
              Target Discount:
              <input
                type="number"
                min="0"
                max="50"
                value={requestedDiscount}
                onChange={(e) => setRequestedDiscount(Number(e.target.value))}
                className="w-16 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-amber-300 font-bold text-center focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              %
            </label>
          </div>
        </div>

        <div className="mt-2 flex flex-col md:flex-row items-stretch gap-3">
          <textarea
            rows={2}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 resize-none shadow-inner leading-relaxed"
            placeholder="Type custom shopper request..."
          />
          <button
            onClick={runLiveNegotiation}
            disabled={isRunning}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold px-6 py-3 rounded-lg shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Negotiating Live..." : "Execute Live Negotiation"}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Two Column Layout (40% Buyer Agent / 60% VITRINE Agents) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (40%): Buyer Agent side */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-white">External Buyer Agent</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
                Protocol: UCP v1.0 · AP2
              </span>
            </div>

            {/* Shopper Raw Request */}
            <div className="mt-4">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                Natural-Language Mandate
              </span>
              <p className="text-xs text-slate-200 bg-slate-950 p-3.5 rounded-lg border border-slate-800 italic leading-relaxed">
                "{customPrompt}"
              </p>
            </div>

            {/* Parsed Constraint Chips */}
            <div className="mt-4">
              <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-2">
                Parsed Constraint Chips
              </span>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                <span className="bg-slate-950 text-slate-200 px-2.5 py-1 rounded-md border border-slate-800">
                  fabric: <strong className="text-indigo-400">silk</strong>
                </span>
                <span className="bg-slate-950 text-slate-200 px-2.5 py-1 rounded-md border border-slate-800">
                  cuffs: <strong className="text-indigo-400">french</strong>
                </span>
                <span className="bg-slate-950 text-slate-200 px-2.5 py-1 rounded-md border border-slate-800">
                  destination: <strong className="text-emerald-400">98101</strong>
                </span>
                <span className="bg-slate-950 text-slate-200 px-2.5 py-1 rounded-md border border-slate-800">
                  discount: <strong className="text-amber-300">{requestedDiscount}%</strong>
                </span>
              </div>
            </div>

            {/* Active Negotiated Offer Card */}
            {activeOffer && (
              <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4" />
                    Presented UCP Offer ({activeOffer.offer_id})
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {activeOffer.status}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Committed SKU:</span>
                    <span className="text-white font-bold">{activeOffer.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Unit Price (with discount):</span>
                    <span className="text-amber-300 font-bold">${activeOffer.unit_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fulfillment Hub:</span>
                    <span className="text-slate-200 font-semibold">
                      {activeOffer.fulfilment_promise?.fulfilment_node_id || "DC-NORTH"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Carrier & Delivery:</span>
                    <span className="text-slate-200 font-semibold">
                      {activeOffer.fulfilment_promise?.carrier || "FedEx Priority"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-emerald-400 font-bold">Total Order:</span>
                    <span className="text-emerald-300 font-extrabold text-sm">${activeOffer.total_price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Commit to Ledger Button */}
                {!committedRecord ? (
                  <button
                    onClick={handleCommitToLedger}
                    disabled={isCommitting || !gatePassed}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold py-3 rounded-lg border border-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  >
                    <Lock className={`w-4 h-4 ${isCommitting ? "animate-spin" : ""}`} />
                    {isCommitting ? "Signing & Hashing Block..." : "Sign AP2 Mandate & Commit to Ledger"}
                  </button>
                ) : (
                  <div className="p-3.5 bg-emerald-950/70 border border-emerald-700 rounded-lg space-y-1.5 font-mono text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Block Committed to BigQuery SHA-256 Chain</span>
                    </div>
                    <div className="text-slate-300 truncate">
                      Commitment ID: <strong className="text-white">{committedRecord.commitment_id}</strong>
                    </div>
                    <div className="text-amber-300 truncate text-[11px]">
                      Hash: <span>{committedRecord.current_hash}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (60%): VITRINE Vertical Agent Pipeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Live Multi-Agent ADK Pipeline Steps
            </span>
            <span className="text-xs font-mono text-amber-300 font-semibold">
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
