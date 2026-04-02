"""CLI to run NL-to-SQL quality evaluation benchmarks."""

from __future__ import annotations

import argparse
import json

from evaluation.nl2sql_quality_eval import (
    evaluate_benchmark,
    load_benchmark,
    write_result,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run NL-to-SQL benchmark evaluation")
    parser.add_argument("--db", required=True, help="Path to SQLite database")
    parser.add_argument(
        "--benchmark",
        required=True,
        help="Path to benchmark JSON with question/gold_sql items",
    )
    parser.add_argument(
        "--out",
        default="evaluation/results/latest_nl2sql_eval.json",
        help="Output JSON path",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    benchmark = load_benchmark(args.benchmark)
    result = evaluate_benchmark(db_path=args.db, benchmark=benchmark)
    write_result(result, args.out)

    print("SUMMARY")
    print(json.dumps(result.summary.__dict__, indent=2))
    print(f"Saved detailed results to: {args.out}")


if __name__ == "__main__":
    main()
