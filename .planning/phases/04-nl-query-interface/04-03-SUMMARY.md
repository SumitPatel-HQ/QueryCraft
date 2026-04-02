---
phase: 04-nl-query-interface
plan: 03
subsystem: api
tags: [fastapi, nl-to-sql, routing, error-handling, testing]
requires:
  - phase: 04-01
    provides: prompt builder, SQL generator, SQL validator
  - phase: 04-02
    provides: response formatter and conversation manager
provides:
  - POST /api/query NL-to-SQL orchestration pipeline
  - Session-bound executor routing with sanitized error mapping
  - Endpoint regression coverage for success and failure paths
affects: [backend-api, nl-query-runtime, integration-tests]
tech-stack:
  added: []
  patterns: [session executor registry, adapter wrappers for provider generate signatures]
key-files:
  created:
    - backend/api/routes/query.py
    - backend/api/__init__.py
    - backend/api/routes/__init__.py
    - backend/api/routers/query.py
    - backend/tests/api/test_query_route.py
  modified:
    - backend/api/routers/__init__.py
    - backend/main.py
key-decisions:
  - "Added adapter clients to bridge provider.generate(prompt) with AI pipeline signatures requiring generate(system_prompt, user_prompt)."
  - "Registered /api/query through existing routers package to preserve current app composition style while satisfying plan path requirements."
patterns-established:
  - "Pipeline route executes schema -> conversation append -> prompt -> generation -> validation -> execution -> formatting -> assistant append."
  - "All executor failures are sanitized to {\"error\": \"Database error\"} to avoid credential leakage."
requirements-completed: [NLQUERY-06]
duration: 37min
completed: 2026-04-02
---

# Phase 4 Plan 3: API orchestration summary

**Session-scoped POST /api/query now orchestrates full NL-to-SQL execution with strict safety validation, secure error handling, and route-level tests for success plus 400/408/502 paths.**

## Performance

- **Duration:** 37 min
- **Started:** 2026-04-02T12:27:28+05:30
- **Completed:** 2026-04-02T07:04:49Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Implemented `backend/api/routes/query.py` with full pipeline orchestration and security refusal for credential-seeking prompts.
- Added TDD coverage in `backend/tests/api/test_query_route.py` validating pipeline order, session validation, refusal behavior, and HTTP error contracts.
- Registered `/api/query` in the running FastAPI app through router compatibility wiring (`backend/api/routers/query.py`, `backend/main.py`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement POST /query endpoint**
   - `bedbc84` (test): failing endpoint tests (RED)
   - `d330b05` (feat): endpoint orchestration implementation (GREEN)
2. **Task 2: Register query route**
   - `3b9bc76` (feat): add top-level api route registration modules
   - `a0c506d` (fix): wire compatibility router into existing app registration flow

## Files Created/Modified
- `backend/api/routes/query.py` - New POST `/query` orchestration endpoint and helper adapters.
- `backend/tests/api/test_query_route.py` - End-to-end route orchestration unit tests with mocked executor/pipeline parts.
- `backend/api/__init__.py` - Top-level APIRouter exposing `/api/query` include.
- `backend/api/routes/__init__.py` - Route package marker for `api.routes` import path.
- `backend/api/routers/query.py` - Compatibility router to include `api.routes.query` in existing app composition.
- `backend/api/routers/__init__.py` - Export `query_router` for main app import.
- `backend/main.py` - Register `query_router` with FastAPI app.

## Decisions Made
- Used `register_executor_for_session/get_executor_for_session` in the route module for session-bound executor lookup without changing existing DB manager contracts.
- Introduced `_SQLGenerationClient` and `_SummaryClient` adapters to normalize provider return types and preserve provider-agnostic pipeline behavior.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Existing app structure used `api.routers`, not `api.routes`**
- **Found during:** Task 2
- **Issue:** Plan required `backend/api/__init__.py` and `api.routes.query`, but runtime app only included routers from `api.routers`.
- **Fix:** Added compatibility router `backend/api/routers/query.py`, exported it from `backend/api/routers/__init__.py`, and included it in `backend/main.py`.
- **Files modified:** `backend/api/routers/query.py`, `backend/api/routers/__init__.py`, `backend/main.py`
- **Verification:** `python -c "import sys; sys.path.insert(0,'backend'); from api.routes.query import router; print('OK')"`
- **Committed in:** `a0c506d`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to make `/api/query` reachable in the current app wiring without architectural change.

## Issues Encountered
- `pytest` shell command was unavailable in environment; verification was run via `python -m pytest` successfully.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- NL query API orchestration contract is in place with explicit error semantics and regression tests.
- Remaining unrelated local modifications (`backend/api/routers/queries.py`, `backend/tests/api/test_live_mysql_runtime_routes.py`) were left untouched as out-of-scope.

## Self-Check: PASSED
- FOUND: `.planning/phases/04-nl-query-interface/04-03-SUMMARY.md`
- FOUND: commit `bedbc84`
- FOUND: commit `d330b05`
- FOUND: commit `3b9bc76`
- FOUND: commit `a0c506d`
