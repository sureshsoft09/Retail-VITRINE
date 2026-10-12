"""Application configuration using pydantic-settings.

Standardized Region: us-central1
"""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

_backend_dir = Path(__file__).resolve().parent.parent.parent
_env_file = _backend_dir / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_env_file) if _env_file.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # GCP Core
    GCP_PROJECT_ID: str = "gcp-aibuildercup-project"
    GCP_REGION: str = "us-central1"
    STAGING_BUCKET: str = "gs://vitrine-staging-agents"

    # Services
    BFF_URL: str = "http://localhost:8080"
    CORE_API_URL: str = "http://localhost:8081"
    UCP_URL: str = "http://localhost:8082"
    AGENTS_HOST_URL: str = "https://vitrine-agents-host-285078287322.us-central1.run.app"

    # Vertex AI Agent Engine Deployed Resource
    AGENT_ENGINE_RESOURCE_NAME: str = "projects/285078287322/locations/us-central1/reasoningEngines/4500934686062673920"

    # BigQuery & Firestore
    BQ_DATASET_CATALOG: str = "vitrine_dataset"
    BQ_DATASET_LEDGER: str = "vitrine_dataset"
    BQ_CONNECTION_ID: str = "us-central1.gemini_conn"
    FIRESTORE_DATABASE: str = "(default)"

    # Autonomy Policy & Guardrails
    AUTONOMY_DISCOUNT_CAP_PCT: float = 15.0
    AUTONOMY_MARGIN_FLOOR_PCT: float = 18.0
    AUTONOMY_MAX_ORDER_VALUE_USD: float = 250.0
    MAX_TRANSACTION_TURNS: int = 5
    GLOBAL_KILL_SWITCH: bool = False

settings = Settings()
