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
**Plans:** 1/2 plans executed

Plans:
- [x] 03-01-PLAN.md — Exception hierarchy + async PostgreSQL executor
- [ ] 03-02-PLAN.md — Async MySQL executor + module exports

### Phase 04: Natural Language Query Interface
**Goal:** Build end-to-end NL-to-SQL pipeline with multi-turn conversation, LLM-based SQL generation, validation, and formatted responses.
**Requirements:** [NLQUERY-01, NLQUERY-02, NLQUERY-03, NLQUERY-04, NLQUERY-05, NLQUERY-06]
**Plans:** 3 plans

Plans:
- [ ] 04-01-PLAN.md — AI pipeline core (prompt builder, SQL generator, validator)
- [ ] 04-02-PLAN.md — Response formatting + conversation management
- [ ] 04-03-PLAN.md — API orchestration (POST /query endpoint)
