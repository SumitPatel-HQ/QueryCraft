"use client";

import { Sparkles } from "lucide-react";

const questions = [
  "Monthly revenue trend for last 6 months",
  "Products with stock below 10 units",
  "Customer retention rate by segment",
  "Average order value by category",
  "Top selling products this week",
];

export default function SampleQuestions() {
  return (
    <div className="flex flex-col gap-3 mt-6 pb-2">
      <div className="flex items-center gap-2 text-[12px] font-medium text-[#f0f0f0] ml-1">
        <Sparkles size={14} className="text-[#888888]" />
        Suggested Queries
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {questions.map((q) => (
          <button
            key={q}
            className="whitespace-nowrap px-4 py-2 rounded-full text-[12px] font-medium bg-[#111111] border border-[rgba(255,255,255,0.08)] text-[#f0f0f0] hover:bg-[#1a1a1a] hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
