"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import type { ERDResponse } from "@/types/api";
import mermaid from "mermaid";

export default function ERDPage() {
  const params = useParams();
  const dbId = params.dbId as string;
  const id = parseInt(dbId, 10);

  const [erdData, setErdData] = useState<ERDResponse | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchERD() {
      try {
        const data = await api.getDatabaseERD(id);
        setErdData(data);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load ERD data";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchERD();
  }, [id, api]);

  useEffect(() => {
    if (erdData?.mermaid && mermaidRef.current) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        er: {
          useMaxWidth: true,
        },
      });

      mermaidRef.current.innerHTML = "";
      mermaid
        .render("mermaid-erd", erdData.mermaid)
        .then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        })
        .catch((err) => {
          console.error("Mermaid render error:", err);
        });
    }
  }, [erdData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading ERD...</div>
      </div>
    );
  }

  if (error || !erdData) {
    return (
      <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400">
        {error || "ERD data not found"}
      </div>
    );
  }

  const tables = erdData.tables || [];
  const relationships = erdData.relationships || [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">
          Entity Relationship Diagram
        </h1>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
          {tables.length} tables - {relationships.length} relationships
        </div>
      </header>

      {/* Mermaid Diagram */}
      <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-5 overflow-x-auto">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888] mb-3">
          Diagram
        </div>
        <div ref={mermaidRef} className="min-h-[300px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888] mb-3">
            Tables
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {tables.map((table) => (
              <div
                key={table.name}
                className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-[8px] px-3 py-2"
              >
                <div className="text-[13px] text-[#f0f0f0] font-medium">{table.name}</div>
                <div className="text-[12px] text-[#666666] mt-1">
                  {table.columns.length} columns
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888] mb-3">
            Relationships
          </div>
          {relationships.length === 0 ? (
            <div className="text-[13px] text-[#666666]">No relationships found</div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {relationships.map((rel, idx) => (
                <div
                  key={idx}
                  className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-[8px] px-3 py-2 text-[13px]"
                >
                  <span className="text-[#f0f0f0]">{rel.from}</span>
                  <span className="text-[#666666] mx-2">→</span>
                  <span className="text-[#f0f0f0]">{rel.to}</span>
                  <span className="text-[#888888] text-[12px] ml-2">({rel.type})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
