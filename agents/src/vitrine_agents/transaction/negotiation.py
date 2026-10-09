"""Negotiation ADK Agent (ag-negotiation-agent).

Formats UCP commercial turns, enforces autonomy discount caps, and generates valid UCP offers.
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional
from uuid import uuid4

from google.adk.agents import LlmAgent
from vitrine_agents import config, tools
from vitrine_agents.schemas import NegotiationOfferFinding
from vitrine_agents.base import load_passport, load_prompt

NEGOTIATION_PROMPT = """
You are the Vitrine Negotiation Agent.
Your job is to format commercial offers for buyer agents in the Universal Commerce Protocol (UCP).
Rules:
1. Apply the buyer's requested discount subject to the merchant autonomy cap (maximum 15%).
2. Call calculate_commercial_margin to verify that the realized margin remains at or above 18%.
3. Populate the typed NegotiationOfferFinding with the final pricing, discount, and projected margin.
"""

negotiation_agent = LlmAgent(
    name="negotiation_agent",
    model=config.MODEL_FAST,
    description="Calculates commercial pricing, applies discount caps, and formats UCP offers.",
    instruction=NEGOTIATION_PROMPT,
    tools=[tools.calculate_commercial_margin],
    output_schema=NegotiationOfferFinding,
    output_key="active_offer",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
)

class NegotiationAgent:
    """Wrapper facade ensuring backward compatibility with existing tests and BFF."""

    def __init__(self):
        self.passport = load_passport("ag-negotiation-agent")
        self.adk_agent = negotiation_agent

    def generate_ucp_offer(
        self,
        txn_id: str,
        sku: str,
        base_price: float,
        discount_pct: float,
        fulfilment_promise: Dict[str, Any],
        discount_cap_pct: float = 15.0,
        margin_floor_pct: float = 18.0,
    ) -> Dict[str, Any]:
        """Generates a legally binding, signed UCP offer document."""
        applied_discount = min(discount_pct, discount_cap_pct)
        comm = tools.calculate_commercial_margin(
            unit_price=base_price,
            discount_pct=applied_discount,
            shipping_cost=fulfilment_promise.get("shipping_cost", 14.50),
        )

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=15)

        return {
            "offer_id": f"off-{uuid4().hex[:10]}",
            "txn_id": txn_id,
            "sku": sku,
            "unit_price": comm["final_price"],
            "original_price": base_price,
            "discount_pct": applied_discount,
            "discount_requested_pct": discount_pct,
            "discount_capped": discount_pct > discount_cap_pct,
            "shipping_cost": fulfilment_promise.get("shipping_cost", 14.50),
            "total_price": round(comm["final_price"] + fulfilment_promise.get("shipping_cost", 14.50), 2),
            "projected_margin_pct": comm["margin_pct"],
            "fulfilment_promise": fulfilment_promise,
            "status": "OFFER_PRESENTED",
            "expires_at_utc": expires_at.isoformat(),
            "merchant_signature": f"sig-ucp-merch-{uuid4().hex[:16]}",
        }
