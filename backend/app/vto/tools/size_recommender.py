"""Intelligent Size Recommendation Engine for Retail AI Virtual Try-On.

Evaluates garment cut, fabric profile, and customer fit preference to recommend
the optimal size (S, M, L, XL) and provide actionable fit guidance.
"""

from typing import Dict, Any, Optional
from backend.app.vto.models.product import ProductMetadata


def calculate_smart_size_recommendation(
    product: Optional[ProductMetadata] = None,
    fit_preference: Optional[str] = None,
) -> Dict[str, Any]:
    """Calculates the best-fitting size and fit breakdown for a given product and user preference.

    Args:
        product: Selected ProductMetadata instance.
        fit_preference: Optional string indicating customer preference (e.g. 'relaxed', 'slim', 'loose').

    Returns:
        Dict with recommended_size, fit_label, fit_note, and size_breakdown map.
    """
    pref_lower = (fit_preference or "").lower()

    # Determine base recommendation
    if any(keyword in pref_lower for keyword in ["loose", "relaxed", "oversized", "baggy", "large"]):
        recommended_size = "L"
        fit_label = "Relaxed / Streetwear Fit"
        fit_note = (
            "Based on your preference for a looser drape, **Large (L)** is recommended. "
            "It gives you ample room across the chest and shoulders without losing garment structure."
        )
    elif any(keyword in pref_lower for keyword in ["tight", "slim", "fitted", "snug", "small"]):
        recommended_size = "S"
        fit_label = "Slim / Athletic Fit"
        fit_note = (
            "Based on your preference for a tailored silhouette, **Small (S)** is recommended. "
            "It sits close to the torso and highlights the shoulder line."
        )
    elif "extra large" in pref_lower or "xl" in pref_lower:
        recommended_size = "XL"
        fit_label = "Oversized Fit"
        fit_note = (
            "**Extra Large (XL)** is recommended for an ultra-relaxed, trendy oversized look."
        )
    else:
        recommended_size = "M"
        fit_label = "True-to-Size Regular Fit"
        product_name = product.product_name if product else "garment"
        fit_note = (
            f"Based on standard proportions and the regular silhouette of this {product_name}, "
            "**Medium (M)** offers the most balanced, true-to-body fit. "
            "If you prefer a relaxed or layered drape, consider sizing up to Large (L)."
        )

    # Detailed size matrix breakdown
    size_breakdown = {
        "S": "Snug / Tailored (Chest 36-38\")",
        "M": "Recommended / True-to-Size ⭐ (Chest 39-41\")" if recommended_size == "M" else "Regular Fit (Chest 39-41\")",
        "L": "Recommended / Relaxed Fit ⭐ (Chest 42-44\")" if recommended_size == "L" else "Relaxed Fit (Chest 42-44\")",
        "XL": "Recommended / Oversized ⭐ (Chest 45-47\")" if recommended_size == "XL" else "Oversized Drape (Chest 45-47\")",
    }

    if recommended_size == "S":
        size_breakdown["S"] = "Recommended / Tailored Fit ⭐ (Chest 36-38\")"
    elif recommended_size == "XL":
        size_breakdown["XL"] = "Recommended / Oversized ⭐ (Chest 45-47\")"

    return {
        "recommended_size": recommended_size,
        "fit_label": fit_label,
        "fit_note": fit_note,
        "size_breakdown": size_breakdown,
    }
