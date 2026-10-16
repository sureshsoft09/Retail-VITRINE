"""FastAPI main application entrypoint for Retail Virtual Try-On API studio."""

import logging
import os
from typing import List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response, RedirectResponse

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
from backend.app.vto.api.ucp import router as ucp_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Retail AI Virtual Try-On Studio API",
    description="Conversational shopping & AI virtual try-on powered by Gemini & Vertex AI",
    version="1.0.0",
)

# Register Universal Commerce Protocol (UCP) router
app.include_router(ucp_router)

agent = VirtualTryOnAgent()

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
def read_root():
    """Serves single-page web application UI at root path."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"status": "ONLINE", "message": "Retail Virtual Try-On API is running."}


@app.get("/health")
def health_check():
    """Health check endpoint for GCP Cloud Run / local verification."""
    return {
        "status": "HEALTHY",
        "project_id": settings.gcp_project_id,
        "region": settings.gcp_region,
        "product_bucket": settings.product_bucket,
        "temp_bucket": settings.temp_bucket,
        "output_bucket": settings.output_bucket,
    }


@app.get("/api/products", response_model=List[ProductMetadata])
def list_products():
    """Returns the full list of products from the product catalog, enriched with direct streaming image URLs."""
    try:
        from backend.app.vto.services.firestore_service import FirestoreService
        firestore_service = FirestoreService()
        products = firestore_service.list_all_products()
        return agent._enrich_product_image_urls(products)
    except Exception as e:
        logger.error(f"Error listing catalog products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


_gcs_product_client = None
_product_image_cache = {}


@app.get("/api/products/{product_id}/image")
def get_product_image(product_id: str):
    """Streams the exact product image file uploaded in the Google Cloud Storage product bucket.
    If not found in the bucket, returns a 404 so UI displays 'No image found'."""
    global _gcs_product_client

    # Check in-memory cache for fast repeated responses
    if product_id in _product_image_cache:
        img_bytes, media_type = _product_image_cache[product_id]
        return Response(
            content=img_bytes,
            media_type=media_type,
            headers={"Cache-Control": "public, max-age=3600"},
        )

    try:
        from google.cloud import storage

        if _gcs_product_client is None:
            _gcs_product_client = storage.Client(project=settings.gcp_project_id)

        bucket = _gcs_product_client.bucket(settings.product_bucket)

        # Check standard possible object paths in product bucket
        candidate_paths = [
            f"products/{product_id}.jpg",
            f"products/{product_id}.jpeg",
            f"products/{product_id}.png",
            f"products/{product_id}.webp",
            f"{product_id}.jpg",
            f"{product_id}.jpeg",
            f"{product_id}.png",
        ]

        for path in candidate_paths:
            blob = bucket.blob(path)
            if blob.exists(timeout=3.0):
                img_bytes = blob.download_as_bytes(timeout=5.0)
                if img_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
                    media_type = "image/png"
                elif img_bytes.startswith(b"\xff\xd8\xff"):
                    media_type = "image/jpeg"
                elif img_bytes.startswith(b"RIFF") and b"WEBP" in img_bytes[:16]:
                    media_type = "image/webp"
                else:
                    media_type = "image/png" if path.endswith(".png") else "image/jpeg"

                _product_image_cache[product_id] = (img_bytes, media_type)
                return Response(
                    content=img_bytes,
                    media_type=media_type,
                    headers={"Cache-Control": "public, max-age=3600"},
                )
    except Exception as e:
        logger.error(f"Error streaming product image for '{product_id}' from GCS: {e}")

    # Explicit 404: Never serve synthetic drawings or external mock photos
    raise HTTPException(
        status_code=404,
        detail=f"No image found for product '{product_id}' in storage bucket gs://{settings.product_bucket}",
    )


@app.post("/sessions", response_model=SessionResponse)
def create_session():
    """Endpoint 1: Create a new try-on session."""
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


@app.post("/sessions/{session_id}/message", response_model=ChatMessageResponse)
def handle_chat_message(session_id: str, request: ChatMessageRequest):
    """Endpoint 2: Send a natural language product search message."""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    try:
        response = agent.process_customer_message(session, request.message)
        session_service.save_session(session)
        return response
    except Exception as e:
        logger.error(f"Error handling chat message: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{session_id}/select", response_model=ChatMessageResponse)
def select_product(session_id: str, request: SelectProductRequest):
    """Endpoint 3: Select a product by 1-based index or product ID."""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    try:
        response = agent.select_product(session, request.selection_index)
        session_service.save_session(session)
        return response
    except Exception as e:
        logger.error(f"Error selecting product: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{session_id}/photo", response_model=PhotoUploadResponse)
@app.post("/sessions/{session_id}/upload_photo", response_model=PhotoUploadResponse)
def upload_customer_photo(session_id: str, file: UploadFile = File(...)):
    """Endpoint 4: Upload customer full-body / upper-body photo."""
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


@app.post("/sessions/{session_id}/generate", response_model=TryOnResultResponse)
def generate_try_on(session_id: str, request: GenerateTryOnRequest):
    """Endpoint 5: Trigger Virtual Try-On generation after customer confirmation."""
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


@app.get("/sessions/{session_id}/result", response_model=TryOnResultResponse)
def get_try_on_result(session_id: str):
    """Endpoint 6: Retrieve generated try-on result and short-lived signed URL."""
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


@app.delete("/sessions/{session_id}", response_model=CleanupResponse)
def delete_session(session_id: str):
    """Endpoint 7: Clean up session state and purge temporary GCS assets."""
    session = session_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found.")

    response = agent.cleanup_session(session_id)
    session_service.delete_session(session_id)
    return response
