"""Standard library unittest runner for VITRINE.

Executes all test cases without requiring third-party test runners.
"""

import asyncio
from datetime import datetime, timedelta, timezone
import sys
import unittest
from pathlib import Path

# Add Src, Src/agents/src, and Src/agents to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "agents" / "src"))
sys.path.insert(0, str(root_dir / "agents"))

from backend.app.core.calculators.atp import calculate_atp
from backend.app.core.calculators.transit import evaluate_transit_feasibility
from backend.app.core.calculators.margin import calculate_margin
from backend.app.core.services.gate import CommitmentGate

from vitrine_agents.transaction.promise_engine import PromiseEngineAgent
from vitrine_agents.transaction.critic import CommitmentCriticAgent
from vitrine_agents.transaction.substitution import SubstitutionStrategistAgent
from vitrine_agents.transaction.agent import VitrineTransactionSupervisor
from vitrine_agents.trust.analyst import AgentTrustAnalyst
from buyer_agent.buyer import DemoBuyerAgent

class TestCalculators(unittest.TestCase):
    def test_atp_calculation(self):
        res = calculate_atp(on_hand=10, reserved=2, safety_stock=3, requested_quantity=3)
        self.assertTrue(res["is_satisfiable"])
        self.assertEqual(res["available_units"], 5)

        res2 = calculate_atp(on_hand=10, reserved=2, safety_stock=3, requested_quantity=6)
        self.assertFalse(res2["is_satisfiable"])

    def test_transit_feasibility(self):
        now = datetime.now(timezone.utc)
        future_cutoff = now + timedelta(hours=4)
        past_cutoff = now - timedelta(hours=6)
        deadline = now + timedelta(hours=24)

        res_missed = evaluate_transit_feasibility(now, past_cutoff, transit_hours=12.0, deadline=deadline)
        self.assertFalse(res_missed["is_feasible"])
        self.assertTrue(res_missed["cutoff_missed"])

        res_ok = evaluate_transit_feasibility(now, future_cutoff, transit_hours=12.0, deadline=deadline)
        self.assertTrue(res_ok["is_feasible"])

    def test_margin_calculation(self):
        res_ok = calculate_margin(unit_price=100.0, landed_cost=50.0, fulfilment_cost=10.0, shipping_cost=10.0)
        self.assertFalse(res_ok["violates_floor"])
        self.assertEqual(res_ok["margin_pct"], 30.0)

        res_fail = calculate_margin(unit_price=100.0, landed_cost=65.0, fulfilment_cost=10.0, shipping_cost=10.0)
        self.assertTrue(res_fail["violates_floor"])

    def test_11_condition_gate(self):
        atp_ok = calculate_atp(10, 0, 2, 1)
        now = datetime.now(timezone.utc)
        cutoff = now + timedelta(hours=5)
        deadline = now + timedelta(hours=24)
        transit_ok = evaluate_transit_feasibility(now, cutoff, 8.0, deadline)
        margin_ok = calculate_margin(100.0, 50.0, 10.0, 10.0)
        mandate_ok = {"mandate_id": "ap2-001", "signature_valid": True, "is_replayed": False}

        gate_res = CommitmentGate.evaluate(
            txn_id="txn-test-01",
            atp_check=atp_ok,
            transit_check=transit_ok,
            margin_check=margin_ok,
            ap2_mandate=mandate_ok,
            order_total=100.0,
            discount_pct=5.0,
            buyer_reputation_score=0.95,
        )
        self.assertTrue(gate_res["passed"])
        self.assertEqual(len(gate_res["conditions"]), 11)

class TestAgentLayer(unittest.TestCase):
    def test_promise_candidates(self):
        engine = PromiseEngineAgent()
        candidates = engine.evaluate_candidates("SKU-4829-SILK-BLOUSE", "98101", "2026-10-10T18:00:00Z")
        self.assertEqual(len(candidates), 2)
        self.assertEqual(candidates[0].fulfilment_node_id, "DC-NORTH")

    def test_critic_adversarial_block(self):
        critic = CommitmentCriticAgent()
        engine = PromiseEngineAgent()
        candidates = engine.evaluate_candidates("SKU-4829-SILK-BLOUSE", "98101", "2026-10-10T18:00:00Z")
        critique = critic.evaluate_promise(candidates[1].model_dump())
        self.assertFalse(critique.passed)
        self.assertEqual(critique.verdict, "BLOCKED")
        self.assertEqual(critique.objections[0].condition_id, "COND_01_CARRIER_CUTOFF")

    def test_substitution_recovery(self):
        strategist = SubstitutionStrategistAgent()
        sub_res = strategist.find_substitutes(
            blocked_sku="SKU-4829-SILK-BLOUSE",
            hard_constraints={"material": "silk"},
            critic_objection="Carrier cutoff missed",
        )
        self.assertTrue(sub_res.has_substitute)
        self.assertEqual(sub_res.recommended_alternative.sku, "SKU-4830-SILK-SHIRT")

    def test_supervisor_full_flow(self):
        supervisor = VitrineTransactionSupervisor()
        buyer = DemoBuyerAgent(persona="honest_shopper")
        req = buyer.build_initial_request("txn-sync-01")
        result = asyncio.run(supervisor.query("txn-sync-01", req.model_dump()))
        self.assertEqual(result["status"], "SUBSTITUTION_OFFER_PRESENTED")
        self.assertIsNotNone(result["active_offer"])
        self.assertGreaterEqual(len(result["step_events"]), 5)

    def test_trust_analyst(self):
        analyst = AgentTrustAnalyst()
        buyer = DemoBuyerAgent(persona="hostile")
        req = buyer.build_initial_request("txn-hostile-01")
        res = analyst.screen_buyer_agent(req.buyer_agent_id, req.ap2_mandate["nonce"])
        self.assertEqual(res.verdict, "REJECT_UNTRUSTED")
        self.assertEqual(res.trust_tier, "HOSTILE")

from tests.test_backend import TestBackendServices
from tests.test_mcp_servers import TestMcpServers

if __name__ == "__main__":
    unittest.main(verbosity=2)


