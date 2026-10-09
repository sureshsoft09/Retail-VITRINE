"""Supplier Risk Sentinel (sent-supplier-risk-watch).

Runs on Cloud Run / Cloud Scheduler every 6 hours.
Monitors external supplier disruption news and port congestion signals.
Applies a two-source rule before tripping the SKU circuit breaker.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
from pydantic import BaseModel

class SupplierRiskEvent(BaseModel):
    supplier_id: str
    affected_skus: List[str]
    severity: str
    sources: List[str]
    circuit_breaker_tripped: bool
    summary: str

class SupplierRiskSentinel:
    """Sentinel agent for supplier disruption monitoring."""

    def __init__(self):
        self.sentinel_id = "sent-supplier-risk-watch"

    def evaluate_supplier_signals(
        self,
        supplier_id: str,
        signals: List[Dict[str, Any]],
        affected_skus: List[str],
    ) -> SupplierRiskEvent:
        """Applies the two-source rule before tripping the circuit breaker."""
        # Two-source rule: requires >= 2 distinct credible reports
        distinct_sources = {s.get("source_uri") for s in signals if s.get("source_uri")}
        tripped = len(distinct_sources) >= 2

        return SupplierRiskEvent(
            supplier_id=supplier_id,
            affected_skus=affected_skus,
            severity="HIGH" if tripped else "LOW",
            sources=list(distinct_sources),
            circuit_breaker_tripped=tripped,
            summary=(
                f"Two-source confirmed logistics shutdown for supplier {supplier_id}. Circuit breaker TRIPPED."
                if tripped
                else f"Single source signal for supplier {supplier_id}. Circuit breaker clear (watch status)."
            ),
        )
