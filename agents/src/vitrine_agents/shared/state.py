"""Shared models and state across VITRINE agents."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class NegotiationConstraint(BaseModel):
    delivery_pincode: str
    latest_delivery_date: str
    max_budget: Optional[float] = None
    target_sku: Optional[str] = None
    required_attributes: Dict[str, str] = Field(default_factory=dict)
    substitution_acceptable: bool = True

class SessionState(BaseModel):
    txn_id: str
    buyer_agent_id: str
    turn_count: int = 1
    max_turns: int = 5
    status: str = "NEGOTIATING"
    constraints: NegotiationConstraint
    active_offer: Optional[Dict[str, Any]] = None
    candidate_promises: List[Dict[str, Any]] = Field(default_factory=list)
    critic_objections: List[Dict[str, Any]] = Field(default_factory=list)
    step_seq: int = 0
    session_budget_cents: int = 0
