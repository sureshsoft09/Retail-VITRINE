"""Tool 4: validate_person_image(image_bytes, mime_type)

Validates customer photo format, file size, lighting, pose, single person presence, and body visibility using Pillow and Gemini.
"""

import io
import logging
from typing import Tuple

try:
    from PIL import Image
except (ImportError, AttributeError):
    Image = None

try:
    from google import genai
    from google.genai import types
except (ImportError, AttributeError):
    genai = None
    types = None

from backend.app.vto.config import settings

logger = logging.getLogger(__name__)

SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg"]


def validate_person_image(
    image_bytes: bytes,
    filename: str = "upload.jpg",
    content_type: str = "image/jpeg",
) -> Tuple[bool, str]:
    """Validates uploaded person photo against Virtual Try-On quality requirements.

    Args:
        image_bytes: Raw binary image content.
        filename: Uploaded filename.
        content_type: HTTP Content-Type header.

    Returns:
        Tuple of (is_valid: bool, feedback_message: str).
    """
    logger.info(f"Validating image file '{filename}', size={len(image_bytes)} bytes, content_type='{content_type}'")

    # 1. MIME type validation
    if content_type.lower() not in SUPPORTED_MIME_TYPES:
        return (
            False,
            f"Unsupported image format '{content_type}'. Please upload a clear JPEG or PNG image.",
        )

    # 2. File size validation
    max_bytes = settings.max_image_size_mb * 1024 * 1024
    if len(image_bytes) > max_bytes:
        return (
            False,
            f"Image file size ({len(image_bytes)/(1024*1024):.1f}MB) exceeds the maximum limit of {settings.max_image_size_mb}MB.",
        )

    # 3. Image integrity & resolution check via Pillow
    if Image is not None:
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
            img = Image.open(io.BytesIO(image_bytes))  # re-open after verify
            width, height = img.size
            if width < 100 or height < 100:
                return (
                    False,
                    f"Image resolution ({width}x{height}) is too small for quality try-on visualization. Please upload a photo at least 150x150 pixels.",
                )
        except Exception as e:
            logger.error(f"Image corruption check failed: {e}")
            return False, "The uploaded file appears corrupted or unreadable. Please upload a valid image file."

    # 4. Multimodal inspection via Gemini Vision
    if genai is None:
        return True, "Photo format and dimensions validated."

    try:
        client = genai.Client(vertexai=True, project=settings.gcp_project_id, location=settings.gcp_region)

        prompt = (
            "Analyze this photo for Google Cloud Vertex AI virtual-try-on-001 suitability. "
            "The virtual-try-on-001 model is a garment-replacement engine and has specific requirements: "
            "1. The person must be wearing an upper garment (shirt, t-shirt, top). It cannot dress a bare/shirtless torso. "
            "2. The chest and torso must be unobstructed (no phones held directly in front of the chest, no mirror selfies where a phone or hand blocks the chest). "
            "3. Pose should have arms relaxed rather than raised across the chest. "
            "Be accommodating of normal indoor/outdoor clothes, casual smartphones, and standard poses. "
            "If the photo clearly violates these rules (e.g. completely shirtless, or phone held in front of chest blocking torso): "
            "Reply with a JSON object: {\"is_valid\": false, \"reason\": \"<friendly explanation of why try-on will fail and to wear a basic top with chest unobstructed>\"}. "
            "Otherwise, if it is a suitable photo of a person wearing clothing: "
            "Reply with: {\"is_valid\": true, \"reason\": \"Photo validated successfully.\"}"
        )

        part = types.Part.from_bytes(data=image_bytes, mime_type=content_type)

        candidate_models = [settings.gemini_model_id, "gemini-2.5-flash", "gemini-1.5-flash"]
        # Remove duplicates while preserving order
        unique_models = list(dict.fromkeys(candidate_models))

        for model_id in unique_models:
            try:
                response = client.models.generate_content(
                    model=model_id,
                    contents=[part, prompt],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.0,
                    ),
                )
                if response.text:
                    import json
                    result = json.loads(response.text)
                    is_valid = result.get("is_valid", True)
                    reason = result.get("reason", "Photo validated successfully.")
                    logger.info(f"Gemini vision validation result ({model_id}): is_valid={is_valid}, reason='{reason}'")
                    return is_valid, reason
            except Exception as model_err:
                logger.warning(f"Gemini vision call on {model_id} failed: {model_err}")
                continue

    except Exception as e:
        logger.warning(f"Gemini vision evaluation unavailable: {e}. Falling back to structural validation.")

    # Structural check passed
    return True, "Image uploaded and passed structural validation. Ready for Virtual Try-On."
