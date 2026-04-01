# QueryCraft Requirements (Planning Baseline)

## Phase 02 — AI-Agnostic Provider Layer

- **LLM-01**: Introduce a provider interface so NL-to-SQL generation is decoupled from Gemini implementation details.
- **LLM-02**: Keep Gemini as the default runtime provider with behavior parity for SQL generation + explanation paths.
- **LLM-03**: Add configuration-driven provider selection with safe fallback to Gemini when config is invalid or missing.
- **LLM-04**: Preserve fallback-to-pattern-matching reliability when provider calls fail, with explicit provider-aware logging.
