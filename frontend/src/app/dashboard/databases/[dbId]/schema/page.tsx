"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { Search, Plus, Key, Edit2, Copy, Trash2 } from "lucide-react";
import type { SchemaDataResponse } from "@/types/api";

function TypeBadge({ type }: { type: string }) {
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('int') || lowerType.includes('serial')) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">integer</span>;
  }
  if (lowerType.includes('char') || lowerType.includes('text') || lowerType.includes('string') || lowerType.includes('uuid')) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">text</span>;
  }
  if (lowerType.includes('bool')) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20">boolean</span>;
  }
  if (lowerType.includes('time') || lowerType.includes('date')) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">timestamp</span>;
  }
  if (lowerType.includes('float') || lowerType.includes('double') || lowerType.includes('numeric') || lowerType.includes('real')) {
     return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/20">numeric</span>;
  }
  
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#888888]/10 text-[#888888] border border-[#888888]/20">{lowerType}</span>;
}

export default function DatabaseSchemaPage() {
  const params = useParams();
  const dbId = params.dbId as string;
  const id = parseInt(dbId, 10);

  const [schema, setSchema] = useState<SchemaDataResponse | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const api = useApi();

  useEffect(() => {
    async function fetchSchema() {
      try {
        const data = await api.getDatabaseSchema(id);
        setSchema(data);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load schema";
        setError(errorMessage);
        console.error("Error fetching schema:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchSchema();
  }, [id, api]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#888888] text-sm">Loading schema...</div>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="bg-[#1a0f0f] border border-[#3a1f1f] rounded-[8px] p-4 text-red-400 text-sm">
        {error || "Schema not found"}
      </div>
    );
  }

  const tables = Object.entries(schema.schema);
  const totalTables = tables.length;
  
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input 
            type="text" 
            placeholder="Search columns..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[13px] text-white rounded-[6px] pl-9 pr-4 py-2 focus:outline-none focus:border-[#444444] placeholder-[#666666] transition-colors"
          />
        </div>
      </div>

      {tables.map(([tableName, columns]) => {
        const typedColumns = columns as Array<{
          name?: string;
          column?: string;
          type: string;
          primary_key?: boolean;
          nullable?: boolean;
          foreign_key?: { table: string; column: string };
          default?: string;
        }>;

        const filteredColumns = typedColumns.filter(
          (col) => {
            const columnName = col.name || col.column || '';
            return (
              columnName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              tableName.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
        );

        if (filteredColumns.length === 0) return null;

        return (
          <div
            key={tableName}
            className="bg-[#111111] border border-[#2a2a2a] rounded-[8px] overflow-hidden"
          >
            <div className="bg-[#111111] px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-bold text-white">{tableName}</h3>
                <div className="text-[12px] text-[#888888] mt-1 flex items-center gap-2">
                  <span>{typedColumns.length} columns</span>
                  <span className="w-1 h-1 rounded-full bg-[#444444]" />
                  <span>{totalTables} table{totalTables === 1 ? '' : 's'}</span>
                  <span className="w-1 h-1 rounded-full bg-[#444444]" />
                  <span className="uppercase tracking-wider">{schema.source === "cached" ? "CACHED" : "FRESH"}</span>
                </div>
              </div>
              
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#2a2a2a] text-[#f0f0f0] text-[12px] font-medium hover:bg-[#1a1a1a] transition-colors">
                <Plus size={14} />
                Add Column
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111111]">
                  <tr>
                    <th className="px-5 py-3 text-[11px] font-medium text-[#888888] uppercase tracking-[0.06em] border-b border-[#2a2a2a] w-[35%]">
                      Column Name
                    </th>
                    <th className="px-5 py-3 text-[11px] font-medium text-[#888888] uppercase tracking-[0.06em] border-b border-[#2a2a2a] w-[15%]">
                      Data Type
                    </th>
                    <th className="px-5 py-3 text-[11px] font-medium text-[#888888] uppercase tracking-[0.06em] border-b border-[#2a2a2a] w-[20%]">
                      Constraints
                    </th>
                    <th className="px-5 py-3 text-[11px] font-medium text-[#888888] uppercase tracking-[0.06em] border-b border-[#2a2a2a] w-[15%]">
                      Nullable
                    </th>
                    <th className="px-5 py-3 text-[11px] font-medium text-[#888888] uppercase tracking-[0.06em] border-b border-[#2a2a2a] w-[15%]">
                      Default
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredColumns.map((col, i) => {
                    const isEven = i % 2 === 0;
                    const columnName = col.name || col.column || '';
                    return (
                      <tr
                        key={i}
                        className={`group border-b border-[#2a2a2a] last:border-0 hover:bg-[#1f1f1f] transition-colors ${
                          isEven ? 'bg-[#111111]' : 'bg-[#161616]'
                        }`}
                      >
                        <td className="px-5 py-3 text-[13px] text-[#f0f0f0]">
                          <div className="flex items-center gap-2">
                            {columnName}
                            {col.primary_key && (
                              <Key size={12} className="text-[#eab308]" aria-label="Primary Key" />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <TypeBadge type={col.type} />
                        </td>
                        <td className="px-5 py-3 text-[13px] text-[#888888]">
                          {col.foreign_key ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[#666666]/10 text-[#a3a3a3] border border-[#444444]">
                               FK: {col.foreign_key.table}.{col.foreign_key.column}
                            </span>
                          ) : (
                            <span className="text-[#444444]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[13px]">
                           {col.nullable === false ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-red-500/10 text-red-400 border border-red-500/20">
                                NOT NULL
                              </span>
                           ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[#2a2a2a] text-[#a3a3a3] border border-[#333333]">
                                NULLABLE
                              </span>
                           )}
                        </td>
                        <td className="px-5 py-3 text-[13px] text-[#888888]">
                           {col.default ? (
                             <span className="font-mono text-[12px]">{col.default}</span>
                           ) : (
                             <span className="text-[#444444]">—</span>
                           )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
