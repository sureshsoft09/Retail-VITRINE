"""Unit tests for Smart Size Recommendation Engine and Response integration."""

import pytest
from backend.app.vto.models.product import ProductMetadata
from backend.app.vto.models.responses import TryOnResultResponse
from backend.app.vto.tools.size_recommender import calculate_smart_size_recommendation


class TestSizeRecommendation:
    """Test suite for smart size recommendation calculations and data contracts."""

    def test_default_regular_size_recommendation(self):
        product = ProductMetadata(
            product_id="TSHIRT-1001",
            product_name="Classic Crewneck Graphic T-Shirt",
            category="T-Shirt",
            color="yellow",
            size=["S", "M", "L", "XL"],
            brand="AuraWear",
            price=1299.00,
            currency="INR",
            product_image_gcs_uri="gs://bucket/products/TSHIRT-1001.jpg",
        )
        rec = calculate_smart_size_recommendation(product=product, fit_preference=None)

        assert rec["recommended_size"] == "M"
        assert "Regular" in rec["fit_label"]
        assert "Medium (M)" in rec["fit_note"]
        assert "M" in rec["size_breakdown"]
        assert "Recommended" in rec["size_breakdown"]["M"]

    def test_relaxed_preference_recommends_large(self):
        rec = calculate_smart_size_recommendation(fit_preference="I prefer a loose, relaxed fit")

        assert rec["recommended_size"] == "L"
        assert "Relaxed" in rec["fit_label"]
        assert "Large (L)" in rec["fit_note"]
        assert "Recommended" in rec["size_breakdown"]["L"]

    def test_slim_preference_recommends_small(self):
        rec = calculate_smart_size_recommendation(fit_preference="I want a slim fitted look")

        assert rec["recommended_size"] == "S"
        assert "Slim" in rec["fit_label"]
        assert "Small (S)" in rec["fit_note"]
        assert "Recommended" in rec["size_breakdown"]["S"]

    def test_try_on_response_serialization_with_size_fields(self):
        rec = calculate_smart_size_recommendation()
        resp = TryOnResultResponse(
            session_id="test_sess_123",
            status="COMPLETED",
            try_on_image_url="https://storage.googleapis.com/test.jpg",
            product_id="TSHIRT-1001",
            recommended_size=rec["recommended_size"],
            fit_note=rec["fit_note"],
            size_breakdown=rec["size_breakdown"],
            message="Ready!",
        )

        assert resp.recommended_size == "M"
        assert "Medium (M)" in resp.fit_note
        assert isinstance(resp.size_breakdown, dict)
        assert resp.size_breakdown["M"].startswith("Recommended")

    def test_session_data_attribute_compatibility(self):
        from backend.app.vto.models.session import SessionData, SessionState
        from backend.app.vto.models.product import ProductPreference

        session = SessionData(
            session_id="test_sess",
            state=SessionState.AWAITING_CONFIRMATION,
            preferences=ProductPreference(requested_size="loose / relaxed"),
        )
        # Verify both attributes work without AttributeError
        assert session.preferences.requested_size == "loose / relaxed"
        assert session.product_preference.requested_size == "loose / relaxed"
