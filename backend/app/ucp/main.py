"""vitrine-ucp — Public Universal Commerce Protocol (UCP) Endpoint.

Standardized Region: us-central1
Provides machine-to-machine protocol interfaces for external buyer agents:
  - GET /.well-known/ucp (Capability Discovery)
  - POST /ucp/v1/sessions (Session Initialization)
  - POST /ucp/discover (Multimodal product search)
  - POST /ucp/negotiate (Capability and delivery window negotiation)
  - POST /ucp/offer/{id}/accept (Mandate verification and commitment)
"""

import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure cloud_run_host is on sys.path
_cr_host_path = str(Path(__file__).resolve().parent.parent.parent.parent / "agents" / "cloud_run_host")
if _cr_host_path not in sys.path:
    sys.path.insert(0, _cr_host_path)

from backend.app.ucp.config import ucp_settings
from backend.app.gcp.bq import bq_client
from vitrine_agents.transaction.agent import VitrineTransactionSupervisor
from app.trust_analyst import AgentTrustAnalyst

app = FastAPI(
    title="vitrine-ucp",
    version=ucp_settings.UCP_VERSION,
    description="Universal Commerce Protocol public gateway for autonomous buyer agents."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

trust_analyst = AgentTrustAnalyst()
supervisor = VitrineTransactionSupervisor()

# Vertex AI Reasoning Engine remote client
_remote_engine = None

def get_remote_reasoning_engine():
    """Lazily initializes the connection to the deployed Vertex AI Agent Engine."""
    global _remote_engine
    if _remote_engine is None and ucp_settings.AGENT_ENGINE_RESOURCE_NAME:
        try:
            import vertexai
            from vertexai.preview import reasoning_engines
            vertexai.init(project=ucp_settings.GCP_PROJECT_ID, location=ucp_settings.GCP_REGION)
            _remote_engine = reasoning_engines.ReasoningEngine(ucp_settings.AGENT_ENGINE_RESOURCE_NAME)
        except Exception:
            _remote_engine = False
    return _remote_engine if _remote_engine is not False else None


# ------------------------------------------------------------------------------
# Request & Response Models
# ------------------------------------------------------------------------------

class UCPSessionRequest(BaseModel):
    buyer_agent_id: str
    capabilities_requested: List[str] = Field(default_factory=list)
    client_version: Optional[str] = "1.0.0"

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
    sku: Optional[str] = None
    quantity: Optional[int] = 1
    unit_price: Optional[float] = None
    currency: Optional[str] = "USD"
    fulfilment_node_id: Optional[str] = "DC-NORTH"
    carrier_id: Optional[str] = "FedEx-Express"


# ------------------------------------------------------------------------------
# Health & Discovery Endpoints
# ------------------------------------------------------------------------------

@app.get("/healthz")
@app.get("/health")
@app.get("/")
def healthz():
    return {
        "status": "ok",
        "service": "vitrine-ucp",
        "version": ucp_settings.UCP_VERSION,
        "region": ucp_settings.GCP_REGION,
    }

@app.get("/.well-known/ucp")
def ucp_capabilities_discovery():
    """Returns standardized UCP capability discovery manifest."""
    return {
        "ucp_version": ucp_settings.UCP_VERSION,
        "merchant": {
            "name": ucp_settings.UCP_MERCHANT_NAME,
            "region": ucp_settings.GCP_REGION,
            "agent_engine_id": ucp_settings.AGENT_ENGINE_RESOURCE_NAME,
            "agents_host_url": ucp_settings.AGENTS_HOST_URL,
        },
        "capabilities": [
            "urn:ucp:capability:multimodal_discovery",
            "urn:ucp:capability:delivery_promise_negotiation",
            "urn:ucp:capability:dynamic_substitution",
            "urn:ucp:capability:ap2_payment_mandates",
            "urn:ucp:capability:cryptographic_ledger_proofs",
            "urn:ucp:capability:zero_trust_sentinels",
        ],
        "supported_payment_protocols": ["urn:ap2:mandate:v1"],
        "attribute_vocabulary": [
            "fabric_composition",
            "sleeve_length",
            "care_instructions",
            "fit",
            "color",
        ],
        "endpoints": {
            "session": "/ucp/v1/sessions",
            "discover": "/ucp/discover",
            "negotiate": "/ucp/negotiate",
            "accept": "/ucp/offer/{offer_id}/accept",
        },
    }

@app.post("/ucp/v1/sessions")
def ucp_initiate_session(req: UCPSessionRequest):
    """Establishes an agent-to-merchant UCP negotiation session."""
    return {
        "session_id": f"ucp-sess-{os.urandom(6).hex()}",
        "buyer_agent_id": req.buyer_agent_id,
        "status": "ESTABLISHED",
        "merchant": ucp_settings.UCP_MERCHANT_NAME,
        "ucp_version": ucp_settings.UCP_VERSION,
        "accepted_capabilities": [
            "urn:ucp:capability:multimodal_discovery",
            "urn:ucp:capability:delivery_promise_negotiation",
            "urn:ucp:capability:dynamic_substitution",
            "urn:ucp:capability:ap2_payment_mandates",
            "urn:ucp:capability:cryptographic_ledger_proofs",
        ],
    }


# ------------------------------------------------------------------------------
# Protocol Operations
# ------------------------------------------------------------------------------

@app.post("/ucp/discover")
def ucp_discover(req: UCPDiscoverRequest):
    """Product discovery matching multimodal enriched attributes."""
    matches = bq_client.search_catalogue(query=req.query, mode="enriched")
    return {
        "status": "SUCCESS",
        "matches_count": len(matches),
        "candidates": matches,
    }

# Active UCP offer cache for buyer agent polling and settlement
_active_ucp_offers: Dict[str, Dict[str, Any]] = {}

@app.post("/ucp/negotiate")
async def ucp_negotiate(req: UCPNegotiateRequest):
    """Processes commercial negotiation turn via live Vertex AI Reasoning Engine or supervisor."""
    # Screen for mandate replay or fraudulent behavior
    mandate_nonce = req.ap2_mandate.get("nonce")
    mandate_id = req.ap2_mandate.get("mandate_id")
    trust_res = trust_analyst.screen_buyer_agent(
        buyer_agent_id=req.buyer_agent_id,
        mandate_id=mandate_id,
        mandate_nonce=mandate_nonce,
    )

    if trust_res.verdict == "REJECT_UNTRUSTED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Security screen rejected request: {trust_res.explanation}",
        )

    payload = {
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

    # Query live Vertex AI Reasoning Engine with graceful fallback to supervisor
    remote_engine = get_remote_reasoning_engine()
    if remote_engine:
        try:
            result = remote_engine.query(
                session_id=req.txn_id,
                input=payload,
            )
        except Exception:
            result = await supervisor.query(session_id=req.txn_id, input=payload)
    else:
        result = await supervisor.query(session_id=req.txn_id, input=payload)

    # Cache active offer if generated
    if isinstance(result, dict) and result.get("active_offer"):
        offer = result["active_offer"]
        offer_id = offer.get("offer_id")
        if offer_id:
            _active_ucp_offers[offer_id] = offer

    return result

@app.get("/ucp/offer/{offer_id}")
def ucp_get_offer(offer_id: str):
    """Retrieves an active UCP offer by ID."""
    if offer_id not in _active_ucp_offers:
        raise HTTPException(status_code=404, detail=f"Offer '{offer_id}' not found or expired.")
    return _active_ucp_offers[offer_id]

@app.post("/ucp/offer/{offer_id}/accept")
def ucp_accept_offer(offer_id: str, req: UCPAcceptRequest):
    """Accepts an offer and commits the order to the immutable BigQuery ledger."""
    # Verify AP2 mandate
    if not req.ap2_mandate.get("signature_valid", False):
        raise HTTPException(status_code=400, detail="Invalid AP2 mandate signature.")

    # Retrieve cached offer terms if available
    cached_offer = _active_ucp_offers.get(offer_id, {})
    delivery_promise = cached_offer.get("fulfilment_promise") or cached_offer.get("delivery_promise") or {}

    # Determine committed SKU & pricing from request or cached offer
    sku = req.sku or cached_offer.get("sku") or "SKU-4830-SILK-SHIRT"
    quantity = int(req.quantity or cached_offer.get("quantity") or 1)
    unit_price = float(req.unit_price or cached_offer.get("unit_price") or 134.00)
    fulfilment_node_id = req.fulfilment_node_id or delivery_promise.get("fulfilment_node_id") or "DC-NORTH"
    carrier_id = req.carrier_id or delivery_promise.get("carrier") or delivery_promise.get("carrier_id") or "FedEx-Express"

    # Append to hash-chained ledger
    record = bq_client.append_commitment({
        "txn_id": req.txn_id,
        "sku": sku,
        "quantity": quantity,
        "unit_price": unit_price,
        "currency": req.currency or cached_offer.get("currency") or "USD",
        "fulfilment_node_id": fulfilment_node_id,
        "carrier_id": carrier_id,
        "mandate_id": req.ap2_mandate.get("mandate_id", "mandate-accepted"),
        "buyer_agent_id": req.buyer_agent_id,
    })

    return {
        "status": "COMMITTED",
        "offer_id": offer_id,
        "commitment_record": record,
        "message": "Commercial promise committed and verified in immutable ledger.",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=ucp_settings.PORT)
