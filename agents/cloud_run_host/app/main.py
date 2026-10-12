"""FastAPI Agent Host (vitrine-agents-host) for Cloud Run in us-central1.

Hosts:
  1. Catalogue Enrichment Agent (ag-catalog-enricher / ag-attribute-inferencer)
  2. Agent Trust Analyst (ag-agent-trust-analyst)
  3. Autonomous Supplier Risk Sentinel (sent-supplier-risk-watch)
"""

import os
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field

from app.trust_analyst import AgentTrustAnalyst, TrustAnalysisResult
from app.catalog_enricher import CatalogEnricherAgent, EnrichedAttribute
from app.attribute_inferencer import AttributeInferencerAgent, InferredAttribute
from app.supplier_risk import SupplierRiskSentinel, SupplierRiskEvent

app = FastAPI(
    title="VITRINE Agents Host",
    version="1.0.0",
    description="Cloud Run agent host for autonomous catalogue enrichment, AP2 trust analysis, and supplier risk sentinels.",
)

# Instantiate singletons for the hosted agents
trust_analyst = AgentTrustAnalyst()
catalog_enricher = CatalogEnricherAgent()
attribute_inferencer = AttributeInferencerAgent()
supplier_sentinel = SupplierRiskSentinel()

# --- Request / Response Models ---

class ScreenBuyerRequest(BaseModel):
    buyer_agent_id: str
    mandate_id: Optional[str] = None
    mandate_nonce: Optional[str] = None
    request_velocity_per_min: int = 1

class EnrichChunkRequest(BaseModel):
    skus: List[str] = Field(default_factory=lambda: ["SKU-4829-SILK-BLOUSE"])
    include_inferencing: bool = True

class SentinelRunRequest(BaseModel):
    supplier_id: str = "SUP-MILAN-SILK-01"
    signals: List[Dict[str, Any]] = Field(
        default_factory=lambda: [
            {"source": "reuters.com", "headline": "Northern Italy port slowdown"},
            {"source": "lloydsloadinglist.com", "headline": "Genoa logistics freight congestion"},
        ]
    )
    affected_skus: Optional[List[str]] = None

# --- Endpoints ---

@app.get("/", status_code=status.HTTP_200_OK)
@app.get("/health", status_code=status.HTTP_200_OK)
@app.get("/healthz", status_code=status.HTTP_200_OK)
def healthz():
    return {
        "status": "ok",
        "service": "vitrine-agents-host",
        "region": os.environ.get("GCP_REGION", "us-central1"),
    }

@app.get("/agents")
def list_hosted_agents():
    return {
        "agents": [
            {
                "id": "ag-agent-trust-analyst",
                "role": "Deep Fraud & AP2 Mandate Security Analyst",
                "runtime": "cloud-run",
                "endpoint": "/trust/screen",
            },
            {
                "id": "ag-catalog-enricher",
                "role": "Multimodal Catalogue Attribute Extraction",
                "runtime": "cloud-run",
                "endpoint": "/enrich/chunk",
            },
            {
                "id": "ag-attribute-inferencer",
                "role": "Analog Clustering & Attribute Inference",
                "runtime": "cloud-run",
                "endpoint": "/enrich/chunk",
            },
            {
                "id": "sent-supplier-risk-watch",
                "role": "Autonomous Disruption Sentinel (Two-Source Rule)",
                "runtime": "cloud-run",
                "endpoint": "/sentinels/supplier-risk/run",
            },
        ]
    }

# 1. Trust Analyst Endpoint
@app.post("/trust/screen", response_model=TrustAnalysisResult)
async def screen_buyer(req: ScreenBuyerRequest):
    """Screen an incoming buyer agent and AP2 mandate against cryptographic replay and high-velocity probing."""
    result = trust_analyst.screen_buyer_agent(
        buyer_agent_id=req.buyer_agent_id,
        mandate_id=req.mandate_id,
        mandate_nonce=req.mandate_nonce,
        request_velocity_per_min=req.request_velocity_per_min,
    )
    return result

# 2. Catalogue Enrichment & Attribute Inferencing Endpoint
@app.post("/enrich/chunk")
async def enrich_chunk(req: EnrichChunkRequest):
    """Enriches a batch of SKUs using multimodal extraction and analog inference."""
    enriched = await catalog_enricher.enrich_skus(req.skus)
    
    inferred = []
    if req.include_inferencing:
        for sku in req.skus:
            inferred.extend(attribute_inferencer.infer_missing_attributes(sku=sku))

    return {
        "status": "COMPLETED",
        "processed_skus": len(req.skus),
        "enriched_attributes": [a.model_dump() for a in enriched],
        "inferred_attributes": [i.model_dump() for i in inferred],
        "summary": f"Enriched {len(req.skus)} SKUs with {len(enriched)} multimodal attributes and {len(inferred)} inferred attributes.",
    }

# 3. Sentinel Runner Endpoint
@app.post("/sentinels/supplier-risk/run", response_model=SupplierRiskEvent)
async def run_supplier_sentinel(req: SentinelRunRequest):
    """Executes the Supplier Risk Sentinel sweep applying the strict two-source corroboration rule."""
    event = supplier_sentinel.evaluate_supplier_signals(
        supplier_id=req.supplier_id,
        signals=req.signals,
        affected_skus=req.affected_skus,
    )
    return event

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
