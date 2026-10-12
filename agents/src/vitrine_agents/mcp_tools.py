"""Model Context Protocol (MCP) toolsets for VITRINE ADK agents.

Connects to the three standalone FastMCP microservices via Streamable HTTP (SSE):
  1. `CatalogMCP_Tool`:  mcp-catalog (Port 8090) -> catalog_search, get_sku, get_substitutes, update_attributes
  2. `PromiseMCP_Tool`:  mcp-promise (Port 8091) -> promise_fanout, compute_atp, compute_transit, get_carrier_cutoffs
  3. `CommerceMCP_Tool`: mcp-commerce (Port 8092) -> compute_landed_cost, compute_margin, verify_mandate, append_ledger, verify_chain_integrity
"""

import os
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StreamableHTTPConnectionParams
from vitrine_agents import config

def _normalize_mcp_url(url: str) -> str:
    url = (url or "").rstrip("/")
    return url if url.endswith("/mcp") else f"{url}/mcp"

# MCP Server Streamable HTTP URLs (from config / environment / Cloud Run)
CATALOG_MCP_URL = _normalize_mcp_url(config.MCP_CATALOG_URL)
PROMISE_MCP_URL = _normalize_mcp_url(config.MCP_PROMISE_URL)
COMMERCE_MCP_URL = _normalize_mcp_url(config.MCP_COMMERCE_URL)

# ADK MCP Toolsets (with 30s connection timeout for reliable local handshake)
CatalogMCP_Tool = MCPToolset(
    connection_params=StreamableHTTPConnectionParams(
        url=CATALOG_MCP_URL,
        timeout=30.0,
    ),
)

PromiseMCP_Tool = MCPToolset(
    connection_params=StreamableHTTPConnectionParams(
        url=PROMISE_MCP_URL,
        timeout=30.0,
    ),
)

CommerceMCP_Tool = MCPToolset(
    connection_params=StreamableHTTPConnectionParams(
        url=COMMERCE_MCP_URL,
        timeout=30.0,
    ),
)
