"""Tests for per-session AI conversation history management."""

from __future__ import annotations

from backend.ai.conversation_manager import ConversationManager


def test_add_message_stores_role_and_content_by_session() -> None:
    manager = ConversationManager()

    manager.add_message("s1", "user", "hello")
    manager.add_message("s1", "assistant", "hi")

    assert manager.export("s1") == [
        {"role": "user", "content": "hello"},
        {"role": "assistant", "content": "hi"},
    ]


def test_get_history_returns_last_n_messages() -> None:
    manager = ConversationManager()

    for index in range(8):
        role = "user" if index % 2 == 0 else "assistant"
        manager.add_message("s1", role, f"m{index}")

    history = manager.get_history("s1", 6)

    assert len(history) == 6
    assert [item["content"] for item in history] == ["m2", "m3", "m4", "m5", "m6", "m7"]


def test_cap_at_twenty_drops_oldest_user_assistant_pair() -> None:
    manager = ConversationManager()

    for index in range(22):
        role = "user" if index % 2 == 0 else "assistant"
        manager.add_message("s1", role, f"m{index}")

    exported = manager.export("s1")

    assert len(exported) == 20
    assert exported[0]["content"] == "m2"
    assert exported[-1]["content"] == "m21"


def test_clear_removes_session_history() -> None:
    manager = ConversationManager()
    manager.add_message("s1", "user", "hello")

    manager.clear("s1")

    assert manager.export("s1") == []
    assert manager.get_history("s1", 6) == []
