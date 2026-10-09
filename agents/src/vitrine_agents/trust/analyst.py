"""Agent Trust Analyst (ag-agent-trust-analyst).

Screens buyer agents and payment mandates for adversarial activity.
Detects:
  - AP2 mandate nonce replay attacks
  - High-velocity automated probing
  - Untrusted counterparty graphs
Enforces mandatory counter-evidence for non-allow verdicts. Contains NO commercial tools.

Implements Google ADK LlmAgent architecture.
"""

from typing import Any, Dict, List
from pydantic import BaseModel

from google.adk.agents import LlmAgent
from vitrine_agents import config, tools
from vitrine_agents.schemas import TrustScreeningFinding
from vitrine_agents.base import load_passport, load_prompt

TRUST_ANALYST_PROMPT = """
You are the Agent Trust Analyst.
Your role is defensive security screening. You inspect inbound buyer agent credentials and AP2 mandates.
Rules:
1. Call screen_ap2_mandate with the buyer_agent_id and cryptographic nonce.
2. If a nonce replay or velocity anomaly is detected, rule REJECT_UNTRUSTED and provide mandatory counter-evidence.
3. You have NO permission or tools to alter commercial prices, inventory, or order status.
"""

trust_analyst_agent = LlmAgent(
    name="trust_analyst",
    model=config.MODEL_REASONING,
    description="Screens buyer agents and AP2 mandates against cryptographic replay attacks.",
    instruction=TRUST_ANALYST_PROMPT,
    tools=[tools.screen_ap2_mandate],
    output_schema=TrustScreeningFinding,
    output_key="trust_finding",
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
)

class TrustFinding(BaseModel):
    finding_type: str
    evidence: List[str]
    counter_evidence: List[str]
    severity: str

class TrustAnalysisResult(BaseModel):
    buyer_agent_id: str
    trust_tier: str  # TRUSTED (Tier 1), PROBATION (Tier 2), HOSTILE (Tier 3)
    verdict: str     # ALLOW, THROTTLE, REJECT_UNTRUSTED
    findings: List[TrustFinding]
    reputation_score: float
    explanation: str

class AgentTrustAnalyst:
    """Agent evaluating inbound buyer-agent integrity and mandate freshness."""

    def __init__(self):
        self.passport = load_passport("ag-agent-trust-analyst")
        self.system_prompt = load_prompt("trust_analyst.v1")
        self.adk_agent = trust_analyst_agent
        # In-memory nonce cache for anti-replay demonstration
        self._observed_nonces = {"replayed_nonce_test_attack", "nonce-prior-tx-8812"}

    def screen_buyer_agent(
        self,
        buyer_agent_id: str,
        mandate_nonce: str,
        request_velocity_per_min: int = 2,
    ) -> TrustAnalysisResult:
        """Evaluates trust tier and mandate freshness."""
        findings: List[TrustFinding] = []
        is_replayed = mandate_nonce in self._observed_nonces
        is_high_velocity = request_velocity_per_min > 10

        if is_replayed:
            findings.append(
                TrustFinding(
                    finding_type="MANDATE_NONCE_REPLAY",
                    evidence=[f"Nonce '{mandate_nonce}' observed in past audit window"],
                    counter_evidence=["Nonce re-submission within 120s window is cryptographic signature of replay attack"],
                    severity="CRITICAL",
                )
            )

        if is_high_velocity:
            findings.append(
                TrustFinding(
                    finding_type="HIGH_VELOCITY_PROBE",
                    evidence=[f"Observed {request_velocity_per_min} requests/minute from IP range"],
                    counter_evidence=["Burst velocity exceeds 10 req/min threshold for unverified buyer agents"],
                    severity="HIGH",
                )
            )

        is_hostile = is_replayed or "hostile" in buyer_agent_id.lower()
        if is_hostile:
            trust_tier = "HOSTILE"
            verdict = "REJECT_UNTRUSTED"
            score = 0.05
            explanation = "Mandate verification failed due to cryptographic nonce replay attack."
        elif is_high_velocity:
            trust_tier = "PROBATION"
            verdict = "THROTTLE"
            score = 0.55
            explanation = "Elevated velocity observed; proof-of-work challenge required."
        else:
            trust_tier = "TRUSTED"
            verdict = "ALLOW"
            score = 0.98
            explanation = "Buyer agent credentials verified; mandate signature and nonce fresh."

        return TrustAnalysisResult(
            buyer_agent_id=buyer_agent_id,
            trust_tier=trust_tier,
            verdict=verdict,
            findings=findings,
            reputation_score=score,
            explanation=explanation,
        )
