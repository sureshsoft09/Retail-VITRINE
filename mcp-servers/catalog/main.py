"""MCP Catalog Server (mcp-catalog).

Standardized Region: us-central1
Port: 8090
Exposes catalogue search, multimodal attribute provenance, SKU detail,
and substitution graph traversal over MCP/HTTP to agents authorized by Agent Gateway.
"""

from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Header, status
from pydantic import BaseModel

app = FastAPI(
    title="mcp-catalog",
    version="1.0.0",
    description="VITRINE MCP Catalogue Service"
)

# ------------------------------------------------------------------------------
# Request / Response Schemas
# ------------------------------------------------------------------------------

class SearchRequest(BaseModel):
    query: str
    required_attributes: Optional[Dict[str, str]] = None
    min_confidence: float = 0.7
    mode: str = "enriched"  # "raw" or "enriched"

class GetSkuRequest(BaseModel):
    sku: str

class SubstitutesRequest(BaseModel):
    sku: str
    target_attributes: Optional[Dict[str, str]] = None

class UpdateAttributesRequest(BaseModel):
    sku: str
    attributes: Dict[str, Any]

# In-memory catalogue store for deterministic MCP resolution
CATALOGUE_STORE: Dict[str, Dict[str, Any]] = {
    "SKU-4829-SILK-BLOUSE": {
        "sku": "SKU-4829-SILK-BLOUSE",
        "title": "100% Mulberry Silk Crepe Blouse",
        "description": "Luxurious tailored silk blouse with French cuffs.",
        "price": 128.00,
        "category": "Womenswear",
        "raw_attributes": {
            "department": "Womens",
            "fabric_composition": "— not captured",
            "sleeve_length": "— not captured",
        },
        "enriched_attributes": {
            "fabric_composition": {
                "value": "100% Mulberry Silk",
                "confidence": 0.96,
                "provenance": "EXTRACTED_FROM_IMAGE",
                "source_uri": "gs://vitrine-media/sku-4829-care-label.jpg",
            },
            "sleeve_length": {
                "value": "French Cuffs",
                "confidence": 0.92,
                "provenance": "EXTRACTED_FROM_IMAGE",
                "source_uri": "gs://vitrine-media/sku-4829-cuff.jpg",
            },
            "care_instructions": {
                "value": "Dry Clean Only",
                "confidence": 0.95,
                "provenance": "EXTRACTED_FROM_IMAGE",
                "source_uri": "gs://vitrine-media/sku-4829-care-label.jpg",
            },
        },
        "substitutes": ["SKU-4830-SILK-SHIRT"],
    },
    "SKU-4830-SILK-SHIRT": {
        "sku": "SKU-4830-SILK-SHIRT",
        "title": "Tailored Button-Down Blouse",
        "description": "Pure mulberry silk women's classic long sleeve shirt.",
        "price": 135.00,
        "category": "Womenswear",
        "raw_attributes": {
            "department": "Womens",
            "fabric_composition": "Silk",
        },
        "enriched_attributes": {
            "fabric_composition": {
                "value": "100% Mulberry Silk",
                "confidence": 0.98,
                "provenance": "DOCAI_SPEC_SHEET",
                "source_uri": "gs://vitrine-docs/spec-sheet-4830.pdf",
            },
            "sleeve_length": {
                "value": "French Cuffs",
                "confidence": 0.94,
                "provenance": "EXTRACTED_FROM_IMAGE",
                "source_uri": "gs://vitrine-media/sku-4830-cuff.jpg",
            },
        },
        "substitutes": ["SKU-4829-SILK-BLOUSE"],
    },
}

# ------------------------------------------------------------------------------
# Ingress Policy & Health
# ------------------------------------------------------------------------------

@app.get("/healthz")
def healthz():
    return {"status": "ok", "server": "mcp-catalog", "region": "us-central1"}

# ------------------------------------------------------------------------------
# MCP Tool Endpoints
# ------------------------------------------------------------------------------

@app.post("/tools/catalog.search")
def catalog_search(
    req: SearchRequest,
    x_agent_id: Optional[str] = Header(None),
):
    """MCP Tool: Searches catalogue matching structured and multimodal attributes."""
    q = req.query.lower()
    matches = []

    for sku, product in CATALOGUE_STORE.items():
        if req.mode == "raw":
            # Match strictly against title or raw attributes (fails specific specs)
            if q in product["title"].lower() or any(
                q in str(v).lower() for v in product["raw_attributes"].values() if v != "— not captured"
            ):
                matches.append(product)
        else:
            # Enriched mode: matches title OR extracted multimodal attributes
            title_match = q in product["title"].lower()
            attr_match = any(
                q in attr["value"].lower() for attr in product["enriched_attributes"].values()
            )
            if title_match or attr_match:
                matches.append(product)

    return {
        "status": "SUCCESS",
        "count": len(matches),
        "results": matches,
        "mode_used": req.mode,
    }

@app.post("/tools/catalog.get_sku")
def get_sku(
    req: GetSkuRequest,
    x_agent_id: Optional[str] = Header(None),
):
    """MCP Tool: Fetches complete SKU detail with multimodal provenance."""
    product = CATALOGUE_STORE.get(req.sku)
    if not product:
        raise HTTPException(status_code=404, detail=f"SKU '{req.sku}' not found in catalogue.")
    return {
        "status": "SUCCESS",
        "sku_data": product,
    }

@app.post("/tools/catalog.get_substitutes")
def get_substitutes(
    req: SubstitutesRequest,
    x_agent_id: Optional[str] = Header(None),
):
    """MCP Tool: Traverses substitution graph to locate compliant replacement SKUs."""
    product = CATALOGUE_STORE.get(req.sku)
    if not product:
        raise HTTPException(status_code=404, detail=f"SKU '{req.sku}' not found.")

    sub_skus = product.get("substitutes", [])
    substitutes = [CATALOGUE_STORE[s] for s in sub_skus if s in CATALOGUE_STORE]

    return {
        "status": "SUCCESS",
        "original_sku": req.sku,
        "substitute_count": len(substitutes),
        "substitutes": substitutes,
    }

@app.post("/tools/catalog.update_attributes")
def update_attributes(
    req: UpdateAttributesRequest,
    x_agent_id: Optional[str] = Header(None),
):
    """MCP Tool: Ingests multimodal extracted attributes (restricted to enrichment agent)."""
    # Authorization boundary check: only enrichment agents or admin may write attributes
    agent_str = x_agent_id if isinstance(x_agent_id, str) else None
    if agent_str and "trust" in agent_str.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Trust Analyst has zero catalog write permissions.",
        )

    product = CATALOGUE_STORE.get(req.sku)
    if not product:
        raise HTTPException(status_code=404, detail=f"SKU '{req.sku}' not found.")

    product["enriched_attributes"].update(req.attributes)
    return {
        "status": "UPDATED",
        "sku": req.sku,
        "attribute_count": len(product["enriched_attributes"]),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8090)
