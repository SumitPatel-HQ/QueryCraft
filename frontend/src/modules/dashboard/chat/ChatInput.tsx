"use client";

import { Send } from "lucide-react";

export default function ChatInput() {
  return (
    <div className="sticky bottom-0 left-0 right-0 w-full bg-[#111111] border-t border-[rgba(255,255,255,0.08)] py-4 backdrop-blur-md">
      <div className="max-w-[900px] mx-auto px-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <input
              aria-label="Type your question"
              placeholder="Query sales data, trends, or user stats..."
              className="flex-1 h-[44px] rounded-[10px] px-4 text-[13px] font-mono bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] text-[#f0f0f0] placeholder-[#444444] shadow-inner focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
            />
            <button
              aria-label="Submit"
              className="w-[44px] h-[44px] rounded-[10px] flex items-center justify-center bg-white text-black hover:scale-[0.97] active:scale-95 transition-all shadow-sm flex-shrink-0"
            >
              <Send size={16} strokeWidth={2.5} className="ml-0.5" />
            </button>
          </div>
          <div className="text-[11px] text-[#444444] text-center mt-1">
            QueryCraft uses AI and may produce inaccurate SQL. Always verify before executing destructive operations.
          </div>
        </div>
      </div>
    </div>
  );
}
