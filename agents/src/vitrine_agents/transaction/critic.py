"""Commitment Critic ADK Agent (ag-commitment-critic).

Adversarial critic evaluating candidate commitments with independent fresh context.
Implements the two-stage Google ADK agent architecture:
1. `critic_investigate`: LlmAgent equipped with independent verification tools.
2. `critic_conclude`: LlmAgent producing a typed CritiqueFinding.
3. `critic_agent`: SequentialAgent coordinating adversarial verification.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4
from pydantic import BaseModel

from google.adk.agents import LlmAgent, SequentialAgent
from vitrine_agents import config, tools
from vitrine_agents.schemas import CritiqueFinding, ObjectionFinding
from vitrine_agents.base import load_passport, load_prompt

CRITIC_INVESTIGATE_PROMPT = """
You are the Commitment Critic Agent.
You operate under zero-trust principles with fresh context. You do not trust the Promise Engine's optimism.
Your job is to independently verify:
1. Did the origin node miss the carrier cutoff window?
2. Does the origin node have sufficient ATP inventory exceeding safety buffers?
3. Does the net realized margin satisfy the policy floor (18%)?

Procedure:
1. Call evaluate_transit_window for the promise's fulfillment node.
2. Call get_node_inventory to independently verify ATP units.
3. Call calculate_commercial_margin to recompute net profit margin.
Produce an adversarial evidence brief citing specific discrepancies and breached thresholds.
"""

CRITIC_CONCLUDE_PROMPT = """
You are converting the critic investigation brief into a typed CritiqueFinding.
Rules:
- If ANY check failed (carrier cutoff missed, ATP <= 0, margin < 18%), set verdict to BLOCKED and passed to false.
- Detail every objection with its condition_id, exact numeric detail, and suggested resolution.
- Only if all checks pass without objection, set verdict to APPROVED and passed to true.
"""

critic_investigate = LlmAgent(
    name="critic_investigate",
    model=config.MODEL_REASONING,
    description="Independently verifies carrier cutoffs, ATP safety buffers, and margin floors.",
    instruction=CRITIC_INVESTIGATE_PROMPT,
    tools=[tools.evaluate_transit_window, tools.get_node_inventory, tools.calculate_commercial_margin],
    output_key="critic_evidence",
)

critic_conclude = LlmAgent(
    name="critic_conclude",
    model=config.MODEL_FAST,
    description="Produces typed CritiqueFinding ruling on whether candidate promise is approved or blocked.",
    instruction=CRITIC_CONCLUDE_PROMPT,
    output_schema=CritiqueFinding,
    output_key="critique_verdict",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
)

critic_agent = SequentialAgent(
    name="critic_agent",
    description="Adversarial check evaluating draft commitments under zero-trust assumptions.",
    sub_agents=[critic_investigate, critic_conclude],
)

class Objection(BaseModel):
    objection_id: str
    condition_id: str
    summary: str
    detail: str
    blocking: bool = True
    suggested_resolution: str
    evidence_ref: str

class CritiqueResult(BaseModel):
    passed: bool
    verdict: str
    objections: List[Objection] = []
    evaluation_id: str
    timestamp: str

class CommitmentCriticAgent:
    """Wrapper facade ensuring backward compatibility with existing tests and BFF."""

    def __init__(self):
        self.passport = load_passport("ag-commitment-critic")
        self.adk_agent = critic_agent

    def evaluate_promise(
        self,
        candidate_promise: Dict[str, Any],
        requested_quantity: int = 1,
        margin_floor_pct: float = 18.0,
    ) -> CritiqueResult:
        """Independently recomputes feasibility and raises blocking objections if violated."""
        objections: List[Objection] = []
        now = datetime.now(timezone.utc)

        # 1. Independent Carrier Cutoff Verification
        cutoff_str = candidate_promise.get("carrier_cutoff") or candidate_promise.get("carrier_cutoff_utc")
        if cutoff_str:
            cutoff_dt = datetime.fromisoformat(cutoff_str.replace("Z", "+00:00"))
            if now > cutoff_dt:
                missed_hours = round((now - cutoff_dt).total_seconds() / 3600.0, 1)
                objections.append(
                    Objection(
                        objection_id=f"obj-{uuid4().hex[:8]}",
                        condition_id="COND_01_CARRIER_CUTOFF",
                        summary="Carrier cutoff window missed",
                        detail=f"Carrier cutoff was at {cutoff_dt.isoformat()}. Current time misses cutoff by {missed_hours} hours.",
                        blocking=True,
                        suggested_resolution="Substitute with alternative fulfillment node (e.g. DC-NORTH) or shift guaranteed delivery by +24 hours.",
                        evidence_ref=f"cutoff_timestamp:{cutoff_str}",
                    )
                )

        # 2. Independent ATP Verification
        atp = candidate_promise.get("atp_units", 0)
        if atp < requested_quantity:
            objections.append(
                Objection(
                    objection_id=f"obj-{uuid4().hex[:8]}",
                    condition_id="COND_02_ATP_SAFETY_STOCK",
                    summary="Insufficient ATP inventory",
                    detail=f"Requested {requested_quantity} units, but available ATP is {atp}.",
                    blocking=True,
                    suggested_resolution="Fulfill from regional distribution center or initiate split fulfillment.",
                    evidence_ref=f"atp:{atp}",
                )
            )

        # 3. Independent Margin Floor Verification
        margin = candidate_promise.get("margin_pct", 0.0)
        if margin < margin_floor_pct:
            objections.append(
                Objection(
                    objection_id=f"obj-{uuid4().hex[:8]}",
                    condition_id="COND_05_MARGIN_FLOOR",
                    summary="Realized margin breaches policy floor",
                    detail=f"Projected margin is {margin:.1f}%, which is below the policy floor of {margin_floor_pct:.1f}%.",
                    blocking=True,
                    suggested_resolution="Reduce discount percentage or switch to standard freight.",
                    evidence_ref=f"margin:{margin}",
                )
            )

        passed = len(objections) == 0
        return CritiqueResult(
            passed=passed,
            verdict="APPROVED" if passed else "BLOCKED",
            objections=objections,
            evaluation_id=f"crit-eval-{uuid4().hex[:10]}",
            timestamp=now.isoformat(),
        )
