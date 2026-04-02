import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def test_build_prompt_includes_schema_dialect_safety_and_recent_history():
    from ai.prompt_builder import build_prompt

    schema = {
        "users": [
            {"column": "id", "type": "integer"},
            {"column": "email", "type": "varchar"},
        ],
        "orders": [
            {"column": "id", "type": "integer"},
            {"column": "user_id", "type": "integer"},
        ],
    }
    history = [{"role": "user", "content": f"message-{index}"} for index in range(8)]

    system_prompt, user_prompt = build_prompt(
        schema_dict=schema,
        conversation_history=history,
        user_message="show all users",
        dialect="postgresql",
    )

    assert "postgresql" in system_prompt.lower()
    assert "select" in system_prompt.lower()
    assert "insert" in system_prompt.lower()
    assert "delete" in system_prompt.lower()
    assert "drop" in system_prompt.lower()
    assert "coalesce" in system_prompt.lower()
    assert "aliases" in system_prompt.lower()

    assert "users(id:integer, email:varchar)" in system_prompt
    assert "orders(id:integer, user_id:integer)" in system_prompt

    assert "message-0" not in user_prompt
    assert "message-1" not in user_prompt
    for index in range(2, 8):
        assert f"message-{index}" in user_prompt

    assert "show all users" in user_prompt
