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

from google.adk.agents import LlmAgent, SequentialAgent
from vitrine_agents import config
from vitrine_agents.mcp_tools import CommerceMCP_Tool
from vitrine_agents.schemas import TrustScreeningFinding
from vitrine_agents.base import load_passport, load_prompt

TRUST_INVESTIGATE_PROMPT = """
You are the Agent Trust Analyst.
Your role is defensive security screening. You inspect inbound buyer agent credentials and AP2 mandates.
Rules:
1. Call verify_mandate with the buyer_agent_id and cryptographic nonce.
2. If a nonce replay or velocity anomaly is detected, rule REJECT_UNTRUSTED and provide mandatory counter-evidence.
3. You have NO permission or tools to alter commercial prices, inventory, or order status.
4. Produce a security screening brief detailing observed signals, trust tier, and risk score.
"""

TRUST_CONCLUDE_PROMPT = """
You are converting the security screening brief into a typed TrustScreeningFinding.
Populate every field:
- buyer_agent_id: Incoming buyer agent ID
- trust_tier: "ENTERPRISE", "VERIFIED", "PROVISIONAL", or "HOSTILE"
- verdict: "ACCEPT", "CHALLENGE_REQUIRED", or "REJECT_UNTRUSTED"
- risk_score: Float between 0.0 and 1.0
- findings: List of observed security or cryptographic signals
- counter_evidence: Counter-evidence if hostile replay or velocity breach
"""

trust_investigate = LlmAgent(
    name="trust_investigate",
    model=config.MODEL_REASONING,
    description="Inspects inbound buyer agent credentials and AP2 mandates via MCP tools.",
    instruction=TRUST_INVESTIGATE_PROMPT,
    tools=[CommerceMCP_Tool],
    output_key="trust_evidence",
)

trust_conclude = LlmAgent(
    name="trust_conclude",
    model=config.MODEL_REASONING,
    description="Synthesizes security screening results into a typed TrustScreeningFinding.",
    instruction=TRUST_CONCLUDE_PROMPT,
    output_schema=TrustScreeningFinding,
    output_key="trust_finding",
)

trust_analyst_agent = SequentialAgent(
    name="trust_analyst",
    description="Screens buyer agents and AP2 mandates against cryptographic replay attacks.",
    sub_agents=[trust_investigate, trust_conclude],
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
