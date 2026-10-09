"""Tests for the MCP Server Microservices: mcp-catalog, mcp-promise, and mcp-commerce.

Validates tool operations, deterministic calculation IDs, cryptographic ledger chaining,
and external Agent Gateway authorization / containment boundaries.
"""

import importlib.util
from pathlib import Path
import sys
import unittest

root_dir = Path(__file__).resolve().parent.parent

def _load_mcp_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

catalog_mod = _load_mcp_module("catalog_main", root_dir / "mcp-servers" / "catalog" / "main.py")
promise_mod = _load_mcp_module("promise_main", root_dir / "mcp-servers" / "promise" / "main.py")
commerce_mod = _load_mcp_module("commerce_main", root_dir / "mcp-servers" / "commerce" / "main.py")

from fastapi import HTTPException

class TestMcpServers(unittest.TestCase):
    # --------------------------------------------------------------------------
    # 1. mcp-catalog Tests
    # --------------------------------------------------------------------------
    def test_catalog_health(self):
        res = catalog_mod.healthz()
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["server"], "mcp-catalog")

    def test_catalog_search_raw_vs_enriched(self):
        # Raw search for "French Cuffs" returns 0
        req_raw = catalog_mod.SearchRequest(query="French Cuffs", mode="raw")
        res_raw = catalog_mod.catalog_search(req_raw)
        self.assertEqual(res_raw["count"], 0)

        # Enriched search returns matching SKUs with extracted multimodal attributes
        req_enriched = catalog_mod.SearchRequest(query="French Cuffs", mode="enriched")
        res_enriched = catalog_mod.catalog_search(req_enriched)
        self.assertGreaterEqual(res_enriched["count"], 1)
        self.assertEqual(res_enriched["results"][0]["sku"], "SKU-4829-SILK-BLOUSE")

    def test_catalog_get_sku_and_substitutes(self):
        sku_res = catalog_mod.get_sku(catalog_mod.GetSkuRequest(sku="SKU-4829-SILK-BLOUSE"))
        self.assertEqual(sku_res["sku_data"]["price"], 128.00)

        sub_res = catalog_mod.get_substitutes(catalog_mod.SubstitutesRequest(sku="SKU-4829-SILK-BLOUSE"))
        self.assertEqual(sub_res["substitute_count"], 1)
        self.assertEqual(sub_res["substitutes"][0]["sku"], "SKU-4830-SILK-SHIRT")

    def test_catalog_trust_analyst_containment(self):
        # Trust analyst must be DENIED catalog write permissions
        req = catalog_mod.UpdateAttributesRequest(
            sku="SKU-4829-SILK-BLOUSE",
            attributes={"test_attr": {"value": "malicious"}}
        )
        with self.assertRaises(HTTPException) as ctx:
            catalog_mod.update_attributes(req, x_agent_id="ag-agent-trust-analyst")
        self.assertEqual(ctx.exception.status_code, 403)

    # --------------------------------------------------------------------------
    # 2. mcp-promise Tests
    # --------------------------------------------------------------------------
    def test_promise_health(self):
        res = promise_mod.healthz()
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["server"], "mcp-promise")

    def test_promise_fanout_and_cutoffs(self):
        req = promise_mod.PromiseFanoutRequest(
            sku="SKU-4829-SILK-BLOUSE",
            destination_pincode="98101",
            target_delivery_date="2026-10-10T14:00:00Z"
        )
        res = promise_mod.promise_fanout(req)
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(len(res["candidates"]), 2)

        # DC-NORTH candidate has cutoff met; STORE-042 missed cutoff
        cand_dc = next(c for c in res["candidates"] if c["node_id"] == "DC-NORTH")
        cand_store = next(c for c in res["candidates"] if c["node_id"] == "STORE-042")
        self.assertTrue(cand_dc["cutoff_met"])
        self.assertFalse(cand_store["cutoff_met"])

    def test_promise_compute_atp_and_transit(self):
        atp_req = promise_mod.ComputeAtpRequest(
            sku="SKU-4829-SILK-BLOUSE",
            node_id="DC-NORTH",
            on_hand=20,
            reserved=3,
            safety_stock=2,
            requested_qty=1
        )
        atp_res = promise_mod.compute_atp(atp_req)
        self.assertEqual(atp_res["atp_units"], 15)
        self.assertTrue(atp_res["condition_passed"])
        self.assertTrue(atp_res["computation_id"].startswith("calc-atp-"))

        transit_req = promise_mod.ComputeTransitRequest(
            origin_node="DC-NORTH",
            destination_pincode="98101",
            max_transit_hours=24.0
        )
        transit_res = promise_mod.compute_transit(transit_req)
        self.assertEqual(transit_res["transit_hours"], 18.5)
        self.assertTrue(transit_res["isochrone_feasible"])

    # --------------------------------------------------------------------------
    # 3. mcp-commerce Tests
    # --------------------------------------------------------------------------
    def test_commerce_health(self):
        res = commerce_mod.healthz()
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["server"], "mcp-commerce")

    def test_commerce_calculators(self):
        landed = commerce_mod.compute_landed_cost(commerce_mod.LandedCostRequest(
            base_price=100.0,
            shipping_cost=15.0,
            handling_fee=5.0,
            duty_pct=10.0
        ))
        self.assertEqual(landed["total_landed_cost"], 130.00)
        self.assertTrue(landed["computation_id"].startswith("calc-landed-"))

        margin = commerce_mod.compute_margin(commerce_mod.MarginRequest(
            price=150.0,
            landed_cost=65.0,
            fulfilment_cost=15.0,
            shipping_cost=10.0,
            policy_floor_pct=18.0
        ))
        # (150 - 65 - 15 - 10) / 150 = 60 / 150 = 40.0%
        self.assertEqual(margin["realized_margin_pct"], 40.0)
        self.assertTrue(margin["floor_satisfied"])

    def test_commerce_mandate_anti_replay(self):
        # Replayed nonce must fail freshness check
        req_bad = commerce_mod.VerifyMandateRequest(
            mandate_id="ap2-mandate-09",
            signature="sig_demo",
            amount=128.00,
            nonce="replayed_nonce_test_attack"
        )
        res_bad = commerce_mod.verify_mandate(req_bad)
        self.assertFalse(res_bad["valid"])
        self.assertTrue(res_bad["is_replayed"])

    def test_commerce_ledger_append_and_containment(self):
        # 1. Trust analyst must be DENIED ledger append
        req = commerce_mod.AppendLedgerRequest(
            txn_id="txn-test-containment",
            sku="SKU-4829-SILK-BLOUSE",
            quantity=1,
            unit_price=128.00,
            fulfilment_node_id="DC-NORTH",
            carrier_id="fedex_express",
            buyer_agent_id="buyer-hostile-482",
            mandate_id="ap2-mandate-fail"
        )
        with self.assertRaises(HTTPException) as ctx:
            commerce_mod.append_ledger(req, x_agent_id="ag-agent-trust-analyst")
        self.assertEqual(ctx.exception.status_code, 403)

        # 2. Authorized supervisor appends commitment successfully
        rec = commerce_mod.append_ledger(req, x_agent_id="orch-commerce-supervisor")
        self.assertEqual(rec["status"], "COMMITTED")
        self.assertGreater(rec["sequence_num"], 1)

        # 3. Chain integrity check passes
        integrity = commerce_mod.verify_chain_integrity()
        self.assertTrue(integrity["verified"])
        self.assertEqual(integrity["status"], "CHAIN_INTEGRITY_VERIFIED")

if __name__ == "__main__":
    unittest.main(verbosity=2)
