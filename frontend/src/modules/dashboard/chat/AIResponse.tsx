"use client";

import SQLCodeBlock from "./SQLCodeBlock";
import ResultsTable from "./ResultsTable";

export default function AIResponse() {
  return (
    <div
      className="self-start max-w-full rounded-[16px] rounded-tl-[16px] rounded-br-[16px] p-6"
      style={{
        background: "rgba(30,30,30,0.6)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="text-sm font-semibold mb-3">📝 Generated SQL:</div>
      <SQLCodeBlock
        code={`SELECT c.customer_name, SUM(o.total_amount) AS total_spent\nFROM customers c\nJOIN orders o ON o.customer_id = c.customer_id\nGROUP BY c.customer_name\nORDER BY total_spent DESC\nLIMIT 10;`}
      />

      <div className="mt-4">
        <div className="text-sm font-semibold mb-2">💡 Explanation:</div>
        <p className="text-sm text-[rgba(255,255,255,0.60)]">
          This query finds the top 10 customers by calculating their total spending. It joins the
          customers and orders tables, groups by customer, sums their order amounts, and sorts in
          descending order.
        </p>
      </div>

      <div className="mt-4 flex gap-4 items-center text-xs">
        <span className="text-[#10B981]">✓ 92% Confidence</span>
        <span className="text-[rgba(255,255,255,0.60)]">Generated in 0.8s</span>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold mb-3">📊 Results (10 rows):</div>
        <ResultsTable />
      </div>

      <div className="mt-4 flex gap-2">
        {[
          "Edit SQL",
          "Copy SQL",
          "Export CSV",
        ].map((b) => (
          <button
            key={b}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{
              color: "#8B5CF6",
              border: "1px solid rgba(139,92,246,0.4)",
              background: "transparent",
            }}
          >
            {b}
          </button>
        ))}
        <div className="ml-2 flex items-center gap-2 text-lg" aria-label="Feedback">
          <button aria-label="Thumbs up">👍</button>
          <button aria-label="Thumbs down">👎</button>
        </div>
      </div>

      <div className="mt-3 text-[0.75rem] text-[rgba(255,255,255,0.38)]">2:30 PM</div>
    </div>
  );
}


