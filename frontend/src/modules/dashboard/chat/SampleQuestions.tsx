"use client";

const questions = [
  "Monthly revenue trend for last 6 months",
  "Products with stock below 10 units",
  "Customer retention rate by segment",
  "Average order value by category",
  "Top selling products this week",
];

export default function SampleQuestions() {
  return (
    <div
      className="sticky bottom-6 rounded-xl p-4 mt-6"
      style={{
        background: "rgba(30,30,30,0.95)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="text-sm font-semibold mb-3">🎯 Try these sample questions:</div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <button
            key={q}
            className="px-4 py-2 rounded-full text-sm"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.87)",
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}


