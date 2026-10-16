"""Tests for FastAPI endpoints: photo upload, product image streaming, and sessions."""

import unittest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from backend.app.vto.main import app
from backend.app.vto.services.session_service import session_service

client = TestClient(app)


class TestEndpoints(unittest.TestCase):

    def test_create_session(self):
        response = client.post("/sessions")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("session_id", data)

    @patch("app.agent.upload_person_image")
    @patch("app.agent.validate_person_image")
    def test_photo_upload_endpoints(self, mock_validate, mock_upload):
        mock_validate.return_value = (True, "Photo validated successfully.")
        mock_upload.return_value = "gs://fake-bucket/sessions/s1/person.jpg"

        # Create session
        session = session_service.create_session()
        sid = session.session_id

        # Minimal valid 1x1 JPEG dummy
        fake_img = (
            b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00"
            b"\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t"
            b"\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a"
            b"\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342"
            b"\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00"
            b"\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00"
            b"\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00"
            b"\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
        )

        # Test POST /sessions/{id}/photo
        res1 = client.post(
            f"/sessions/{sid}/photo",
            files={"file": ("customer.jpg", fake_img, "image/jpeg")}
        )
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["status"], "VALIDATED")

        # Test POST /sessions/{id}/upload_photo
        res2 = client.post(
            f"/sessions/{sid}/upload_photo",
            files={"file": ("customer.jpg", fake_img, "image/jpeg")}
        )
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["status"], "VALIDATED")

    def test_product_image_endpoint(self):
        # Test GET /api/products/TSHIRT-1001/image (exists in GCS bucket)
        res = client.get("/api/products/TSHIRT-1001/image")
        self.assertEqual(res.status_code, 200)
        self.assertIn("image/", res.headers["content-type"])

        # Test GET /api/products/SHIRT-2002/image (detects PNG magic bytes)
        res_shirt = client.get("/api/products/SHIRT-2002/image")
        self.assertEqual(res_shirt.status_code, 200)
        self.assertEqual(res_shirt.headers["content-type"], "image/png")

        # Test GET nonexistent product returns 404 (no fake SVG shirt redirect)
        res_missing = client.get("/api/products/NONEXISTENT-9999/image")
        self.assertEqual(res_missing.status_code, 404)
        self.assertIn("No image found", res_missing.json()["detail"])

    def test_completed_session_searches_new_product(self):
        from backend.app.vto.models.session import SessionState
        # Create session and artificially set to COMPLETED (simulating after try-on generation)
        session = session_service.create_session()
        session.state = SessionState.COMPLETED
        sid = session.session_id

        # Customer sends query for green shirt
        res = client.post(
            f"/sessions/{sid}/message",
            json={"message": "I want to try green shirt"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data["matching_products"]), 0)
        # Should contain green shirt / emerald green t-shirt
        product_names = [p["product_name"] for p in data["matching_products"]]
        self.assertTrue(any("Green" in name for name in product_names))


    def test_list_products_catalog(self):
        # Test GET /api/products
        res = client.get("/api/products")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 10)
        # Check first product structure
        first = data[0]
        self.assertIn("product_id", first)
        self.assertIn("product_name", first)
        self.assertIn("product_image_url", first)
        self.assertTrue(first["product_image_url"].startswith("/api/products/"))

    def test_try_on_prerequisite_validation(self):
        # 1. New session with neither product nor photo
        session = session_service.create_session()
        sid = session.session_id

        res1 = client.post(f"/sessions/{sid}/generate", json={"confirm": True})
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["status"], "FAILED")
        self.assertIn("Please select an apparel product and upload your photo first", res1.json()["message"])

        # 2. Select product only, photo missing
        client.post(f"/sessions/{sid}/select", json={"selection_index": "SHIRT-2002"})
        res2 = client.post(f"/sessions/{sid}/generate", json={"confirm": True})
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["status"], "FAILED")
        self.assertIn("Please upload a person photo first", res2.json()["message"])

    @patch("app.tools.image_validator.genai.Client")
    def test_thumbnail_photo_validation(self, mock_genai_client):
        from PIL import Image
        import io
        from backend.app.vto.tools.image_validator import validate_person_image

        mock_instance = MagicMock()
        mock_genai_client.return_value = mock_instance
        mock_resp = MagicMock()
        mock_resp.text = '{"is_valid": true, "reason": "Person detected"}'
        mock_instance.models.generate_content.return_value = mock_resp

        # Create a test 183x275 image (same dimensions as user's photo)
        buf = io.BytesIO()
        Image.new("RGB", (183, 275), color=(200, 180, 160)).save(buf, format="JPEG")
        raw_bytes = buf.getvalue()

        # Structural check and mocked Gemini pass for 183x275
        is_valid, msg = validate_person_image(raw_bytes, "person3.jpg", "image/jpeg")
        self.assertTrue(is_valid)

        # Image smaller than 100x100 is rejected by resolution check without calling Gemini
        buf_tiny = io.BytesIO()
        Image.new("RGB", (50, 50), color=(100, 100, 100)).save(buf_tiny, format="JPEG")
        is_valid_tiny, msg_tiny = validate_person_image(buf_tiny.getvalue(), "tiny.jpg", "image/jpeg")
        self.assertFalse(is_valid_tiny)
        self.assertIn("too small", msg_tiny)


if __name__ == "__main__":
    unittest.main()

