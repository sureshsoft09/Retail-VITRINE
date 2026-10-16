"""Session state model for tracking conversational try-on workflow."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

from backend.app.vto.models.product import ProductMetadata, ProductPreference


class SessionState(str, Enum):
    """Workflow state transitions for Virtual Try-On session."""

    AWAITING_PRODUCT_REQUEST = "AWAITING_PRODUCT_REQUEST"
    AWAITING_PRODUCT_SELECTION = "AWAITING_PRODUCT_SELECTION"
    AWAITING_PERSON_PHOTO = "AWAITING_PERSON_PHOTO"
    AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION"
    COMPLETED = "COMPLETED"


class SessionData(BaseModel):
    """In-memory or persisted customer try-on session model."""

    session_id: str = Field(..., description="Unique UUID for customer session")
    state: SessionState = Field(default=SessionState.AWAITING_PRODUCT_REQUEST)
    preferences: Optional[ProductPreference] = Field(None, description="Extracted garment preferences")
    matching_products: List[ProductMetadata] = Field(default_factory=list, description="Search results from catalogue")
    selected_product: Optional[ProductMetadata] = Field(None, description="Product selected by customer")
    person_image_gcs_uri: Optional[str] = Field(None, description="Private GCS path to validated person photo")
    generated_image_gcs_uri: Optional[str] = Field(None, description="Private GCS path to output try-on image")
    generated_image_signed_url: Optional[str] = Field(None, description="Short-lived authenticated download URL")
    conversation_history: List[dict] = Field(default_factory=list, description="Turn-by-turn chat history")

    @property
    def product_preference(self) -> Optional[ProductPreference]:
        return self.preferences

    @product_preference.setter
    def product_preference(self, val: Optional[ProductPreference]):
        self.preferences = val
