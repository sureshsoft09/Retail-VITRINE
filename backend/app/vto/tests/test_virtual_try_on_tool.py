"""Unit tests for virtual_try_on_tool."""

import unittest
from unittest.mock import patch, MagicMock

from backend.app.vto.tools.virtual_try_on_tool import generate_virtual_try_on


class TestVirtualTryOnTool(unittest.TestCase):

    @patch("google.genai.Client")
    def test_generate_virtual_try_on_success(self, mock_genai_client_cls):
        """Tests successful virtual_try_on tool invocation with mocked SDK response."""
        mock_client = MagicMock()
        mock_genai_client_cls.return_value = mock_client

        mock_image_item = MagicMock()
        mock_image_item.image.image_bytes = b"fake_generated_jpeg_bytes"

        mock_response = MagicMock()
        mock_response.generated_images = [mock_image_item]
        mock_client.models.recontext_image.return_value = mock_response

        person_uri = "gs://temp-bucket/sessions/s123/person.jpg"
        product_uri = "gs://product-bucket/products/TSHIRT-1001.jpg"

        image_bytes, metadata = generate_virtual_try_on(person_uri, product_uri)

        self.assertEqual(image_bytes, b"fake_generated_jpeg_bytes")
        self.assertEqual(metadata["status"], "SUCCESS")
        self.assertEqual(metadata["model_id"], "virtual-try-on-001")

    @patch("google.cloud.storage.Client")
    @patch("google.genai.Client")
    def test_generate_virtual_try_on_fallback(self, mock_genai_client_cls, mock_storage_client_cls):
        """Verifies preview image generation when virtual-try-on-001 model call encounters error/quota limit."""
        mock_client = MagicMock()
        mock_genai_client_cls.return_value = mock_client
        mock_client.models.recontext_image.side_effect = Exception("Vertex AI quota or object 404")

        mock_storage = MagicMock()
        mock_storage_client_cls.return_value = mock_storage
        mock_storage.bucket.return_value.blob.return_value.exists.return_value = False

        person_uri = "gs://temp-bucket/sessions/s123/person.jpg"
        product_uri = "gs://product-bucket/products/TSHIRT-1001.jpg"

        image_bytes, metadata = generate_virtual_try_on(person_uri, product_uri)
        self.assertIsNotNone(image_bytes)
        self.assertGreater(len(image_bytes), 0)
        self.assertEqual(metadata["status"], "PREVIEW_SUCCESS")

    @patch("google.genai.Client")
    def test_generate_virtual_try_on_allow_all_retry(self, mock_genai_client_cls):
        """Verifies retry with allow_all when initial call encounters Person Generation error."""
        mock_client = MagicMock()
        mock_genai_client_cls.return_value = mock_client

        mock_image_item = MagicMock()
        mock_image_item.image.image_bytes = b"recovered_tryon_bytes"

        mock_success_response = MagicMock()
        mock_success_response.generated_images = [mock_image_item]

        # First call fails with Person Generation adult restriction, second call succeeds
        mock_client.models.recontext_image.side_effect = [
            Exception("The image you want to edit contains content that has been blocked because you selected the 'Allow (Adults only)' option for Person Generation. You can send this request again using the 'Allow (All ages)' option."),
            mock_success_response,
        ]

        person_uri = "gs://temp-bucket/sessions/s123/person.jpg"
        product_uri = "gs://product-bucket/products/TSHIRT-1001.jpg"

        image_bytes, metadata = generate_virtual_try_on(person_uri, product_uri)

        self.assertEqual(image_bytes, b"recovered_tryon_bytes")
        self.assertEqual(metadata["status"], "SUCCESS")
        self.assertEqual(mock_client.models.recontext_image.call_count, 2)


if __name__ == "__main__":
    unittest.main()

