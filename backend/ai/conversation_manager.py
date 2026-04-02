"""Conversation history management for multi-turn NL query sessions."""

from __future__ import annotations


class ConversationManager:
    """In-memory per-session conversation history manager."""

    def __init__(self) -> None:
        self._sessions: dict[str, list[dict[str, str]]] = {}

    def add_message(self, session_id: str, role: str, content: str) -> None:
        """Add a role/content message to a session and enforce max history size."""
        if session_id not in self._sessions:
            self._sessions[session_id] = []

        self._sessions[session_id].append({"role": role, "content": content})

        if len(self._sessions[session_id]) > 20:
            self._sessions[session_id] = self._sessions[session_id][2:]

    def get_history(self, session_id: str, n: int = 6) -> list[dict[str, str]]:
        """Return the last n messages for a session."""
        if session_id not in self._sessions:
            return []
        return self._sessions[session_id][-n:]

    def clear(self, session_id: str) -> None:
        """Clear all stored messages for a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]

    def export(self, session_id: str) -> list[dict[str, str]]:
        """Export full history for a session."""
        return self._sessions.get(session_id, [])
