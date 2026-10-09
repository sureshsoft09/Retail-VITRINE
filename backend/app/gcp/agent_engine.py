"""Vertex AI Agent Engine Client for vitrine-transaction.

Standardized Region: us-central1.
Invokes remote Agent Engine session queries keyed by session_id = txn_id.
"""

try:
    import vertexai
    from vertexai import agent_engines
except Exception:
    vertexai = None
    agent_engines = None


class AgentEngineClient:
    """Invoker for vitrine-transaction hosted on Vertex AI Agent Engine."""

    def __init__(
        self,
        project_id: str = None,
        region: str = "us-central1",
        resource_name: str = None,
    ):
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID", "vitrine-demo")
        self.region = region or os.getenv("GCP_REGION", "us-central1")
        self.resource_name = resource_name or os.getenv("AGENT_ENGINE_RESOURCE_NAME")
        
        self._initialized = False
        self._remote_engine = None

    def _get_engine(self):
        if not self._initialized:
            try:
                vertexai.init(project=self.project_id, location=self.region)
                self._initialized = True
            except Exception as e:
                print(f"[AgentEngineClient] Cloud init note: {e}")
        if not self._remote_engine:
            if not self.resource_name:

                raise ValueError("AGENT_ENGINE_RESOURCE_NAME environment variable is not set.")
            self._remote_engine = agent_engines.get(self.resource_name)
        return self._remote_engine

    async def query(self, session_id: str, input_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Runs a turn in the transaction session on Vertex AI Agent Engine."""
        engine = self._get_engine()
        # Remote Agent Engine invocation passing session_id and structured turn input
        response = engine.query(
            session_id=session_id,
            input=input_payload,
        )
        return response

    async def stream_query(self, session_id: str, input_payload: Dict[str, Any]):
        """Streams turn execution step events from Vertex AI Agent Engine."""
        engine = self._get_engine()
        for chunk in engine.stream_query(session_id=session_id, input=input_payload):
            yield chunk
