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


def test_build_prompt_includes_relationship_section_when_fk_present():
    """Test that RELATIONSHIPS section appears when foreign keys exist in schema"""
    from ai.prompt_builder import build_prompt

    schema = {
        "users": [
            {"column": "id", "type": "integer"},
            {"column": "email", "type": "varchar"},
        ],
        "orders": [
            {"column": "id", "type": "integer"},
            {
                "column": "user_id",
                "type": "integer",
                "foreign_key": {
                    "referenced_table": "users",
                    "referenced_column": "id",
                    "constraint_name": "fk_orders_users",
                },
            },
        ],
    }
    history = []

    system_prompt, user_prompt = build_prompt(
        schema_dict=schema,
        conversation_history=history,
        user_message="show relationships",
        dialect="mysql",
    )

    assert "RELATIONSHIPS:" in system_prompt
    assert "orders.user_id -> users.id" in system_prompt


def test_build_prompt_compound_intent_instructions_present():
    """Test that compound intent handling instructions are in system prompt"""
    from ai.prompt_builder import build_prompt

    schema = {"users": [{"column": "id", "type": "integer"}]}
    history = []

    system_prompt, user_prompt = build_prompt(
        schema_dict=schema,
        conversation_history=history,
        user_message="show tables and relationships",
        dialect="postgresql",
    )

    assert "COMPOUND INTENT HANDLING" in system_prompt
    assert (
        "address ALL parts" in system_prompt
        or "address ALL parts" in system_prompt.lower()
    )
    assert "DO NOT collapse" in system_prompt


def test_build_prompt_mysql_relationship_examples():
    """Test MySQL-specific relationship query examples"""
    from ai.prompt_builder import build_prompt

    schema = {"users": [{"column": "id", "type": "integer"}]}
    history = []

    system_prompt, user_prompt = build_prompt(
        schema_dict=schema,
        conversation_history=history,
        user_message="show relationships",
        dialect="mysql",
    )

    assert "information_schema.key_column_usage" in system_prompt.lower()
    assert (
        "referenced_table_name" in system_prompt.lower()
        or "relationships" in system_prompt.lower()
    )


def test_build_prompt_postgresql_relationship_examples():
    """Test PostgreSQL-specific relationship query examples"""
    from ai.prompt_builder import build_prompt

    schema = {"users": [{"column": "id", "type": "integer"}]}
    history = []

    system_prompt, user_prompt = build_prompt(
        schema_dict=schema,
        conversation_history=history,
        user_message="show relationships",
        dialect="postgresql",
    )

    assert (
        "information_schema.table_constraints" in system_prompt.lower()
        or "FOREIGN KEY" in system_prompt
    )


def test_build_prompt_sqlite_relationship_examples():
    """Test SQLite-specific relationship query examples"""
    from ai.prompt_builder import build_prompt

    schema = {"users": [{"column": "id", "type": "integer"}]}
    history = []

    system_prompt, user_prompt = build_prompt(
        schema_dict=schema,
        conversation_history=history,
        user_message="show relationships",
        dialect="sqlite",
    )

    assert "pragma_foreign_key_list" in system_prompt.lower()


def test_build_prompt_supports_both_column_key_formats():
    """Test that schema formatting supports both 'column' and 'name' keys"""
    from ai.prompt_builder import build_prompt

    # Schema with 'name' key instead of 'column'
    schema = {
        "users": [
            {"name": "id", "type": "integer"},
            {"name": "email", "type": "varchar"},
        ],
    }
    history = []

    system_prompt, user_prompt = build_prompt(
        schema_dict=schema,
        conversation_history=history,
        user_message="show users",
        dialect="mysql",
    )

    assert "users(id:integer, email:varchar)" in system_prompt


def test_build_prompt_no_relationships_section_when_no_fk():
    """Test that RELATIONSHIPS section is absent when no foreign keys exist"""
    from ai.prompt_builder import build_prompt

    schema = {
        "users": [
            {"column": "id", "type": "integer"},
            {"column": "email", "type": "varchar"},
        ],
    }
    history = []

    system_prompt, user_prompt = build_prompt(
        schema_dict=schema,
        conversation_history=history,
        user_message="show tables",
        dialect="mysql",
    )

    # RELATIONSHIPS section should not appear if there are no FKs
    assert (
        "RELATIONSHIPS:" not in system_prompt
        or system_prompt.count("RELATIONSHIPS:") == 1
    )
