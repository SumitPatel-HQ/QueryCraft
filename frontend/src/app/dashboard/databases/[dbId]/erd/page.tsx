"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import type { SchemaDataResponse } from "@/types/api";

type SchemaColumn = {
  name: string;
  type: string;
  primary_key?: boolean;
  foreign_key?: {
    table: string;
    column: string;
  };
};

export default function ERDPage() {
  const params = useParams();
  const dbId = params.dbId as string;
  const id = parseInt(dbId, 10);

  const [schema, setSchema] = useState<SchemaDataResponse | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const api = useApi();


  useEffect(() => {
    async function fetchSchema() {
      try {
        const data = await api.getDatabaseSchema(id);
        setSchema(data);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load ERD data";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchSchema();
  }, [id, api]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading ERD...</div>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400">
        {error || "Schema not found"}
      </div>
    );
  }

  const tables = Object.entries(schema.schema) as Array<[string, unknown]>;
  const relationships: Array<{ from: string; to: string; key: string }> = [];

  tables.forEach(([tableName, columns]) => {
    const typedColumns = columns as SchemaColumn[];
    typedColumns.forEach((col) => {
      if (col.foreign_key) {
        relationships.push({
          from: `${tableName}.${col.name}`,
          to: `${col.foreign_key.table}.${col.foreign_key.column}`,
          key: `${tableName}-${col.name}-${col.foreign_key.table}-${col.foreign_key.column}`,
        });
      }
    });
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">Entity Relationships</h1>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
          {tables.length} tables - {relationships.length} foreign keys
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888] mb-3">Tables</div>
          <div className="space-y-2">
            {tables.map(([name, columns]) => (
              <div key={name} className="flex items-center justify-between bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-[8px] px-3 py-2">
                <span className="text-[13px] text-[#f0f0f0]">{name}</span>
                <span className="text-[12px] text-[#666666]">{(columns as SchemaColumn[]).length} columns</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888] mb-3">Relationships</div>
          {relationships.length === 0 ? (
            <div className="text-[13px] text-[#666666]">No foreign key relationships found</div>
          ) : (
            <div className="space-y-2">
              {relationships.map((rel) => (
                <div key={rel.key} className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-[8px] px-3 py-2 text-[13px] text-[#f0f0f0]">
                  {rel.from} <span className="text-[#666666]">-&gt;</span> {rel.to}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
