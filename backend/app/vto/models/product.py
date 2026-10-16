"""Product metadata and preference Pydantic models."""

from typing import List, Optional
from pydantic import BaseModel, Field


class ProductMetadata(BaseModel):
    """Firestore product document schema."""

    product_id: str = Field(..., description="Unique product identifier (e.g., TSHIRT-1001)")
    product_name: str = Field(..., description="Human-readable product name")
    category: str = Field(..., description="Product category (e.g., t-shirt, shirt, dress)")
    size: List[str] = Field(..., description="Available sizes (e.g., ['S', 'M', 'L', 'XL'])")
    color: str = Field(..., description="Product primary color")
    neck_type: Optional[str] = Field(None, description="Neck design type (e.g., round neck, v-neck, polo)")
    sleeve_type: Optional[str] = Field(None, description="Sleeve length type (e.g., short sleeve, long sleeve)")
    gender_category: Optional[str] = Field("unisex", description="Target gender (men, women, unisex)")
    brand: str = Field(..., description="Brand name")
    price: float = Field(..., description="Retail price")
    currency: str = Field("INR", description="Currency code (e.g., INR, USD)")
    stock_status: str = Field("in_stock", description="Stock status (in_stock, out_of_stock)")
    product_image_gcs_uri: str = Field(..., description="GCS URI for product image (e.g., gs://bucket/products/TSHIRT-1001.jpg)")
    product_image_url: Optional[str] = Field(None, description="Signed or display HTTP URL for frontend image preview")


class ProductPreference(BaseModel):
    """Extracted attributes from customer natural-language query."""

    category: Optional[str] = Field(None, description="Extracted product category")
    requested_size: Optional[str] = Field(None, description="Extracted requested size")
    color: Optional[str] = Field(None, description="Extracted garment color")
    neck_type: Optional[str] = Field(None, description="Extracted neck style")
    sleeve_type: Optional[str] = Field(None, description="Extracted sleeve style")


class ProductSearchResult(BaseModel):
    """Result returned by product search tool."""

    exact_matches: List[ProductMetadata] = Field(default_factory=list)
    alternatives: List[ProductMetadata] = Field(default_factory=list)
    missing_attributes: List[str] = Field(default_factory=list, description="Attributes requested but unavailable in inventory")
    explanation: Optional[str] = Field(None, description="Human-friendly match status explanation")
