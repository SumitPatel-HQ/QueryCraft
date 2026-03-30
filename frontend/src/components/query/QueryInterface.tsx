"use client";

import { useState } from "react";
import { Send, Loader2, Database as DatabaseIcon } from "lucide-react";
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { cn } from "@/lib/utils"
import QueryResults from "./QueryResults"
import type { DatabaseResponse, QueryResponse } from "@/types/api";

interface QueryInterfaceProps {
  databases: DatabaseResponse[];
  preselectedDatabaseId?: number;
}

export default function QueryInterface({ databases, preselectedDatabaseId }: QueryInterfaceProps) {
  const api = useApi();
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<number | null>(
    preselectedDatabaseId || (databases.length === 1 ? databases[0].id : null)
  );
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDatabaseId) {
      setError("Please select a database");
      return;
    }

    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.queryDatabase(selectedDatabaseId, question.trim());
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {!preselectedDatabaseId && databases.length > 1 && (
        <div>
          <label className="block text-[12px] text-[#888888] mb-2">Select Database</label>
          <select
            value={selectedDatabaseId || ""}
            onChange={(e) => setSelectedDatabaseId(Number(e.target.value) || null)}
            className="w-full bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-4 py-3 text-[14px] text-[#f0f0f0] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
          >
            <option value="">Choose a database...</option>
            {databases.map((db) => (
              <option key={db.id} value={db.id}>
                {db.display_name} ({db.table_count} tables)
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedDatabaseId && (
        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4 flex items-center gap-3">
          <DatabaseIcon size={20} className="text-[#888888]" />
          <div>
            <div className="text-[14px] font-semibold text-[#f0f0f0]">
              {databases.find((db) => db.id === selectedDatabaseId)?.display_name}
            </div>
            <div className="text-[12px] text-[#666666]">
              {databases.find((db) => db.id === selectedDatabaseId)?.table_count} tables
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your data..."
          disabled={loading || !selectedDatabaseId}
          className="flex-1 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-4 py-3 text-[14px] text-[#f0f0f0] placeholder:text-[#666666] focus:outline-none focus:ring-0 focus:border-white/10 disabled:opacity-50"
        />
        <Button 
          type="submit" 
          disabled={loading || !selectedDatabaseId || !question.trim()} 
          className={cn(
            "w-11 h-11 rounded-full p-0 flex items-center justify-center transition-all duration-200 shrink-0",
            !loading && question.trim() && selectedDatabaseId
              ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5" 
              : "bg-[#222222] text-white/20 opacity-50"
          )}
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </Button>
      </form>

      {error && (
        <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400 text-[14px]">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && <QueryResults result={result} />}
    </div>
  );
}
