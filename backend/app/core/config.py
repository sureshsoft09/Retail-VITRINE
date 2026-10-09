"""Application configuration using pydantic-settings.

Standardized Region: us-central1
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # GCP Core
    GCP_PROJECT_ID: str = "vitrine-demo"
    GCP_REGION: str = "us-central1"
    STAGING_BUCKET: str = "gs://vitrine-staging-bucket"

    # Services
    BFF_URL: str = "http://localhost:8080"
    CORE_API_URL: str = "http://localhost:8081"
    UCP_URL: str = "http://localhost:8082"
    AGENTS_HOST_URL: str = "http://localhost:8083"

    # MCP Tool Servers
    MCP_CATALOG_URL: str = "http://localhost:8090"
    MCP_PROMISE_URL: str = "http://localhost:8091"
    MCP_COMMERCE_URL: str = "http://localhost:8092"

    # Vertex AI Agent Engine
    AGENT_ENGINE_RESOURCE_NAME: str = "projects/vitrine-demo/locations/us-central1/reasoningEngines/vitrine-transaction"

    # BigQuery & Firestore
    BQ_DATASET_CATALOG: str = "vitrine_catalog"
    BQ_DATASET_LEDGER: str = "vitrine_ledger"
    BQ_CONNECTION_ID: str = "us-central1.gemini_conn"
    FIRESTORE_DATABASE: str = "(default)"

    # Autonomy Policy & Guardrails
    AUTONOMY_DISCOUNT_CAP_PCT: float = 15.0
    AUTONOMY_MARGIN_FLOOR_PCT: float = 18.0
    AUTONOMY_MAX_ORDER_VALUE_USD: float = 250.0
    MAX_TRANSACTION_TURNS: int = 5
    GLOBAL_KILL_SWITCH: bool = False

settings = Settings()
