"""Deploy the VITRINE ADK pipeline to Vertex AI Agent Engine.

Usage:
    python deploy.py            # create deployment and print resource name
    python deploy.py <res_name> # update existing deployment

Enterprise deployment pattern:
- Uses vertexai.preview.reasoning_engines.AdkApp(agent=root_agent)
- Targets us-central1 standardized region
- Ships environment variables and required package dependencies
"""

import os
import sys
from pathlib import Path

# Add paths
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "agents" / "src"))

from vitrine_agents import config
from vitrine_agents.transaction.agent import root_agent

# Monkey-patch tarfile.TarFile.add so Windows paths are converted to clean relative names
import tarfile

_original_tar_add = tarfile.TarFile.add

def _safe_tar_add(self, name, arcname=None, recursive=True, *, filter=None):
    if arcname is None:
        arcname = Path(name).name
    def _clean_filter(tarinfo):
        base = os.path.basename(tarinfo.name)
        if base in {"__pycache__", ".adk", "session.db"} or base.endswith((".pyc", ".pyo")):
            return None
        return tarinfo
    return _original_tar_add(self, name, arcname=arcname, recursive=recursive, filter=_clean_filter if filter is None else filter)

tarfile.TarFile.add = _safe_tar_add

REQUIREMENTS = [
    "google-adk>=1.0.0",
    "google-cloud-aiplatform[adk,agent-engines]>=1.70.0",
    "google-cloud-bigquery>=3.25.0",
    "google-cloud-firestore>=2.15.0",
    "pydantic>=2.6.0",
    "python-dotenv>=1.0.0",
    "mcp>=1.2.0",
    "httpx>=0.27.0",
    "cloudpickle>=3.0.0",
    "opentelemetry-api<=1.42.1",
    "opentelemetry-sdk<=1.42.1",
]

RESERVED = {
    "GOOGLE_CLOUD_PROJECT",
    "GOOGLE_CLOUD_LOCATION",
    "GOOGLE_GENAI_USE_VERTEXAI",
    "GOOGLE_APPLICATION_CREDENTIALS",
    "PORT",
}

ENV_VARS = {
    k: str(v)
    for k, v in {
        "BQ_DATASET": config.DATASET,
        "MODEL_REASONING": config.MODEL_REASONING,
        "MODEL_FAST": config.MODEL_FAST,
        "MCP_CATALOG_URL": config.MCP_CATALOG_URL,
        "MCP_PROMISE_URL": config.MCP_PROMISE_URL,
        "MCP_COMMERCE_URL": config.MCP_COMMERCE_URL,
        "AUTONOMY_DISCOUNT_CAP_PCT": os.environ.get("AUTONOMY_DISCOUNT_CAP_PCT", "15.0"),
        "AUTONOMY_MARGIN_FLOOR_PCT": os.environ.get("AUTONOMY_MARGIN_FLOOR_PCT", "18.0"),
        "AUTONOMY_MAX_ORDER_VALUE_USD": os.environ.get("AUTONOMY_MAX_ORDER_VALUE_USD", "250.0"),
        "MAX_TRANSACTION_TURNS": os.environ.get("MAX_TRANSACTION_TURNS", "5"),
        "ENABLE_TRACING": str(config.ENABLE_TRACING).lower(),
        "FIRESTORE_DATABASE": os.environ.get("FIRESTORE_DATABASE", "(default)"),
    }.items()
    if k not in RESERVED and v is not None and str(v) != ""
}

def main() -> None:
    print("=" * 70)
    print("VITRINE ADK Agent Engine Deployment (us-central1)")
    print(f"Project: {config.PROJECT} | Location: {config.LOCATION}")
    print("=" * 70)

    try:
        import vertexai
        from vertexai import agent_engines

        vertexai.init(
            project=config.PROJECT,
            location=config.LOCATION,
            staging_bucket=config.STAGING_BUCKET,
        )

        app = agent_engines.AdkApp(
            agent=root_agent,
            enable_tracing=config.ENABLE_TRACING,
        )

        wheel_path = root_dir / "agents" / "dist" / "vitrine_agents-0.1.0-py3-none-any.whl"
        pkg_path = root_dir / "agents" / "src" / "vitrine_agents"
        extra_pkgs = []
        if wheel_path.exists():
            extra_pkgs.append(str(wheel_path))
        if pkg_path.exists():
            extra_pkgs.append(str(pkg_path))

        kwargs = {
            "agent_engine": app,
            "requirements": REQUIREMENTS,
            "extra_packages": extra_pkgs,
            "display_name": "vitrine-transaction-agents",
            "description": "VITRINE Autonomy & Transaction Agents ADK App",
            "env_vars": ENV_VARS,
        }
        if config.SERVICE_ACCOUNT:
            kwargs["service_account"] = config.SERVICE_ACCOUNT
            print(f"Runtime identity: {config.SERVICE_ACCOUNT}")

        if len(sys.argv) > 1 and sys.argv[1].startswith("projects/"):
            res_name = sys.argv[1]
            print(f"Updating Agent Engine deployment: {res_name}...")
            remote_app = agent_engines.get(res_name)
            remote_app.update(**kwargs)
            print("Update complete.")
        else:
            print("Creating new Vertex AI Agent Engine deployment...")
            remote_app = agent_engines.create(**kwargs)
            print(f"Agent Engine deployed successfully: {remote_app.resource_name}")

    except Exception as e:
        import traceback
        print(f"Deployment error: {e}")
        traceback.print_exc()
        raise

if __name__ == "__main__":
    main()
