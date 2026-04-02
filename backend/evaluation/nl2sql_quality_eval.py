"""Reusable NL-to-SQL quality evaluation utilities."""

from __future__ import annotations

import json
import os
import re
import sqlite3
from dataclasses import dataclass
from typing import Any, Callable

from core.nl_to_sql.processor import NLToSQLProcessor
from core.schema_introspection.introspector import SQLiteIntrospector


@dataclass
class EvalSummary:
    total: int
    execution_accuracy: float
    exact_match: float
    avg_token_f1: float
    syntax_valid_rate: float


@dataclass
class EvalDetail:
    id: str
    question: str
    method: str | None
    blocked: bool
    pred_sql: str | None
    gold_sql: str
    pred_error: str | None
    exec_match: bool
    exact_match: bool
    token_f1: float


@dataclass
class EvalResult:
    summary: EvalSummary
    details: list[EvalDetail]


BenchmarkItem = dict[str, str]
PredictorOutput = str | dict[str, Any]
PredictorFn = Callable[[str], PredictorOutput]


def _normalize_sql(sql: str | None) -> str:
    cleaned = (sql or "").strip().rstrip(";").lower()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def _token_f1(pred_sql: str | None, gold_sql: str) -> float:
    pred_tokens = _normalize_sql(pred_sql).split()
    gold_tokens = _normalize_sql(gold_sql).split()

    if not pred_tokens and not gold_tokens:
        return 1.0

    pred_set = set(pred_tokens)
    gold_set = set(gold_tokens)
    true_positive = len(pred_set & gold_set)

    precision = true_positive / len(pred_set) if pred_set else 0.0
    recall = true_positive / len(gold_set) if gold_set else 0.0

    if precision + recall == 0:
        return 0.0
    return (2 * precision * recall) / (precision + recall)


def _normalize_rows(rows: list[tuple[Any, ...]]) -> list[tuple[Any, ...]]:
    normalized: list[tuple[Any, ...]] = []
    for row in rows:
        normalized_row = []
        for value in row:
            if isinstance(value, float):
                normalized_row.append(round(value, 8))
            else:
                normalized_row.append(value)
        normalized.append(tuple(normalized_row))
    return normalized


def _run_sql(con: sqlite3.Connection, sql_query: str) -> list[tuple[Any, ...]]:
    cur = con.cursor()
    cur.execute(sql_query)
    return _normalize_rows(cur.fetchall())


def _build_default_predictor(db_path: str) -> PredictorFn:
    introspector = SQLiteIntrospector(db_path)
    schema = introspector.get_schema_details()
    processor = NLToSQLProcessor(schema, introspector=introspector)

    def _predict(question: str) -> dict[str, Any]:
        result = processor.process_query(question)
        return {
            "sql_query": result.get("sql_query", ""),
            "blocked": bool(result.get("blocked", False)),
            "method": result.get("generation_method"),
        }

    return _predict


def evaluate_benchmark(
    db_path: str,
    benchmark: list[BenchmarkItem],
    predictor: PredictorFn | None = None,
) -> EvalResult:
    if predictor is None:
        predictor = _build_default_predictor(db_path)

    con = sqlite3.connect(db_path)
    details: list[EvalDetail] = []
    execution_correct = 0
    exact_match_count = 0
    syntax_valid_count = 0
    token_f1_values: list[float] = []

    try:
        for index, item in enumerate(benchmark, start=1):
            item_id = item.get("id", f"q{index}")
            question = item["question"]
            gold_sql = item["gold_sql"]

            pred_sql: str | None
            pred_error: str | None = None
            method: str | None = None
            blocked = False

            raw_prediction = predictor(question)
            if isinstance(raw_prediction, dict):
                pred_sql = raw_prediction.get("sql_query") or ""
                blocked = bool(raw_prediction.get("blocked", False))
                method = raw_prediction.get("method")
            else:
                pred_sql = raw_prediction
                method = "custom"

            exec_match = False
            pred_rows: list[tuple[Any, ...]] = []
            gold_rows: list[tuple[Any, ...]] = []

            if pred_sql:
                try:
                    pred_rows = _run_sql(con, pred_sql)
                    syntax_valid_count += 1
                except Exception as exc:  # noqa: BLE001
                    pred_error = str(exc)
            elif blocked:
                blocked = True

            try:
                gold_rows = _run_sql(con, gold_sql)
            except Exception as exc:  # noqa: BLE001
                pred_error = f"Gold SQL invalid: {exc}"

            if pred_error is None and pred_rows == gold_rows:
                exec_match = True
                execution_correct += 1

            exact_match = _normalize_sql(pred_sql) == _normalize_sql(gold_sql)
            if exact_match:
                exact_match_count += 1

            token_f1 = _token_f1(pred_sql, gold_sql)
            token_f1_values.append(token_f1)

            details.append(
                EvalDetail(
                    id=str(item_id),
                    question=question,
                    method=method,
                    blocked=blocked,
                    pred_sql=pred_sql,
                    gold_sql=gold_sql,
                    pred_error=pred_error,
                    exec_match=exec_match,
                    exact_match=exact_match,
                    token_f1=round(token_f1, 3),
                )
            )
    finally:
        con.close()

    total = len(benchmark)
    summary = EvalSummary(
        total=total,
        execution_accuracy=round(execution_correct / total, 3) if total else 0.0,
        exact_match=round(exact_match_count / total, 3) if total else 0.0,
        avg_token_f1=round(sum(token_f1_values) / total, 3) if total else 0.0,
        syntax_valid_rate=round(syntax_valid_count / total, 3) if total else 0.0,
    )

    return EvalResult(summary=summary, details=details)


def load_benchmark(path: str) -> list[BenchmarkItem]:
    with open(path, encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("Benchmark file must contain a JSON array")
    return data


def write_result(result: EvalResult, out_path: str) -> None:
    out_dir = os.path.dirname(out_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    payload = {
        "summary": result.summary.__dict__,
        "details": [detail.__dict__ for detail in result.details],
    }
    with open(out_path, "w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)
