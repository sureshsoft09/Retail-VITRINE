"""Firestore Client for transaction state and live step-event publishing.

Standardized Region: us-central1
Provides Firestore persistence for the Transaction Theatre and operator settings.
Includes in-memory local fallback for testing.
"""

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

class FirestoreService:
    """Service publishing real-time step events and managing transaction sessions."""

    def __init__(self, project_id: Optional[str] = None):
        self.project_id = project_id or os.getenv("GCP_PROJECT_ID", "vitrine-demo")
        self.database = os.getenv("FIRESTORE_DATABASE", "(default)")
        self._in_memory_events: Dict[str, List[Dict[str, Any]]] = {}
        self._client = None

    def _get_client(self):
        if self._client is None and os.getenv("GCP_CREDENTIALS_ACTIVE"):
            try:
                from google.cloud import firestore
                self._client = firestore.Client(project=self.project_id, database=self.database)
            except Exception:
                self._client = None
        return self._client


    def publish_step_event(self, txn_id: str, step_data: Dict[str, Any]) -> Dict[str, Any]:
        """Publishes a transaction step event to Firestore and memory."""
        now_iso = datetime.now(timezone.utc).isoformat()
        enriched_step = {
            **step_data,
            "timestamp": now_iso,
            "txn_id": txn_id,
        }

        # Save to memory cache
        if txn_id not in self._in_memory_events:
            self._in_memory_events[txn_id] = []
        self._in_memory_events[txn_id].append(enriched_step)

        # Publish to Firestore if available
        client = self._get_client()
        if client:
            try:
                doc_ref = (
                    client.collection("transactions")
                    .document(txn_id)
                    .collection("steps")
                    .document(f"step-{step_data.get('step_seq', len(self._in_memory_events[txn_id]))}")
                )
                doc_ref.set(enriched_step)
            except Exception as e:
                print(f"[FirestoreService] Cloud publish notice: {e}")

        return enriched_step

    def get_transaction_steps(self, txn_id: str) -> List[Dict[str, Any]]:
        """Retrieves all step events for a given transaction."""
        client = self._get_client()
        if client:
            try:
                docs = (
                    client.collection("transactions")
                    .document(txn_id)
                    .collection("steps")
                    .order_by("step_seq")
                    .stream()
                )
                steps = [d.to_dict() for d in docs]
                if steps:
                    return steps
            except Exception:
                pass
        return self._in_memory_events.get(txn_id, [])

# Singleton instance
firestore_service = FirestoreService()
