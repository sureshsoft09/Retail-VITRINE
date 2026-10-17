"""FastAPI response payload Pydantic models."""

from typing import List, Optional
from pydantic import BaseModel, Field

from backend.app.vto.models.product import ProductMetadata

AI_FIT_DISCLAIMER = (
    "Disclaimer: The generated image is an AI visualization intended for visual reference only. "
    "It does not guarantee physical garment fit or texture. Garment sizing and fit can vary by product, brand, and fabric."
)


class SessionResponse(BaseModel):
    """Session initialization response."""

    session_id: str
    state: str
    message: str


class ChatMessageResponse(BaseModel):
    """Chat message interaction response."""

    session_id: str
    state: str
    message: str = Field(default="", description="Agent text response message.")
    agent_message: str = Field(default="", description="Alias agent text message.")
    matching_products: List[ProductMetadata] = Field(default_factory=list)
    products: List[ProductMetadata] = Field(default_factory=list)
    missing_attributes: List[str] = Field(default_factory=list)

    def model_post_init(self, __context):
        if not self.message and self.agent_message:
            self.message = self.agent_message
        elif not self.agent_message and self.message:
            self.agent_message = self.message

        if not self.matching_products and self.products:
            self.matching_products = self.products
        elif not self.products and self.matching_products:
            self.products = self.matching_products


class PhotoUploadResponse(BaseModel):
    """Photo upload and validation response."""

    session_id: str
    status: str = "VALIDATED"
    is_valid: bool = True
    message: str = ""
    person_image_gcs_uri: Optional[str] = None
    gcs_uri: Optional[str] = None

    def model_post_init(self, __context):
        if self.status == "REJECTED":
            self.is_valid = False
        if not self.gcs_uri and self.person_image_gcs_uri:
            self.gcs_uri = self.person_image_gcs_uri
        elif not self.person_image_gcs_uri and self.gcs_uri:
            self.person_image_gcs_uri = self.gcs_uri


class TryOnResultResponse(BaseModel):
    """Virtual Try-On generation result response."""

    session_id: str
    status: str = "COMPLETED"
    product_id: Optional[str] = None
    selected_product_id: Optional[str] = None
    try_on_image_url: Optional[str] = None
    signed_image_url: Optional[str] = None
    disclaimer: str = AI_FIT_DISCLAIMER
    recommended_size: Optional[str] = "M"
    fit_note: Optional[str] = ""
    size_breakdown: Optional[dict] = None
    message: str = ""

    def model_post_init(self, __context):
        if not self.try_on_image_url and self.signed_image_url:
            self.try_on_image_url = self.signed_image_url
        elif not self.signed_image_url and self.try_on_image_url:
            self.signed_image_url = self.try_on_image_url

        if not self.product_id and self.selected_product_id:
            self.product_id = self.selected_product_id
        elif not self.selected_product_id and self.product_id:
            self.selected_product_id = self.product_id


class CleanupResponse(BaseModel):
    """Session resource deletion cleanup response."""

    session_id: str
    status: str
    message: str
