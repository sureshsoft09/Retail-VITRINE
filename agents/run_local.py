"""Run the VITRINE ADK pipeline locally. No deployment needed.

Usage:
    python run_local.py
    python run_local.py SKU-4829-SILK-BLOUSE

Enterprise Google ADK local runner architecture:
- Uses google.adk.runners.InMemoryRunner when Gemini/Vertex credentials are set
- Automatically falls back to deterministic supervisor execution in offline sandbox mode
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Add package paths
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "agents" / "src"))

from vitrine_agents.transaction.agent import root_agent, VitrineTransactionSupervisor

async def main(sku: str = "SKU-4829-SILK-BLOUSE") -> None:
    print("=" * 70)
    print("VITRINE ADK Local Runner (InMemoryRunner / Agent Engine Pipeline)")
    print(f"Target SKU: {sku}")
    print(f"ADK Root Agent: {root_agent.name}")
    print(f"ADK Sub-Agents: {[sa.name for sa in root_agent.sub_agents]}")
    print("=" * 70)

    has_credentials = bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"))

    if has_credentials:
        try:
            from google.adk.runners import InMemoryRunner
            from google.genai import types

            runner = InMemoryRunner(agent=root_agent, app_name="vitrine")
            session = await runner.session_service.create_session(app_name="vitrine", user_id="dev-buyer")

            prompt = (
                f"Fulfill order for {sku} to postal code 98101 before Friday 16:00 UTC. "
                f"Hard constraints: fabric='100% Mulberry Silk', sleeve='French Cuffs'."
            )
            msg = types.Content(role="user", parts=[types.Part(text=prompt)])

            print("\nStreaming live ADK pipeline events via Gemini:")
            async for event in runner.run_async(user_id="dev-buyer", session_id=session.id, new_message=msg):
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if hasattr(part, "function_call") and part.function_call:
                            print(f"  [tool] {part.function_call.name}({dict(part.function_call.args)})")
                if event.is_final_response():
                    print(f"  [{event.author}] done")
            return
        except Exception as e:
            print(f"[Notice] Falling back to deterministic supervisor execution: {e}")

    # Offline / sandbox execution through supervisor
    print("\nRunning multi-agent commerce turn through ADK agent pipeline:")
    supervisor = VitrineTransactionSupervisor()
    result = await supervisor.query(
        session_id="local-session-001",
        input={
            "txn_id": "txn-local-adk-01",
            "buyer_agent_id": "honest-shopper-01",
            "action": "NEGOTIATE",
            "constraints": {
                "sku": sku,
                "pincode": "98101",
                "delivery_by": "2026-10-10T16:00:00Z",
                "hard_constraints": {"fabric": "100% Mulberry Silk", "sleeve": "French Cuffs"},
            },
        },
    )

    print(f"\nStatus: {result['status']}")
    print(f"Active Offer ID: {result['active_offer']['offer_id']}")
    print(f"Delivered SKU: {result['active_offer']['sku']}")
    print(f"Final Total Price: ${result['active_offer']['total_price']}")
    print(f"Projected Margin: {result['active_offer']['projected_margin_pct']}%")
    print("\nStep Sequence:")
    for step in result["step_events"]:
        print(f"  [{step['step_seq']}] {step['agent']} -> {step['phase']}: {step['message']}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "SKU-4829-SILK-BLOUSE"
    asyncio.run(main(target))
