"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Zap,
  Database,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from "lucide-react";
import type { QueryHistoryItem } from "@/types/api";

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 85 ? "#22c55e" : score >= 65 ? "#f59e0b" : "#ef4444";
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: `${color}20`, color }}
    >
      {score}% confidence
    </span>
  );
}

function SqlBlock({ sql }: { sql: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const lines = sql.trim().split("\n");
  const preview = lines.slice(0, 2).join("\n");
  const hasMore = lines.length > 2;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div
      className="mt-3 rounded-[8px] overflow-hidden"
      style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between px-3 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#555555]">SQL</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[11px] text-[#666666] hover:text-[#aaaaaa] transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#aaaaaa] transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
      </div>
      <pre className="px-3 py-2.5 text-[12px] text-[#a78bfa] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
        {expanded ? sql.trim() : preview + (hasMore ? "\n..." : "")}
      </pre>
    </div>
  );
}

function HistoryCard({ item }: { item: QueryHistoryItem }) {
  return (
    <div
      className="rounded-[12px] p-4 transition-all"
      style={{
        background: "#111111",
        border: `1px solid ${item.success ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.2)"}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {item.success ? (
            <CheckCircle2 size={16} className="text-[#22c55e]" />
          ) : (
            <XCircle size={16} className="text-[#ef4444]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] text-[#f0f0f0] leading-snug font-medium">
            {item.question}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {item.confidence_score !== null && (
              <ConfidenceBadge score={item.confidence_score} />
            )}
            {item.result_count !== null && item.success && (
              <span className="flex items-center gap-1 text-[11px] text-[#777777]">
                <BarChart2 size={11} />
                {item.result_count} row{item.result_count !== 1 ? "s" : ""}
              </span>
            )}
            {item.execution_time_ms !== null && (
              <span className="flex items-center gap-1 text-[11px] text-[#777777]">
                <Zap size={11} />
                {item.execution_time_ms}ms
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-[#555555] ml-auto">
              <Clock size={11} />
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Error message */}
          {!item.success && item.error_message && (
            <div className="mt-2 px-3 py-2 rounded-[6px] bg-[#ef444410] border border-[#ef444420]">
              <p className="text-[12px] text-[#f87171] line-clamp-2">{item.error_message}</p>
            </div>
          )}

          {/* SQL block */}
          {item.sql_query && <SqlBlock sql={item.sql_query} />}
        </div>
      </div>
    </div>
  );
}

export default function DatabaseChatHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const dbId = params.dbId as string;
  const id = parseInt(dbId, 10);

  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [dbName, setDbName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const api = useApi();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await api.getDatabaseHistory(id);
        setHistory(data.history);
        setDbName(data.database_name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [id, api]);

  const successCount = history.filter((h) => h.success).length;
  const failCount = history.filter((h) => !h.success).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#555555] text-sm">Loading history…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400 text-[14px]">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">
            Chat History
          </h1>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
            {dbName} · Last 50 queries
          </div>
        </div>

    </div>

      {/* Stats bar */}
      {history.length > 0 && (
        <div
          className="grid grid-cols-3 gap-3"
          style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
        >
          {[
            { label: "Total Queries", value: history.length, icon: <Database size={14} /> },
            { label: "Successful", value: successCount, icon: <CheckCircle2 size={14} className="text-[#22c55e]" /> },
            { label: "Failed", value: failCount, icon: <XCircle size={14} className="text-[#ef4444]" /> },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="flex flex-col gap-1 px-4 py-3 rounded-[10px]"
              style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-1.5 text-[#666666]">
                {icon}
                <span className="text-[11px] uppercase tracking-widest font-medium">{label}</span>
              </div>
              <span className="text-[22px] font-bold text-[#f0f0f0] leading-none">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* History list */}
      {history.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-[12px] gap-3"
          style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <MessageSquare size={32} className="text-[#333333]" />
          <p className="text-[14px] text-[#555555]">No queries yet for this database</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
