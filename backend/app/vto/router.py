"""FastAPI Router for Retail Virtual Try-On Studio.

Integrated with vitrine-bff, supporting:
- Product listing and direct image streaming (GCS with local fallback)
- Session lifecycle (create, chat, select, photo upload, generate, result, cleanup)
- Universal Commerce Protocol (UCP) checkout payload generation
"""

import logging
import os
import io
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Response, status
from pydantic import BaseModel, Field

from backend.app.vto.config import settings
from backend.app.vto.models.product import ProductMetadata
from backend.app.vto.models.requests import ChatMessageRequest, SelectProductRequest, GenerateTryOnRequest
from backend.app.vto.models.responses import (
    SessionResponse,
    ChatMessageResponse,
    PhotoUploadResponse,
    TryOnResultResponse,
    CleanupResponse,
    AI_FIT_DISCLAIMER,
)
from backend.app.vto.services.session_service import session_service
from backend.app.vto.agent import VirtualTryOnAgent
from backend.app.vto.services.firestore_service import FirestoreService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Virtual Try-On"])
agent = VirtualTryOnAgent()
firestore_service = FirestoreService()

_gcs_product_client = None
_product_image_cache: Dict[str, tuple[bytes, str]] = {}
_LOCAL_ASSETS_DIR = Path(__file__).parent / "assets" / "images"


@router.get("/products", response_model=List[ProductMetadata])
def list_vto_products():
    """Returns the full list of products from the product catalog, enriched with direct streaming image URLs."""
    try:
        products = firestore_service.list_all_products()
        # Ensure image urls point to the BFF vto image streaming endpoint
        for prod in products:
            prod.product_image_url = f"/api/vto/products/{prod.product_id}/image"
        return products
    except Exception as e:
        logger.error(f"Error listing catalog products: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/products/{product_id}/image")
def get_vto_product_image(product_id: str):
    """Streams the product image file from GCS or local asset cache."""
    global _gcs_product_client

    # Check in-memory cache
    if product_id in _product_image_cache:
        img_bytes, media_type = _product_image_cache[product_id]
        return Response(
            content=img_bytes,
            media_type=media_type,
            headers={"Cache-Control": "public, max-age=3600"},
        )

    # 1. Attempt streaming from Google Cloud Storage
    try:
        from google.cloud import storage

        if _gcs_product_client is None:
            _gcs_product_client = storage.Client(project=settings.gcp_project_id)

        bucket = _gcs_product_client.bucket(settings.product_bucket)
        candidate_paths = [
            f"products/{product_id}.jpg",
            f"products/{product_id}.jpeg",
            f"products/{product_id}.png",
            f"{product_id}.jpg",
            f"{product_id}.jpeg",
            f"{product_id}.png",
        ]

        for path in candidate_paths:
            blob = bucket.blob(path)
            if blob.exists(timeout=2.0):
                img_bytes = blob.download_as_bytes(timeout=4.0)
                media_type = "image/png" if path.endswith(".png") else "image/jpeg"
                _product_image_cache[product_id] = (img_bytes, media_type)
                return Response(
                    content=img_bytes,
                    media_type=media_type,
                    headers={"Cache-Control": "public, max-age=3600"},
                )
    except Exception as e:
        logger.warning(f"Could not fetch product image for '{product_id}' from GCS: {e}")

    # 2. Local asset fallback
    if _LOCAL_ASSETS_DIR.exists():
        for ext in [".jpg", ".jpeg", ".png"]:
            local_file = _LOCAL_ASSETS_DIR / f"{product_id}{ext}"
            if local_file.exists():
                img_bytes = local_file.read_bytes()
                media_type = "image/png" if ext == ".png" else "image/jpeg"
                _product_image_cache[product_id] = (img_bytes, media_type)
                return Response(
                    content=img_bytes,
                    media_type=media_type,
                    headers={"Cache-Control": "public, max-age=3600"},
                )

    raise HTTPException(
        status_code=404,
        detail=f"No image found for product '{product_id}'",
    )


@router.post("/sessions", response_model=SessionResponse)
def create_session():
    """Initializes a new try-on session."""
    try:
        session = session_service.create_session()
        return SessionResponse(
            session_id=session.session_id,
            state=session.state.value,
            message="Welcome to Retail AI Virtual Try-On! What apparel item are you looking to try on today?",
        )
    except Exception as e:
        logger.error(f"Error creating session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/message", response_model=ChatMessageResponse)
def handle_chat_message(session_id: str, request: ChatMessageRequest):
    """Processes natural language product query."""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    try:
        response = agent.process_customer_message(session, request.message)
        # Ensure image URLs use /api/vto/
        for p in response.matching_products:
            p.product_image_url = f"/api/vto/products/{p.product_id}/image"
        session_service.save_session(session)
        return response
    except Exception as e:
        logger.error(f"Error handling chat message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/select", response_model=ChatMessageResponse)
def select_product(session_id: str, request: SelectProductRequest):
    """Selects a garment by 1-based index or product ID."""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    try:
        response = agent.select_product(session, request.selection_index)
        for p in response.matching_products:
            p.product_image_url = f"/api/vto/products/{p.product_id}/image"
        session_service.save_session(session)
        return response
    except Exception as e:
        logger.error(f"Error selecting product: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/photo", response_model=PhotoUploadResponse)
@router.post("/sessions/{session_id}/upload_photo", response_model=PhotoUploadResponse)
def upload_customer_photo(session_id: str, file: UploadFile = File(...)):
    """Uploads customer photo for fit visualization."""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    try:
        file_bytes = file.file.read()
        content_type = file.content_type or "image/jpeg"
        response = agent.upload_and_validate_photo(
            session, file_bytes, file.filename or "photo.jpg", content_type
        )
        session_service.save_session(session)
        return response
    except Exception as e:
        logger.error(f"Error uploading photo: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/generate", response_model=TryOnResultResponse)
def generate_try_on(session_id: str, request: GenerateTryOnRequest):
    """Triggers Virtual Try-On generation using Vertex AI model."""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    try:
        response = agent.generate_try_on(session, request.confirm)
        session_service.save_session(session)
        return response
    except Exception as e:
        logger.error(f"Error generating try-on: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/result", response_model=TryOnResultResponse)
def get_try_on_result(session_id: str):
    """Retrieves generated try-on visualization result."""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    if not session.generated_image_gcs_uri:
        raise HTTPException(status_code=400, detail="No try-on image has been generated yet for this session.")

    from backend.app.vto.security.image_access import generate_signed_url

    try:
        signed_url = generate_signed_url(session.generated_image_gcs_uri)
    except Exception:
        signed_url = session.generated_image_signed_url or ""

    return TryOnResultResponse(
        session_id=session.session_id,
        status="COMPLETED",
        try_on_image_url=signed_url,
        product_id=session.selected_product.product_id if session.selected_product else "",
        disclaimer=AI_FIT_DISCLAIMER,
        message="Here is your generated virtual try-on visualization!",
    )


@router.delete("/sessions/{session_id}", response_model=CleanupResponse)
def delete_session(session_id: str):
    """Cleans up session state and purges temporary assets."""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    response = agent.cleanup_session(session_id)
    session_service.delete_session(session_id)
    return response


# --- Universal Commerce Protocol (UCP) Integration Endpoints ---

@router.get("/ucp/checkout/{product_id}")
def get_ucp_checkout_payload(product_id: str):
    """Builds a verified UCP order manifest for immediate AP2 mandate checkout."""
    prod = firestore_service.get_product_by_id(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found.")

    unit_price = float(prod.price)
    shipping_cost = 8.50
    total_amount = round(unit_price + shipping_cost, 2)
    checkout_id = f"ucp-chk-{uuid.uuid4().hex[:10]}"

    return {
        "ucp_version": "2026-01-11",
        "checkout_session_id": checkout_id,
        "protocol": "dev.ucp.shopping.checkout",
        "merchant": {
            "merchant_id": "merchant_vitrine_haute_couture",
            "name": "VITRINE Autonomous Commerce",
            "domain": "vitrine-merchant-commerce.web.app",
        },
        "order": {
            "currency": prod.currency or "USD",
            "items": [
                {
                    "item_id": prod.product_id,
                    "title": prod.product_name,
                    "category": prod.category,
                    "unit_price": unit_price,
                    "quantity": 1,
                    "selected_size": prod.size[0] if prod.size else "M",
                    "color": prod.color,
                }
            ],
            "totals": {
                "subtotal": unit_price,
                "shipping": shipping_cost,
                "tax": 0.00,
                "total": total_amount,
            },
        },
        "payment_handler": {
            "handler_id": "google_pay_ap2_mandate",
            "settlement_type": "autonomous_cryptographic_escrow",
            "mandate_state": "READY_FOR_BUYER_SIGNATURE",
        },
        "fulfillment": {
            "carrier": "fedex_express",
            "sla": "Guaranteed 24h Express Delivery",
            "atp_reservation": "CONFIRMED",
        },
    }
