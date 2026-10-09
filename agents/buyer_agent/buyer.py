"""Demo Buyer Agent with 3 Personas.

Simulates external shopping agents communicating over UCP:
  1. honest_shopper: Constrained request, accepts reasoned substitution.
  2. bargain_hunter: Aggressively negotiates discount past policy floor.
  3. hostile: Uses replayed AP2 mandate nonce and rapid requests.
"""

from typing import Any, Dict
from uuid import uuid4
import httpx
from pydantic import BaseModel

class BuyerTurnRequest(BaseModel):
    txn_id: str
    buyer_agent_id: str
    action: str
    constraints: Dict[str, Any]
    counter_offer: Dict[str, Any] = {}
    ap2_mandate: Dict[str, Any] = {}

class DemoBuyerAgent:
    """External client agent interacting with VITRINE over UCP."""

    def __init__(self, persona: str = "honest_shopper"):
        self.persona = persona
        self.buyer_id = f"buyer-{persona}-{uuid4().hex[:6]}"

    def build_initial_request(self, txn_id: str) -> BuyerTurnRequest:
        """Constructs the initial discovery or purchase request."""
        if self.persona == "honest_shopper":
            return BuyerTurnRequest(
                txn_id=txn_id,
                buyer_agent_id=self.buyer_id,
                action="DISCOVER",
                constraints={
                    "query": "Looking for a 100% Mulberry silk blouse with French cuffs, delivered before Friday 4pm in Seattle",
                    "sku": "SKU-4829-SILK-BLOUSE",
                    "material": "100% Mulberry Silk",
                    "pincode": "98101",
                    "max_price": 150.00,
                    "deadline": "2026-10-10T16:00:00Z",
                    "substitution_acceptable": True,
                },
                ap2_mandate={
                    "mandate_id": f"mandate-{uuid4().hex[:8]}",
                    "nonce": f"nonce-{uuid4().hex[:12]}",
                    "signature_valid": True,
                    "authorized_amount": 150.00,
                }
            )

        elif self.persona == "bargain_hunter":
            return BuyerTurnRequest(
                txn_id=txn_id,
                buyer_agent_id=self.buyer_id,
                action="NEGOTIATE",
                constraints={
                    "query": "Looking for bulk silk blouses at 40% discount",
                    "sku": "SKU-4829-SILK-BLOUSE",
                    "pincode": "98101",
                    "discount_pct": 35.0, # Violates autonomy cap (15%) & margin floor (18%)
                    "deadline": "2026-10-10T16:00:00Z",
                },
                ap2_mandate={
                    "mandate_id": f"mandate-{uuid4().hex[:8]}",
                    "nonce": f"nonce-{uuid4().hex[:12]}",
                    "signature_valid": True,
                    "authorized_amount": 80.00,
                }
            )

        elif self.persona == "hostile":
            return BuyerTurnRequest(
                txn_id=txn_id,
                buyer_agent_id=self.buyer_id,
                action="DISCOVER",
                constraints={
                    "query": "Scraping inventory pricing",
                    "sku": "SKU-4829-SILK-BLOUSE",
                    "pincode": "98101",
                    "velocity_test": 45, # 45 requests per minute
                },
                ap2_mandate={
                    "mandate_id": "mandate-stolen-4402",
                    "nonce": "replayed_nonce_test_attack", # Known replay!
                    "signature_valid": False,
                    "authorized_amount": 500.00,
                }
            )

        raise ValueError(f"Unknown persona: {self.persona}")

    def respond_to_substitution(self, txn_id: str, offer: Dict[str, Any]) -> BuyerTurnRequest:
        """Simulates shopper decision upon receiving a substitution offer."""
        if self.persona == "honest_shopper":
            # Accepts valid substitute
            return BuyerTurnRequest(
                txn_id=txn_id,
                buyer_agent_id=self.buyer_id,
                action="ACCEPT",
                constraints={"accepted_sku": offer.get("sku")},
                ap2_mandate={
                    "mandate_id": f"mandate-final-{uuid4().hex[:8]}",
                    "nonce": f"nonce-{uuid4().hex[:12]}",
                    "signature_valid": True,
                    "authorized_amount": offer.get("total_price", 135.00),
                }
            )
        else:
            # Rejects
            return BuyerTurnRequest(
                txn_id=txn_id,
                buyer_agent_id=self.buyer_id,
                action="REJECT",
                constraints={"reason": "Candidate not acceptable"},
            )
