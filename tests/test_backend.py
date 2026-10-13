"""Integration tests for the VITRINE Backend Services.

Validates BFF route handlers, raw vs enriched Product Brain search,
cryptographic SHA-256 ledger integrity verification, and UCP capability discovery.
Directly exercises route functions for microsecond performance and deterministic execution.
"""

import sys
from pathlib import Path
import unittest

root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "agents" / "src"))
sys.path.insert(0, str(root_dir / "agents"))

from backend.app.bff.main import (
    healthz,
    search_catalogue,
    evaluate_gate,
    verify_ledger,
    GateEvaluateRequest,
)
from backend.app.ucp.main import ucp_capabilities_discovery
from backend.app.gcp.bq import bq_client

class TestBackendServices(unittest.TestCase):
    def test_bff_health(self):
        res = healthz()
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["service"], "vitrine-bff")

    def test_product_brain_raw_vs_enriched(self):
        # Query specifically for French Cuffs (an extracted image attribute)
        query = "French Cuffs"

        # Raw mode should return 0 results because supplier description omits this
        res_raw = search_catalogue(q=query, mode="raw")
        self.assertEqual(res_raw["total_results"], 0)

        # Enriched mode should match the multimodal extracted attribute!
        res_enriched = search_catalogue(q=query, mode="enriched")
        self.assertGreaterEqual(res_enriched["total_results"], 1)
        first_match = res_enriched["results"][0]
        self.assertIn("sleeve_length", first_match["enriched_attributes"])
        self.assertEqual(first_match["enriched_attributes"]["sleeve_length"]["value"], "French Cuffs")

    def test_gate_evaluation_endpoint(self):
        req = GateEvaluateRequest(
            txn_id="txn-gate-test-99",
            on_hand=10,
            reserved=2,
            safety_stock=2,
            requested_qty=1,
            transit_hours=12.0,
            unit_price=128.00,
            landed_cost=65.00,
            fulfilment_cost=12.00,
            shipping_cost=10.00,
            discount_pct=5.0,
            buyer_reputation=0.95,
            mandate={"mandate_id": "ap2-001", "signature_valid": True, "is_replayed": False}
        )
        res = evaluate_gate(req)
        self.assertTrue(res["passed"])
        self.assertEqual(len(res["conditions"]), 11)

    def test_ledger_append_and_cryptographic_verification(self):
        # Append block 1
        rec1 = bq_client.append_commitment({
            "txn_id": "txn-ledger-01",
            "sku": "SKU-4829-SILK-BLOUSE",
            "quantity": 1,
            "unit_price": 128.00,
            "mandate_id": "mandate-01",
        })
        self.assertEqual(rec1["sequence_num"], 1)
        self.assertEqual(rec1["prev_hash"], "0" * 64)

        # Append block 2
        rec2 = bq_client.append_commitment({
            "txn_id": "txn-ledger-02",
            "sku": "SKU-4830-SILK-SHIRT",
            "quantity": 2,
            "unit_price": 135.00,
            "mandate_id": "mandate-02",
        })
        self.assertEqual(rec2["sequence_num"], 2)
        # Block 2 prev_hash must equal Block 1 current_hash!
        self.assertEqual(rec2["prev_hash"], rec1["current_hash"])

        # Run chain verification endpoint
        verify_res = verify_ledger()
        self.assertTrue(verify_res["verified"])
        self.assertEqual(verify_res["status"], "CHAIN_INTEGRITY_VERIFIED")

    def test_ucp_capabilities_discovery(self):
        res = ucp_capabilities_discovery()
        self.assertEqual(res["ucp_version"], "1.0.0")
        self.assertIn("urn:ucp:capability:delivery_promise_negotiation", res["capabilities"])
        self.assertIn("fabric_composition", res["attribute_vocabulary"])

    def test_ucp_endpoints_full_cycle(self):
        import asyncio
        from backend.app.ucp.main import (
            ucp_initiate_session,
            ucp_discover,
            ucp_negotiate,
            ucp_accept_offer,
            UCPSessionRequest,
            UCPDiscoverRequest,
            UCPNegotiateRequest,
            UCPAcceptRequest,
        )

        # 1. Session Initialization
        sess = ucp_initiate_session(UCPSessionRequest(buyer_agent_id="buyer-agent-test"))
        self.assertEqual(sess["status"], "ESTABLISHED")
        self.assertIn("ucp-sess-", sess["session_id"])

        # 2. Multimodal Product Discovery
        disc = ucp_discover(UCPDiscoverRequest(query="Mulberry Silk"))
        self.assertEqual(disc["status"], "SUCCESS")
        self.assertGreaterEqual(disc["matches_count"], 1)

        # 3. Negotiation
        neg_req = UCPNegotiateRequest(
            txn_id="txn-ucp-test-01",
            buyer_agent_id="buyer-agent-test",
            sku="SKU-4829-SILK-BLOUSE",
            target_delivery_date="2026-10-15T10:00:00Z",
            target_discount_pct=5.0,
            ap2_mandate={"mandate_id": "mandate-ucp-01", "nonce": "nonce-ucp-01", "signature_valid": True},
        )
        neg_res = asyncio.run(ucp_negotiate(neg_req))
        self.assertIn(neg_res["status"], ("OFFER_PRESENTED", "SUBSTITUTION_OFFER_PRESENTED"))

        # 4. Accept & Immutable Ledger Commitment
        acc_req = UCPAcceptRequest(
            txn_id="txn-ucp-test-01",
            buyer_agent_id="buyer-agent-test",
            offer_id="off-test-01",
            ap2_mandate={"mandate_id": "mandate-ucp-01", "signature_valid": True},
        )
        acc_res = ucp_accept_offer("off-test-01", acc_req)
        self.assertEqual(acc_res["status"], "COMMITTED")
        self.assertEqual(len(acc_res["commitment_record"]["current_hash"]), 64)

if __name__ == "__main__":
    unittest.main(verbosity=2)
