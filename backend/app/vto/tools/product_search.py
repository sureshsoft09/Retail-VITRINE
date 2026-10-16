"""Tool 2 & 3: search_products(preferences) and get_product(product_id)

Searches product catalogue in Firestore, prioritizing exact matches and ranking relevant alternatives.
"""

import logging
from typing import List, Optional

from backend.app.vto.models.product import ProductMetadata, ProductPreference, ProductSearchResult
from backend.app.vto.services.firestore_service import FirestoreService

logger = logging.getLogger(__name__)


def search_products(
    preferences: ProductPreference,
    firestore_service: Optional[FirestoreService] = None,
) -> ProductSearchResult:
    """Searches products by preference, placing exact matches first and ranking alternatives.

    Args:
        preferences: ProductPreference extracted attributes.
        firestore_service: Optional FirestoreService instance (creates default if None).

    Returns:
        ProductSearchResult with exact matches, alternatives, missing attributes, and explanation.
    """
    if firestore_service is None:
        firestore_service = FirestoreService()

    all_products = firestore_service.list_all_products()
    logger.info(f"Searching across {len(all_products)} products with preferences: {preferences.model_dump()}")

    exact_matches: List[ProductMetadata] = []
    candidates: List[tuple[ProductMetadata, int, List[str]]] = []

    req_category = preferences.category.lower() if preferences.category else None
    req_size = preferences.requested_size.upper() if preferences.requested_size else None
    req_color = preferences.color.lower() if preferences.color else None
    req_neck = preferences.neck_type.lower() if preferences.neck_type else None
    req_sleeve = preferences.sleeve_type.lower() if preferences.sleeve_type else None

    for product in all_products:
        if product.stock_status != "in_stock":
            continue

        match_score = 0
        missing_attrs: List[str] = []

        # Category check
        if req_category:
            if product.category.lower() == req_category:
                match_score += 3
            else:
                missing_attrs.append(f"category '{req_category}'")

        # Size check
        if req_size:
            if req_size in [s.upper() for s in product.size]:
                match_score += 3
            else:
                missing_attrs.append(f"size '{req_size}'")

        # Color check
        if req_color:
            if product.color.lower() == req_color:
                match_score += 2
            else:
                missing_attrs.append(f"color '{req_color}'")

        # Neck type check
        if req_neck:
            if product.neck_type and product.neck_type.lower() == req_neck:
                match_score += 2
            else:
                missing_attrs.append(f"neck style '{req_neck}'")

        # Sleeve type check
        if req_sleeve:
            if product.sleeve_type and product.sleeve_type.lower() == req_sleeve:
                match_score += 1
            else:
                missing_attrs.append(f"sleeve style '{req_sleeve}'")

        # Is exact match? All non-None criteria must match!
        total_criteria = sum(1 for c in [req_category, req_size, req_color, req_neck, req_sleeve] if c is not None)
        matched_criteria = (
            (1 if req_category and product.category.lower() == req_category else 0)
            + (1 if req_size and req_size in [s.upper() for s in product.size] else 0)
            + (1 if req_color and product.color.lower() == req_color else 0)
            + (1 if req_neck and product.neck_type and product.neck_type.lower() == req_neck else 0)
            + (1 if req_sleeve and product.sleeve_type and product.sleeve_type.lower() == req_sleeve else 0)
        )

        if total_criteria > 0 and matched_criteria == total_criteria:
            exact_matches.append(product)
        elif matched_criteria > 0:
            candidates.append((product, match_score, missing_attrs))

    # Sort candidate alternatives by match score descending
    candidates.sort(key=lambda x: x[1], reverse=True)
    alternatives = [item[0] for item in candidates[:3]]

    # Identify missing requested attributes if no exact match exists
    missing_attribute_summary: List[str] = []
    explanation = ""

    if exact_matches:
        explanation = f"Found {len(exact_matches)} exact match(es) for your preferences."
    else:
        if candidates:
            # Aggregate missing attributes from top candidate
            top_missing = candidates[0][2]
            missing_attribute_summary = list(set(top_missing))
            explanation = (
                f"No exact match was found matching all your preferences. "
                f"The following attributes were unavailable in exact combination: {', '.join(missing_attribute_summary)}. "
                f"Showing closest relevant alternatives below."
            )
        else:
            explanation = "No matching or near-matching products found in catalogue."

    return ProductSearchResult(
        exact_matches=exact_matches,
        alternatives=alternatives,
        missing_attributes=missing_attribute_summary,
        explanation=explanation,
    )


def get_product(
    product_id: str,
    firestore_service: Optional[FirestoreService] = None,
) -> Optional[ProductMetadata]:
    """Retrieves verified product metadata from Firestore by product_id.

    Args:
        product_id: Product identifier.
        firestore_service: Optional FirestoreService instance.

    Returns:
        ProductMetadata object if found, otherwise None.
    """
    if firestore_service is None:
        firestore_service = FirestoreService()

    return firestore_service.get_product_by_id(product_id)
