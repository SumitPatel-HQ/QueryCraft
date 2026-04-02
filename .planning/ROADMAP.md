# Roadmap

### Phase 01: Foundation and Multi-Database Core
**Goal:** Completed baseline application with upload flow, schema introspection, NL-to-SQL, and dashboard experiences.
**Requirements:** [CORE-01]
**Plans:** 0 plans

### Phase 02: AI-Agnostic Provider Layer
**Goal:** Decouple LLM usage from Gemini-specific client code while preserving current query quality and fallback reliability.
**Requirements:** [LLM-01, LLM-02, LLM-03, LLM-04]
**Plans:** 2/2 plans complete

Plans:
- [x] 02-01-PLAN.md — Establish provider contracts + provider selection
- [x] 02-02-PLAN.md — Integrate Gemini adapter through contracts + verify parity

### Phase 03: Live Database Connection Executors
**Goal:** Implement PostgreSQL and MySQL database executors with unified schema introspection and query execution interfaces.
**Requirements:** [LIVEDB-01, LIVEDB-02, LIVEDB-03, LIVEDB-04, LIVEDB-05]
**Plans:** 3/3 plans complete

Plans:
- [x] 03-01-PLAN.md — Exception hierarchy + async PostgreSQL executor
- [x] 03-02-PLAN.md — Async MySQL executor + module exports
- [x] 03-03-PLAN.md — PostgreSQL SSL contract gap closure

### Phase 03.1: Connect the live MySQL backend to the frontend sidebar so users can create a MySQL connection, see connected status, and view whether it is active along with connection info. (INSERTED)

**Goal:** Users can create a live MySQL connection from the dashboard sidebar, immediately see whether it is connected/active, and inspect basic connection details without breaking existing database flows.
**Requirements:** [MYSQLUI-01, MYSQLUI-02, MYSQLUI-03, MYSQLUI-04]
**Depends on:** Phase 03
**Plans:** 3/3 plans complete

Plans:
- [x] 03.1-01-PLAN.md — Add live MySQL connection creation contract + persistence API
- [x] 03.1-02-PLAN.md — Route schema/query database flows through the live MySQL service
- [x] 03.1-03-PLAN.md — Wire sidebar MySQL creation UI + connection status/info display

### Phase 04: Natural Language Query Interface
**Goal:** Build end-to-end NL-to-SQL pipeline with multi-turn conversation, LLM-based SQL generation, validation, and formatted responses.
**Requirements:** [NLQUERY-01, NLQUERY-02, NLQUERY-03, NLQUERY-04, NLQUERY-05, NLQUERY-06]
**Plans:** 2/3 plans executed

Plans:
- [x] 04-01-PLAN.md — AI pipeline core (prompt builder, SQL generator, validator)
- [x] 04-02-PLAN.md — Response formatting + conversation management
- [ ] 04-03-PLAN.md — API orchestration (POST /query endpoint)
