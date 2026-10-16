"""Unit tests for product_search tool."""

import unittest
from unittest.mock import MagicMock

from backend.app.vto.models.product import ProductMetadata, ProductPreference
from backend.app.vto.tools.product_search import search_products


class TestProductSearch(unittest.TestCase):

    def setUp(self):
        self.mock_firestore_service = MagicMock()
        self.mock_firestore_service.list_all_products.return_value = [
            ProductMetadata(
                product_id="TSHIRT-1001",
                product_name="Yellow Round Neck T-Shirt",
                category="t-shirt",
                size=["S", "M", "L", "XL"],
                color="yellow",
                neck_type="round neck",
                sleeve_type="short sleeve",
                brand="Demo Brand",
                price=999.0,
                currency="INR",
                stock_status="in_stock",
                product_image_gcs_uri="gs://bucket/products/TSHIRT-1001.jpg",
            ),
            ProductMetadata(
                product_id="TSHIRT-1002",
                product_name="Blue V-Neck T-Shirt",
                category="t-shirt",
                size=["S", "M"],
                color="blue",
                neck_type="v-neck",
                sleeve_type="short sleeve",
                brand="Demo Brand",
                price=1199.0,
                currency="INR",
                stock_status="in_stock",
                product_image_gcs_uri="gs://bucket/products/TSHIRT-1002.jpg",
            ),
        ]

    def test_search_products_exact_match(self):
        """Verifies that exact matches are prioritized and returned first."""
        pref = ProductPreference(
            category="t-shirt",
            requested_size="M",
            color="yellow",
            neck_type="round neck",
        )

        result = search_products(pref, firestore_service=self.mock_firestore_service)

        self.assertEqual(len(result.exact_matches), 1)
        self.assertEqual(result.exact_matches[0].product_id, "TSHIRT-1001")
        self.assertEqual(len(result.missing_attributes), 0)

    def test_search_products_alternative_fallback(self):
        """Verifies fallback to alternatives and reporting missing attributes when exact match is missing."""
        pref = ProductPreference(
            category="t-shirt",
            requested_size="XL",
            color="blue",
            neck_type="v-neck",
        )

        result = search_products(pref, firestore_service=self.mock_firestore_service)

        self.assertEqual(len(result.exact_matches), 0)
        self.assertGreater(len(result.alternatives), 0)
        self.assertIn("size 'XL'", result.missing_attributes[0])


if __name__ == "__main__":
    unittest.main()
