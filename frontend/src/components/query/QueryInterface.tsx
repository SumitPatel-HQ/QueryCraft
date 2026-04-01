"use client";

import { useRef, useState } from "react";
import { Send, Loader2, Database as DatabaseIcon, Paperclip } from "lucide-react";
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
  const [availableDatabases, setAvailableDatabases] = useState<DatabaseResponse[]>(databases);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<number | null>(
    preselectedDatabaseId || (databases.length === 1 ? databases[0].id : null)
  );
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizeDisplayName = (fileName: string) => {
    const nameWithoutExt = fileName.replace(/\.(db|sqlite|sql|csv)$/i, "");
    return nameWithoutExt.replace(/[_-]+/g, " ").trim() || "Uploaded Database";
  };

  const handleFileUpload = async (file?: File) => {
    if (!file) return;

    const allowedExtensions = [".db", ".sqlite", ".sql", ".csv"];
    const fileExt = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      setError(`Invalid file type. Allowed: ${allowedExtensions.join(", ")}`);
      return;
    }

    setUploadingFile(true);
    setError(null);
    setUploadMessage(null);

    try {
      const displayName = normalizeDisplayName(file.name);
      const uploadResult = await api.uploadDatabase(file, displayName);
      const refreshedDatabases = await api.getDatabases();
      setAvailableDatabases(refreshedDatabases);
      setSelectedDatabaseId(uploadResult.database_id);
      setUploadMessage(`Uploaded ${displayName} successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingFile(false);
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    void handleFileUpload(e.dataTransfer.files?.[0]);
  };

  const handleQuery = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleQuery();
  };

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-220px)] pb-24">
      {!preselectedDatabaseId && availableDatabases.length > 1 && (
        <div>
          <label className="block text-[12px] text-[#888888] mb-2">Select Database</label>
          <select
            value={selectedDatabaseId || ""}
            onChange={(e) => setSelectedDatabaseId(Number(e.target.value) || null)}
            className="w-full bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] px-4 py-3 text-[14px] text-[#f0f0f0] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
          >
            <option value="">Choose a database...</option>
            {availableDatabases.map((db) => (
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
              {availableDatabases.find((db) => db.id === selectedDatabaseId)?.display_name}
            </div>
            <div className="text-[12px] text-[#666666]">
              {availableDatabases.find((db) => db.id === selectedDatabaseId)?.table_count} tables
            </div>
          </div>
        </div>
      )}

      <div className="flex-1" />

      <div
        className="fixed bottom-0 left-0 md:left-55 right-0 z-30 px-6 lg:px-8 pb-0 pt-0 bg-transparent"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={cn(
          "max-w-250 mx-auto flex items-end gap-3 rounded-3xl px-1 transition-all duration-200",
          isDraggingFile && "ring-1 ring-white/25 border-white/20"
        )}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="w-11 h-11 rounded-full text-[#888888] hover:text-[#f0f0f0] hover:bg-white/5 shrink-0 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
          >
            {uploadingFile ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".db,.sqlite,.sql,.csv"
            className="hidden"
            onChange={(e) => {
              void handleFileUpload(e.target.files?.[0]);
              e.currentTarget.value = "";
            }}
          />

          <form onSubmit={handleSubmit} className="flex-1 flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleQuery();
                  }
                }}
                placeholder="Ask a question about your data..."
                disabled={loading || !selectedDatabaseId}
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
                className="w-full bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[22px] px-6 py-3 text-[14px] text-[#f0f0f0] placeholder:text-[#666666] focus:outline-none focus:border-[rgba(255,255,255,0.15)] disabled:opacity-50 resize-none overflow-hidden min-h-11 max-h-50 flex items-center"
              />
            </div>
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </Button>
          </form>
        </div>
      </div>

      {uploadMessage && (
        <div className="bg-emerald-900/20 border border-emerald-900/50 rounded-[10px] p-4 text-emerald-300 text-[14px]">
          {uploadMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400 text-[14px]">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && <QueryResults result={result} />}
    </div>
  );
}
