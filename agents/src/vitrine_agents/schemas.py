"""Structured outputs for Google ADK agents in VITRINE.

Both the reasoning pipeline and downstream services (BFF, UCP, Gate) depend on these shapes.
"""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

# ------------------------------------------------------------------------------
# Promise Engine Schemas
# ------------------------------------------------------------------------------

class CandidatePromiseFinding(BaseModel):
    """Feasible fulfillment commitment synthesised from network nodes."""
    fulfilment_node_id: str = Field(description="Origin store or warehouse node ID (e.g. STORE-042, DC-NORTH).")
    sku: str = Field(description="Fulfilled product SKU identifier.")
    atp_units: int = Field(ge=0, description="Available to promise inventory at candidate node.")
    transit_hours: float = Field(ge=0.0, description="Estimated transit time in decimal hours.")
    carrier: str = Field(description="Selected carrier (e.g. FedEx Standard, OnTrac SameDay).")
    carrier_cutoff: str = Field(description="ISO 8601 UTC timestamp of carrier dispatch cutoff window.")
    unit_price: float = Field(ge=0.0, description="Base unit price for product in USD.")
    shipping_cost: float = Field(ge=0.0, description="Shipping cost in USD.")
    margin_pct: float = Field(description="Gross profit margin percentage after landed costs.")
    guaranteed_delivery_utc: str = Field(description="Guaranteed SLA delivery window in ISO 8601 UTC.")
    confidence: float = Field(ge=0.0, le=1.0, description="Algorithmic confidence in promise feasibility.")

# ------------------------------------------------------------------------------
# Commitment Critic Schemas
# ------------------------------------------------------------------------------

CriticVerdict = Literal["APPROVED", "BLOCKED", "NEEDS_SUBSTITUTION"]

class ObjectionFinding(BaseModel):
    """Specific objection raised during adversarial critique."""
    condition_id: str = Field(description="Condition identifier (e.g. COND_01_CARRIER_CUTOFF, COND_02_ATP_SAFETY_STOCK).")
    summary: str = Field(description="Succinct 1-sentence objection summary.")
    detail: str = Field(description="Exact numeric discrepancy, cutoff delta, or margin breach detail.")
    blocking: bool = Field(default=True, description="Whether this objection blocks commitment execution.")
    suggested_resolution: str = Field(description="Actionable remediation path for substitution strategist.")

class CritiqueFinding(BaseModel):
    """Adversarial ruling from Commitment Critic with fresh context."""
    verdict: CriticVerdict = Field(description="Overall critique verdict.")
    passed: bool = Field(description="True only when zero blocking objections exist.")
    objections: List[ObjectionFinding] = Field(default_factory=list, description="List of raised objections.")
    evaluation_id: str = Field(description="Cryptographic evaluation ID referencing calculator state.")
    audit_notes: str = Field(description="Fresh context audit notes establishing why checks were rerun.")

# ------------------------------------------------------------------------------
# Substitution Strategist Schemas
# ------------------------------------------------------------------------------

class SubstitutionFinding(BaseModel):
    """Recovered substitute preserving all buyer hard constraints."""
    has_substitute: bool = Field(description="True if an alternative satisfying hard constraints was discovered.")
    substitute_sku: Optional[str] = Field(default=None, description="Recommended alternative product SKU.")
    substitute_name: Optional[str] = Field(default=None, description="Display title for substitute.")
    shopper_reason: Optional[str] = Field(default=None, description="Clear, customer-facing reason explaining substitution.")
    preserved_hard_constraints: List[str] = Field(default_factory=list, description="List of hard constraints verified as 100% preserved.")
    origin_node: Optional[str] = Field(default=None, description="Fulfillment node fulfilling substitute.")
    atp_units: Optional[int] = Field(default=None, description="Inventory depth for substitute.")
    price_delta: float = Field(default=0.0, description="Price difference relative to original requested item.")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)

# ------------------------------------------------------------------------------
# Negotiation Agent Schemas
# ------------------------------------------------------------------------------

class NegotiationOfferFinding(BaseModel):
    """Commercial offer formatted for UCP protocol turn."""
    offer_id: str = Field(description="Unique UCP offer ID.")
    sku: str = Field(description="Product SKU.")
    unit_price: float = Field(description="Discounted final unit price in USD.")
    discount_pct: float = Field(description="Applied discount percentage.")
    total_price: float = Field(description="Final total price including shipping.")
    projected_margin_pct: float = Field(description="Realized margin percentage satisfying policy floor.")
    status: Literal["OFFER_PRESENTED", "REJECTED_OUT_OF_BOUNDS"] = Field(description="Offer disposition.")
    explanation: str = Field(description="Commercial basis for the offer.")

# ------------------------------------------------------------------------------
# Agent Trust Analyst Schemas
# ------------------------------------------------------------------------------

TrustTier = Literal["ENTERPRISE", "VERIFIED", "PROVISIONAL", "HOSTILE"]

class TrustScreeningFinding(BaseModel):
    """AP2 mandate and cryptographic buyer verification finding."""
    buyer_agent_id: str = Field(description="Identity of incoming buyer agent.")
    trust_tier: TrustTier = Field(description="Resolved trust tier.")
    verdict: Literal["ACCEPT", "CHALLENGE_REQUIRED", "REJECT_UNTRUSTED"] = Field(description="Gateway screening disposition.")
    risk_score: float = Field(ge=0.0, le=1.0, description="Calculated risk score.")
    findings: List[str] = Field(default_factory=list, description="Observed security or cryptographic signals.")
    counter_evidence: Optional[str] = Field(default=None, description="Counter-evidence if hostile replay or velocity breach.")
