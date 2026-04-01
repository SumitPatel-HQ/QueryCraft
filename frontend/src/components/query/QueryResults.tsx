"use client";

import { Code, Clock, TrendingUp, Sparkles } from "lucide-react";
import type { QueryResponse } from "@/types/api";
import SQLCodeBlock from "@/modules/dashboard/chat/SQLCodeBlock";

interface QueryResultsProps {
  result: QueryResponse;
}

export default function QueryResults({ result }: QueryResultsProps) {
  const columns = result.columns || Object.keys((result.results[0] as Record<string, unknown>) || {});

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4">
          <div className="flex items-center gap-2 text-[#888888] mb-2">
            <TrendingUp size={14} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em]">Confidence</span>
          </div>
          <div className="text-[20px] font-bold text-[#f0f0f0]">
            {result.confidence !== null && result.confidence !== undefined ? `${result.confidence}%` : "N/A"}
          </div>
        </div>

        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4">
          <div className="flex items-center gap-2 text-[#888888] mb-2">
            <Clock size={14} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em]">Execution Time</span>
          </div>
          <div className="text-[20px] font-bold text-[#f0f0f0]">{result.execution_time_ms ?? "N/A"}ms</div>
        </div>

        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4">
          <div className="flex items-center gap-2 text-[#888888] mb-2">
            <Sparkles size={14} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em]">Complexity</span>
          </div>
          <div className="text-[20px] font-bold text-[#f0f0f0]">{result.query_complexity || "N/A"}</div>
        </div>

        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4">
          <div className="flex items-center gap-2 text-[#888888] mb-2">
            <Code size={14} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em]">Method</span>
          </div>
          <div className="text-[14px] font-bold text-[#f0f0f0] uppercase">{result.generation_method || "N/A"}</div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888] mb-3">Generated SQL</div>
        <SQLCodeBlock code={result.sql_query} />
      </div>

      {result.explanation && (
        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888] mb-3">Explanation</div>
          <div className="text-[14px] text-[#f0f0f0]">{result.explanation}</div>
        </div>
      )}

      <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888]">
            Results ({result.results.length} rows)
          </div>
        </div>

        {result.results.length === 0 ? (
          <div className="p-8 text-center text-[#666666] text-[14px]">No results found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0a]">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="text-left px-4 py-3 text-[12px] font-semibold text-[#f0f0f0] border-b border-[rgba(255,255,255,0.08)]"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.results.map((row, i) => {
                  const record = row as Record<string, unknown>;
                  return (
                    <tr
                      key={i}
                      className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)]"
                    >
                      {columns.map((col) => (
                        <td key={col} className="px-4 py-3 text-[13px] text-[#f0f0f0]">
                          {record[col] !== null && record[col] !== undefined ? (
                            String(record[col])
                          ) : (
                            <span className="text-[#666666]">NULL</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
