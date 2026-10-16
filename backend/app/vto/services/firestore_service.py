"""Firestore database service for querying product catalogue."""

import logging
from typing import List, Optional

try:
    from google.cloud import firestore
except (ImportError, AttributeError):
    firestore = None

from backend.app.vto.config import settings
from backend.app.vto.models.product import ProductMetadata

logger = logging.getLogger(__name__)

# Sample realistic fallback dataset used when Firestore is offline or empty
SAMPLE_CATALOGUE = [
    ProductMetadata(
        product_id="TSHIRT-1001",
        product_name="Yellow Crew Neck Essential T-Shirt",
        category="t-shirt",
        size=["S", "M", "L", "XL"],
        color="yellow",
        neck_type="round neck",
        sleeve_type="short sleeve",
        gender_category="unisex",
        brand="Urban Thread Co.",
        price=999.0,
        currency="INR",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/TSHIRT-1001.jpg",
    ),
    ProductMetadata(
        product_id="TSHIRT-1002",
        product_name="Navy Blue V-Neck Slim Fit T-Shirt",
        category="t-shirt",
        size=["S", "M", "L"],
        color="blue",
        neck_type="v-neck",
        sleeve_type="short sleeve",
        gender_category="men",
        brand="AeroStudio",
        price=1199.0,
        currency="INR",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/TSHIRT-1002.jpg",
    ),
    ProductMetadata(
        product_id="TSHIRT-1003",
        product_name="Mustard Yellow Classic Polo Collar T-Shirt",
        category="t-shirt",
        size=["M", "L", "XL"],
        color="yellow",
        neck_type="polo",
        sleeve_type="short sleeve",
        gender_category="men",
        brand="Nordic Polo",
        price=1499.0,
        currency="INR",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/TSHIRT-1003.jpg",
    ),
    ProductMetadata(
        product_id="TSHIRT-1004",
        product_name="Crimson Red Graphic Oversized T-Shirt",
        category="t-shirt",
        size=["S", "M", "L", "XL"],
        color="red",
        neck_type="round neck",
        sleeve_type="short sleeve",
        gender_category="unisex",
        brand="StreetCulture",
        price=1299.0,
        currency="INR",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/TSHIRT-1004.jpg",
    ),
    ProductMetadata(
        product_id="TSHIRT-1005",
        product_name="Charcoal Black Minimalist Round Neck T-Shirt",
        category="t-shirt",
        size=["S", "M", "L", "XL", "XXL"],
        color="black",
        neck_type="round neck",
        sleeve_type="short sleeve",
        gender_category="unisex",
        brand="Urban Thread Co.",
        price=899.0,
        currency="INR",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/TSHIRT-1005.jpg",
    ),
    ProductMetadata(
        product_id="TSHIRT-1006",
        product_name="Emerald Green Organic Cotton T-Shirt",
        category="t-shirt",
        size=["S", "M", "L", "XL"],
        color="green",
        neck_type="round neck",
        sleeve_type="short sleeve",
        gender_category="unisex",
        brand="EcoWear",
        price=1099.0,
        currency="INR",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/TSHIRT-1006.jpg",
    ),
    ProductMetadata(
        product_id="SHIRT-2001",
        product_name="Crisp White Formal Business Shirt",
        category="shirt",
        size=["M", "L", "XL"],
        color="white",
        neck_type="collar",
        sleeve_type="long sleeve",
        gender_category="men",
        brand="Elevate Apparel",
        price=1999.0,
        currency="INR",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/SHIRT-2001.jpg",
    ),
    ProductMetadata(
        product_id="SHIRT-2002",
        product_name="Olive Green Casual Linen Shirt",
        category="shirt",
        size=["S", "M", "L", "XL"],
        color="green",
        neck_type="collar",
        sleeve_type="long sleeve",
        gender_category="men",
        brand="Nordic Linen",
        price=2199.0,
        currency="INR",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/SHIRT-2002.jpg",
    ),
    ProductMetadata(
        product_id="HOODIE-3001",
        product_name="Pitch Black Heavyweight Pullover Fleece Hoodie",
        category="hoodie",
        size=["S", "M", "L", "XL", "XXL"],
        color="black",
        neck_type="hooded",
        sleeve_type="long sleeve",
        gender_category="unisex",
        brand="StreetCulture",
        price=2499.0,
        currency="INR",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/HOODIE-3001.jpg",
    ),
    ProductMetadata(
        product_id="HOODIE-3002",
        product_name="Heather Grey Premium Athletic Zip Hoodie",
        category="hoodie",
        size=["M", "L", "XL"],
        color="grey",
        neck_type="hooded",
        sleeve_type="long sleeve",
        gender_category="unisex",
        brand="AeroStudio",
        price=2699.0,
        currency="INR",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/HOODIE-3002.jpg",
    ),
    ProductMetadata(
        product_id="SKU-4829-SILK-BLOUSE",
        product_name="100% Mulberry Silk Draped Blouse — Ivory",
        category="blouse",
        size=["XS", "S", "M", "L"],
        color="ivory",
        neck_type="draped neck",
        sleeve_type="long sleeve",
        gender_category="women",
        brand="Maison Vitrine",
        price=128.0,
        currency="USD",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/SKU-4829-SILK-BLOUSE.jpg",
    ),
    ProductMetadata(
        product_id="SKU-4830-SILK-SHIRT",
        product_name="Relaxed French Linen-Silk Shirt — Ivory",
        category="shirt",
        size=["XS", "S", "M", "L"],
        color="ivory",
        neck_type="collar",
        sleeve_type="long sleeve",
        gender_category="women",
        brand="Maison Vitrine",
        price=134.0,
        currency="USD",
        stock_status="in_stock",
        product_image_gcs_uri=f"gs://{settings.product_bucket}/products/SKU-4830-SILK-SHIRT.jpg",
    ),
]


class FirestoreService:
    """Service wrapper for GCP Firestore interactions."""

    _cached_products = None

    def __init__(self):
        self.collection_name = settings.firestore_collection
        self._db = None

    @property
    def db(self):
        """Lazy initialization of Firestore client."""
        if self._db is None and firestore is not None:
            try:
                self._db = firestore.Client(project=settings.gcp_project_id)
            except Exception as e:
                logger.warning(f"Could not connect to live GCP Firestore: {e}. Utilizing local sample catalogue.")
                self._db = None
        return self._db

    def list_all_products(self) -> List[ProductMetadata]:
        """Lists all products from Firestore collection or fallback memory with caching."""
        if FirestoreService._cached_products:
            return FirestoreService._cached_products

        if self.db:
            try:
                docs = self.db.collection(self.collection_name).stream(timeout=3.0)
                products = []
                for doc in docs:
                    products.append(ProductMetadata(**doc.to_dict()))
                if products:
                    FirestoreService._cached_products = products
                    return products
            except Exception as e:
                logger.warning(f"Firestore streaming timeout/error for '{self.collection_name}': {e}. Using local catalogue.")

        # Return fallback catalogue if database call fails or empty
        FirestoreService._cached_products = SAMPLE_CATALOGUE
        return SAMPLE_CATALOGUE

    def get_product_by_id(self, product_id: str) -> Optional[ProductMetadata]:
        """Retrieves single product document by product_id."""
        if FirestoreService._cached_products:
            for p in FirestoreService._cached_products:
                if p.product_id == product_id:
                    return p

        if self.db:
            try:
                doc_ref = self.db.collection(self.collection_name).document(product_id).get(timeout=3.0)
                if doc_ref.exists:
                    return ProductMetadata(**doc_ref.to_dict())
            except Exception as e:
                logger.warning(f"Error fetching product_id '{product_id}' from Firestore: {e}")

        # Search fallback dataset
        for p in SAMPLE_CATALOGUE:
            if p.product_id == product_id:
                return p
        return None

    def upsert_product(self, product: ProductMetadata) -> bool:
        """Seeds or updates a product document in Firestore."""
        if self.db:
            try:
                self.db.collection(self.collection_name).document(product.product_id).set(product.model_dump(), timeout=3.0)
                logger.info(f"Upserted product {product.product_id} into Firestore.")
                FirestoreService._cached_products = None  # invalidate cache
                return True
            except Exception as e:
                logger.warning(f"Failed to upsert product {product.product_id}: {e}")
                return False
        return False
