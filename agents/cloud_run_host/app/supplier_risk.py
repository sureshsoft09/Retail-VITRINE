"""Supplier Risk Sentinel for Cloud Run Host.

Runs on Cloud Run / Cloud Scheduler every 6 hours.
Monitors external supplier disruption news and port congestion signals.
Applies a strict two-source rule before tripping the SKU circuit breaker.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class SupplierRiskEvent(BaseModel):
    supplier_id: str
    affected_skus: List[str]
    severity: str  # LOW, MEDIUM, HIGH, CRITICAL
    sources: List[str]
    distinct_source_count: int
    circuit_breaker_tripped: bool
    summary: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SupplierRiskSentinel:
    """Sentinel agent for autonomous supplier disruption monitoring."""

    def __init__(self):
        self.sentinel_id = "sent-supplier-risk-watch"

    def evaluate_supplier_signals(
        self,
        supplier_id: str,
        signals: List[Dict[str, Any]],
        affected_skus: Optional[List[str]] = None,
    ) -> SupplierRiskEvent:
        """Applies the two-source rule before tripping the circuit breaker."""
        skus = affected_skus or [
            "SKU-4829-SILK-BLOUSE",
            "SKU-4830-SILK-SHIRT",
        ]

        # Extract distinct credible reporting domains/URIs
        distinct_sources = {
            s.get("source_uri") or s.get("source")
            for s in signals
            if (s.get("source_uri") or s.get("source"))
        }
        
        source_count = len(distinct_sources)
        # Two-source rule: requires >= 2 distinct credible reports
        tripped = source_count >= 2

        if tripped:
            severity = "HIGH"
            summary = (
                f"Two-source confirmed logistics shutdown for supplier {supplier_id} "
                f"across {source_count} independent sources. SKU circuit breaker TRIPPED."
            )
        else:
            severity = "LOW"
            summary = (
                f"Single-source or unverified signal ({source_count} source) for supplier {supplier_id}. "
                f"Circuit breaker CLEAR (placed on watch status)."
            )

        return SupplierRiskEvent(
            supplier_id=supplier_id,
            affected_skus=skus,
            severity=severity,
            sources=list(distinct_sources),
            distinct_source_count=source_count,
            circuit_breaker_tripped=tripped,
            summary=summary,
        )
