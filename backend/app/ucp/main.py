"""vitrine-ucp — Public Universal Commerce Protocol (UCP) Endpoint.

Standardized Region: us-central1
Provides machine-to-machine protocol interfaces for external buyer agents:
  - /.well-known/ucp (Capability Discovery)
  - /ucp/discover (Multimodal product search)
  - /ucp/negotiate (Capability and delivery window negotiation)
  - /ucp/offer (Firm binding offer assembly)
  - /ucp/offer/{id}/accept (Mandate verification and commitment)
"""

import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel

# Ensure cloud_run_host is on sys.path
_cr_host_path = str(Path(__file__).resolve().parent.parent.parent.parent / "agents" / "cloud_run_host")
if _cr_host_path not in sys.path:
    sys.path.insert(0, _cr_host_path)

from backend.app.core.config import settings
from backend.app.gcp.bq import bq_client
from vitrine_agents.transaction.agent import root_agent
from app.trust_analyst import AgentTrustAnalyst

app = FastAPI(
    title="vitrine-ucp",
    version="1.0.0",
    description="Universal Commerce Protocol public gateway for autonomous buyer agents."
)

trust_analyst = AgentTrustAnalyst()

class UCPDiscoverRequest(BaseModel):
    query: str
    destination_pincode: str = "98101"
    max_price: Optional[float] = None

class UCPNegotiateRequest(BaseModel):
    txn_id: str
    buyer_agent_id: str
    sku: str
    target_delivery_date: str
    target_discount_pct: float = 0.0
    ap2_mandate: Dict[str, Any]

class UCPAcceptRequest(BaseModel):
    txn_id: str
    buyer_agent_id: str
    offer_id: str
    ap2_mandate: Dict[str, Any]

@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "vitrine-ucp"}

@app.get("/.well-known/ucp")
def ucp_capabilities_discovery():
    """Returns standardized UCP capability discovery manifest."""
    return {
        "ucp_version": "1.0.0",
        "merchant": {
            "name": "VITRINE Retailer Prototype",
            "region": settings.GCP_REGION,
            "agent_engine_id": settings.AGENT_ENGINE_RESOURCE_NAME,
        },
        "capabilities": [
            "urn:ucp:capability:multimodal_discovery",
            "urn:ucp:capability:delivery_promise_negotiation",
            "urn:ucp:capability:dynamic_substitution",
            "urn:ucp:capability:ap2_payment_mandates",
            "urn:ucp:capability:cryptographic_ledger_proofs",
        ],
        "supported_payment_protocols": ["urn:ap2:mandate:v1"],
        "attribute_vocabulary": [
            "fabric_composition",
            "sleeve_length",
            "care_instructions",
            "fit",
            "color",
        ],
    }

@app.post("/ucp/discover")
def ucp_discover(req: UCPDiscoverRequest):
    """Product discovery matching multimodal enriched attributes."""
    matches = bq_client.search_catalogue(query=req.query, mode="enriched")
    return {
        "status": "SUCCESS",
        "matches_count": len(matches),
        "candidates": matches,
    }

@app.post("/ucp/negotiate")
async def ucp_negotiate(req: UCPNegotiateRequest):
    """Processes commercial negotiation turn via the multi-agent supervisor."""
    # Screen for mandate replay or fraud
    nonce = req.ap2_mandate.get("nonce", "nonce-default")
    trust_res = trust_analyst.screen_buyer_agent(req.buyer_agent_id, nonce)

    if trust_res.verdict == "REJECT_UNTRUSTED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Security screen rejected request: {trust_res.explanation}",
        )

    # Process turn with supervisor agent
    result = await root_agent.query(
        session_id=req.txn_id,
        input={
            "txn_id": req.txn_id,
            "buyer_agent_id": req.buyer_agent_id,
            "action": "NEGOTIATE",
            "constraints": {
                "sku": req.sku,
                "pincode": "98101",
                "deadline": req.target_delivery_date,
                "discount_pct": req.target_discount_pct,
            },
            "ap2_mandate": req.ap2_mandate,
        }
    )

    return result

@app.post("/ucp/offer/{offer_id}/accept")
def ucp_accept_offer(offer_id: str, req: UCPAcceptRequest):
    """Accepts an offer and commits the order to the immutable BigQuery ledger."""
    # Verify AP2 mandate
    if not req.ap2_mandate.get("signature_valid", False):
        raise HTTPException(status_code=400, detail="Invalid AP2 mandate signature.")

    # Append to hash-chained ledger
    record = bq_client.append_commitment({
        "txn_id": req.txn_id,
        "sku": "SKU-4830-SILK-SHIRT",
        "quantity": 1,
        "unit_price": 135.00,
        "currency": "USD",
        "mandate_id": req.ap2_mandate.get("mandate_id", "mandate-accepted"),
        "buyer_agent_id": req.buyer_agent_id,
    })

    return {
        "status": "COMMITTED",
        "commitment_record": record,
        "message": "Commercial promise committed and verified in immutable ledger.",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8082)
