"""Environment-driven settings for VITRINE ADK agents.

Enterprise ADK configuration pattern:
- override=True ensures .env values take precedence over stale shell variables
- Location standardized on us-central1
- Gemini 2.5 Pro for deep reasoning (Critic, Strategist, Trust)
- Gemini 2.5 Flash for high-throughput candidate evaluation (Promise, Negotiator)
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env files with hierarchical precedence:
# 1. Base repository root (Src/.env)
# 2. Agents root (agents/.env)
# 3. Transaction agent specific .env (agents/src/vitrine_agents/transaction/.env) [Highest priority]
_file_path = Path(__file__).resolve()
_transaction_env = _file_path.parent / "transaction" / ".env"
_agents_root = _file_path.parent.parent.parent
_repo_root = _agents_root.parent

for _candidate in [_repo_root / ".env", _agents_root / ".env", _transaction_env]:
    if _candidate.exists():
        load_dotenv(dotenv_path=_candidate, override=True)

PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", os.environ.get("GCP_PROJECT_ID", "gcp-aibuildercup-project"))
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", os.environ.get("GCP_REGION", "us-central1"))
DATASET = os.environ.get("BQ_DATASET", os.environ.get("BQ_DATASET_CATALOG", "vitrine_commerce"))
STAGING_BUCKET = os.environ.get("STAGING_BUCKET", "gs://vitrine-staging-agents")
SERVICE_ACCOUNT = os.environ.get("SERVICE_ACCOUNT", "")
ENABLE_TRACING = os.environ.get("ENABLE_TRACING", "true").lower() == "true"

MCP_CATALOG_URL = os.environ.get("MCP_CATALOG_URL", "https://vitrine-mcp-catalog-gcks46p4tq-uc.a.run.app/mcp")
MCP_PROMISE_URL = os.environ.get("MCP_PROMISE_URL", "https://vitrine-mcp-promise-gcks46p4tq-uc.a.run.app/mcp")
MCP_COMMERCE_URL = os.environ.get("MCP_COMMERCE_URL", "https://vitrine-mcp-commerce-gcks46p4tq-uc.a.run.app/mcp")

MODEL_REASONING = os.environ.get("MODEL_REASONING", os.environ.get("MODEL_PIN_PRIMARY", "gemini-2.5-flash"))
MODEL_FAST = os.environ.get("MODEL_FAST", os.environ.get("MODEL_PIN_FAST", "gemini-2.5-flash"))

# Ensure standard Google GenAI and Vertex AI environment variables are synchronized
os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT
os.environ["GCP_PROJECT_ID"] = PROJECT
os.environ["GOOGLE_CLOUD_LOCATION"] = LOCATION
os.environ["GCP_REGION"] = LOCATION
if not os.environ.get("GEMINI_API_KEY"):
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "true"

def describe() -> str:
    """One-line summary of resolved settings for startup logs."""
    return (
        f"project={PROJECT} location={LOCATION} dataset={DATASET} "
        f"models={MODEL_REASONING}/{MODEL_FAST}"
    )
