"use client";

import QueryInterface from "@/components/query/QueryInterface";
import type { DatabaseResponse } from "@/types/api";

interface ChatPageProps {
  databases: DatabaseResponse[];
  error?: string;
}

export default function ChatPage({ databases, error }: ChatPageProps) {
  return (
    <div className="max-w-[1000px] mx-auto flex flex-col gap-8 pb-12">
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">
          Query Your Data
        </h1>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
          Natural Language to SQL
        </div>
      </header>

      {error && (
        <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400 text-[14px]">
          <strong>Error loading databases:</strong> {error}
        </div>
      )}

      {databases.length === 0 ? (
        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] py-16 flex flex-col items-center justify-center text-center px-4">
          <h3 className="text-[16px] font-semibold text-[#f0f0f0] mb-2">No databases available</h3>
          <p className="text-[14px] text-[#888888] max-w-[36ch] mx-auto mb-6">
            Upload a database first to start querying with natural language.
          </p>
        </div>
      ) : (
        <QueryInterface databases={databases} />
      )}
    </div>
  );
}

