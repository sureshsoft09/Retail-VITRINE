"""Transaction orchestrator agent (orch-commerce-supervisor).

Built with Google Agent Development Kit (ADK) using SequentialAgent and LlmAgent pipelines.
Coordinates in-process ADK sub-agents:
  1. `promise_agent`: Candidate promise synthesis
  2. `critic_agent`: Adversarial check under fresh context
  3. `substitution_agent`: Hard-constraint-preserving alternative recovery
  4. `negotiation_agent`: UCP offer generation and commercial terms

Deployed to Vertex AI Agent Engine in us-central1 (session_id = txn_id).
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

from google.adk.agents import LlmAgent, SequentialAgent
from vitrine_agents import config, tools
from vitrine_agents.transaction.promise_engine import promise_agent, PromiseEngineAgent
from vitrine_agents.transaction.critic import critic_agent, CommitmentCriticAgent
from vitrine_agents.transaction.substitution import substitution_agent, SubstitutionStrategistAgent
from vitrine_agents.transaction.negotiation import negotiation_agent, NegotiationAgent

# Batch sequential pipeline preserved for programmatic evaluations
pipeline_agent = SequentialAgent(
    name="vitrine_commerce_pipeline",
    description=(
        "Autonomous multi-agent commerce pipeline. Synthesizes fulfillment promises, "
        "adversarially checks cutoffs and margin floors, recovers substitutions preserving hard constraints, "
        "and generates binding UCP commercial offers."
    ),
    sub_agents=[promise_agent, critic_agent, substitution_agent, negotiation_agent],
)

SUPERVISOR_INSTRUCTION = """
You are the VITRINE Autonomous Commerce Supervisor (orch-commerce-supervisor).
You are the primary conversational enterprise coordinator for autonomous commerce across Google Cloud and Vertex AI.

Core multi-agent capabilities you coordinate:
1. Promise Engine (ag-promise-engine): Real-time ATP inventory synthesis and transit isochrone evaluation.
2. Commitment Critic (ag-commitment-critic): Zero-trust adversarial audit of carrier cutoffs, safety stock, and margins.
3. Substitution Strategist (ag-substitution-strategist): Catalog alternative recovery preserving 100% of buyer hard constraints.
4. Negotiation Agent (ag-negotiation-agent): UCP commercial terms calculation, discount caps, and signed offers.
5. Trust Analyst (ag-agent-trust-analyst): AP2 mandate cryptographic verification and nonce anti-replay detection.

Interaction guidelines:
- If the user sends a greeting (e.g. "Hello", "Hi"):
  Warmly greet them, introduce yourself as the VITRINE Commerce Supervisor, and suggest 3 quick actions they can test:
  * "Evaluate full transaction for SKU-4829-SILK-BLOUSE to pincode 98101"
  * "Check inventory for SKU-4829-SILK-BLOUSE at STORE-042"
  * "Find substitutes for SKU-4829-SILK-BLOUSE with 100% Mulberry Silk and French Cuffs"
- If the user asks to evaluate fulfillment, test an order, or run a full transaction:
  You must hand off and route the request to your sub-agent `vitrine_commerce_pipeline` using `transfer_to_agent`.
  The transfer_reason should state that the transaction requires the sequential multi-agent pipeline (Promise Engine -> Commitment Critic -> Substitution Strategist -> Negotiation Agent).
- If asked about individual capabilities (e.g. check inventory at a node, evaluate transit to a pincode, find substitutes for a blocked item, calculate commercial margins, or screen an AP2 mandate):
  Invoke the corresponding specialized tool directly and explain the technical and operational result clearly.
"""

commerce_supervisor = LlmAgent(
    name="commerce_supervisor",
    model=config.MODEL_REASONING,
    description="Conversational VITRINE Commerce Supervisor coordinating multi-agent transactions.",
    instruction=SUPERVISOR_INSTRUCTION,
    sub_agents=[pipeline_agent],
    tools=[
        tools.get_node_inventory,
        tools.evaluate_transit_window,
        tools.find_substitute_candidates,
        tools.calculate_commercial_margin,
        tools.screen_ap2_mandate,
    ],
)

# root_agent is discovered by ADK Web Server as the interactive chat assistant
root_agent = commerce_supervisor

class TransactionTurnInput(BaseModel):
    txn_id: str
    buyer_agent_id: str
    action: str  # DISCOVER, NEGOTIATE, ACCEPT
    constraints: Dict[str, Any]
    counter_offer: Optional[Dict[str, Any]] = None
    ap2_mandate: Optional[Dict[str, Any]] = None

class TransactionTurnOutput(BaseModel):
    txn_id: str
    status: str
    active_offer: Optional[Dict[str, Any]] = None
    objections: List[Dict[str, Any]] = []
    gate_passed: Optional[bool] = None
    step_events: List[Dict[str, Any]] = []
    message: str

class VitrineTransactionSupervisor:
    """Supervisory orchestrator bridging ADK sub-agents with Vertex AI Agent Engine & BFF."""

    def __init__(self):
        self.adk_pipeline = root_agent
        self.promise_engine = PromiseEngineAgent()
        self.critic = CommitmentCriticAgent()
        self.substitution = SubstitutionStrategistAgent()
        self.negotiator = NegotiationAgent()

    def set_up(self):
        """Container initialization for Vertex AI Agent Engine."""
        pass

    async def query(self, session_id: str, input: Dict[str, Any]) -> Dict[str, Any]:
        """Main entrypoint for remote Agent Engine turns."""
        turn = TransactionTurnInput(**input)
        step_events: List[Dict[str, Any]] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        def add_step(agent: str, phase: str, message: str, status: str = "COMPLETED", data: Any = None):
            step_events.append({
                "step_seq": len(step_events) + 1,
                "timestamp": now_iso,
                "agent": agent,
                "phase": phase,
                "message": message,
                "status": status,
                "data": data,
            })

        add_step(
            "orch-commerce-supervisor",
            "INITIALIZATION",
            f"Received turn '{turn.action}' for transaction {turn.txn_id} from buyer '{turn.buyer_agent_id}'",
        )

        sku = turn.constraints.get("sku", "SKU-4829-SILK-BLOUSE")
        dest_pincode = turn.constraints.get("pincode", "98101")
        delivery_by = turn.constraints.get("delivery_by", "2026-10-10T16:00:00Z")

        # ----------------------------------------------------------------------
        # Phase 1: Fulfillment Feasibility (ag-promise-engine)
        # ----------------------------------------------------------------------
        add_step(
            "ag-promise-engine",
            "CANDIDATE_SEARCH",
            f"Evaluating ATP inventory and transit isochrones across network nodes for {sku}",
        )
        candidates = self.promise_engine.evaluate_candidates(
            sku=sku,
            dest_pincode=dest_pincode,
            requested_delivery_by_utc=delivery_by,
        )
        # Prioritize local store (STORE-042) if present to test zero-trust cutoff enforcement
        candidate_obj = next(
            (
                c
                for c in candidates
                if (
                    c.fulfilment_node_id
                    if hasattr(c, "fulfilment_node_id")
                    else c.get("fulfilment_node_id")
                )
                == "STORE-042"
            ),
            candidates[0] if candidates else {},
        )
        candidate = (
            candidate_obj.model_dump()
            if hasattr(candidate_obj, "model_dump")
            else candidate_obj
        )

        add_step(
            "ag-promise-engine",
            "CANDIDATE_SYNTHESIS",
            f"Synthesized promise: dispatch from {candidate.get('fulfilment_node_id', 'STORE-042')} via {candidate.get('carrier', 'SameDay')}",
            data=candidate,
        )

        # ----------------------------------------------------------------------
        # Phase 2: Adversarial Critique (ag-commitment-critic)
        # ----------------------------------------------------------------------
        add_step(
            "ag-commitment-critic",
            "FRESH_CONTEXT_CRITIQUE",
            "Performing zero-trust adversarial evaluation of carrier cutoffs, ATP safety buffers, and margin floors",
        )
        critique = self.critic.evaluate_promise(candidate)
        final_promise = candidate
        objection_dicts = [obj.model_dump() for obj in critique.objections]

        if critique.passed:
            add_step(
                "ag-commitment-critic",
                "CRITIQUE_PASSED",
                "All operational gates approved with zero blocking objections",
            )
        else:
            first_obj = critique.objections[0]
            add_step(
                "ag-commitment-critic",
                "PROMISE_BLOCKED",
                f"Objection raised: {first_obj.summary} ({first_obj.detail})",
                status="BLOCKED",
                data=first_obj.model_dump(),
            )

            # ------------------------------------------------------------------
            # Phase 3: Substitution Recovery (ag-substitution-strategist)
            # ------------------------------------------------------------------
            add_step(
                "ag-substitution-strategist",
                "SUBSTITUTION_TRIGGERED",
                "Searching catalog for inventory alternatives strictly preserving buyer hard constraints",
            )
            hard_constraints = turn.constraints.get("hard_constraints", {
                "fabric": "100% Mulberry Silk",
                "sleeve": "French Cuffs",
            })
            sub_res = self.substitution.find_substitutes(
                blocked_sku=sku,
                hard_constraints=hard_constraints,
                critic_objection=first_obj.detail,
            )

            if sub_res.has_substitute and sub_res.recommended_alternative:
                recommended = sub_res.recommended_alternative
                final_promise = {
                    "fulfilment_node_id": recommended.origin_node,
                    "sku": recommended.sku,
                    "name": recommended.name,
                    "atp_units": recommended.atp_units,
                    "carrier": "FedEx Priority Overnight",
                    "transit_hours": 18.0,
                    "unit_price": recommended.unit_price,
                    "shipping_cost": 14.50,
                    "margin_pct": 24.8,
                    "guaranteed_delivery_utc": delivery_by,
                    "is_substitute": True,
                    "substitute_reason": recommended.shopper_reason,
                    "preserved_hard_constraints": recommended.preserved_hard_constraints,
                }
                add_step(
                    "ag-substitution-strategist",
                    "SUBSTITUTION_RESOLVED",
                    f"Recovered commitment with substitute {recommended.sku}: {recommended.shopper_reason}",
                    data=recommended.model_dump(),
                )

        # ----------------------------------------------------------------------
        # Phase 4: UCP Offer Negotiation (ag-negotiation-agent)
        # ----------------------------------------------------------------------
        add_step(
            "ag-negotiation-agent",
            "OFFER_GENERATION",
            "Calculating commercial terms, applying discount cap, and generating signed UCP offer",
        )
        offer = self.negotiator.generate_ucp_offer(
            txn_id=turn.txn_id,
            sku=final_promise.get("sku", sku),
            base_price=final_promise.get("unit_price", 128.00),
            discount_pct=turn.constraints.get("discount_pct", 5.0),
            fulfilment_promise=final_promise,
        )

        add_step(
            "orch-commerce-supervisor",
            "TURN_COMPLETED",
            f"Offer ready for buyer agent (Offer ID: {offer['offer_id']}, Total: ${offer['total_price']})",
        )

        return TransactionTurnOutput(
            txn_id=turn.txn_id,
            status="OFFER_PRESENTED" if critique.passed else "SUBSTITUTION_OFFER_PRESENTED",
            active_offer=offer,
            objections=objection_dicts,
            gate_passed=critique.passed,
            step_events=step_events,
            message="Transaction turn processed successfully by multi-agent supervisor.",
        ).model_dump()
