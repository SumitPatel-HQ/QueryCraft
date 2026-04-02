"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import type { ERDResponse, ERDTable, ERDRelationship } from "@/types/api";
import mermaid from "mermaid";
import Link from "next/link";
import { Link2 } from "lucide-react";

function sanitizeMermaidId(s: string): string {
  // Mermaid ER diagram identifiers are safest with [A-Za-z0-9_-].
  // Keep underscores/dashes to preserve readability.
  return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function cleanMermaidType(colType: string): string {
  const base = (colType || "").split("(")[0];
  return sanitizeMermaidId(base) || "string";
}

function generateDynamicMermaid(
  tables: ERDTable[],
  relationships: ERDRelationship[]
): string {
  let mermaidStr = "erDiagram\n";

  tables.forEach((table) => {
    const tableName = sanitizeMermaidId(table.name);
    mermaidStr += `    ${tableName} {\n`;

    table.columns.forEach((col) => {
      const colType = cleanMermaidType(col.type);
      const colName = sanitizeMermaidId(col.name);

      let keyMarker = "";
      const keyUpper = (col.key || "").toUpperCase();
      if (
        keyUpper.includes("PK") ||
        keyUpper.includes("PRI") ||
        keyUpper.includes("PRIMARY")
      ) {
        keyMarker = " PK";
      } else if (
        keyUpper.includes("FK") ||
        keyUpper.includes("MUL") ||
        keyUpper.includes("FOREIGN")
      ) {
        keyMarker = " FK";
      }

      mermaidStr += `        ${colType} ${colName}${keyMarker}\n`;
    });
    mermaidStr += "    }\n";
  });

  relationships.forEach((rel) => {
    const from = sanitizeMermaidId(rel.from);
    const to = sanitizeMermaidId(rel.to);
    mermaidStr += `    ${from} }o--|| ${to} : "${sanitizeMermaidId(rel.via || "has")}"\n`;
  });

  return mermaidStr;
}

export default function ERDPage() {
  const params = useParams();
  const dbId = params.dbId as string;
  const id = parseInt(dbId, 10);

  const [erdData, setErdData] = useState<ERDResponse | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const mermaidBaseIdRef = useRef(
    `mermaid-erd-${Math.random().toString(36).slice(2)}`
  );
  const mermaidSeqRef = useRef(0);

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

  const tables = erdData?.tables || [];
  const relationships = erdData?.relationships || [];
  const tableCount = tables.length;
  const relationshipCount = relationships.length;

  const backendMermaid = erdData?.mermaid?.trim() || "";
  const fallbackMermaid = generateDynamicMermaid(tables, relationships);
  const mermaidSource = backendMermaid || fallbackMermaid;
  const canRenderMermaid = tableCount > 0 && mermaidSource.trim().length > 0;

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      er: {
        useMaxWidth: true,
      },
    });
  }, []);

  useEffect(() => {
    if (canRenderMermaid && mermaidRef.current) {
      const renderId = `${mermaidBaseIdRef.current}-${++mermaidSeqRef.current}`;

      mermaidRef.current.innerHTML = "";
      mermaid
        .render(renderId, mermaidSource)
        .then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        })
        .catch((err) => {
          console.error("Mermaid render error:", err);

          if (
            backendMermaid &&
            fallbackMermaid &&
            fallbackMermaid !== backendMermaid &&
            mermaidRef.current
          ) {
            const fallbackId = `${mermaidBaseIdRef.current}-${++mermaidSeqRef.current}`;
            mermaid
              .render(fallbackId, fallbackMermaid)
              .then(({ svg }) => {
                if (mermaidRef.current) {
                  mermaidRef.current.innerHTML = svg;
                }
              })
              .catch((fallbackErr) => {
                console.error("Mermaid fallback render error:", fallbackErr);
              });
          }
        });
    }
  }, [canRenderMermaid, mermaidSource, backendMermaid, fallbackMermaid]);

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

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">
          Entity Relationship Diagram
        </h1>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
          {tableCount} TABLES &middot; {relationshipCount} RELATIONSHIPS
        </div>
      </header>

      {tableCount === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-center min-h-[400px]">
          <div className="w-12 h-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[rgba(255,255,255,0.05)]">
            <Link2 className="w-6 h-6 text-[#666666]" />
          </div>
          <h3 className="text-white font-medium text-base mb-2">Nothing to diagram yet</h3>
          <p className="text-[#888888] text-sm max-w-md mb-6 leading-relaxed">
            Your current schema has {tableCount} table(s) and {relationshipCount} relationship(s).
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/databases/${dbId}/schema`}
              className="px-4 py-2 bg-[#ffffff] text-[#000000] text-sm font-medium rounded-md hover:bg-[#e0e0e0] transition-colors"
            >
              View Schema
            </Link>
            <a
              href="https://en.wikipedia.org/wiki/Foreign_key"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#1a1a1a] text-white text-sm font-medium rounded-md border border-[rgba(255,255,255,0.08)] hover:bg-[#222222] transition-colors"
            >
              Learn about Foreign Keys
            </a>
          </div>
        </div>
      ) : (
        <>
          {relationshipCount === 0 ? (
            <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4">
              <div className="text-[#f0f0f0] text-sm font-medium">No relationships detected</div>
              <div className="text-[#888888] text-sm mt-1">
                The diagram still shows entities, but no links were inferred (missing FK constraints or naming like `*_id`).
              </div>
            </div>
          ) : null}

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
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
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
        </>
      )}
    </div>
  );
}

