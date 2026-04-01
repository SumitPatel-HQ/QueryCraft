---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 02-ai-agnostic-provider
status: planning
last_updated: "2026-04-01T20:52:42.340Z"
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 2
  completed_plans: 1
---

# Project State

**Last Updated:** 2026-04-02
**Current Phase:** 02-ai-agnostic-provider
**Status:** planning

## Decisions

- Keep Gemini as default provider until new providers prove equal reliability.
- Preserve existing NL-to-SQL fallback behavior (LLM first, pattern matching fallback).
- Prioritize backend contract safety; no frontend contract changes in this phase.
- [Phase 02]: Kept generator-facing provider method as generate(prompt) while adding a Gemini adapter shim.
- [Phase 02]: Resolved provider selection as explicit arg -> LLM_PROVIDER -> LLM_PROVIDER_ORDER -> gemini fallback.

## Blockers

- No standardized backend test scaffold exists yet.
