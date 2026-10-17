"""Product catalogue service dynamically pulling products from Google Cloud Storage bucket and Firestore."""

import logging
import time
from typing import List, Optional

try:
    from google.cloud import storage
except (ImportError, AttributeError):
    storage = None

try:
    from google.cloud import firestore
except (ImportError, AttributeError):
    firestore = None

from backend.app.vto.config import settings
from backend.app.vto.models.product import ProductMetadata

logger = logging.getLogger(__name__)

# Curated metadata dictionary for items residing in the GCS bucket gs://gcp-aibuildercup-project-retail-products
PRODUCT_METADATA_REGISTRY = {
    "TSHIRT-1001": {
        "product_name": "Yellow Crew Neck Essential T-Shirt",
        "category": "t-shirt",
        "size": ["S", "M", "L", "XL"],
        "color": "yellow",
        "neck_type": "round neck",
        "sleeve_type": "short sleeve",
        "gender_category": "unisex",
        "brand": "Urban Thread Co.",
        "price": 999.0,
        "currency": "INR",
    },
    "TSHIRT-1002": {
        "product_name": "Navy Blue V-Neck Slim Fit T-Shirt",
        "category": "t-shirt",
        "size": ["S", "M", "L"],
        "color": "blue",
        "neck_type": "v-neck",
        "sleeve_type": "short sleeve",
        "gender_category": "men",
        "brand": "AeroStudio",
        "price": 1199.0,
        "currency": "INR",
    },
    "TSHIRT-1003": {
        "product_name": "Mustard Yellow Classic Polo Collar T-Shirt",
        "category": "t-shirt",
        "size": ["M", "L", "XL"],
        "color": "yellow",
        "neck_type": "polo",
        "sleeve_type": "short sleeve",
        "gender_category": "men",
        "brand": "Nordic Polo",
        "price": 1499.0,
        "currency": "INR",
    },
    "TSHIRT-1004": {
        "product_name": "Crimson Red Graphic Oversized T-Shirt",
        "category": "t-shirt",
        "size": ["S", "M", "L", "XL"],
        "color": "red",
        "neck_type": "round neck",
        "sleeve_type": "short sleeve",
        "gender_category": "unisex",
        "brand": "StreetCulture",
        "price": 1299.0,
        "currency": "INR",
    },
    "TSHIRT-1005": {
        "product_name": "Charcoal Black Minimalist Round Neck T-Shirt",
        "category": "t-shirt",
        "size": ["S", "M", "L", "XL", "XXL"],
        "color": "black",
        "neck_type": "round neck",
        "sleeve_type": "short sleeve",
        "gender_category": "unisex",
        "brand": "Urban Thread Co.",
        "price": 899.0,
        "currency": "INR",
    },
    "TSHIRT-1006": {
        "product_name": "Emerald Green Organic Cotton T-Shirt",
        "category": "t-shirt",
        "size": ["S", "M", "L", "XL"],
        "color": "green",
        "neck_type": "round neck",
        "sleeve_type": "short sleeve",
        "gender_category": "unisex",
        "brand": "EcoWear",
        "price": 1099.0,
        "currency": "INR",
    },
    "SHIRT-2001": {
        "product_name": "Crisp White Formal Business Shirt",
        "category": "shirt",
        "size": ["M", "L", "XL"],
        "color": "white",
        "neck_type": "collar",
        "sleeve_type": "long sleeve",
        "gender_category": "men",
        "brand": "Elevate Apparel",
        "price": 1999.0,
        "currency": "INR",
    },
    "SHIRT-2002": {
        "product_name": "Olive Green Casual Linen Shirt",
        "category": "shirt",
        "size": ["S", "M", "L", "XL"],
        "color": "green",
        "neck_type": "collar",
        "sleeve_type": "long sleeve",
        "gender_category": "men",
        "brand": "Nordic Linen",
        "price": 2199.0,
        "currency": "INR",
    },
    "HOODIE-3001": {
        "product_name": "Pitch Black Heavyweight Pullover Fleece Hoodie",
        "category": "hoodie",
        "size": ["S", "M", "L", "XL", "XXL"],
        "color": "black",
        "neck_type": "hooded",
        "sleeve_type": "long sleeve",
        "gender_category": "unisex",
        "brand": "StreetCulture",
        "price": 2499.0,
        "currency": "INR",
    },
    "HOODIE-3002": {
        "product_name": "Heather Grey Premium Athletic Zip Hoodie",
        "category": "hoodie",
        "size": ["M", "L", "XL"],
        "color": "grey",
        "neck_type": "hooded",
        "sleeve_type": "long sleeve",
        "gender_category": "unisex",
        "brand": "AeroStudio",
        "price": 2699.0,
        "currency": "INR",
    },
}


class FirestoreService:
    """Service for querying product catalogue dynamically from GCS bucket and Firestore."""

    _cached_products: Optional[List[ProductMetadata]] = None
    _last_cache_time: float = 0.0
    _CACHE_TTL_SECONDS: float = 60.0

    def __init__(self):
        self.collection_name = settings.firestore_collection
        self._db = None
        self._storage_client = None

    @property
    def storage_client(self):
        """Lazy initialization of Cloud Storage client."""
        if self._storage_client is None and storage is not None:
            try:
                self._storage_client = storage.Client(project=settings.gcp_project_id)
            except Exception as e:
                logger.warning(f"Could not initialize GCS storage client: {e}")
        return self._storage_client

    @property
    def db(self):
        """Lazy initialization of Firestore client."""
        if self._db is None and firestore is not None:
            try:
                self._db = firestore.Client(project=settings.gcp_project_id)
            except Exception as e:
                logger.warning(f"Could not connect to live GCP Firestore: {e}")
                self._db = None
        return self._db

    def list_all_products(self, force_refresh: bool = False) -> List[ProductMetadata]:
        """Lists products dynamically from the Google Cloud Storage bucket."""
        now = time.time()
        if (
            not force_refresh
            and FirestoreService._cached_products is not None
            and (now - FirestoreService._last_cache_time) < FirestoreService._CACHE_TTL_SECONDS
        ):
            return FirestoreService._cached_products

        products: List[ProductMetadata] = []

        # 1. Primary Source: Query Google Cloud Storage bucket gcp-aibuildercup-project-retail-products
        try:
            if self.storage_client:
                bucket = self.storage_client.bucket(settings.product_bucket)
                blobs = list(bucket.list_blobs())

                for blob in blobs:
                    # Filter for image files
                    name_lower = blob.name.lower()
                    if not any(name_lower.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                        continue

                    # Extract product ID from blob name (e.g., "products/TSHIRT-1002.jpg" -> "TSHIRT-1002")
                    filename = blob.name.split("/")[-1]
                    product_id = filename.rsplit(".", 1)[0]

                    # Retrieve rich metadata or auto-infer for new items
                    meta = PRODUCT_METADATA_REGISTRY.get(product_id, {})

                    # Infer category from product ID if not registered
                    if "category" in meta:
                        category = meta["category"]
                    elif "TSHIRT" in product_id.upper():
                        category = "t-shirt"
                    elif "SHIRT" in product_id.upper():
                        category = "shirt"
                    elif "HOODIE" in product_id.upper():
                        category = "hoodie"
                    else:
                        category = "apparel"

                    product_name = meta.get(
                        "product_name",
                        f"{product_id.replace('-', ' ').title()} - Vitrine Collection"
                    )

                    prod = ProductMetadata(
                        product_id=product_id,
                        product_name=product_name,
                        category=category,
                        size=meta.get("size", ["S", "M", "L", "XL"]),
                        color=meta.get("color", "assorted"),
                        neck_type=meta.get("neck_type", "standard"),
                        sleeve_type=meta.get("sleeve_type", "standard"),
                        gender_category=meta.get("gender_category", "unisex"),
                        brand=meta.get("brand", "Vitrine Studio"),
                        price=meta.get("price", 1499.0),
                        currency=meta.get("currency", "INR"),
                        stock_status="in_stock",
                        product_image_gcs_uri=f"gs://{settings.product_bucket}/{blob.name}",
                        product_image_url=f"/api/vto/products/{product_id}/image",
                    )
                    products.append(prod)

                if products:
                    logger.info(f"Loaded {len(products)} products dynamically from GCS bucket '{settings.product_bucket}'")
                    FirestoreService._cached_products = products
                    FirestoreService._last_cache_time = now
                    return products
        except Exception as e:
            logger.warning(f"Could not list blobs from GCS bucket '{settings.product_bucket}': {e}")

        # Fallback to in-memory registry of the bucket items
        if FirestoreService._cached_products:
            return FirestoreService._cached_products

        fallback_products = [
            ProductMetadata(
                product_id=pid,
                product_name=m["product_name"],
                category=m["category"],
                size=m["size"],
                color=m["color"],
                neck_type=m["neck_type"],
                sleeve_type=m["sleeve_type"],
                gender_category=m["gender_category"],
                brand=m["brand"],
                price=m["price"],
                currency=m["currency"],
                stock_status="in_stock",
                product_image_gcs_uri=f"gs://{settings.product_bucket}/products/{pid}.jpg",
                product_image_url=f"/api/vto/products/{pid}/image",
            )
            for pid, m in PRODUCT_METADATA_REGISTRY.items()
        ]
        FirestoreService._cached_products = fallback_products
        FirestoreService._last_cache_time = now
        return fallback_products

    def get_product_by_id(self, product_id: str) -> Optional[ProductMetadata]:
        """Retrieves single product document by product_id."""
        prods = self.list_all_products()
        for p in prods:
            if p.product_id == product_id:
                return p

        # Check Firestore if available
        if self.db:
            try:
                doc_ref = self.db.collection(self.collection_name).document(product_id).get(timeout=3.0)
                if doc_ref.exists:
                    return ProductMetadata(**doc_ref.to_dict())
            except Exception as e:
                logger.warning(f"Error fetching product_id '{product_id}' from Firestore: {e}")

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
