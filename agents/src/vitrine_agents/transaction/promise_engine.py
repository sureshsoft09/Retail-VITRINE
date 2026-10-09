"""Promise Engine ADK Agent (ag-promise-engine).

Implements the two-stage Google ADK agent architecture:
1. `promise_investigate`: LlmAgent equipped with ATP & transit feasibility tools.
2. `promise_conclude`: LlmAgent producing a typed CandidatePromiseFinding.
3. `promise_agent`: SequentialAgent coordinating the investigation and synthesis.
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4
from pydantic import BaseModel

from google.adk.agents import LlmAgent, SequentialAgent
from vitrine_agents import config, tools
from vitrine_agents.schemas import CandidatePromiseFinding
from vitrine_agents.base import load_passport, load_prompt

PROMISE_INVESTIGATE_PROMPT = """
You are the Vitrine Promise Engine Agent.
Your job is to evaluate fulfillment feasibility for candidate nodes across the enterprise network.
Procedure:
1. Call get_node_inventory for each candidate node (STORE-042, DC-NORTH).
2. Call evaluate_transit_window to check transit duration and carrier cutoffs against destination pincode.
3. Produce an evidence summary detailing inventory safety stock, carrier cutoff windows, and feasible options.
"""

PROMISE_CONCLUDE_PROMPT = """
You are converting promise investigation evidence into a typed CandidatePromiseFinding.
Populate every field from the evidence brief.
Choose the best candidate node that maximizes delivery speed while strictly adhering to safety stock.
"""

promise_investigate = LlmAgent(
    name="promise_investigate",
    model=config.MODEL_FAST,
    description="Gathers ATP inventory and carrier cutoff window evidence.",
    instruction=PROMISE_INVESTIGATE_PROMPT,
    tools=[tools.get_node_inventory, tools.evaluate_transit_window],
    output_key="promise_evidence",
)

promise_conclude = LlmAgent(
    name="promise_conclude",
    model=config.MODEL_FAST,
    description="Synthesizes evidence into a typed CandidatePromiseFinding.",
    instruction=PROMISE_CONCLUDE_PROMPT,
    output_schema=CandidatePromiseFinding,
    output_key="candidate_promise",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
)

promise_agent = SequentialAgent(
    name="promise_agent",
    description="Synthesizes inventory, transit isochrones, and carrier cutoffs into binding promises.",
    sub_agents=[promise_investigate, promise_conclude],
)

class CandidatePromise(BaseModel):
    candidate_id: str
    fulfilment_node_id: str
    sku: str
    atp_units: int
    transit_hours: float
    carrier: str
    carrier_cutoff: str
    carrier_cutoff_utc: str
    unit_price: float
    shipping_cost: float
    margin_pct: float
    guaranteed_delivery_utc: str
    confidence: float

class PromiseEngineAgent:
    """Wrapper facade ensuring backward compatibility with direct method calls."""

    def __init__(self):
        self.passport = load_passport("ag-promise-engine")
        self.adk_agent = promise_agent

    def evaluate_candidates(
        self,
        sku: str,
        dest_pincode: str,
        requested_delivery_by_utc: str,
        requested_quantity: int = 1,
    ) -> List[CandidatePromise]:
        """Synthesizes candidate promises across fulfillment nodes."""
        candidates = []
        nodes = [
            ("DC-NORTH", "FedEx Priority Overnight", 18.0, 14.50, 24.8),
            ("STORE-042", "SameDay Local Courier", 3.5, 9.50, 21.0),
        ]
        now = datetime.now(timezone.utc)
        for node_id, carrier, transit_hours, ship_cost, margin_pct in nodes:
            inv = tools.get_node_inventory(sku, node_id)
            transit = tools.evaluate_transit_window(node_id, dest_pincode)

            candidates.append(CandidatePromise(
                candidate_id=f"prom-{uuid4().hex[:8]}",
                fulfilment_node_id=node_id,
                sku=sku,
                atp_units=inv["atp_units"],
                transit_hours=transit["transit_hours"],
                carrier=carrier,
                carrier_cutoff=transit["carrier_cutoff_utc"],
                carrier_cutoff_utc=transit["carrier_cutoff_utc"],
                unit_price=128.00,
                shipping_cost=ship_cost,
                margin_pct=margin_pct,
                guaranteed_delivery_utc=requested_delivery_by_utc,
                confidence=0.98 if not transit["cutoff_missed"] else 0.40,
            ))
        return candidates
