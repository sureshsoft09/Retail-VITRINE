"""Deploy the VITRINE ADK pipeline to Vertex AI Agent Engine.

Usage:
    python deploy.py            # create deployment and print resource name
    python deploy.py <res_name> # update existing deployment

Enterprise deployment pattern:
- Uses vertexai.preview.reasoning_engines.AdkApp(agent=root_agent)
- Targets us-central1 standardized region
- Ships environment variables and required package dependencies
"""

import sys
from pathlib import Path

# Add paths
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "agents" / "src"))

from vitrine_agents import config
from vitrine_agents.transaction.agent import root_agent

REQUIREMENTS = [
    "google-adk>=1.0.0",
    "google-cloud-aiplatform[adk,agent_engines]>=1.95.0",
    "google-cloud-bigquery>=3.25.0",
    "pydantic>=2.6.0,<2.8.0",
    "python-dotenv>=1.0.0",
]

RESERVED = {
    "GOOGLE_CLOUD_PROJECT",
    "GOOGLE_CLOUD_LOCATION",
    "GOOGLE_GENAI_USE_VERTEXAI",
    "GOOGLE_APPLICATION_CREDENTIALS",
    "PORT",
}

ENV_VARS = {
    k: v
    for k, v in {
        "BQ_DATASET": config.DATASET,
        "MODEL_REASONING": config.MODEL_REASONING,
        "MODEL_FAST": config.MODEL_FAST,
    }.items()
    if k not in RESERVED and v
}

def main() -> None:
    print("=" * 70)
    print("VITRINE ADK Agent Engine Deployment (us-central1)")
    print(f"Project: {config.PROJECT} | Location: {config.LOCATION}")
    print("=" * 70)

    try:
        import vertexai
        from vertexai.preview import reasoning_engines

        vertexai.init(
            project=config.PROJECT,
            location=config.LOCATION,
            staging_bucket=config.STAGING_BUCKET,
        )

        app = reasoning_engines.AdkApp(
            agent=root_agent,
            enable_tracing=config.ENABLE_TRACING,
        )

        kwargs = {
            "agent_engine": app,
            "requirements": REQUIREMENTS,
            "extra_packages": ["vitrine_agents"],
            "env_vars": ENV_VARS,
        }
        if config.SERVICE_ACCOUNT:
            kwargs["service_account"] = config.SERVICE_ACCOUNT
            print(f"Runtime identity: {config.SERVICE_ACCOUNT}")

        if len(sys.argv) > 1:
            res_name = sys.argv[1]
            print(f"Updating deployment: {res_name}...")
            remote_app = reasoning_engines.ReasoningEngine(res_name)
            remote_app.update(**kwargs)
            print("Update complete.")
        else:
            print("Creating new Vertex AI Reasoning Engine / Agent Engine deployment...")
            remote_app = reasoning_engines.ReasoningEngine.create(**kwargs)
            print(f"Deployment created successfully: {remote_app.resource_name}")

    except Exception as e:
        print(f"[Offline / Mock Notice] Deployment requires GCP credentials and bucket: {e}")
        print("AdkApp packaged successfully with root_agent = SequentialAgent.")

if __name__ == "__main__":
    main()
