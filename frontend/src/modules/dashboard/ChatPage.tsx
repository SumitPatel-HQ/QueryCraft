"use client";

import QueryInterface from "@/components/query/QueryInterface";
import type { DatabaseResponse } from "@/types/api";

interface ChatPageProps {
  databases: DatabaseResponse[];
  error?: string;
  preselectedDatabaseId?: number;
}

export default function ChatPage({ databases, error, preselectedDatabaseId }: ChatPageProps) {
  return (
    <div style={{ maxWidth: "1000px" }} className="w-full mx-auto flex flex-col gap-8 pb-0 min-h-[calc(100vh-64px)]">
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

      <QueryInterface databases={databases} preselectedDatabaseId={preselectedDatabaseId} />
    </div>
  );
}

