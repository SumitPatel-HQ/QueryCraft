## Plan: Fix Relationship Intent Accuracy

Resolve inaccurate NL-to-SQL behavior for compound metadata questions by removing prompt over-bias, carrying foreign-key metadata through both live query pipelines, and replacing cartesian fallbacks with relationship-aware or safe table-list fallbacks.

**Steps**
1. Phase 1: Lock contract and intent behavior. Define one shared intent rule: ALWAYS attempt to satisfy ALL detected intents in a compound query; never silently drop parts. If some intents fail (missing metadata, unavailable pattern), mark them as missing in coverage_report but return partial results for successful intents. This is the core contract: multi-intent support is mandatory, fallbacks are acceptable only with explicit failure markers. This is a design guardrail for all downstream changes.
2. Phase 2: Enrich async schema introspection for live MySQL/PostgreSQL query-time paths. Extend introspection SQL and row mapping in async executors to include foreign key references while preserving existing keys (column, type, nullable) for backward compatibility. This unblocks relationship context in the session query route. Depends on 1.
3. Phase 3: Normalize and enrich prompt schema rendering. Update prompt schema formatting to support both schema shapes (column/name keys), add explicit relationship sections derived from foreign_key metadata, and add relationship-focused metadata examples per dialect (MySQL, PostgreSQL, SQLite). Include explicit compound-intent instructions so the model does not collapse to tables-only output when relationships are requested. Depends on 1. Parallel with 2.
4. Phase 4: Align both NL-to-SQL query pipelines to the same intent policy. In the v1 processor-based route, pass explicit db_type into NLToSQLProcessor (avoid implicit mysql default when introspector is absent), and add relationship-intent fallback generation that is dialect-aware and metadata-safe. In the session route, keep build_prompt path but consume enriched schema and intent-aware prompt rules from step 3. Depends on 1, 2, and 3.
5. Phase 5: Remove relationship-breaking pattern fallback behavior. Replace comma-join cartesian fallback in pattern matching for relationship/list prompts with metadata relationship query generation or safe table listing when relationship metadata is unavailable. Depends on 4.
6. Phase 6: Add regression tests for this exact failure mode and contract consistency. Extend prompt, executor, processor, and API route tests to assert compound question handling (tables + relationships), FK-aware schema shaping, and non-cartesian fallback behavior. Depends on 2, 3, 4, and 5.
7. Phase 7: Verify with targeted automated checks and scenario-driven prompts. Run focused pytest suites for ai, executors, core processor, and API routes, then run representative prompts across both routes to confirm relationship-aware output and graceful fallback behavior. Depends on 6.
8. Phase 8: Intent Decomposition Layer. Add preprocessing before NLToSQLProcessor to split one user sentence into multiple intent units (table_inventory, relationship_inventory, aggregation, filtering, etc.) using lightweight hybrid detection. Decomposition logic:
   a) Explicit connectors: split by 'and', 'also', 'plus', ',' when followed by action verb (list, show, count, find).
   b) Semantic patterns: detect 'with', 'including', 'along with', 'and their', 'showing their' as compound intent indicators.
   c) Entity co-occurrence: if user mentions multiple entities (tables, columns, relationships in one clause), infer compound intent.
   d) Keyword taxonomy scoring: per intent type (table_inventory searches for 'tables/columns/structure'; relationship_inventory searches for 'relationship/foreign key/join'; aggregation searches for 'count/sum/average'; filtering searches for 'where/equals/greater'; ranking searches for 'top/limit/ordered').
   e) Entity extraction: map user-mentioned entities back to schema to validate intent feasibility.
   Pseudocode:
   ```
   def decompose_question(question, schema):
     intents = []
     # Split by explicit connectors
     clauses = split_by_connectors(question)
     for clause in clauses:
       intent_type = classify_clause(clause, keyword_taxonomy)  # -> table_inventory, relationship_inventory, etc.
       entities = extract_entities(clause, schema)
       intents.append({type: intent_type, text: clause, entities: entities, status: 'detected'})
     # Merge intents if co-occurrence detected
     if has_semantic_pattern(question, ['with', 'including', 'and their']):
       merge_related_intents(intents)  # e.g., table + relationship
     return IntentPlan(intents=intents, query=question)
   ```
   Integrate into both api/routers/queries.py and api/routes/query.py. Processor accepts intent_plan object instead of raw question. Depends on 1.
9. Phase 9: Multi-Query Output Design. Move from single SQL contract to intent-labeled SQL list while preserving legacy response behavior. Extend query_schemas.py with query_items array:
   query_items = [{intent_label, sql_query, explanation, tables_used, status ('success'/'failed'/'skipped'), error_message, result_rows, confidence}]
   Execution model:
   a) Independent intents (table_inventory, aggregation, etc.) → execute sequentially, allow failures in one without blocking others.
   b) Dependent intents (future-ready): rank by execution order, skip dependents if prerequisite fails (mark as 'skipped').
   c) Failure handling: catch per-query errors, mark item status='failed' with error_message, continue to next item. Return full response with partial results.
   Update generator.py and sql_generator.py to parse one SQL per intent (see Phase 11 format). Update both API routes to:
   1. Decompose intent_plan (Phase 8).
   2. Generate SQL for each intent.
   3. Execute each intent SQL independently with error capture.
   4. Populate query_items and aggregate results.
   Return both legacy fields (sql_query from first successful item, results from first item) and full multi-query list. Backward compatibility: legacy clients read sql_query/results; new clients read query_items + multi_query_mode flag. Frontend renders expandable sections per intent for multi-item responses. Depends on 8.
10. Phase 10: Semantic Coverage Validation Layer. Add coverage checks in validators.py or new companion module to ensure all detected intents are satisfied, not only syntax-safe. Define rules: table_inventory requires metadata table-list SQL, relationship_inventory requires FK/relationship pattern, aggregation requires aggregate operator aligned with asked measure, filtering requires where condition, ranking_topk requires order+limit. Entity coverage rule: core entities from intent_plan must appear in SQL. Retry logic on coverage failure:
   a) First attempt: generate initial query_items per Phase 9.
   b) Coverage check: validate each item against rules; detect missing_intents.
   c) If missing_intents detected:
      i. Inject missing intents explicitly into retry prompt: "Previous response failed to address: [missing_intents]. Generate SQL for these intents. Do not repeat previous intents."
      ii. Re-invoke LLM with modified prompt + intent_plan highlighting missing items only.
      iii. Merge new items into query_items, preserving old items.
   d) Second coverage check: if still missing, use safe fallback per type (e.g., relationship_inventory → table relationships query from schema; aggregation → SELECT COUNT(*) fallback).
   Return coverage_report in response with {detected_intents, satisfied_intents, missing_intents, retry_count, fallback_used}. Depends on 8 and 9.
11. Phase 11: Prompt Builder Critical Multi-Intent Enhancement. Add explicit non-dropping instruction to prompt_builder.py: "Do NOT omit any user-requested intent. If task_intents contains multiple items, generate exactly one SQL statement per intent. Output format is strict:" and define output format:
   INTENT: [intent_label]
   SQL: [sql_query]
   EXPLANATION: [brief explanation]
   
   INTENT: [intent_label]
   SQL: [sql_query]
   EXPLANATION: [brief explanation]
   
   Add positive examples (tables plus relationships → two INTENT blocks) and negative examples (user asks for 'tables and relationships' but response only has table SQL → flag as violation). Support both legacy single_query_mode and new multi_query_mode true for decomposed requests. Include intent_plan summary block in prompt: "Task intents to satisfy: 1) [intent_label]: [description] 2) [intent_label]: [description]...". Update generator.py to reliably parse this format: split response by INTENT:, extract label and SQL block, validate one SQL per intent block. Parallel with Phase 9 structure work.
12. Phase 12: End-to-End Flow, Rollout, and Verification. Integrate all components: User Query → Intent Decomposition (Phase 8) → Prompt Builder (intent-aware, Phase 11) → LLM Generation → Coverage Validation (Phase 10) → Response Formatter (multi-query, Phase 9). Add feature flag for multi-query mode per route. Keep old response fields populated until frontend migration completes. Enable coverage validation in warn-only mode first, then enforce retry/fallback. Add structured observability/logging:
   - Log detected_intents from Phase 8 decomposition.
   - Log generated_intents (count) from Phase 11 LLM output.
   - Log missing_intents from Phase 10 coverage validation.
   - Log retry_count and fallback_used flags.
   - Keep logs lightweight (JSON format in single log line per query with all fields; no external infra).
   - Use Python logging module with structured keys: {timestamp, user_id, database_id, query, detected_intents, missing_intents, retry_count}.
   Depends on 8, 9, 10, 11.

**Relevant files**
- d:/LearningHub/CollegeProjects/QueryCraft/backend/ai/prompt_builder.py — primary fix point for hardcoded metadata examples, schema formatting, and intent instructions.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/database/executors/mysql_executor_async.py — add FK extraction to query-time schema introspection.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/database/executors/postgres_executor_async.py — add FK extraction to query-time schema introspection.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/api/routes/query.py — session-based query path using build_prompt.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/api/routers/queries.py — production v1 query path using NLToSQLProcessor.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/core/nl_to_sql/processor.py — add explicit db_type handling and relationship-intent fallback policy.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/core/nl_to_sql/pattern_matcher.py — remove cartesian fallback for relationship prompts.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/tests/ai/test_prompt_builder.py — add tests for compound metadata intent and relationship examples.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/tests/executors/test_mysql_async.py — assert FK metadata included in introspection output while preserving old keys.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/tests/executors/test_postgres_async.py — assert FK metadata included in introspection output while preserving old keys.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/tests/core/nl_to_sql/test_processor_llm_fallback.py — add coverage for relationship-intent fallback and explicit db_type behavior.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/tests/core/nl_to_sql/test_processor_schema_context.py — assert FK/relationship lines are present in schema context.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/tests/api/test_query_route.py — add route-level check for compound metadata prompt shaping in session route.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/tests/api/test_live_mysql_runtime_routes.py — add runtime route tests for MySQL relationship metadata fallback behavior.
- d:/LearningHub/CollegeProjects/QueryCraft/backend/api/schemas/query_schemas.py — extend response schemas with query_items list for multi-query output (Phases 9).
- d:/LearningHub/CollegeProjects/QueryCraft/backend/core/llm/generator.py — update LLM output parsing to handle intent-labeled SQL list (Phase 9).
- d:/LearningHub/CollegeProjects/QueryCraft/backend/ai/sql_generator.py — parse and structure one SQL per detected intent (Phase 9).
- d:/LearningHub/CollegeProjects/QueryCraft/backend/ai/response_formatter.py — adapt response formatting for multi-query output and backward compatibility (Phase 9).

**Verification**
1. Run targeted tests: pytest backend/tests/ai/test_prompt_builder.py backend/tests/executors/test_mysql_async.py backend/tests/executors/test_postgres_async.py backend/tests/core/nl_to_sql/test_processor_schema_context.py backend/tests/core/nl_to_sql/test_processor_llm_fallback.py backend/tests/api/test_query_route.py backend/tests/api/test_live_mysql_runtime_routes.py.
2. Run one end-to-end path check for session route using a request that asks for both tables and relationships; assert generated SQL includes relationship metadata query when FK metadata exists.
3. Run one end-to-end path check for v1 route using the same request on a schema without FK metadata; assert partial results with relationship_inventory items marked status='failed' in query_items (no silent drop).
4. Confirm no regressions in SQL safety constraints (single-statement, non-empty, length checks) and no route contract changes in response shape beyond new query_items field.
5. Test intent decomposition (Phase 8): 
   - Verify compound query "I want to list all tables AND understand relationships" splits into ≥2 intents (table_inventory, relationship_inventory).
   - Test semantic patterns: "Show tables with their relationships", "List users including their orders" both detect implicit compound intent.
   - Assert keyword taxonomy scoring correctly classifies each clause.
6. Test multi-query generation and execution (Phase 9):
   - Assert response contains query_items list with ≥2 items when compound intent detected.
   - Assert each item has {intent_label, sql_query, status, error_message} fields.
   - Test failure isolation: if one intent SQL fails to execute, mark status='failed' but continue executing other intents.
   - Assert legacy fields (sql_query, results) are still populated from first successful item for backward compat.
7. Test coverage validation and retry logic (Phase 10):
   - Submit compound query on schema with FK; assert coverage_report shows all intents satisfied (zero missing_intents, retry_count=0).
   - Submit same query on schema without FK; assert missing_intents includes 'relationship_inventory', retry_count≥1, fallback_used=true.
   - Verify retry prompt injection contains explicit text: "previous response missed these intents: [list]".
   - Validate that second attempt (after retry) returns different SQL than first attempt for missing intents.
8. Test output format strictness (Phase 11):
   - Assert LLM response matches strict format (INTENT: / SQL: / EXPLANATION: blocks).
   - Test parser (generator.py) reliably extracts INTENT block structure; reject responses missing format markers.
   - Test negative example: if LLM response only generates one INTENT block when task_intents has two, mark it as coverage miss, trigger retry.
9. Test backward compatibility:
   - Legacy clients reading only sql_query/results still work without breaking.
   - New clients can opt-in to query_items by checking multi_query_mode flag.
   - Verify old test suites still pass without modification.
10. Test observability logging (Phase 12):
   - Assert structured logs contain {detected_intents, missing_intents, retry_count, fallback_used}.
   - Manually inspect one log entry for completeness and JSON format.
   - Verify logs do not contain sensitive user query text in error messages (redact if needed).

**Decisions**
- Production-critical scope includes both query paths: /api/v1/databases/{database_id}/query and /api/query.
- **Multi-intent is mandatory**: NEVER silently drop parts of a compound query. All intents must be attempted; failures are recorded in coverage_report with status markers, not silent omissions.
- Fallback policy: when explicit FK metadata is unavailable, prioritize a safe tables list fallback + mark relationship_inventory as 'failed' in query_items, not silently drop it.
- Keep backend response contracts stable; extend schemas (query_items, coverage_report) but preserve legacy fields for backward compatibility.
- Intent decomposition uses lightweight hybrid approach (rules + semantic patterns + keyword scoring) instead of ML model to avoid overengineering and deployment complexity.
- Retry logic is explicit: on coverage failure, re-invoke LLM with missing intents injected into prompt; second failure uses type-safe fallback (not a guess).
- Multi-query output is backward compatible: legacy response fields (sql_query, results) remain; new clients opt-in to query_items + coverage_report via multi_query_mode flag.
- Coverage validation runs in warn-only mode initially to track missing intents; enforcement (retry/fallback) is gated by feature flag.
- Feature flags allow gradual rollout: phases 1-7 can deploy independently; phases 8-12 require coordinated frontend readiness via feature gates.
- Observability is mandatory: detection of multi-intent and behavior of retry/fallback must be logged for debugging and telemetry.

**Further Considerations**
1. Recommendation: Create new module backend/core/nl_to_sql/intent_decomposer.py to centralize decomposition logic (Phase 8 pseudocode). This avoids drift between prompt_builder and NLToSQLProcessor logic and allows independent testing.
2. Recommendation: Create backend/core/llm/intent_parser.py to handle strict INTENT: / SQL: / EXPLANATION: format parsing (Phase 11). Include regex patterns for robust extraction and unit tests.
3. Recommendation: Create backend/core/nl_to_sql/coverage_validator.py for Phase 10 validation rules. Design as pluggable rule registry so intent-specific rules can be added incrementally per use case.
4. Recommendation: After this fix, add a small metadata benchmark set (tables, columns, relationships, compound intent) under backend/evaluation/benchmarks to track quality over time.
5. Recommendation: Decide whether to deprecate one of the two NL-to-SQL routes (/api/query vs /api/v1/databases/{id}/query) long-term to prevent behavior divergence. Document the deprecation timeline in BACKEND_ARCHITECTURE_FLOW.md.
6. Recommendation (from Phase 8): Intent decomposition taxonomy can be extended incrementally; start with 7 base intents (table_inventory, relationship_inventory, aggregation, filtering, ranking, sorting, joining) and add custom intents per database use case later without rearchitecting.
7. Recommendation (from Phase 9): Implement response formatter adapter layer (backend/ai/response_formatter_v2.py) to avoid tight coupling between multi-query generation and legacy API consumers. Old formatter works for single-query; new formatter orchestrates multi-query.
8. Recommendation (from Phase 10): Coverage validation rules should be versioned and discoverable by clients. Publish rules as metadata endpoint (GET /databases/{id}/validation_rules) so tooling can explain why a query was incomplete.
9. Recommendation (from Phase 12): Require feature flag sign-off from frontend team before enabling coverage validation enforcement. Warn-only mode should persist for ≥1 sprint to collect telemetry and validate retry logic effectiveness.
10. Recommendation: Add observability dashboard: track intent split rates (% of queries with >1 intent), coverage miss rates (% missing_intents), and fallback frequency per database. Use metrics to guide next refinement cycle.
11. Recommendation: Document output format (Phase 11) explicitly in API documentation and LLM system prompt comments. Include valid and invalid examples for LLM training.
12. Recommendation: After phases 1-7 stabilize, plan phase 8-12 rollout with explicit frontend readiness criteria: test coverage ≥80%, integration tests passing, canary traffic testing on 5% of queries first.