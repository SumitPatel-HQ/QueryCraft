---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 04
status: executing
stopped_at: Completed 04-01-PLAN.md
last_updated: "2026-04-02T06:50:36.971Z"
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 11
  completed_plans: 10
---

# Project State

**Last Updated:** 2026-04-02
**Current Phase:** 04
**Status:** Executing Phase 04

**Last Completed Plan:** 04-02-PLAN.md
**Next Plan:** 04-03-PLAN.md

## Decisions

- Keep Gemini as default provider until new providers prove equal reliability.
- Preserve existing NL-to-SQL fallback behavior (LLM first, pattern matching fallback).
- Prioritize backend contract safety; no frontend contract changes in this phase.
- [Phase 02]: Kept generator-facing provider method as generate(prompt) while adding a Gemini adapter shim.
- [Phase 02]: Resolved provider selection as explicit arg -> LLM_PROVIDER -> LLM_PROVIDER_ORDER -> gemini fallback.
- [Phase 02]: Generator now resolves providers through provider_factory and only depends on generate(prompt).
- [Phase 02]: Processor fallback contract keys and generation_method semantics remain unchanged.
- [Phase 03]: PostgresExecutorAsync reuses an executor-owned asyncpg pool and config across query and schema operations.
- [Phase 03]: SELECT-only validation now rejects non-read PostgreSQL statements before pool acquisition.
- [Phase 03]: Added asyncpg to backend requirements because Phase 03 PostgreSQL execution depends on it at runtime.
- [Phase 03]: MySQLExecutorAsync mirrors PostgresExecutorAsync with lazy aiomysql pool creation and 30s timeout defaults.
- [Phase 03]: MySQL schema introspection maps INFORMATION_SCHEMA rows into the shared table-to-columns dict consumed by the LLM pipeline.
- [Phase 03]: PostgreSQL SSL enforcement now passes asyncpg ssl='require' explicitly instead of relying on an SSLContext-only path.
- [Phase 03]: The PostgreSQL SSL regression test now captures asyncpg.create_pool kwargs so removing ssl='require' fails immediately.
- [Phase 03.1]: MySQL creation reuses the existing databases table and connection_string column to preserve metadata contracts.
- [Phase 03.1]: MySQL runtime routes rebuild executor config from stored DSNs and bypass the legacy sync manager.
- [Phase 03.1]: The sidebar now renders live MySQL cards directly from DatabaseResponse.connection_info via authenticated API state.
- [Phase 04]: Formatter responses always include SQL in collapsible markdown for transparency.
- [Phase 04]: Conversation history eviction removes oldest two messages to preserve user-assistant turn pairing under 20-message cap.
- [Phase 04]: Added temporary ai.sql_generator and ai.sql_validator stubs to unblock ai package imports during parallel execution.
- [Phase 04]: SQL generator uses a Protocol-based llm_client interface with generate(system_prompt, user_prompt) to keep providers swappable.
- [Phase 04]: Validation failures can return (False, reason) or raise UnsafeQueryError via raise_on_error for strict orchestration paths.

## Accumulated Context

### Roadmap Evolution

- Phase 03.1 inserted after Phase 03: Connect the live MySQL backend to the frontend sidebar so users can create a MySQL connection, see connected status, and view whether it is active along with connection info. (URGENT)

## Blockers

- No standardized backend test scaffold exists yet.

## Performance Metrics

- Phase 03 Plan 02 — Duration: 5 min; Tasks: 2; Files: 4
- Phase 03 Plan 03 — Duration: 2 min; Tasks: 2; Files: 2
- Phase 03.1 Plan 01 — Duration: 4 min; Tasks: 2; Files: 6
- Phase 03.1 Plan 02 — Duration: 10 min; Tasks: 2; Files: 5
- Phase 03.1 Plan 03 — Duration: 4 min; Tasks: 2; Files: 5
- Phase 04 Plan 02 — Duration: 4 min; Tasks: 3; Files: 7

## Session

- **Last Session:** 2026-04-02T06:50:36.959Z
- **Stopped At:** Completed 04-01-PLAN.md
