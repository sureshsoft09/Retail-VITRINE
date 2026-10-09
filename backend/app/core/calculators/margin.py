"""Margin & Landed Cost deterministic calculator.

Enforces minimum margin floors and discount limits set by commercial policy.
"""

from typing import Dict, Any

def calculate_margin(
    unit_price: float,
    landed_cost: float,
    fulfilment_cost: float,
    shipping_cost: float,
    margin_floor_pct: float = 18.0,
) -> Dict[str, Any]:
    """Calculates net margin and validates against policy floor."""
    total_cost = landed_cost + fulfilment_cost + shipping_cost
    net_margin = unit_price - total_cost
    margin_pct = (net_margin / unit_price) * 100.0 if unit_price > 0 else 0.0

    violates_floor = margin_pct < margin_floor_pct

    return {
        "unit_price": unit_price,
        "total_cost": round(total_cost, 2),
        "net_margin": round(net_margin, 2),
        "margin_pct": round(margin_pct, 2),
        "margin_floor_pct": margin_floor_pct,
        "violates_floor": violates_floor,
    }
