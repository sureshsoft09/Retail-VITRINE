"""Deploy vitrine-transaction root orchestrator to Vertex AI Agent Engine.

Standardized Region: us-central1
"""

import os
import vertexai
from vertexai import agent_engines
from vitrine_agents.transaction.agent import root_agent

PROJECT_ID = os.getenv("GCP_PROJECT_ID", "your-gcp-project-id")
REGION = os.getenv("GCP_REGION", "us-central1")
STAGING_BUCKET = os.getenv("STAGING_BUCKET", f"gs://{PROJECT_ID}-agent-engine-staging")

def deploy():
    print(f"Initializing Vertex AI (project={PROJECT_ID}, region={REGION})...")
    vertexai.init(project=PROJECT_ID, location=REGION, staging_bucket=STAGING_BUCKET)

    print("Submitting vitrine-transaction to Vertex AI Agent Engine...")
    remote_app = agent_engines.create(
        agent_engine=root_agent,
        display_name="vitrine-transaction",
        description="VITRINE multi-turn transaction orchestrator managing commercial promises and UCP negotiations.",
        requirements=[
            "google-cloud-aiplatform>=1.44.0",
            "google-adk>=0.1.0",
            "google-cloud-bigquery>=3.19.0",
            "google-cloud-firestore>=2.15.0",
            "httpx>=0.27.0",
            "pydantic>=2.6.0",
        ],
        extra_packages=[
            "agents/src/vitrine_agents/transaction",
            "agents/src/vitrine_agents/shared",
        ],
        env_vars={
            "MCP_CATALOG_URL": os.getenv("MCP_CATALOG_URL", "http://mcp-catalog:8080"),
            "MCP_PROMISE_URL": os.getenv("MCP_PROMISE_URL", "http://mcp-promise:8080"),
            "MCP_COMMERCE_URL": os.getenv("MCP_COMMERCE_URL", "http://mcp-commerce:8080"),
            "FIRESTORE_DATABASE": os.getenv("FIRESTORE_DATABASE", "(default)"),
            "GCP_REGION": REGION,
        },
        service_account=f"sa-agents@{PROJECT_ID}.iam.gserviceaccount.com",
    )

    print("Successfully deployed to Vertex AI Agent Engine!")
    print(f"Resource Name: {remote_app.resource_name}")
    return remote_app.resource_name

if __name__ == "__main__":
    deploy()
