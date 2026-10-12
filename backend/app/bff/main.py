"""vitrine-bff — Public BFF API Service.

Standardized Region: us-central1
Provides endpoints for the React frontend: Product Brain, Transaction Theatre,
11-Condition Gate, Immutable Ledger Explorer, and Governance Console.
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sys
from pathlib import Path

# Ensure cloud_run_host is on sys.path
_cr_host_path = str(Path(__file__).resolve().parent.parent.parent.parent / "agents" / "cloud_run_host")
if _cr_host_path not in sys.path:
    sys.path.insert(0, _cr_host_path)

from backend.app.core.config import settings
from backend.app.core.services.gate import CommitmentGate
from backend.app.core.services.autonomy import autonomy_manager
from backend.app.core.calculators.atp import calculate_atp
from backend.app.core.calculators.transit import evaluate_transit_feasibility
from backend.app.core.calculators.margin import calculate_margin
from backend.app.gcp.bq import bq_client
from backend.app.gcp.firestore import firestore_service
from vitrine_agents.transaction.agent import root_agent
from app.trust_analyst import AgentTrustAnalyst

app = FastAPI(
    title="vitrine-bff",
    version="1.0.0",
    description="VITRINE Public BFF Gateway."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

trust_analyst = AgentTrustAnalyst()

# ------------------------------------------------------------------------------
# Request & Response Models
# ------------------------------------------------------------------------------

class StartTransactionRequest(BaseModel):
    txn_id: str
    buyer_agent_id: str
    persona: str = "honest_shopper"
    constraints: Dict[str, Any]
    ap2_mandate: Optional[Dict[str, Any]] = None

class GateEvaluateRequest(BaseModel):
    txn_id: str
    on_hand: int = 10
    reserved: int = 2
    safety_stock: int = 2
    requested_qty: int = 1
    transit_hours: float = 12.0
    unit_price: float = 128.00
    landed_cost: float = 65.00
    fulfilment_cost: float = 12.00
    shipping_cost: float = 10.00
    discount_pct: float = 5.0
    buyer_reputation: float = 0.95
    mandate: Dict[str, Any] = {"mandate_id": "ap2-001", "signature_valid": True, "is_replayed": False}

# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------

@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "vitrine-bff", "region": settings.GCP_REGION}

@app.post("/api/session")
def bootstrap_session():
    """Bootstraps a session with feature flags and region configuration."""
    policy = autonomy_manager.get_policy()
    return {
        "status": "ready",
        "region": settings.GCP_REGION,
        "features": {
            "agent_engine_active": True,
            "multimodal_enrichment_active": True,
            "hash_chained_ledger_active": True,
        },
        "autonomy_policy": policy.model_dump(),
    }

# ------------------------------------------------------------------------------
# Product Brain (Pillar 1)
# ------------------------------------------------------------------------------

@app.get("/api/catalogue/search")
def search_catalogue(q: str = Query(..., description="Query terms"), mode: str = Query("enriched", regex="^(raw|enriched)$")):
    """Product Brain search with raw vs. enriched switch.
    
    Demonstrates before/after: raw fails to match fine-grained attributes;
    enriched matches multimodal attributes with high confidence.
    """
    results = bq_client.search_catalogue(query=q, mode=mode)
    return {
        "query": q,
        "mode": mode,
        "total_results": len(results),
        "results": results,
    }

@app.get("/api/products/{sku}")
def get_product(sku: str):
    results = bq_client.search_catalogue(query=sku, mode="enriched")
    if not results:
        raise HTTPException(status_code=404, detail="SKU not found")
    return results[0]

# ------------------------------------------------------------------------------
# Transaction Theatre & Agent Execution (Pillars 2 & 3)
# ------------------------------------------------------------------------------

@app.post("/api/transactions")
async def start_transaction(req: StartTransactionRequest):
    """Processes a transaction turn with the Agent supervisor and records step events."""
    policy = autonomy_manager.get_policy()
    if policy.kill_switch_active:
        raise HTTPException(status_code=503, detail="Global kill switch is active. Autonomous transactions suspended.")

    # Ingress screen via Trust Analyst
    nonce = (req.ap2_mandate or {}).get("nonce", "nonce-clean")
    trust_res = trust_analyst.screen_buyer_agent(req.buyer_agent_id, nonce)

    if trust_res.verdict == "REJECT_UNTRUSTED":
        # Log hostile step event
        firestore_service.publish_step_event(
            req.txn_id,
            {
                "step_seq": 1,
                "agent": "ag-agent-trust-analyst",
                "phase": "SECURITY_SCREEN",
                "message": f"REJECTED: {trust_res.explanation}",
                "status": "BLOCKED",
                "data": trust_res.model_dump(),
            }
        )
        return {
            "txn_id": req.txn_id,
            "status": "REJECTED_HOSTILE",
            "trust_verdict": trust_res.model_dump(),
            "message": "Transaction blocked by Agent Trust Analyst security screen.",
        }

    # Execute turn with supervisor agent
    result = await root_agent.query(
        session_id=req.txn_id,
        input={
            "txn_id": req.txn_id,
            "buyer_agent_id": req.buyer_agent_id,
            "action": "DISCOVER",
            "constraints": req.constraints,
            "ap2_mandate": req.ap2_mandate,
        }
    )

    # Persist live steps for the Transaction Theatre
    for step in result.get("step_events", []):
        firestore_service.publish_step_event(req.txn_id, step)

    # If offer is ready and commitment gate passes, append to ledger
    if result.get("status") in ("OFFER_PRESENTED", "SUBSTITUTION_OFFER_PRESENTED") and result.get("active_offer"):
        offer = result["active_offer"]
        bq_client.append_commitment({
            "txn_id": req.txn_id,
            "sku": offer["sku"],
            "quantity": offer["quantity"],
            "unit_price": offer["unit_price"],
            "currency": offer.get("currency", "USD"),
            "fulfilment_node_id": offer.get("delivery_promise", {}).get("fulfilment_node_id", "DC-NORTH"),
            "carrier_id": offer.get("delivery_promise", {}).get("carrier_id", "FedEx-Express"),
            "mandate_id": (req.ap2_mandate or {}).get("mandate_id", "mandate-auto"),
            "buyer_agent_id": req.buyer_agent_id,
        })

    return result

@app.get("/api/theatre/events/{txn_id}")
def get_theatre_events(txn_id: str):
    """Returns streaming step events for a transaction in the Transaction Theatre."""
    steps = firestore_service.get_transaction_steps(txn_id)
    return {"txn_id": txn_id, "step_count": len(steps), "steps": steps}

# ------------------------------------------------------------------------------
# The 11-Condition Gate
# ------------------------------------------------------------------------------

@app.post("/api/gate/evaluate")
def evaluate_gate(req: GateEvaluateRequest):
    """Directly evaluates the 11-condition commitment gate."""
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=14)
    deadline = now + timedelta(hours=36)

    atp_res = calculate_atp(req.on_hand, req.reserved, req.safety_stock, req.requested_qty)
    transit_res = evaluate_transit_feasibility(now, cutoff, req.transit_hours, deadline)
    margin_res = calculate_margin(
        unit_price=req.unit_price,
        landed_cost=req.landed_cost,
        fulfilment_cost=req.fulfilment_cost,
        shipping_cost=req.shipping_cost,
        margin_floor_pct=autonomy_manager.get_policy().margin_floor_pct,
    )

    policy = autonomy_manager.get_policy()
    return CommitmentGate.evaluate(
        txn_id=req.txn_id,
        atp_check=atp_res,
        transit_check=transit_res,
        margin_check=margin_res,
        ap2_mandate=req.mandate,
        order_total=req.unit_price * req.requested_qty,
        discount_pct=req.discount_pct,
        buyer_reputation_score=req.buyer_reputation,
        autonomy_max_order=policy.max_order_usd,
        autonomy_discount_cap=policy.max_discount_pct,
    )

# ------------------------------------------------------------------------------
# Immutable Ledger & Governance
# ------------------------------------------------------------------------------

@app.get("/api/ledger")
def get_ledger(limit: int = 50):
    return {"records": bq_client.list_commitments(limit=limit)}

@app.get("/api/admin/ledger/verify")
def verify_ledger():
    """Cryptographically verifies SHA-256 chain integrity."""
    return bq_client.verify_chain_integrity()

@app.get("/api/admin/autonomy")
def get_autonomy():
    return autonomy_manager.get_policy().model_dump()

@app.put("/api/admin/autonomy")
def update_autonomy(updates: Dict[str, Any]):
    return autonomy_manager.update_policy(updates).model_dump()

@app.post("/api/admin/killswitch")
def toggle_killswitch(active: bool = Query(...)):
    res = autonomy_manager.toggle_kill_switch(active)
    return {"kill_switch_active": res}

@app.get("/api/control-tower/summary")
def get_control_tower_summary():
    return {
        "win_rate_pct": 74.2,
        "commitments_kept_pct": 98.6,
        "average_realized_margin_pct": 24.8,
        "total_autonomous_orders": len(bq_client.list_commitments()),
        "substitutions_accepted": 8,
    }

@app.get("/api/control-tower/lost-reasons")
def get_lost_reasons():
    return {
        "lost_reasons": [
            {"constraint": "Carrier Cutoff Missed", "count": 28, "action": "Shifted to next-day delivery"},
            {"constraint": "Margin Below Policy Floor", "count": 14, "action": "Discounts capped at 15%"},
            {"constraint": "Safety Stock Exhaustion", "count": 6, "action": "Substituted with DC-NORTH inventory"},
        ]
    }

@app.get("/api/fraud/queue")
def get_fraud_queue():
    return {
        "findings": [
            {
                "id": "fraud-001",
                "buyer_agent_id": "buyer-hostile-482",
                "finding_type": "MANDATE_NONCE_REPLAY",
                "evidence": "Nonce 'replayed_nonce_test_attack' observed in prior transaction",
                "counter_evidence": "Nonce reused within 120s window is cryptographic signature of replay attack",
                "severity": "CRITICAL",
                "verdict": "REJECT_UNTRUSTED",
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
