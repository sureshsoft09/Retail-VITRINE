"""Unit tests for deterministic calculators and 11-condition commitment gate.

Runs locally in milliseconds with 0 cloud dependencies.
"""

from datetime import datetime, timedelta, timezone
import pytest
from backend.app.core.calculators.atp import calculate_atp
from backend.app.core.calculators.transit import evaluate_transit_feasibility
from backend.app.core.calculators.margin import calculate_margin
from backend.app.core.services.gate import CommitmentGate

def test_atp_calculation():
    # 10 on hand, 2 reserved, 3 safety stock -> 5 available. Requesting 3 should pass
    res = calculate_atp(on_hand=10, reserved=2, safety_stock=3, requested_quantity=3)
    assert res["is_satisfiable"] is True
    assert res["available_units"] == 5

    # Requesting 6 should fail
    res2 = calculate_atp(on_hand=10, reserved=2, safety_stock=3, requested_quantity=6)
    assert res2["is_satisfiable"] is False

def test_transit_feasibility_and_cutoff():
    now = datetime.now(timezone.utc)
    future_cutoff = now + timedelta(hours=4)
    past_cutoff = now - timedelta(hours=6)
    deadline = now + timedelta(hours=24)

    # Order placed 6 hours AFTER carrier cutoff -> Cutoff missed!
    res_missed = evaluate_transit_feasibility(now, past_cutoff, transit_hours=12.0, deadline=deadline)
    assert res_missed["is_feasible"] is False
    assert res_missed["cutoff_missed"] is True

    # Order placed before carrier cutoff -> Feasible
    res_ok = evaluate_transit_feasibility(now, future_cutoff, transit_hours=12.0, deadline=deadline)
    assert res_ok["is_feasible"] is True
    assert res_ok["cutoff_missed"] is False

def test_margin_calculation():
    # Price $100, costs $70 -> margin 30% (above 18% floor)
    res_ok = calculate_margin(unit_price=100.0, landed_cost=50.0, fulfilment_cost=10.0, shipping_cost=10.0)
    assert res_ok["violates_floor"] is False
    assert res_ok["margin_pct"] == 30.0

    # Price $100, costs $85 -> margin 15% (violates 18% floor)
    res_violation = calculate_margin(unit_price=100.0, landed_cost=65.0, fulfilment_cost=10.0, shipping_cost=10.0)
    assert res_violation["violates_floor"] is True
    assert res_violation["margin_pct"] == 15.0

def test_11_condition_gate_evaluation():
    atp_ok = calculate_atp(10, 0, 2, 1)
    now = datetime.now(timezone.utc)
    cutoff = now + timedelta(hours=5)
    deadline = now + timedelta(hours=24)
    transit_ok = evaluate_transit_feasibility(now, cutoff, 8.0, deadline)
    margin_ok = calculate_margin(100.0, 50.0, 10.0, 10.0)
    mandate_ok = {"mandate_id": "ap2-001", "signature_valid": True, "is_replayed": False}

    # All conditions pass
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
    assert gate_res["passed"] is True
    assert len(gate_res["conditions"]) == 11
    assert all(c["passed"] for c in gate_res["conditions"])

    # Carrier cutoff failure -> Gate fails closed
    transit_bad = evaluate_transit_feasibility(now, now - timedelta(hours=2), 8.0, deadline)
    gate_res_fail = CommitmentGate.evaluate(
        txn_id="txn-test-02",
        atp_check=atp_ok,
        transit_check=transit_bad,
        margin_check=margin_ok,
        ap2_mandate=mandate_ok,
        order_total=100.0,
        discount_pct=5.0,
        buyer_reputation_score=0.95,
    )
    assert gate_res_fail["passed"] is False
    carrier_cond = next(c for c in gate_res_fail["conditions"] if c["condition_id"] == "COND_01_CARRIER_CUTOFF")
    assert carrier_cond["passed"] is False
