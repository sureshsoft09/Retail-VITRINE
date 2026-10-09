"""Transit & Carrier Cutoff deterministic calculator.

Evaluates whether transit time from fulfilment node to delivery pincode
meets the delivery deadline before carrier daily cutoff.
"""

from datetime import datetime, timezone
from typing import Dict, Any

def evaluate_transit_feasibility(
    order_timestamp: datetime,
    carrier_cutoff: datetime,
    transit_hours: float,
    deadline: datetime,
) -> Dict[str, Any]:
    """Pure calculation of transit feasibility and cutoff margin."""
    # Ensure all timestamps are comparable (timezone-aware)
    if order_timestamp.tzinfo is None:
        order_timestamp = order_timestamp.replace(tzinfo=timezone.utc)
    if carrier_cutoff.tzinfo is None:
        carrier_cutoff = carrier_cutoff.replace(tzinfo=timezone.utc)
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    # Cutoff check: Did order arrive before carrier cutoff?
    cutoff_missed = order_timestamp > carrier_cutoff
    cutoff_delta_seconds = (carrier_cutoff - order_timestamp).total_seconds()

    # Feasibility check: Can carrier deliver by deadline?
    # Estimated arrival = order_timestamp + transit_hours
    estimated_arrival_timestamp = order_timestamp.timestamp() + (transit_hours * 3600)
    deadline_missed = estimated_arrival_timestamp > deadline.timestamp()

    is_feasible = (not cutoff_missed) and (not deadline_missed)

    return {
        "is_feasible": is_feasible,
        "cutoff_missed": cutoff_missed,
        "cutoff_delta_hours": round(cutoff_delta_seconds / 3600.0, 2),
        "deadline_missed": deadline_missed,
        "transit_hours": transit_hours,
        "reason": (
            f"Carrier cutoff missed by {abs(round(cutoff_delta_seconds / 3600.0, 1))}h"
            if cutoff_missed
            else ("Delivery deadline cannot be met" if deadline_missed else "Transit feasible")
        ),
    }
