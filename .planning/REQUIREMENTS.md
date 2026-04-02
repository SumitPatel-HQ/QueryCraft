# QueryCraft Requirements (Planning Baseline)

## Phase 02 — AI-Agnostic Provider Layer

- **LLM-01**: Introduce a provider interface so NL-to-SQL generation is decoupled from Gemini implementation details.
- **LLM-02**: Keep Gemini as the default runtime provider with behavior parity for SQL generation + explanation paths.
- **LLM-03**: Add configuration-driven provider selection with safe fallback to Gemini when config is invalid or missing.
- **LLM-04**: Preserve fallback-to-pattern-matching reliability when provider calls fail, with explicit provider-aware logging.

## Phase 03 — Live Database Connection Executors

- [x] **LIVEDB-01**: Implement PostgreSQL executor with async connection pooling, schema introspection via information_schema, and SELECT-only query execution.
- [x] **LIVEDB-02**: Implement MySQL executor with async connection pooling, schema introspection via INFORMATION_SCHEMA, and SELECT-only query execution.
- [x] **LIVEDB-03**: Enforce SSL connections when ssl flag is True using sslmode=require for PostgreSQL and verified SSLContext for MySQL.
- [x] **LIVEDB-04**: Return unified schema dict format `{"table_name": [{"column": "...", "type": "...", "nullable": bool}]}` from both executors.
- [x] **LIVEDB-05**: Define and raise structured exceptions (ConnectionError, AuthenticationError, QueryTimeoutError, SchemaIntrospectionError, UnsafeQueryError) from database/exceptions.py.

## Phase 04 — Natural Language Query Interface

- **NLQUERY-01**: Build LLM prompt from schema dict + conversation history + user message with dialect-specific SQL generation instructions.
- **NLQUERY-02**: Generate SQL via LLM with self-refinement loop (max 2 retries on validation failure) and extract SQL from response (handle raw SQL and markdown fences).
- **NLQUERY-03**: Validate generated SQL (non-empty, SELECT/WITH only, no forbidden keywords, no stacked queries, max 4000 chars) before execution.
- **NLQUERY-04**: Format query results as Markdown table (cap at 500 rows) with LLM-generated natural language summary and collapsible SQL display.
- **NLQUERY-05**: Manage per-session conversation history (max 20 messages, last 6 injected into prompts, drop oldest pairs when cap hit).
- [x] **NLQUERY-06**: Orchestrate full pipeline via POST /query endpoint with structured error handling (400 for validation, 408 for timeout, 502 for executor failure).

## Phase 03.1 — Live MySQL Sidebar Integration

- [x] **MYSQLUI-01**: Add an authenticated API contract for creating a live MySQL database record from host/port/database/username/password/ssl inputs submitted by the frontend.
- [x] **MYSQLUI-02**: Validate new MySQL connections with the Phase 03 async MySQL executor, introspect schema before persistence, and never return raw passwords in API responses.
- [x] **MYSQLUI-03**: Show MySQL connections in the frontend sidebar with connected/active status and basic connection info (host, database, port, username, ssl state).
- [x] **MYSQLUI-04**: Existing database schema/query/detail flows must handle persisted `db_type="mysql"` records without unsupported-database crashes.
