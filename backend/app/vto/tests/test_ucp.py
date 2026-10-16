"""Unit tests specifically covering the Universal Commerce Protocol (UCP) endpoints."""

import unittest
from fastapi.testclient import TestClient
from backend.app.vto.main import app

client = TestClient(app)


class TestUCPProtocol(unittest.TestCase):
    """Test suite for UCP discovery profile and checkout session capability."""

    def test_ucp_discovery_endpoint(self):
        """Step 3 validation: Verify agent can discover business capabilities via /.well-known/ucp."""
        res = client.get("/.well-known/ucp")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        # Verify root UCP structure
        self.assertIn("ucp", data)
        self.assertIn("business", data)
        self.assertEqual(data["ucp"]["version"], "2026-01-11")

        # Verify service definition
        services = data["ucp"]["services"]
        self.assertIn("dev.ucp.shopping", services)
        self.assertEqual(services["dev.ucp.shopping"][0]["transport"], "rest")

        # Verify capability definition
        capabilities = data["ucp"]["capabilities"]
        self.assertIn("dev.ucp.shopping.checkout", capabilities)
        self.assertEqual(capabilities["dev.ucp.shopping.checkout"][0]["version"], "2026-01-11")

        # Verify payment handlers
        payment_handlers = data["ucp"]["payment_handlers"]
        self.assertIn("com.google.pay", payment_handlers)

    def test_ucp_create_checkout_session(self):
        """Step 4 validation: Verify agent can invoke dev.ucp.shopping.checkout capability."""
        payload = {
            "line_items": [
                {
                    "item": {
                        "id": "TSHIRT-1001",
                        "title": "Classic Crewneck Graphic T-Shirt",
                        "price": 1299.0,
                    },
                    "quantity": 2,
                }
            ],
            "currency": "INR",
            "buyer": {
                "buyer_id": "cust_agent_test",
                "shipping_address": {
                    "city": "Bengaluru",
                    "postal_code": "560001",
                    "country": "IN",
                },
            },
        }

        res = client.post("/ucp/v1/checkout-sessions", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.json()

        # Validate UCP compliance
        self.assertTrue(data["id"].startswith("chk_sess_"))
        self.assertEqual(data["status"], "ready_for_payment")
        self.assertEqual(data["currency"], "INR")
        self.assertEqual(len(data["line_items"]), 1)
        self.assertEqual(data["line_items"][0]["quantity"], 2)

        # Validate totals calculation (Subtotal: 2598.0, Tax 5%: 129.9, Total: 2727.9)
        totals_map = {t["type"]: t["amount"] for t in data["totals"]}
        self.assertEqual(totals_map["subtotal"], 2598.0)
        self.assertEqual(totals_map["tax"], 129.9)
        self.assertEqual(totals_map["total"], 2727.9)

        # Validate payment links
        link_rels = [link["rel"] for link in data["links"]]
        self.assertIn("payment", link_rels)
        self.assertIn("session", link_rels)

        # Validate retrieval
        get_res = client.get(f"/ucp/v1/checkout-sessions/{data['id']}")
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.json()["id"], data["id"])

    def test_ucp_empty_line_items_rejected(self):
        """Verify business server rejects empty cart payloads."""
        payload = {"line_items": [], "currency": "INR"}
        res = client.post("/ucp/v1/checkout-sessions", json=payload)
        self.assertEqual(res.status_code, 400)


if __name__ == "__main__":
    unittest.main()
