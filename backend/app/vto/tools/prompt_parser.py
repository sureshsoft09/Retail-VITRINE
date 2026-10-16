"""Tool 1: parse_product_request(user_prompt)

Parses natural language product requests into structured ProductPreference models using Gemini.
"""

import logging
import json

try:
    from google import genai
    from google.genai import types
except (ImportError, AttributeError):
    genai = None
    types = None

from backend.app.vto.config import settings
from backend.app.vto.models.product import ProductPreference

logger = logging.getLogger(__name__)


def parse_product_request(user_prompt: str) -> ProductPreference:
    """Extracts structured apparel attributes from customer prompt using Gemini.

    Args:
        user_prompt: Natural language text from customer (e.g., "I want a medium yellow round-neck T-shirt").

    Returns:
        ProductPreference object containing extracted attributes.
    """
    logger.info(f"Parsing product request prompt: '{user_prompt}'")

    system_instruction = (
        "You are an expert retail NLP parser. Extract structured garment preferences "
        "from the customer's text request. Normalize sizes to standard uppercase letters (S, M, L, XL, XXL). "
        "Normalize colors to lower case (yellow, blue, black, white, red, green). "
        "Extract categories such as t-shirt, shirt, dress, jacket, hoodie, pants."
    )

    try:
        if genai is None or types is None:
            raise RuntimeError("google-genai SDK not available in local environment")
        # Ensure GOOGLE_APPLICATION_CREDENTIALS or Vertex AI ADC is configured
        client = genai.Client(vertexai=True, project=settings.gcp_project_id, location=settings.gcp_region)

        # Request structured JSON output conforming to ProductPreference schema
        response = client.models.generate_content(
            model=settings.gemini_model_id,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=ProductPreference,
                temperature=0.0,
            ),
        )

        if response.text:
            parsed_data = json.loads(response.text)
            preference = ProductPreference(**parsed_data)
            logger.info(f"Successfully extracted preferences: {preference.model_dump()}")
            return preference

    except Exception as e:
        logger.warning(f"Gemini API parse call failed or offline: {e}. Executing heuristic fallback parser.")

    # Fallback basic NLP parser for local/testing environments without GCP access
    prompt_clean = user_prompt.lower().replace("-", " ")

    category = None
    for cat in ["t shirt", "tshirt", "shirt", "dress", "hoodie", "jacket", "jeans"]:
        if cat in prompt_clean:
            category = "t-shirt" if cat in ["t shirt", "tshirt"] else cat
            break

    requested_size = None
    for s_label, s_code in [
        ("medium", "M"),
        ("small", "S"),
        ("extra large", "XL"),
        ("large", "L"),
        ("xl", "XL"),
        ("s", "S"),
        ("m", "M"),
        ("l", "L"),
    ]:
        if f" {s_label} " in f" {prompt_clean} ":
            requested_size = s_code
            break

    color = None
    for c in ["yellow", "blue", "black", "white", "red", "green", "pink", "navy"]:
        if c in prompt_clean:
            color = c
            break

    neck_type = None
    for n in ["round neck", "v neck", "polo", "crew neck", "collar"]:
        if n in prompt_clean:
            neck_type = "round neck" if "round" in n else ("v-neck" if "v" in n else n)
            break

    sleeve_type = None
    for sl in ["short sleeve", "long sleeve", "sleeveless"]:
        if sl in prompt_clean:
            sleeve_type = sl
            break

    return ProductPreference(
        category=category,
        requested_size=requested_size,
        color=color,
        neck_type=neck_type,
        sleeve_type=sleeve_type,
    )
