"""Main FastAPI application for VITRINE backend services.

Standardized Region: us-central1
Routes transaction turns to Vertex AI Agent Engine and provides commercial APIs.
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.core.config import settings
from backend.app.core.services.gate import CommitmentGate
from backend.app.core.calculators.atp import calculate_atp
from backend.app.core.calculators.transit import evaluate_transit_feasibility
from backend.app.core.calculators.margin import calculate_margin
from backend.app.gcp.agent_engine import AgentEngineClient

app = FastAPI(
    title="VITRINE Core & BFF API",
    version="1.0.0",
    description="Merchant-side agentic commerce engine on Google Cloud."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent_engine_client = AgentEngineClient(
    project_id=settings.GCP_PROJECT_ID,
    region=settings.GCP_REGION,
    resource_name=settings.AGENT_ENGINE_RESOURCE_NAME,
)

class TransactionRequest(BaseModel):
    txn_id: str
    buyer_agent_id: str
    action: str  # DISCOVER, NEGOTIATE, ACCEPT
    constraints: Dict[str, Any]
    counter_offer: Optional[Dict[str, Any]] = None
    ap2_mandate: Optional[Dict[str, Any]] = None

class GateEvaluateRequest(BaseModel):
    txn_id: str
    on_hand: int
    reserved: int
    safety_stock: int
    requested_qty: int
    transit_hours: float
    unit_price: float
    landed_cost: float
    fulfilment_cost: float
    shipping_cost: float
    discount_pct: float
    buyer_reputation: float
    mandate: Dict[str, Any]

@app.get("/healthz", status_code=status.HTTP_200_OK)
def healthz():
    return {
        "status": "healthy",
        "region": settings.GCP_REGION,
        "service": "vitrine-backend",
        "agent_engine_configured": bool(settings.AGENT_ENGINE_RESOURCE_NAME),
    }

@app.post("/api/transactions")
async def process_transaction_turn(req: TransactionRequest):
    """Processes an agent transaction turn via Vertex AI Agent Engine."""
    if settings.GLOBAL_KILL_SWITCH:
        raise HTTPException(status_code=503, detail="Global kill switch active.")

    try:
        # Remote invoke on Vertex AI Agent Engine
        result = await agent_engine_client.query(
            session_id=req.txn_id,
            input_payload=req.model_dump(),
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent Engine transaction failed: {str(exc)}",
        )

@app.post("/api/gate/evaluate")
def evaluate_gate(req: GateEvaluateRequest):
    """Evaluates the 11-condition commitment gate using pure deterministic calculators."""
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
        margin_floor_pct=settings.AUTONOMY_MARGIN_FLOOR_PCT,
    )

    gate_result = CommitmentGate.evaluate(
        txn_id=req.txn_id,
        atp_check=atp_res,
        transit_check=transit_res,
        margin_check=margin_res,
        ap2_mandate=req.mandate,
        order_total=req.unit_price * req.requested_qty,
        discount_pct=req.discount_pct,
        buyer_reputation_score=req.buyer_reputation,
        autonomy_max_order=settings.AUTONOMY_MAX_ORDER_VALUE_USD,
        autonomy_discount_cap=settings.AUTONOMY_DISCOUNT_CAP_PCT,
    )

    return gate_result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
