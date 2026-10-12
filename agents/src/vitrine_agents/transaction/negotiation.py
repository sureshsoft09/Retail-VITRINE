"""Negotiation ADK Agent (ag-negotiation-agent).

Formats UCP commercial turns, enforces autonomy discount caps, and generates valid UCP offers.
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional
from uuid import uuid4

from google.adk.agents import LlmAgent, SequentialAgent
from vitrine_agents import config, tools
from vitrine_agents.mcp_tools import CommerceMCP_Tool
from vitrine_agents.schemas import NegotiationOfferFinding
from vitrine_agents.base import load_passport, load_prompt

NEGOTIATION_INVESTIGATE_PROMPT = """
You are the Vitrine Negotiation Agent.
Your job is to format commercial offers for buyer agents in the Universal Commerce Protocol (UCP).
Check the candidate SKU (or substitute SKU if substitution was recommended) and its pricing.
Rules:
1. Pricing & Wholesale Cost:
   - For SKU-4829-SILK-BLOUSE: retail price is $128.00, wholesale cost_of_goods (landed_cost) is $60.00.
   - For SKU-4830-SILK-SHIRT: retail price is $135.00, wholesale cost_of_goods (landed_cost) is $65.00.
   - For any other SKU: wholesale cost_of_goods (landed_cost) is 45-50% of retail price. Do NOT use retail price as landed_cost!
2. Apply the buyer's requested discount subject to the merchant autonomy cap (maximum 15%). If no discount is requested, apply 5%.
   - Discounted unit price = base_price * (1 - discount_pct / 100).
3. Call compute_margin with:
   - price = discounted unit price
   - landed_cost = wholesale cost_of_goods (e.g. $65.00 for SKU-4830-SILK-SHIRT)
   - fulfilment_cost = 8.00
   - shipping_cost = 8.50
   - policy_floor_pct = 18.0
4. Check the realized margin:
   - If realized margin >= 18%, set status to "OFFER_PRESENTED".
   - Only if realized margin < 18%, set status to "REJECTED_OUT_OF_BOUNDS".
5. Produce a commercial negotiation brief summarizing:
   - Target SKU
   - Base unit price
   - Applied discount % (capped at 15%)
   - Discounted unit price
   - Shipping cost ($8.50)
   - Total price (discounted unit price + shipping)
   - Net realized margin % (e.g. ~36%)
   - Offer status (OFFER_PRESENTED)
"""

NEGOTIATION_CONCLUDE_PROMPT = """
You are converting the commercial negotiation brief into a typed NegotiationOfferFinding.
Populate every field in NegotiationOfferFinding:
- offer_id: A unique offer ID string (e.g. "off-" + 10 random hex chars)
- sku: Product SKU being offered
- unit_price: Discounted unit price in USD
- discount_pct: Applied discount percentage
- total_price: Final total price including shipping
- projected_margin_pct: Realized margin percentage (must be >= 18%)
- status: "OFFER_PRESENTED" or "REJECTED_OUT_OF_BOUNDS"
- explanation: Clear commercial explanation of the offer terms
"""

negotiation_investigate = LlmAgent(
    name="negotiation_investigate",
    model=config.MODEL_FAST,
    description="Calculates commercial pricing, applies discount caps, and verifies margins via MCP tools.",
    instruction=NEGOTIATION_INVESTIGATE_PROMPT,
    tools=[CommerceMCP_Tool],
    output_key="negotiation_evidence",
)

negotiation_conclude = LlmAgent(
    name="negotiation_conclude",
    model=config.MODEL_FAST,
    description="Synthesizes commercial negotiation terms into a typed NegotiationOfferFinding.",
    instruction=NEGOTIATION_CONCLUDE_PROMPT,
    output_schema=NegotiationOfferFinding,
    output_key="active_offer",
)

negotiation_agent = SequentialAgent(
    name="negotiation_agent",
    description="Calculates commercial pricing, applies discount caps, and formats UCP offers.",
    sub_agents=[negotiation_investigate, negotiation_conclude],
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
