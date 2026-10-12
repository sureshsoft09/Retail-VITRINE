"""MCP Catalog Server (mcp-catalog).

Standardized Region: us-central1
Port: 8090
Built with FastMCP exposing Model Context Protocol over streamable-http at /mcp.
"""

import asyncio
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

mcp = FastMCP("vitrine-catalog")

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
# Health & Status Helpers
# ------------------------------------------------------------------------------

def healthz() -> Dict[str, Any]:
    return {"status": "ok", "server": "mcp-catalog", "region": "us-central1"}

def root_info() -> Dict[str, Any]:
    return {
        "service": "mcp-catalog",
        "framework": "FastMCP",
        "status": "ONLINE",
        "description": "VITRINE MCP Catalogue Service",
        "mcp_endpoint": "/mcp",
        "tools": [
            "catalog_search",
            "get_sku",
            "get_substitutes",
            "update_attributes",
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
def catalog_search(
    query: Optional[str] = None,
    mode: str = "enriched",
    min_confidence: float = 0.7,
    required_attributes: Optional[Dict[str, str]] = None,
    x_agent_id: Optional[str] = None,
    req: Optional[SearchRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Searches catalogue matching structured and multimodal attributes."""
    if isinstance(query, SearchRequest):
        req = query
    if req is not None:
        q_str = req.query.lower()
        search_mode = req.mode
    else:
        q_str = (query or "").lower()
        search_mode = mode

    matches = []
    for sku, product in CATALOGUE_STORE.items():
        if search_mode == "raw":
            if q_str in product["title"].lower() or any(
                q_str in str(v).lower() for v in product["raw_attributes"].values() if v != "— not captured"
            ):
                matches.append(product)
        else:
            title_match = q_str in product["title"].lower()
            attr_match = any(
                q_str in attr["value"].lower() for attr in product["enriched_attributes"].values()
            )
            if title_match or attr_match:
                matches.append(product)

    return {
        "status": "SUCCESS",
        "count": len(matches),
        "results": matches,
        "mode_used": search_mode,
    }

@mcp.tool()
def get_sku(
    sku: Optional[str] = None,
    x_agent_id: Optional[str] = None,
    req: Optional[GetSkuRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Fetches complete SKU detail with multimodal provenance."""
    if isinstance(sku, GetSkuRequest):
        req = sku
    target_sku = req.sku if req is not None else sku

    product = CATALOGUE_STORE.get(target_sku or "")
    if not product:
        raise HTTPException(status_code=404, detail=f"SKU '{target_sku}' not found in catalogue.")
    return {
        "status": "SUCCESS",
        "sku_data": product,
    }

@mcp.tool()
def get_substitutes(
    sku: Optional[str] = None,
    target_attributes: Optional[Dict[str, str]] = None,
    x_agent_id: Optional[str] = None,
    req: Optional[SubstitutesRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Traverses substitution graph to locate compliant replacement SKUs."""
    if isinstance(sku, SubstitutesRequest):
        req = sku
    target_sku = req.sku if req is not None else sku

    product = CATALOGUE_STORE.get(target_sku or "")
    if not product:
        raise HTTPException(status_code=404, detail=f"SKU '{target_sku}' not found.")

    sub_skus = product.get("substitutes", [])
    substitutes = [CATALOGUE_STORE[s] for s in sub_skus if s in CATALOGUE_STORE]

    return {
        "status": "SUCCESS",
        "original_sku": target_sku,
        "substitute_count": len(substitutes),
        "substitutes": substitutes,
    }

@mcp.tool()
def update_attributes(
    sku: Optional[str] = None,
    attributes: Optional[Dict[str, Any]] = None,
    x_agent_id: Optional[str] = None,
    req: Optional[UpdateAttributesRequest] = None,
) -> Dict[str, Any]:
    """MCP Tool: Ingests multimodal extracted attributes (restricted to enrichment agent)."""
    if isinstance(sku, UpdateAttributesRequest):
        req = sku
    target_sku = req.sku if req is not None else sku
    target_attrs = req.attributes if req is not None else (attributes or {})

    # Authorization boundary check: Trust Analyst cannot write catalog attributes
    agent_str = x_agent_id if isinstance(x_agent_id, str) else None
    if agent_str and "trust" in agent_str.lower():
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Trust Analyst has zero catalog write permissions.",
        )

    product = CATALOGUE_STORE.get(target_sku or "")
    if not product:
        raise HTTPException(status_code=404, detail=f"SKU '{target_sku}' not found.")

    product["enriched_attributes"].update(target_attrs)
    return {
        "status": "UPDATED",
        "sku": target_sku,
        "attribute_count": len(product["enriched_attributes"]),
    }

# ------------------------------------------------------------------------------
# Entrypoint
# ------------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8090))
    mcp.run(
        transport="streamable-http",
        host="0.0.0.0",
        port=port,
    )
