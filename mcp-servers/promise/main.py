"""MCP Promise Server (mcp-promise).

Standardized Region: us-central1
Port: 8091
Built with FastMCP exposing Model Context Protocol over streamable-http at /mcp.
"""

import asyncio
from datetime import datetime, timezone
import hashlib
import os
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv
from fastmcp import FastMCP
from fastapi import HTTPException
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

# Load environment variables
load_dotenv()

# ------------------------------------------------------------------------------
# Initialize FastMCP Server
# ------------------------------------------------------------------------------

mcp = FastMCP("vitrine-promise")

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
# Health & Status Helpers
# ------------------------------------------------------------------------------

def healthz() -> Dict[str, Any]:
    return {"status": "ok", "server": "mcp-promise", "region": "us-central1"}

def root_info() -> Dict[str, Any]:
    return {
        "service": "mcp-promise",
        "framework": "FastMCP",
        "status": "ONLINE",
        "description": "VITRINE MCP Promise & Delivery Feasibility Service",
        "mcp_endpoint": "/mcp",
        "tools": [
            "promise_fanout",
            "compute_atp",
            "compute_transit",
            "get_carrier_cutoffs",
        ],
    }

@mcp.custom_route("/healthz", methods=["GET"])
async def healthz_route(request: Request) -> Response:
    return JSONResponse(healthz())

@mcp.custom_route("/", methods=["GET"])
async def root_route(request: Request) -> Response:
    return JSONResponse(root_info())

# ------------------------------------------------------------------------------
# MCP Tools
# ------------------------------------------------------------------------------

@mcp.tool()
def promise_fanout(
    sku: Optional[str] = None,
    destination_pincode: Optional[str] = None,
    target_delivery_date: Optional[str] = None,
    requested_qty: int = 1,
    x_agent_id: Optional[str] = None,
    req: Optional[PromiseFanoutRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Evaluates candidate fulfilment nodes in parallel."""
    if isinstance(sku, PromiseFanoutRequest):
        req = sku
    if req is not None:
        target_sku = req.sku
        dest = req.destination_pincode
        t_date = req.target_delivery_date
        qty = req.requested_qty
    else:
        target_sku = sku or ""
        dest = destination_pincode or ""
        t_date = target_delivery_date or ""
        qty = requested_qty

    # Authorization boundary check: Trust Analyst has zero commercial tools
    agent_str = x_agent_id if isinstance(x_agent_id, str) else None
    if agent_str and "trust" in agent_str.lower():
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Trust Analyst has no permission to invoke promise tools.",
        )

    # Deterministic calculation IDs
    comp_id_dc = hashlib.sha256(f"{target_sku}:DC-NORTH:{dest}".encode()).hexdigest()[:12]
    comp_id_store = hashlib.sha256(f"{target_sku}:STORE-042:{dest}".encode()).hexdigest()[:12]

    return {
        "status": "SUCCESS",
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
        "sku": target_sku,
        "destination": dest,
        "candidates": [
            {
                "candidate_id": "cand_dc_north",
                "sku": target_sku,
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
                "sku": target_sku,
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

@mcp.tool()
def compute_atp(
    sku: Optional[str] = None,
    node_id: Optional[str] = None,
    on_hand: int = 0,
    reserved: int = 0,
    safety_stock: int = 0,
    requested_qty: int = 1,
    x_agent_id: Optional[str] = None,
    req: Optional[ComputeAtpRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Evaluates Available-to-Promise (ATP) quantity with safety stock constraints."""
    if isinstance(sku, ComputeAtpRequest):
        req = sku
    if req is not None:
        target_sku = req.sku
        target_node = req.node_id
        oh = req.on_hand
        res = req.reserved
        safe = req.safety_stock
        req_q = req.requested_qty
    else:
        target_sku = sku or ""
        target_node = node_id or ""
        oh = on_hand
        res = reserved
        safe = safety_stock
        req_q = requested_qty

    atp = oh - res - safe
    passed = atp >= req_q
    comp_id = hashlib.sha256(f"atp:{target_sku}:{target_node}:{atp}".encode()).hexdigest()[:12]

    return {
        "status": "SUCCESS",
        "sku": target_sku,
        "node_id": target_node,
        "atp_units": atp,
        "requested_qty": req_q,
        "safety_stock_reserved": safe,
        "condition_passed": passed,
        "computation_id": f"calc-atp-{comp_id}",
    }

@mcp.tool()
def compute_transit(
    origin_node: Optional[str] = None,
    destination_pincode: Optional[str] = None,
    max_transit_hours: float = 24.0,
    x_agent_id: Optional[str] = None,
    req: Optional[ComputeTransitRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Evaluates carrier route transit hours and isochrone polygon match."""
    if isinstance(origin_node, ComputeTransitRequest):
        req = origin_node
    if req is not None:
        origin = req.origin_node
        dest = req.destination_pincode
        max_t = req.max_transit_hours
    else:
        origin = origin_node or ""
        dest = destination_pincode or ""
        max_t = max_transit_hours

    transit_hours_map = {
        ("DC-NORTH", "98101"): 18.5,
        ("STORE-042", "98101"): 3.5,
        ("DC-SOUTH", "98101"): 32.0,
    }
    transit = transit_hours_map.get((origin, dest), 20.0)
    feasible = transit <= max_t

    return {
        "status": "SUCCESS",
        "origin_node": origin,
        "destination_pincode": dest,
        "transit_hours": transit,
        "max_transit_hours": max_t,
        "isochrone_feasible": feasible,
        "computation_id": f"calc-transit-{origin[:4]}",
    }

@mcp.tool()
def get_carrier_cutoffs(
    carrier_id: Optional[str] = None,
    node_id: Optional[str] = None,
    order_time_utc: Optional[str] = None,
    x_agent_id: Optional[str] = None,
    req: Optional[CarrierCutoffRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Checks carrier schedule and cutoff windows."""
    if isinstance(carrier_id, CarrierCutoffRequest):
        req = carrier_id
    if req is not None:
        c_id = req.carrier_id
        n_id = req.node_id
        o_time = req.order_time_utc
    else:
        c_id = carrier_id or ""
        n_id = node_id or ""
        o_time = order_time_utc

    cutoffs = {
        ("local_same_day", "STORE-042"): "2026-10-09T05:00:00Z",
        ("fedex_express", "DC-NORTH"): "2026-10-09T18:00:00Z",
    }
    cutoff_iso = cutoffs.get((c_id, n_id), "2026-10-09T18:00:00Z")
    order_time = o_time or datetime.now(timezone.utc).isoformat()
    passed = order_time <= cutoff_iso

    return {
        "status": "SUCCESS",
        "carrier_id": c_id,
        "node_id": n_id,
        "carrier_cutoff_utc": cutoff_iso,
        "order_time_utc": order_time,
        "cutoff_met": passed,
    }

# ------------------------------------------------------------------------------
# Entrypoint
# ------------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8091))
    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=port,
    )
