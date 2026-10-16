"""Unit tests for prompt_parser tool."""

import unittest
from unittest.mock import patch, MagicMock

from backend.app.vto.tools.prompt_parser import parse_product_request


class TestPromptParser(unittest.TestCase):

    def test_parse_product_request_heuristic_fallback(self):
        """Tests attribute extraction fallback logic."""
        prompt = "I want to try a medium-size yellow round-neck T-shirt."
        pref = parse_product_request(prompt)

        self.assertEqual(pref.category, "t-shirt")
        self.assertEqual(pref.requested_size, "M")
        self.assertEqual(pref.color, "yellow")
        self.assertEqual(pref.neck_type, "round neck")

    @patch("google.genai.Client")
    def test_parse_product_request_mock_gemini(self, mock_client_cls):
        """Tests attribute extraction using mocked Gemini client response."""
        mock_client = MagicMock()
        mock_client_cls.return_value = mock_client

        mock_response = MagicMock()
        mock_response.text = '{"category": "shirt", "requested_size": "L", "color": "white", "neck_type": "collar", "sleeve_type": "long sleeve"}'
        mock_client.models.generate_content.return_value = mock_response

        prompt = "Show me a large white long sleeve shirt with collar"
        pref = parse_product_request(prompt)

        self.assertEqual(pref.category, "shirt")
        self.assertEqual(pref.requested_size, "L")
        self.assertEqual(pref.color, "white")
        self.assertEqual(pref.neck_type, "collar")
        self.assertEqual(pref.sleeve_type, "long sleeve")


if __name__ == "__main__":
    unittest.main()
