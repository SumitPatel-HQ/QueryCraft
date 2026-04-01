"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import type { DatabaseResponse } from "@/types/api";

export default function SettingsPage() {
  const params = useParams();
  const dbId = params.dbId as string;
  const id = parseInt(dbId, 10);

  const [database, setDatabase] = useState<DatabaseResponse | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const api = useApi();


  useEffect(() => {
    async function fetchDatabase() {
      try {
        const data = await api.getDatabase(id);
        setDatabase(data);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load database settings";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchDatabase();
  }, [id, api]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading settings...</div>
      </div>
    );
  }

  if (error || !database) {
    return (
      <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400">
        {error || "Database not found"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">Database Settings</h1>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
          Read-only metadata and configuration
        </div>
      </header>

      <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-6 space-y-4">
        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Database Name</div>
          <div className="text-[14px] text-[#f0f0f0]">{database.display_name}</div>
        </div>

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Type</div>
          <div className="text-[14px] text-[#f0f0f0] uppercase">{database.db_type}</div>
        </div>

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Tables</div>
          <div className="text-[14px] text-[#f0f0f0]">{database.table_count}</div>
        </div>

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Rows</div>
          <div className="text-[14px] text-[#f0f0f0]">{database.row_count.toLocaleString()}</div>
        </div>

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Size</div>
          <div className="text-[14px] text-[#f0f0f0]">{(database.size_mb ?? 0).toFixed(2)} MB</div>
        </div>

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Created At</div>
          <div className="text-[14px] text-[#f0f0f0]">{new Date(database.created_at).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
