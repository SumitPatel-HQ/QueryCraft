---
phase: 04-nl-query-interface
plan: 01
subsystem: api
tags: [nl-to-sql, ai, llm, sql-validation, pytest]
requires:
  - phase: 03-executors-runtime
    provides: async schema introspection format and UnsafeQueryError contracts
provides:
  - Schema-aware prompt construction with dialect and safety instructions
  - Provider-agnostic SQL extraction with retry-based self-refinement
  - SELECT-only SQL validation with forbidden keyword and semicolon guards
affects: [04-02, 04-03, query-orchestration]
tech-stack:
  added: []
  patterns: [provider-agnostic client protocol, validation-first SQL safety gate]
key-files:
  created: [backend/ai/prompt_builder.py, backend/ai/sql_generator.py, backend/ai/sql_validator.py, backend/tests/ai/test_prompt_builder.py, backend/tests/ai/test_sql_generator.py, backend/tests/ai/test_sql_validator.py]
  modified: [backend/ai/__init__.py]
key-decisions:
  - "SQL generator uses a Protocol-based llm_client interface with generate(system_prompt, user_prompt) to keep providers swappable."
  - "Validation failures can return (False, reason) or raise UnsafeQueryError via raise_on_error for strict orchestration paths."
patterns-established:
  - "Prompt pattern: compact schema lines table(col:type) and last-6-message conversational context."
  - "TDD pattern: RED and GREEN commits for generator and validator with behavior-focused unit tests."
requirements-completed: [NLQUERY-01, NLQUERY-02, NLQUERY-03]
duration: 10 min
completed: 2026-04-02
---

# Phase 04 Plan 01: AI Pipeline Core Summary

**Schema-aware prompt construction, provider-agnostic SQL extraction, and strict SELECT-only SQL safety validation for NL query execution.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-02T12:09:04+05:30
- **Completed:** 2026-04-02T06:46:32Z
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments
- Implemented `build_prompt` to inject schema, dialect, safety constraints, and last 6 history messages.
- Implemented `generate_sql` with markdown/raw SQL extraction plus retry-driven self-refinement.
- Implemented `validate_sql` enforcing SELECT/WITH-only behavior, forbidden keyword blocking, semicolon rejection, and query length limit.
- Updated `ai` package exports to expose the phase-contract core pipeline functions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement prompt builder** - `84752ae` (feat)
2. **Task 2: Implement SQL generator with self-refinement (TDD)** - `c51c4eb` (test), `3c1534b` (feat), `9c7855c` (fix)
3. **Task 3: Implement SQL validator (TDD)** - `e37805f` (test), `9ad8205` (feat), `ab1a7e9` (refactor)
4. **Task 4: Create AI module init** - `c96a3f9` (feat)

## Files Created/Modified
- `backend/ai/prompt_builder.py` - Builds system/user prompts with schema compaction and safety instructions.
- `backend/ai/sql_generator.py` - Extracts SQL from LLM output and retries with refinement feedback.
- `backend/ai/sql_validator.py` - Validates SQL safety constraints and optionally raises `UnsafeQueryError`.
- `backend/ai/__init__.py` - Exposes `build_prompt`, `generate_sql`, and `validate_sql` package exports.
- `backend/tests/ai/test_prompt_builder.py` - Verifies prompt schema formatting, safety instructions, and history slicing.
- `backend/tests/ai/test_sql_generator.py` - Verifies extraction paths and retry loop behavior.
- `backend/tests/ai/test_sql_validator.py` - Verifies all validator rules and error-raising behavior.

## Decisions Made
- Used explicit regex extraction for fenced and raw SQL to support common LLM output formats without provider lock-in.
- Kept validator API dual-mode (`return tuple` vs `raise_on_error`) so orchestration can choose fail-fast behavior while tests can inspect reasons.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Local pytest binary unavailable in shell path**
- **Found during:** Task 1 verification
- **Issue:** `pytest` command was not available in PATH in this execution shell.
- **Fix:** Switched verification commands to use project virtualenv interpreter (`backend/venv/Scripts/python.exe -m pytest ...`).
- **Files modified:** None
- **Verification:** All task-level pytest commands passed via venv invocation.
- **Committed in:** N/A (execution-environment adjustment)

---

**2. [Rule 1 - Bug] SQL generator accepted unsafe extracted SQL without refinement**
- **Found during:** Task 2 verification
- **Issue:** Extracted SQL was returned directly, so unsafe responses were not retried with feedback.
- **Fix:** Added validation-aware retry path and refinement feedback for invalid extracted SQL.
- **Files modified:** `backend/ai/sql_generator.py`, `backend/tests/ai/test_sql_generator.py`
- **Verification:** Added unsafe-first-response test and re-ran all SQL generator tests.
- **Committed in:** `9c7855c`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Changes tightened contract correctness and stayed within planned scope.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 04-02 can consume these AI pipeline primitives directly.
- Core backend safety and provider-agnostic contracts are in place for query orchestration.

## Self-Check: PASSED

---
*Phase: 04-nl-query-interface*
*Completed: 2026-04-02*
