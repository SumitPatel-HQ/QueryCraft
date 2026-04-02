# NL-to-SQL Quality Evaluation

This folder tracks NL-to-SQL quality over time using reproducible benchmark runs.

## Metrics

- Execution Accuracy: predicted SQL result rows equal gold SQL result rows.
- Exact Match: normalized predicted SQL text equals normalized gold SQL text.
- Avg Token F1: overlap quality between predicted SQL and gold SQL tokens.
- Syntax Valid Rate: predicted SQL executes successfully.

## Run evaluation

From `backend/`:

```bash
python -m evaluation.run_nl2sql_eval \
  --db "api/uploads/project_1___weather_dataset.db" \
  --benchmark "evaluation/benchmarks/weather_v1.json" \
  --out "evaluation/results/weather_v1_latest.json"
```

## Future quality scope

Use this process every time NL-to-SQL logic changes:

1. Add/expand benchmark sets in `evaluation/benchmarks/`.
2. Run evaluator and store result JSON in `evaluation/results/`.
3. Compare summary metrics against previous baseline.
4. Do not merge quality regressions without explicit approval.
