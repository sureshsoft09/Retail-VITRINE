"""Unit tests for the complete VITRINE agent layer.

Validates multi-agent coordination, adversarial critique, substitution recovery,
and buyer trust screening.
"""

import pytest
from pathlib import Path
import sys

# Ensure cloud_run_host is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "agents" / "cloud_run_host"))

from vitrine_agents.transaction.promise_engine import PromiseEngineAgent
from vitrine_agents.transaction.critic import CommitmentCriticAgent
from vitrine_agents.transaction.substitution import SubstitutionStrategistAgent
from vitrine_agents.transaction.negotiation import NegotiationAgent
from vitrine_agents.transaction.agent import VitrineTransactionSupervisor
from app.trust_analyst import AgentTrustAnalyst
from buyer_agent.buyer import DemoBuyerAgent

def test_promise_engine_candidates():
    engine = PromiseEngineAgent()
    candidates = engine.evaluate_candidates(
        sku="SKU-4829-SILK-BLOUSE",
        destination_pincode="98101",
        target_delivery_date="2026-10-10T18:00:00Z"
    )
    assert len(candidates) == 2
    assert candidates[0].fulfilment_node_id == "DC-NORTH"
    assert candidates[0].atp_units > 0
    assert candidates[0].computation_id.startswith("comp-")

def test_commitment_critic_adversarial_block():
    critic = CommitmentCriticAgent()
    engine = PromiseEngineAgent()
    candidates = engine.evaluate_candidates("SKU-4829-SILK-BLOUSE", "98101", "2026-10-10T18:00:00Z")
    
    # Store candidate has cutoff in the past
    store_candidate = candidates[1]
    critique = critic.evaluate_promise(store_candidate.model_dump())
    
    assert critique.passed is False
    assert critique.verdict == "BLOCKED"
    assert len(critique.objections) >= 1
    assert critique.objections[0].condition_id == "COND_01_CARRIER_CUTOFF"
    assert "missed by" in critique.objections[0].detail
    assert critique.objections[0].suggested_resolution != ""

def test_substitution_strategist_recovery():
    strategist = SubstitutionStrategistAgent()
    sub_res = strategist.find_substitutes(
        blocked_sku="SKU-4829-SILK-BLOUSE",
        hard_constraints={"material": "silk", "deadline": "Friday"},
        critic_objection="Carrier cutoff missed by 6.0 hours",
    )
    assert sub_res.has_substitute is True
    assert sub_res.recommended_alternative is not None
    assert sub_res.recommended_alternative.sku == "SKU-4830-SILK-SHIRT"
    assert sub_res.recommended_alternative.margin_pct > 25.0

@pytest.mark.asyncio
async def test_supervisor_full_transaction_flow():
    supervisor = VitrineTransactionSupervisor()
    buyer = DemoBuyerAgent(persona="honest_shopper")
    initial_req = buyer.build_initial_request("txn-test-8899")

    result = await supervisor.query("txn-test-8899", initial_req.model_dump())
    
    assert result["txn_id"] == "txn-test-8899"
    assert result["status"] == "SUBSTITUTION_OFFER_PRESENTED"
    assert result["active_offer"] is not None
    assert len(result["objections"]) >= 1
    assert len(result["step_events"]) >= 5 # Live steps recorded for theatre

def test_trust_analyst_replay_detection():
    analyst = AgentTrustAnalyst()
    hostile_buyer = DemoBuyerAgent(persona="hostile")
    req = hostile_buyer.build_initial_request("txn-hostile-11")

    res = analyst.screen_buyer_agent(
        buyer_agent_id=req.buyer_agent_id,
        mandate_nonce=req.ap2_mandate["nonce"],
    )
    assert res.verdict == "REJECT_UNTRUSTED"
    assert res.trust_tier == "HOSTILE"
    assert len(res.findings) >= 1
    assert res.findings[0].finding_type == "MANDATE_NONCE_REPLAY"
    assert len(res.findings[0].counter_evidence) >= 1
