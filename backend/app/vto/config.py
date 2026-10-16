"""Configuration management for the Retail Virtual Try-On Agent.

Loads application configuration from environment variables or .env file using Pydantic Settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings."""

    gcp_project_id: str = "gcp-aibuildercup-project"
    gcp_region: str = "us-central1"

    # Private Cloud Storage Bucket Names
    product_bucket: str = "demo-product-bucket"
    temp_bucket: str = "demo-temp-customer-bucket"
    output_bucket: str = "demo-output-tryon-bucket"

    # Firestore Database Collection
    firestore_collection: str = "products"

    # Gemini & Virtual Try-On Models
    gemini_model_id: str = "gemini-2.5-flash"
    try_on_model_id: str = "virtual-try-on-001"
    try_on_person_generation: str = "allow_all"

    # Application & Image Security Constraints
    max_image_size_mb: int = 10
    signed_url_ttl_seconds: int = 900  # 15 minutes TTL for secure URLs
    delete_temp_on_cleanup: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


# Global singleton instance
settings = Settings()
