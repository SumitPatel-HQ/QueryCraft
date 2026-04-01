"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import QueryInterface from "@/components/query/QueryInterface";
import type { DatabaseResponse } from "@/types/api";

export default function DatabaseChatPage() {
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
        const errorMessage = e instanceof Error ? e.message : "Failed to load database";
        setError(errorMessage);
        console.error("Error fetching database:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchDatabase();
  }, [id, api]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading database...</div>
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
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">
          Query: {database.display_name}
        </h1>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
          {database.table_count} tables - {database.db_type}
        </div>
      </header>

      <QueryInterface databases={[database]} preselectedDatabaseId={database.id} />
    </div>
  );
}
