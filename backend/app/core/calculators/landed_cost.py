"""Landed cost deterministic calculator.

Computes base cost + duty + freight + handling with audit computation ID.
"""

from typing import Any, Dict
from uuid import uuid4

def compute_landed_cost(
    base_cost: float,
    duty_rate_pct: float = 8.5,
    freight_cost: float = 12.0,
    handling_cost: float = 4.5,
) -> Dict[str, Any]:
    """Pure calculation of landed unit cost."""
    duty_amount = round(base_cost * (duty_rate_pct / 100.0), 2)
    total_landed = round(base_cost + duty_amount + freight_cost + handling_cost, 2)
    computation_id = f"calc-landed-{uuid4().hex[:8]}"

    return {
        "computation_id": computation_id,
        "base_cost": base_cost,
        "duty_amount": duty_amount,
        "freight_cost": freight_cost,
        "handling_cost": handling_cost,
        "total_landed_cost": total_landed,
        "working": [
            f"base: ${base_cost:.2f}",
            f"duty ({duty_rate_pct}%): ${duty_amount:.2f}",
            f"freight: ${freight_cost:.2f}",
            f"handling: ${handling_cost:.2f}",
            f"total: ${total_landed:.2f}"
        ]
    }
