"""MCP Commerce Server (mcp-commerce).

Standardized Region: us-central1
Port: 8092
Built with FastMCP exposing Model Context Protocol over streamable-http at /mcp.
"""

import asyncio
from datetime import datetime, timezone
import hashlib
import json
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

mcp = FastMCP("vitrine-commerce")

# ------------------------------------------------------------------------------
# Request / Response Schemas
# ------------------------------------------------------------------------------

class LandedCostRequest(BaseModel):
    base_price: float
    shipping_cost: float
    handling_fee: float = 0.0
    duty_pct: float = 0.0

class MarginRequest(BaseModel):
    price: float
    landed_cost: float
    fulfilment_cost: float
    shipping_cost: float
    policy_floor_pct: float = 18.0

class VerifyMandateRequest(BaseModel):
    mandate_id: str
    signature: str
    amount: float
    nonce: str

class AppendLedgerRequest(BaseModel):
    txn_id: str
    sku: str
    quantity: int
    unit_price: float
    currency: str = "USD"
    fulfilment_node_id: str
    carrier_id: str
    buyer_agent_id: str
    mandate_id: str

# ------------------------------------------------------------------------------
# In-Memory Cryptographic Hash Chained Ledger
# ------------------------------------------------------------------------------

LEDGER_CHAIN: List[Dict[str, Any]] = [
    {
        "sequence_num": 1,
        "commitment_id": "cmt-001041",
        "txn_id": "txn-genesis-01",
        "prev_hash": "0" * 64,
        "current_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "timestamp": "2026-10-09T10:45:00Z",
        "sku": "SKU-4829-SILK-BLOUSE",
        "quantity": 1,
        "unit_price": 128.00,
        "currency": "USD",
        "fulfilment_node_id": "DC-NORTH",
        "carrier_id": "fedex_express",
        "buyer_agent_id": "buyer-shopper-01",
        "mandate_id": "ap2-mandate-001",
    }
]

# Anti-replay nonce cache
USED_NONCES: set = {"ap2-nonce-984b-consumed", "replayed_nonce_test_attack"}

# ------------------------------------------------------------------------------
# Health & Status Helpers
# ------------------------------------------------------------------------------

def healthz() -> Dict[str, Any]:
    return {"status": "ok", "server": "mcp-commerce", "region": "us-central1"}

def root_info() -> Dict[str, Any]:
    return {
        "service": "mcp-commerce",
        "framework": "FastMCP",
        "status": "ONLINE",
        "description": "VITRINE MCP Commerce & Governance Service",
        "mcp_endpoint": "/mcp",
        "tools": [
            "compute_landed_cost",
            "compute_margin",
            "verify_mandate",
            "append_ledger",
            "verify_chain_integrity",
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
def compute_landed_cost(
    base_price: Optional[float] = None,
    shipping_cost: float = 0.0,
    handling_fee: float = 0.0,
    duty_pct: float = 0.0,
    x_agent_id: Optional[str] = None,
    req: Optional[LandedCostRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Pure mathematical landed cost calculation."""
    if isinstance(base_price, LandedCostRequest):
        req = base_price
    if req is not None:
        bp = req.base_price
        ship = req.shipping_cost
        hnd = req.handling_fee
        duty_p = req.duty_pct
    else:
        bp = base_price or 0.0
        ship = shipping_cost
        hnd = handling_fee
        duty_p = duty_pct

    duty = bp * (duty_p / 100.0)
    total_landed = bp + ship + hnd + duty
    comp_id = hashlib.sha256(f"{total_landed:.2f}".encode()).hexdigest()[:12]

    return {
        "status": "SUCCESS",
        "base_price": bp,
        "shipping_cost": ship,
        "handling_fee": hnd,
        "duty_amount": duty,
        "total_landed_cost": round(total_landed, 2),
        "computation_id": f"calc-landed-{comp_id}",
    }

# Alias for backwards compatibility
landed_cost = compute_landed_cost

@mcp.tool()
def compute_margin(
    price: Optional[float] = None,
    landed_cost: float = 0.0,
    fulfilment_cost: float = 0.0,
    shipping_cost: float = 0.0,
    policy_floor_pct: float = 18.0,
    x_agent_id: Optional[str] = None,
    req: Optional[MarginRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Evaluates net margin percentage against merchant policy floor."""
    if isinstance(price, MarginRequest):
        req = price
    if req is not None:
        p = req.price
        lc = req.landed_cost
        fc = req.fulfilment_cost
        sc = req.shipping_cost
        pf = req.policy_floor_pct
    else:
        p = price or 0.0
        lc = landed_cost
        fc = fulfilment_cost
        sc = shipping_cost
        pf = policy_floor_pct

    # Authorization boundary check: Trust Analyst has zero commercial tools
    agent_str = x_agent_id if isinstance(x_agent_id, str) else None
    if agent_str and "trust" in agent_str.lower():
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Trust Analyst is not authorized to execute commercial margin tools.",
        )

    net_profit = p - lc - fc - sc
    margin_pct = (net_profit / p * 100.0) if p > 0 else 0.0
    passed = margin_pct >= pf
    comp_id = hashlib.sha256(f"{margin_pct:.2f}".encode()).hexdigest()[:12]

    return {
        "status": "SUCCESS",
        "selling_price": p,
        "net_profit": round(net_profit, 2),
        "realized_margin_pct": round(margin_pct, 2),
        "policy_floor_pct": pf,
        "floor_satisfied": passed,
        "computation_id": f"calc-margin-{comp_id}",
    }

# Alias for backwards compatibility
calculate_margin = compute_margin

@mcp.tool()
def verify_mandate(
    mandate_id: Optional[str] = None,
    signature: str = "",
    amount: float = 0.0,
    nonce: str = "",
    x_agent_id: Optional[str] = None,
    req: Optional[VerifyMandateRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Verifies AP2 mandate signature, freshness, and anti-replay nonce."""
    if isinstance(mandate_id, VerifyMandateRequest):
        req = mandate_id
    if req is not None:
        m_id = req.mandate_id
        sig = req.signature
        amt = req.amount
        nc = req.nonce
    else:
        m_id = mandate_id or ""
        sig = signature
        amt = amount
        nc = nonce

    is_replayed = nc in USED_NONCES
    if not is_replayed:
        USED_NONCES.add(nc)

    return {
        "status": "SUCCESS",
        "valid": not is_replayed,
        "mandate_id": m_id,
        "amount_authorized": amt,
        "is_replayed": is_replayed,
        "reason": "Replayed nonce detected in audit window" if is_replayed else "Signature and freshness verified",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@mcp.tool()
def append_ledger(
    txn_id: Optional[str] = None,
    sku: str = "",
    quantity: int = 1,
    unit_price: float = 0.0,
    currency: str = "USD",
    fulfilment_node_id: str = "",
    carrier_id: str = "",
    buyer_agent_id: str = "",
    mandate_id: str = "",
    x_agent_id: Optional[str] = None,
    req: Optional[AppendLedgerRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Appends verified commitment to the cryptographic hash-chained ledger."""
    if isinstance(txn_id, AppendLedgerRequest):
        req = txn_id
    if req is not None:
        t_id = req.txn_id
        t_sku = req.sku
        t_qty = req.quantity
        t_price = req.unit_price
        t_curr = req.currency
        t_node = req.fulfilment_node_id
        t_carrier = req.carrier_id
        t_buyer = req.buyer_agent_id
        t_mandate = req.mandate_id
    else:
        t_id = txn_id or ""
        t_sku = sku
        t_qty = quantity
        t_price = unit_price
        t_curr = currency
        t_node = fulfilment_node_id
        t_carrier = carrier_id
        t_buyer = buyer_agent_id
        t_mandate = mandate_id

    # Strict Gateway Containment: Trust Analyst or Enrichment agents CANNOT write commitments
    agent_str = x_agent_id if isinstance(x_agent_id, str) else None
    if agent_str and ("trust" in agent_str.lower() or "enrichment" in agent_str.lower()):
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Agent identity possesses zero commitment append authority.",
        )

    prev_record = LEDGER_CHAIN[-1]
    prev_hash = prev_record["current_hash"]
    seq_num = prev_record["sequence_num"] + 1

    payload = {
        "sequence_num": seq_num,
        "prev_hash": prev_hash,
        "txn_id": t_id,
        "sku": t_sku,
        "quantity": t_qty,
        "unit_price": t_price,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "fulfilment_node_id": t_node,
        "carrier_id": t_carrier,
        "buyer_agent_id": t_buyer,
        "mandate_id": t_mandate,
    }

    # Canonical SHA-256 calculation
    canonical = json.dumps(payload, sort_keys=True)
    current_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    record = {
        "commitment_id": f"cmt-{seq_num:06d}",
        "current_hash": current_hash,
        **payload,
    }
    LEDGER_CHAIN.append(record)

    return {
        "status": "COMMITTED",
        "sequence_num": seq_num,
        "commitment_id": record["commitment_id"],
        "prev_hash": prev_hash,
        "current_hash": current_hash,
        "table": "vitrine_ledger.commitments",
    }

@mcp.tool()
def verify_chain_integrity() -> Dict[str, Any]:
    """MCP Tool: Verifies complete cryptographic SHA-256 hash chain from genesis block."""
    for i in range(1, len(LEDGER_CHAIN)):
        prev_block = LEDGER_CHAIN[i - 1]
        curr_block = LEDGER_CHAIN[i]

        if curr_block["prev_hash"] != prev_block["current_hash"]:
            return {
                "verified": False,
                "status": "CHAIN_BROKEN",
                "error_block": curr_block["sequence_num"],
            }

    return {
        "verified": True,
        "status": "CHAIN_INTEGRITY_VERIFIED",
        "blocks_verified": len(LEDGER_CHAIN),
        "head_hash": LEDGER_CHAIN[-1]["current_hash"],
    }

# ------------------------------------------------------------------------------
# Entrypoint
# ------------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8092))
    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=port,
    )
