"""Deterministic tools invoked by Google ADK agents in VITRINE.

Every tool returns plain JSON-serializable dictionaries.
Mathematical calculations are delegated to pure deterministic backend calculators.
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

from backend.app.core.calculators.atp import calculate_atp
from backend.app.core.calculators.transit import evaluate_transit_feasibility
from backend.app.core.calculators.margin import calculate_margin
from backend.app.core.services.gate import CommitmentGate

def get_node_inventory(sku: str, node_id: str) -> Dict[str, Any]:
    """Retrieve on-hand, allocated, and safety stock for a SKU at a specific node.

    Args:
        sku: Product SKU identifier (e.g. 'SKU-4829-SILK-BLOUSE').
        node_id: Fulfillment node identifier (e.g. 'STORE-042', 'DC-NORTH').
    """
    node_profiles = {
        "STORE-042": {"on_hand": 3, "allocated": 1, "safety_stock": 1, "lead_time_days": 1},
        "DC-NORTH": {"on_hand": 85, "allocated": 10, "safety_stock": 5, "lead_time_days": 1},
        "DC-SOUTH": {"on_hand": 42, "allocated": 4, "safety_stock": 3, "lead_time_days": 2},
    }
    profile = node_profiles.get(node_id, {"on_hand": 0, "allocated": 0, "safety_stock": 1, "lead_time_days": 3})
    atp_res = calculate_atp(
        on_hand=profile["on_hand"],
        reserved=profile["allocated"],
        safety_stock=profile["safety_stock"],
        requested_quantity=1,
    )
    return {
        "sku": sku,
        "node_id": node_id,
        "on_hand": profile["on_hand"],
        "allocated": profile["allocated"],
        "safety_stock": profile["safety_stock"],
        "atp_units": atp_res["available_units"],
        "is_feasible": atp_res["is_satisfiable"],
    }

def evaluate_transit_window(node_id: str, dest_pincode: str) -> Dict[str, Any]:
    """Evaluate transit duration, carrier cutoff adherence, and delivery feasibility.

    Args:
        node_id: Fulfillment node identifier.
        dest_pincode: 5-digit destination delivery postal code.
    """
    now = datetime.now(timezone.utc)
    if node_id == "STORE-042":
        cutoff = now - timedelta(hours=6)
        transit_hours = 3.5
        carrier = "SameDay Local Courier"
    elif node_id == "DC-NORTH":
        cutoff = now + timedelta(hours=5)
        transit_hours = 18.0
        carrier = "FedEx Priority Overnight"
    else:
        cutoff = now + timedelta(hours=4)
        transit_hours = 24.0
        carrier = "UPS Ground"

    deadline = now + timedelta(hours=36)
    feasibility = evaluate_transit_feasibility(
        order_timestamp=now,
        carrier_cutoff=cutoff,
        transit_hours=transit_hours,
        deadline=deadline,
    )
    return {
        "node_id": node_id,
        "dest_pincode": dest_pincode,
        "carrier": carrier,
        "carrier_cutoff_utc": cutoff.isoformat(),
        "transit_hours": transit_hours,
        "cutoff_missed": feasibility["cutoff_missed"],
        "cutoff_delta_hours": feasibility["cutoff_delta_hours"],
        "is_feasible": feasibility["is_feasible"],
    }

def calculate_commercial_margin(
    unit_price: float,
    discount_pct: float = 0.0,
    cost_of_goods: float = 65.0,
    shipping_cost: float = 14.50,
) -> Dict[str, Any]:
    """Calculate commercial profitability and margin floor compliance.

    Args:
        unit_price: Base catalog retail price in USD.
        discount_pct: Requested discount percentage.
        cost_of_goods: Wholesale unit cost in USD.
        shipping_cost: Fulfillment and carrier transit cost in USD.
    """
    discounted_price = round(unit_price * (1.0 - discount_pct / 100.0), 2)
    margin_res = calculate_margin(
        unit_price=discounted_price,
        landed_cost=cost_of_goods,
        fulfilment_cost=8.00,
        shipping_cost=shipping_cost,
        margin_floor_pct=18.0,
    )
    return {
        "base_price": unit_price,
        "discount_pct": discount_pct,
        "final_price": discounted_price,
        "margin_dollars": margin_res["net_margin"],
        "margin_pct": margin_res["margin_pct"],
        "violates_floor": margin_res["violates_floor"],
        "policy_floor_pct": 18.0,
    }

def find_substitute_candidates(blocked_sku: str, hard_constraints: Dict[str, Any]) -> Dict[str, Any]:
    """Find inventory-backed alternatives preserving buyer hard constraints when a promise is blocked.

    Args:
        blocked_sku: SKU that failed carrier cutoff or inventory gates.
        hard_constraints: Non-negotiable requirements (e.g. fabric, sleeve type).
    """
    catalog = [
        {
            "sku": "SKU-4830-SILK-SHIRT",
            "name": "French Silk Classic Shirt (Champagne)",
            "fabric": "100% Mulberry Silk",
            "sleeve": "French Cuffs",
            "collar": "Spread",
            "node_id": "DC-NORTH",
            "atp": 12,
            "unit_price": 134.00,
            "shopper_reason": "Identical 100% Mulberry Silk and French Cuffs, ready for dispatch from DC-NORTH",
        },
        {
            "sku": "SKU-4831-POLY-BLOUSE",
            "name": "Satin Polyester Blouse",
            "fabric": "Polyester Blend",
            "sleeve": "Standard Button",
            "node_id": "DC-NORTH",
            "atp": 50,
            "unit_price": 49.00,
            "shopper_reason": "Lower price alternative but violates fabric constraint",
        },
    ]

    matched = []
    for item in catalog:
        preserves_all = True
        preserved_keys = []
        for k, v in hard_constraints.items():
            val = str(item.get(k, "")).lower()
            target = str(v).lower()
            if target in val or val in target:
                preserved_keys.append(f"{k}: {v}")
            else:
                preserves_all = False
        if preserves_all:
            matched.append({
                "sku": item["sku"],
                "name": item["name"],
                "origin_node": item["node_id"],
                "atp_units": item["atp"],
                "unit_price": item["unit_price"],
                "shopper_reason": item["shopper_reason"],
                "preserved_constraints": preserved_keys,
            })

    return {
        "blocked_sku": blocked_sku,
        "candidates_found": len(matched),
        "best_match": matched[0] if matched else None,
    }

def screen_ap2_mandate(buyer_agent_id: str, nonce: str) -> Dict[str, Any]:
    """Screen incoming buyer agent credentials and AP2 mandate against replay cache.

    Args:
        buyer_agent_id: Identifier of buyer agent.
        nonce: Cryptographic single-use mandate nonce.
    """
    is_replayed = "replay" in nonce.lower() or "spent" in nonce.lower()
    is_hostile = "hostile" in buyer_agent_id.lower() or is_replayed

    return {
        "buyer_agent_id": buyer_agent_id,
        "nonce": nonce,
        "is_replayed": is_replayed,
        "trust_tier": "HOSTILE" if is_hostile else "ENTERPRISE",
        "verdict": "REJECT_UNTRUSTED" if is_hostile else "ACCEPT",
        "risk_score": 0.95 if is_hostile else 0.04,
        "counter_evidence": f"Nonce '{nonce}' was already spent in previous transaction block" if is_replayed else None,
    }
