"""MCP Promise Server (mcp-promise).

Standardized Region: us-central1
Port: 8091
Exposes deterministic fulfilment fanout, ATP calculations, carrier schedules,
and transit feasibility tools over MCP/HTTP to agents authorized by Agent Gateway.
"""

from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import hashlib
from fastapi import FastAPI, HTTPException, Header, status
from pydantic import BaseModel

app = FastAPI(
    title="mcp-promise",
    version="1.0.0",
    description="VITRINE MCP Promise & Delivery Feasibility Service"
)

# ------------------------------------------------------------------------------
# Request / Response Schemas
# ------------------------------------------------------------------------------

class PromiseFanoutRequest(BaseModel):
    sku: str
    destination_pincode: str
    target_delivery_date: str
    requested_qty: int = 1

class ComputeAtpRequest(BaseModel):
    sku: str
    node_id: str
    on_hand: int
    reserved: int
    safety_stock: int
    requested_qty: int

class ComputeTransitRequest(BaseModel):
    origin_node: str
    destination_pincode: str
    max_transit_hours: float = 24.0

class CarrierCutoffRequest(BaseModel):
    carrier_id: str
    node_id: str
    order_time_utc: Optional[str] = None

# ------------------------------------------------------------------------------
# Ingress Policy & Health
# ------------------------------------------------------------------------------

@app.get("/healthz")
def healthz():
    return {"status": "ok", "server": "mcp-promise", "region": "us-central1"}

# ------------------------------------------------------------------------------
# MCP Tool Endpoints
# ------------------------------------------------------------------------------

@app.post("/tools/promise.fanout")
def promise_fanout(
    req: PromiseFanoutRequest,
    x_agent_id: Optional[str] = Header(None),
):
    """MCP Tool: Evaluates candidate fulfilment nodes in parallel."""
    # Authorization boundary check: Trust Analyst has zero commercial tools
    agent_str = x_agent_id if isinstance(x_agent_id, str) else None
    if agent_str and "trust" in agent_str.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Trust Analyst has no permission to invoke promise tools.",
        )

    # Deterministic calculation IDs
    comp_id_dc = hashlib.sha256(f"{req.sku}:DC-NORTH:{req.destination_pincode}".encode()).hexdigest()[:12]
    comp_id_store = hashlib.sha256(f"{req.sku}:STORE-042:{req.destination_pincode}".encode()).hexdigest()[:12]

    return {
        "status": "SUCCESS",
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "sku": req.sku,
        "destination": req.destination_pincode,
        "candidates": [
            {
                "candidate_id": "cand_dc_north",
                "sku": req.sku,
                "node_id": "DC-NORTH",
                "node_name": "Regional Fulfilment Center North",
                "atp_units": 18,
                "carrier_id": "fedex_express",
                "carrier_cutoff": "2026-10-09T18:00:00Z",
                "estimated_delivery": "2026-10-10T14:00:00Z",
                "transit_hours": 18.5,
                "margin_pct": 28.5,
                "cutoff_met": True,
                "isochrone_feasible": True,
                "computation_id": f"calc-{comp_id_dc}",
            },
            {
                "candidate_id": "cand_store_042",
                "sku": req.sku,
                "node_id": "STORE-042",
                "node_name": "Local Retail Store 042 (Seattle)",
                "atp_units": 1,
                "carrier_id": "local_same_day",
                "carrier_cutoff": "2026-10-09T05:00:00Z",
                "estimated_delivery": "2026-10-09T18:00:00Z",
                "transit_hours": 3.5,
                "margin_pct": 21.0,
                "cutoff_met": False,  # Missed cutoff! Triggers Commitment Critic objection
                "isochrone_feasible": True,
                "computation_id": f"calc-{comp_id_store}",
            },
        ],
    }

@app.post("/tools/promise.compute_atp")
def compute_atp(
    req: ComputeAtpRequest,
    x_agent_id: Optional[str] = Header(None),
):
    """MCP Tool: Evaluates Available-to-Promise (ATP) quantity with safety stock constraints."""
    atp = req.on_hand - req.reserved - req.safety_stock
    passed = atp >= req.requested_qty
    comp_id = hashlib.sha256(f"atp:{req.sku}:{req.node_id}:{atp}".encode()).hexdigest()[:12]

    return {
        "status": "SUCCESS",
        "sku": req.sku,
        "node_id": req.node_id,
        "atp_units": atp,
        "requested_qty": req.requested_qty,
        "safety_stock_reserved": req.safety_stock,
        "condition_passed": passed,
        "computation_id": f"calc-atp-{comp_id}",
    }

@app.post("/tools/promise.compute_transit")
def compute_transit(
    req: ComputeTransitRequest,
    x_agent_id: Optional[str] = Header(None),
):
    """MCP Tool: Evaluates carrier route transit hours and isochrone polygon match."""
    # Deterministic lookup table
    transit_hours_map = {
        ("DC-NORTH", "98101"): 18.5,
        ("STORE-042", "98101"): 3.5,
        ("DC-SOUTH", "98101"): 32.0,
    }
    transit = transit_hours_map.get((req.origin_node, req.destination_pincode), 20.0)
    feasible = transit <= req.max_transit_hours

    return {
        "status": "SUCCESS",
        "origin_node": req.origin_node,
        "destination_pincode": req.destination_pincode,
        "transit_hours": transit,
        "max_transit_hours": req.max_transit_hours,
        "isochrone_feasible": feasible,
        "computation_id": f"calc-transit-{req.origin_node[:4]}",
    }

@app.post("/tools/promise.get_carrier_cutoffs")
def get_carrier_cutoffs(
    req: CarrierCutoffRequest,
    x_agent_id: Optional[str] = Header(None),
):
    """MCP Tool: Checks carrier schedule and cutoff windows."""
    # STORE-042 has cutoff 05:00 UTC (past) while DC-NORTH has cutoff 18:00 UTC (active)
    cutoffs = {
        ("local_same_day", "STORE-042"): "2026-10-09T05:00:00Z",
        ("fedex_express", "DC-NORTH"): "2026-10-09T18:00:00Z",
    }
    cutoff_iso = cutoffs.get((req.carrier_id, req.node_id), "2026-10-09T18:00:00Z")
    order_time = req.order_time_utc or datetime.now(timezone.utc).isoformat()
    passed = order_time <= cutoff_iso

    return {
        "status": "SUCCESS",
        "carrier_id": req.carrier_id,
        "node_id": req.node_id,
        "carrier_cutoff_utc": cutoff_iso,
        "order_time_utc": order_time,
        "cutoff_adhered": passed,
        "action_required": None if passed else "Cutoff missed: substitute fulfilment node or delay promise by 24h",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8091)
