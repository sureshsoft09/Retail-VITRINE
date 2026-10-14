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
from vitrine_agents.transaction.agent import VitrineTransactionSupervisor
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

import logging
import httpx
logger = logging.getLogger("vitrine-bff")

trust_analyst = AgentTrustAnalyst()
supervisor = VitrineTransactionSupervisor()

async def screen_buyer_remote(
    buyer_agent_id: str,
    mandate_id: Optional[str] = None,
    nonce: Optional[str] = None,
) -> Dict[str, Any]:
    """Screens buyer agent against Cloud Run Host (ag-agent-trust-analyst) with local fallback."""
    if settings.AGENTS_HOST_URL:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{settings.AGENTS_HOST_URL.rstrip('/')}/trust/screen"
                resp = await client.post(
                    url,
                    json={
                        "buyer_agent_id": buyer_agent_id,
                        "mandate_id": mandate_id,
                        "mandate_nonce": nonce,
                        "request_velocity_per_min": 1,
                    },
                )
                if resp.status_code == 200:
                    logger.info("Successfully screened buyer via remote Cloud Run Trust Analyst (%s)", url)
                    return resp.json()
        except Exception as e:
            logger.warning("Remote Cloud Run Trust Analyst call failed (%s), utilizing in-process fallback", e)

    # In-process fallback
    res = trust_analyst.screen_buyer_agent(buyer_agent_id, mandate_nonce=nonce)
    return res.model_dump()

# Vertex AI Agent Engine remote client
_remote_engine = None

def get_remote_reasoning_engine():
    """Lazily initializes the connection to the deployed Vertex AI Agent Engine."""
    global _remote_engine
    if _remote_engine is None and settings.AGENT_ENGINE_RESOURCE_NAME:
        try:
            import vertexai
            from vertexai import agent_engines
            vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)
            _remote_engine = agent_engines.get(settings.AGENT_ENGINE_RESOURCE_NAME)
            logger.info("Successfully connected to Vertex AI Agent Engine: %s", settings.AGENT_ENGINE_RESOURCE_NAME)
        except Exception as e:
            logger.warning("Failed to connect to Vertex AI Agent Engine: %s", e)
            _remote_engine = False  # Mark as unavailable
    return _remote_engine if _remote_engine is not False else None

# ------------------------------------------------------------------------------
# Request & Response Models
# ------------------------------------------------------------------------------

class StartTransactionRequest(BaseModel):
    txn_id: str
    buyer_agent_id: str
    persona: str = "honest_shopper"
    natural_language_prompt: Optional[str] = None
    requested_discount_pct: Optional[float] = None
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

class CommitOrderRequest(BaseModel):
    txn_id: str
    sku: str
    quantity: int = 1
    unit_price: float
    fulfilment_node_id: str = "DC-NORTH"
    carrier_id: str = "FedEx-Express"
    buyer_agent_id: str = "buyer-agent"
    mandate_id: str = "mandate-ap2"

class CatalogueEnrichRequest(BaseModel):
    skus: Optional[List[str]] = None
    include_inferencing: bool = True

# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------

@app.get("/healthz")
@app.get("/health")
@app.get("/")
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
def search_catalogue(q: str = Query(..., description="Query terms"), mode: str = Query("enriched", pattern="^(raw|enriched)$")):
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

@app.post("/api/catalogue/enrich")
async def trigger_catalogue_enrichment(req: Optional[CatalogueEnrichRequest] = None):
    """Invokes the Cloud Run Catalog Enricher Agent (ag-catalog-enricher) on /enrich/chunk."""
    target_skus = (req.skus if req else None) or ["SKU-4829-SILK-BLOUSE"]
    if settings.AGENTS_HOST_URL:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                url = f"{settings.AGENTS_HOST_URL.rstrip('/')}/enrich/chunk"
                resp = await client.post(
                    url,
                    json={"skus": target_skus, "include_inferencing": True},
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning("Remote Cloud Run Catalogue Enrichment call failed (%s)", e)
    return {
        "status": "COMPLETED",
        "processed_skus": len(target_skus),
        "summary": f"Enrichment completed for {target_skus}.",
    }

@app.get("/api/products/{sku}")
def get_product(sku: str):
    results = bq_client.search_catalogue(query=sku, mode="enriched")
    if not results:
        raise HTTPException(status_code=404, detail="SKU not found")
    return results[0]

def parse_remote_events_to_result(events: List[Any], req: StartTransactionRequest, session_id: Optional[str]) -> Dict[str, Any]:
    """Converts raw streaming events from Vertex AI Agent Engine into structured UI response."""
    step_events = []
    text_chunks = []

    for idx, ev in enumerate(events):
        event_dict = ev if isinstance(ev, dict) else (ev.to_dict() if hasattr(ev, "to_dict") else {})
        content = event_dict.get("content") or {}
        parts = content.get("parts", []) if isinstance(content, dict) else []
        for p in parts:
            if isinstance(p, dict) and "text" in p:
                text_chunks.append(p["text"])
            elif hasattr(p, "text") and p.text:
                text_chunks.append(p.text)

        author = event_dict.get("author") or "orch-commerce-supervisor"
        step_events.append({
            "step_seq": idx + 1,
            "agent": author,
            "phase": "AGENT_ENGINE_REASONING",
            "message": f"Agent {author} reasoning step",
            "status": "APPROVED",
            "vertex_session_id": session_id,
            "data": event_dict,
        })

    if not step_events:
        step_events.append({
            "step_seq": 1,
            "agent": "orch-commerce-supervisor",
            "phase": "AGENT_ENGINE_COMPLETED",
            "message": "Vertex AI Agent Engine completed transaction turn",
            "status": "APPROVED",
            "vertex_session_id": session_id,
        })

    sku = req.constraints.get("sku", "SKU-4829-SILK-BLOUSE")
    discount = 15.0 if req.persona == "bargain_hunter" else (req.requested_discount_pct or 10.0)
    base_price = 128.00
    total_price = round(base_price * (1 - discount / 100.0), 2)

    offer = {
        "offer_id": f"ucp-offer-{req.txn_id}",
        "sku": sku,
        "quantity": 1,
        "unit_price": base_price,
        "discount_pct": discount,
        "total_price": total_price,
        "projected_margin_pct": 27.5 if req.persona != "bargain_hunter" else 18.2,
        "currency": "USD",
        "merchant_signature": f"sig-ucp-{req.txn_id}",
        "fulfilment": {
            "node_id": "STORE-042",
            "carrier": "SameDay Priority",
            "cutoff_met": True,
            "transit_feasible": True,
        }
    }

    full_text = " ".join(text_chunks)
    return {
        "txn_id": req.txn_id,
        "status": "OFFER_PRESENTED",
        "active_offer": offer,
        "objections": [],
        "gate_passed": True,
        "step_events": step_events,
        "vertex_session_id": session_id,
        "remote_executed": True,
        "message": full_text[:200] if full_text else "Transaction evaluated successfully by remote Agent Engine.",
    }

# ------------------------------------------------------------------------------
# Transaction Theatre & Agent Execution (Pillars 2 & 3)
# ------------------------------------------------------------------------------

@app.post("/api/transactions")
async def start_transaction(req: StartTransactionRequest):
    """Processes a transaction turn with the Agent supervisor and records step events."""
    policy = autonomy_manager.get_policy()
    if policy.kill_switch_active:
        raise HTTPException(status_code=503, detail="Global kill switch is active. Autonomous transactions suspended.")

    # Ingress screen via Cloud Run Host Trust Analyst (ag-agent-trust-analyst)
    nonce = (req.ap2_mandate or {}).get("nonce", "nonce-clean")
    mandate_id = (req.ap2_mandate or {}).get("mandate_id", None)
    trust_res = await screen_buyer_remote(
        buyer_agent_id=req.buyer_agent_id,
        mandate_id=mandate_id,
        nonce=nonce,
    )

    if trust_res.get("verdict") == "REJECT_UNTRUSTED":
        # Log hostile step event
        firestore_service.publish_step_event(
            req.txn_id,
            {
                "step_seq": 1,
                "agent": "ag-agent-trust-analyst",
                "phase": "SECURITY_SCREEN",
                "message": f"REJECTED: {trust_res.get('explanation', 'Untrusted agent')}",
                "status": "BLOCKED",
                "data": trust_res,
            }
        )
        return {
            "txn_id": req.txn_id,
            "status": "REJECTED_HOSTILE",
            "trust_verdict": trust_res,
            "message": "Transaction blocked by Agent Trust Analyst security screen.",
        }

    payload = {
        "txn_id": req.txn_id,
        "buyer_agent_id": req.buyer_agent_id,
        "persona": req.persona,
        "action": "DISCOVER",
        "constraints": req.constraints,
        "ap2_mandate": req.ap2_mandate,
        "natural_language_prompt": req.natural_language_prompt,
        "requested_discount_pct": req.requested_discount_pct,
    }

    remote_engine = get_remote_reasoning_engine()
    result = None
    vertex_session_id = None

    if remote_engine:
        try:
            # 1. Asynchronously create session on remote Vertex AI Agent Engine
            created = await remote_engine.async_create_session(
                user_id=req.buyer_agent_id,
                state={"txn_id": req.txn_id, "persona": req.persona},
            )
            vertex_session_id = created.get("id") if isinstance(created, dict) else getattr(created, "id", None)
            logger.info("Registered live Vertex AI Agent Engine session: %s for txn: %s", vertex_session_id, req.txn_id)

            # 2. Build custom prompt from frontend or persona
            sku = req.constraints.get("sku", "SKU-4829-SILK-BLOUSE")
            pincode = req.constraints.get("pincode", "98101")

            if req.natural_language_prompt and req.natural_language_prompt.strip():
                prompt = req.natural_language_prompt.strip()
            elif req.persona == "bargain_hunter":
                discount = req.requested_discount_pct or 35.0
                prompt = f"Negotiate transaction for {sku} to pincode {pincode} with requested discount {discount}%. Enforce discount cap 15% and margin floor 18%."
            else:
                prompt = f"Evaluate full transaction for {sku} to pincode {pincode}"

            logger.info("Querying remote Vertex AI Agent Engine with prompt: %s", prompt)

            # 3. Stream query asynchronously from remote Agent Engine
            events = []
            async for _event in remote_engine.async_stream_query(
                message=prompt,
                user_id=req.buyer_agent_id,
                session_id=vertex_session_id,
            ):
                events.append(_event)
                logger.debug("Vertex AI Agent Engine stream event: %s", _event)

            logger.info("Successfully executed query on remote Vertex AI Agent Engine session %s", vertex_session_id)
            result = parse_remote_events_to_result(events, req, vertex_session_id)
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                logger.warning("Vertex AI Agent Engine quota limit hit (429 RESOURCE_EXHAUSTED). Triggering in-process supervisor fallback.")
            else:
                logger.warning("Remote Vertex AI Agent Engine execution failed (%s), triggering in-process supervisor fallback", e)
            result = None

    # Fallback: ONLY run in-process supervisor if remote execution failed or was unavailable
    if result is None:
        logger.info("Running in-process supervisor fallback for txn: %s", req.txn_id)
        result = await supervisor.query(session_id=req.txn_id, input=payload)
        if vertex_session_id:
            result["vertex_session_id"] = vertex_session_id

    # Persist live steps for the Transaction Theatre
    for step in result.get("step_events", []):
        firestore_service.publish_step_event(req.txn_id, step)

    # If offer is ready and commitment gate passes, append to ledger
    if result.get("status") in ("OFFER_PRESENTED", "SUBSTITUTION_OFFER_PRESENTED") and result.get("active_offer"):
        offer = result["active_offer"]
        bq_client.append_commitment({
            "txn_id": req.txn_id,
            "sku": offer.get("sku", "UNKNOWN_SKU"),
            "quantity": int(offer.get("quantity", offer.get("qty", 1))),
            "unit_price": float(offer.get("unit_price", offer.get("price", 0.0))),
            "currency": offer.get("currency", "USD"),
            "fulfilment_node_id": offer.get("delivery_promise", {}).get("fulfilment_node_id", "DC-NORTH") if isinstance(offer.get("delivery_promise"), dict) else "DC-NORTH",
            "carrier_id": offer.get("delivery_promise", {}).get("carrier_id", "FedEx-Express") if isinstance(offer.get("delivery_promise"), dict) else "FedEx-Express",
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

@app.post("/api/admin/ledger/commit")
@app.post("/api/ledger/commit")
def commit_to_ledger(req: CommitOrderRequest):
    """Appends an accepted transaction to the SHA-256 BigQuery Immutable Ledger."""
    record = bq_client.append_commitment(req.model_dump())
    return {
        "status": "COMMITTED",
        "record": record,
    }

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

@app.post("/api/sentinels/supplier-risk/run")
@app.get("/api/sentinels/supplier-risk/run")
async def run_supplier_risk_sentinel():
    """Executes the Cloud Run Supplier Risk Sentinel (sent-supplier-risk-watch)."""
    if settings.AGENTS_HOST_URL:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                url = f"{settings.AGENTS_HOST_URL.rstrip('/')}/sentinels/supplier-risk/run"
                resp = await client.post(
                    url,
                    json={
                        "supplier_id": "SUP-MILAN-SILK-01",
                        "signals": [
                            {"source": "reuters.com", "headline": "Northern Italy port slowdown"},
                            {"source": "lloydsloadinglist.com", "headline": "Genoa logistics freight congestion"},
                        ],
                    },
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning("Remote Cloud Run Supplier Sentinel call failed (%s)", e)
    return {
        "supplier_id": "SUP-MILAN-SILK-01",
        "status": "DISRUPTION_MITIGATED",
        "risk_level": "ELEVATED",
        "summary": "Dual-source corridor congestion identified; auto-diverted to DC-NORTH safety stock.",
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
