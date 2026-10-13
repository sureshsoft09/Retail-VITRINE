"""Configuration for vitrine-ucp service."""

import os
from pathlib import Path
from pydantic_settings import BaseSettings

_env_path = Path(__file__).resolve().parent / ".env"

class UCPSettings(BaseSettings):
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "gcp-aibuildercup-project")
    PROJECT_ID: str = os.getenv("PROJECT_ID", "gcp-aibuildercup-project")
    GCP_REGION: str = os.getenv("GCP_REGION", "us-central1")
    AGENT_ENGINE_RESOURCE_NAME: str = os.getenv(
        "AGENT_ENGINE_RESOURCE_NAME",
        "projects/285078287322/locations/us-central1/reasoningEngines/4500934686062673920",
    )
    AGENTS_HOST_URL: str = os.getenv(
        "AGENTS_HOST_URL",
        "https://vitrine-agents-host-285078287322.us-central1.run.app",
    )
    BQ_DATASET_CATALOG: str = os.getenv("BQ_DATASET_CATALOG", "vitrine_dataset")
    BQ_DATASET_LEDGER: str = os.getenv("BQ_DATASET_LEDGER", "vitrine_dataset")
    FIRESTORE_DATABASE: str = os.getenv("FIRESTORE_DATABASE", "(default)")
    PORT: int = int(os.getenv("PORT", 8082))
    UCP_VERSION: str = os.getenv("UCP_VERSION", "1.0.0")
    UCP_MERCHANT_NAME: str = os.getenv("UCP_MERCHANT_NAME", "VITRINE Retailer Prototype")

    class Config:
        env_file = str(_env_path) if _env_path.exists() else None
        extra = "allow"

ucp_settings = UCPSettings()
