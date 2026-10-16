"""Security module for generating short-lived signed URLs for private GCS assets."""

import datetime
import logging

try:
    from google.cloud import storage
except (ImportError, AttributeError):
    storage = None

from backend.app.vto.config import settings

logger = logging.getLogger(__name__)


def generate_signed_url(
    gcs_uri: str,
    expiration_seconds: int = settings.signed_url_ttl_seconds,
) -> str:
    """Generates a short-lived V4 Signed URL for private Cloud Storage object download.

    Args:
        gcs_uri: Full GCS URI (gs://bucket_name/object_path).
        expiration_seconds: Lifetime of signed URL in seconds (default: 900s / 15m).

    Returns:
        HTTPS URL signed for GET operations.
    """
    if not gcs_uri or not gcs_uri.startswith("gs://"):
        raise ValueError(f"Invalid GCS URI provided: {gcs_uri}")

    parts = gcs_uri.replace("gs://", "").split("/", 1)
    if len(parts) != 2:
        raise ValueError(f"Malformed GCS URI: {gcs_uri}")

    bucket_name, object_name = parts[0], parts[1]

    try:
        if storage is None:
            raise RuntimeError("google-cloud-storage not available in local environment")
        client = storage.Client(project=settings.gcp_project_id)
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(object_name)

        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=datetime.timedelta(seconds=expiration_seconds),
            method="GET",
        )
        logger.info(f"Generated V4 signed URL for {gcs_uri} (TTL: {expiration_seconds}s)")
        return signed_url
    except Exception as e:
        logger.warning(
            f"Could not generate live GCS V4 signed URL for {gcs_uri}: {e}."
        )
        raise RuntimeError(f"Could not sign GCS URL: {e}") from e
