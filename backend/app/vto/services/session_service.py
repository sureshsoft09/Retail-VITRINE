"""Session management service for creating, updating, and storing try-on sessions."""

import uuid
import logging
from typing import Dict, Optional

from backend.app.vto.models.session import SessionData, SessionState
from backend.app.vto.tools.storage_tool import delete_session_images

logger = logging.getLogger(__name__)


class SessionService:
    """Manages active try-on user session instances."""

    def __init__(self):
        # In-memory session store indexed by session_id UUID
        self._sessions: Dict[str, SessionData] = {}

    def create_session(self) -> SessionData:
        """Creates a new session instance."""
        session_id = str(uuid.uuid4())
        session = SessionData(
            session_id=session_id,
            state=SessionState.AWAITING_PRODUCT_REQUEST,
            conversation_history=[
                {"role": "agent", "content": "Welcome to AI Virtual Try-On! What apparel item are you looking to try on today?"}
            ],
        )
        self._sessions[session_id] = session
        logger.info(f"Created new try-on session: {session_id}")
        return session

    def get_session(self, session_id: str) -> Optional[SessionData]:
        """Retrieves an existing session by session_id."""
        return self._sessions.get(session_id)

    def save_session(self, session: SessionData) -> SessionData:
        """Saves or updates session state."""
        self._sessions[session.session_id] = session
        return session

    def delete_session(self, session_id: str) -> bool:
        """Deletes session state and associated GCS assets according to retention policy."""
        if session_id in self._sessions:
            # Purge GCS assets
            delete_session_images(session_id)
            del self._sessions[session_id]
            logger.info(f"Deleted session and assets for: {session_id}")
            return True
        return False


# Global singleton instance
session_service = SessionService()
