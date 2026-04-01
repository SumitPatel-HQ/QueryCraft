"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { Database, Table2 } from "lucide-react";
import type { DatabaseResponse, SchemaDataResponse } from "@/types/api";

export default function DatabaseOverviewPage() {
  const params = useParams();
  const dbId = params.dbId as string;
  const id = parseInt(dbId, 10);

  const [database, setDatabase] = useState<DatabaseResponse | null>(null);
  const [schema, setSchema] = useState<SchemaDataResponse | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const api = useApi();


  useEffect(() => {
    async function fetchData() {
      try {
        const [dbData, schemaData] = await Promise.all([
          api.getDatabase(id),
          api.getDatabaseSchema(id),
        ]);
        setDatabase(dbData);
        setSchema(schemaData);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load database";
        setError(errorMessage);
        console.error("Error fetching database:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, api]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading database overview...</div>
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

  const tables = Object.keys(schema?.schema || {});

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111111] p-5 rounded-[10px] border border-[rgba(255,255,255,0.08)]">
          <div className="text-[#888888] mb-2 flex items-center gap-2">
            <Table2 size={16} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em]">Tables</span>
          </div>
          <div className="text-[26px] font-bold text-[#f0f0f0]">{database.table_count}</div>
        </div>

        <div className="bg-[#111111] p-5 rounded-[10px] border border-[rgba(255,255,255,0.08)]">
          <div className="text-[#888888] mb-2 flex items-center gap-2">
            <Database size={16} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em]">Total Rows</span>
          </div>
          <div className="text-[26px] font-bold text-[#f0f0f0]">{database.row_count.toLocaleString()}</div>
        </div>

        <div className="bg-[#111111] p-5 rounded-[10px] border border-[rgba(255,255,255,0.08)]">
          <div className="text-[#888888] mb-2 flex items-center gap-2">
            <Database size={16} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em]">Size</span>
          </div>
          <div className="text-[26px] font-bold text-[#f0f0f0]">{(database.size_mb ?? 0).toFixed(1)} MB</div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-6 space-y-4">
        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Name</div>
          <div className="text-[14px] text-[#f0f0f0]">{database.display_name}</div>
        </div>

        {database.description && (
          <div>
            <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Description</div>
            <div className="text-[14px] text-[#f0f0f0]">{database.description}</div>
          </div>
        )}

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Type</div>
          <div className="text-[14px] text-[#f0f0f0] uppercase">{database.db_type}</div>
        </div>

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Created</div>
          <div className="text-[14px] text-[#f0f0f0]">{new Date(database.created_at).toLocaleString()}</div>
        </div>

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Last Accessed</div>
          <div className="text-[14px] text-[#f0f0f0]">{new Date(database.last_accessed).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888] mb-4">
          Tables ({tables.length})
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tables.map((table) => (
            <div
              key={table}
              className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-[8px] px-3 py-2 text-[13px] text-[#f0f0f0]"
            >
              {table}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
