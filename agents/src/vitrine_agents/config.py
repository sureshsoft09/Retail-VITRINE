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

ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT", "vitrine-hackathon-us-central1")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
DATASET = os.environ.get("BQ_DATASET", "vitrine_commerce")
STAGING_BUCKET = os.environ.get("STAGING_BUCKET", "vitrine-staging-bucket-us-central1")
SERVICE_ACCOUNT = os.environ.get("SERVICE_ACCOUNT", "")
ENABLE_TRACING = os.environ.get("ENABLE_TRACING", "true").lower() == "true"

MODEL_REASONING = os.environ.get("MODEL_REASONING", "gemini-2.5-pro")
MODEL_FAST = os.environ.get("MODEL_FAST", "gemini-2.5-flash")

def describe() -> str:
    """One-line summary of resolved settings for startup logs."""
    return (
        f"project={PROJECT} location={LOCATION} dataset={DATASET} "
        f"models={MODEL_REASONING}/{MODEL_FAST}"
    )
