"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Send, Loader2, Database as DatabaseIcon, Paperclip } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { useApi } from "@/hooks/use-api"
import { useChat, type ChatMessage } from "@/hooks/use-chat";
import { cn } from "@/lib/utils"
import QueryResults from "./QueryResults"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DatabaseResponse, QueryResponse } from "@/types/api";

interface QueryInterfaceProps {
  databases: DatabaseResponse[];
  preselectedDatabaseId?: number;
}

export default function QueryInterface({ databases, preselectedDatabaseId }: QueryInterfaceProps) {
  const api = useApi();
  const { getSession, createSession, addMessage } = useChat();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get("session");
  const dbParam = searchParams.get("db");
  const activeSessionId = sessionParam ? Number(sessionParam) : null;
  const sessionDbMapStorageKey = "chat_session_db_map";
  const sessionResultMapStorageKey = "chat_session_result_map";
  const MAX_SESSION_RESULTS = 10;
  const [availableDatabases, setAvailableDatabases] = useState<DatabaseResponse[]>(databases);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<number | null>(
    preselectedDatabaseId || (databases.length === 1 ? databases[0].id : null)
  );

  // Sync availableDatabases with databases prop when it changes
  useEffect(() => {
    setAvailableDatabases(databases);
  }, [databases]);

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const readSessionDbMap = useCallback(() => {
    if (typeof window === "undefined") {
      return {} as Record<string, number>;
    }

    try {
      const raw = window.localStorage.getItem(sessionDbMapStorageKey);
      if (!raw) {
        return {} as Record<string, number>;
      }
      const parsed = JSON.parse(raw) as Record<string, number>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {} as Record<string, number>;
    }
  }, [sessionDbMapStorageKey]);

  const saveSessionDatabase = useCallback((sessionId: number, databaseId: number) => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const current = readSessionDbMap();
      current[String(sessionId)] = databaseId;
      window.localStorage.setItem(sessionDbMapStorageKey, JSON.stringify(current));
    } catch (err) {
      console.error("Failed to save session database mapping:", err);
    }
  }, [readSessionDbMap, sessionDbMapStorageKey]);

  const readSessionResultMap = useCallback(() => {
    if (typeof window === "undefined") {
      return {} as Record<string, QueryResponse>;
    }

    try {
      const raw = window.localStorage.getItem(sessionResultMapStorageKey);
      if (!raw) {
        return {} as Record<string, QueryResponse>;
      }
      const parsed = JSON.parse(raw) as Record<string, QueryResponse>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {} as Record<string, QueryResponse>;
    }
  }, [sessionResultMapStorageKey]);

  const saveSessionResult = useCallback((sessionId: number, response: QueryResponse) => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const current = readSessionResultMap();
      const sessionIdStr = String(sessionId);

      // If updating existing entry, remove it first to re-insert at end (LRU)
      delete current[sessionIdStr];
      current[sessionIdStr] = response;

      // Enforce max entries limit (LRU eviction)
      const entries = Object.entries(current);
      if (entries.length > MAX_SESSION_RESULTS) {
        const toRemove = entries.slice(0, entries.length - MAX_SESSION_RESULTS);
        for (const [key] of toRemove) {
          delete current[key];
        }
      }

      window.localStorage.setItem(sessionResultMapStorageKey, JSON.stringify(current));
    } catch (err) {
      // Handle quota exceeded or other storage errors gracefully
      if (err instanceof Error && err.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded, clearing old session results");
        try {
          // Clear all session results and store only current one
          const minimal: Record<string, QueryResponse> = { [String(sessionId)]: response };
          window.localStorage.setItem(sessionResultMapStorageKey, JSON.stringify(minimal));
        } catch {
          // If even that fails, clear the key entirely
          window.localStorage.removeItem(sessionResultMapStorageKey);
        }
      } else {
        console.error("Failed to save session result:", err);
      }
    }
  }, [readSessionResultMap, sessionResultMapStorageKey]);

  const updateUrlDatabaseParam = useCallback((databaseId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (databaseId) {
      params.set("db", String(databaseId));
    } else {
      params.delete("db");
    }

    const next = params.toString();
    router.replace(next ? `/dashboard/chat?${next}` : "/dashboard/chat");
  }, [router, searchParams]);

  const handleDatabaseSelection = useCallback((databaseId: number | null) => {
    setSelectedDatabaseId(databaseId);

    if (activeSessionId && databaseId) {
      saveSessionDatabase(activeSessionId, databaseId);
    }

    updateUrlDatabaseParam(databaseId);
  }, [activeSessionId, saveSessionDatabase, updateUrlDatabaseParam]);

  useEffect(() => {
    const parsedDb = dbParam ? Number(dbParam) : null;
    const dbFromQuery = parsedDb && !Number.isNaN(parsedDb) ? parsedDb : null;

    let nextDb: number | null = null;

    if (dbFromQuery) {
      nextDb = dbFromQuery;
      if (activeSessionId) {
        saveSessionDatabase(activeSessionId, dbFromQuery);
      }
    } else if (activeSessionId) {
      const map = readSessionDbMap();
      nextDb = map[String(activeSessionId)] ?? null;
    } else if (preselectedDatabaseId) {
      nextDb = preselectedDatabaseId;
    } else if (databases.length === 1) {
      nextDb = databases[0].id;
    }

    setSelectedDatabaseId(nextDb);
    setQuestion("");
    if (activeSessionId) {
      const resultMap = readSessionResultMap();
      setResult(resultMap[String(activeSessionId)] ?? null);
    } else {
      setResult(null);
    }
    setUploadMessage(null);
    setError(null);
  }, [activeSessionId, dbParam, preselectedDatabaseId, databases, readSessionDbMap, saveSessionDatabase, readSessionResultMap]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      if (!activeSessionId || Number.isNaN(activeSessionId)) {
        setChatMessages([]);
        return;
      }

      setLoadingSession(true);
      try {
        const session = await getSession(activeSessionId);
        if (cancelled) {
          return;
        }
        setChatMessages(
          session.messages.map((m) => ({
            id: m.id,
            session_id: activeSessionId,
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          }))
        );
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load chat session");
      } finally {
        if (!cancelled) {
          setLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [activeSessionId, getSession]);

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

      if (!activeSessionId) {
        const created = await createSession(`Chat: ${displayName}`);
        saveSessionDatabase(created.id, uploadResult.database_id);
        router.push(`/dashboard/chat?session=${created.id}&db=${uploadResult.database_id}`);
        window.dispatchEvent(new Event("chat-sessions-updated"));
      } else {
        saveSessionDatabase(activeSessionId, uploadResult.database_id);
        updateUrlDatabaseParam(uploadResult.database_id);
      }

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
      let targetSessionId = activeSessionId;
      if (!targetSessionId) {
        const created = await createSession(question.trim().slice(0, 60));
        targetSessionId = created.id;
        router.push(`/dashboard/chat?session=${created.id}&db=${selectedDatabaseId}`);
        window.dispatchEvent(new Event("chat-sessions-updated"));
      }

      if (!targetSessionId) {
        throw new Error("Failed to resolve active chat session");
      }

      const response = await api.queryDatabase(selectedDatabaseId, question.trim());
      setResult(response);
      saveSessionResult(targetSessionId, response);

      const askedQuestion = question.trim();

      const tempUserId = -Date.now();
      const optimisticTimestamp = new Date().toISOString();

      setChatMessages((prev) => [
        ...prev,
        {
          id: tempUserId,
          session_id: targetSessionId,
          role: "user",
          content: askedQuestion,
          created_at: optimisticTimestamp,
        },
      ]);

      void Promise.all([
        addMessage(targetSessionId, "user", askedQuestion),
      ])
        .then(([savedUser]) => {
          setChatMessages((prev) =>
            prev.map((message) => {
              if (message.id === tempUserId) return savedUser;
              return message;
            })
          );
          window.dispatchEvent(new Event("chat-sessions-updated"));
        })
        .catch((persistError) => {
          console.error("Failed to persist chat messages:", persistError);
        });
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
    <div className="flex flex-col gap-6 min-h-[calc(100vh-220px)] pb-28">
      {availableDatabases.length > 1 && (
        <div className="w-full">
          <label className="block text-[12px] text-[#888888] mb-2 px-1">Select Database</label>
          <Select
            value={selectedDatabaseId ? String(selectedDatabaseId) : ""}
            onValueChange={(val) => handleDatabaseSelection(Number(val) || null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a database..." />
            </SelectTrigger>
            <SelectContent>
              {availableDatabases.map((db) => (
                <SelectItem key={db.id} value={String(db.id)}>
                  <div className="flex items-center gap-2">
                    <DatabaseIcon size={14} className="text-[#666]" />
                    <span>{db.display_name}</span>
                    <span className="text-[11px] text-[#444] ml-2 font-mono uppercase tracking-widest">{db.table_count} tables</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {loadingSession && (
        <div className="text-[12px] text-[#777777]">Loading chat session...</div>
      )}

      {!loadingSession && chatMessages.length > 0 && (
        <div className="flex flex-col gap-3">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-[12px] border px-3 py-2 text-[13px]",
                message.role === "user"
                  ? "bg-[#111111] border-[rgba(255,255,255,0.12)] text-[#f0f0f0]"
                  : "bg-[#0f0f0f] border-[rgba(255,255,255,0.06)] text-[#cccccc]"
              )}
            >

              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))}
        </div>
      )}

      {!selectedDatabaseId && availableDatabases.length === 0 && (
        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[20px] py-20 flex flex-col items-center justify-center text-center px-4">
          <DatabaseIcon size={32} className="text-[#444444] mb-4" />
          <h3 className="text-[16px] font-semibold text-[#f0f0f0] mb-2">No database connected</h3>
          <p className="text-[14px] text-[#888888] max-w-[36ch] mx-auto mb-6">
            Upload a database to start Querying
          </p>
        </div>
      )}

      <div className="flex-1" />

      <div
        className="fixed bottom-0 right-0 z-30 px-6 lg:px-8 pb-4 bg-transparent"
        style={{ left: "var(--chat-left-offset, 0px)" }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={cn(
          "w-full mx-auto rounded-3xl transition-all duration-200",
          isDraggingFile && "ring-1 ring-white/25 border-white/20"
        )}
          style={{ maxWidth: "1000px" }}>
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

          <form onSubmit={handleSubmit} className="w-full">
            <div className="w-full bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[22px] pl-2 pr-2 py-1.5 flex items-center gap-2 focus-within:border-[rgba(255,255,255,0.15)] transition-colors duration-200">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Upload database file"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="w-9 h-9 rounded-full text-[#888888] hover:text-[#f0f0f0] hover:bg-white/5 shrink-0 self-center flex items-center justify-center transition-all duration-200 disabled:opacity-50"
              >
                {uploadingFile ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
              </Button>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleQuery();
                  }
                }}
                placeholder={selectedDatabaseId ? "Ask a question about your data..." : "Please upload or select a database..."}
                disabled={loading || !selectedDatabaseId}
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
                className="flex-1 bg-transparent border-0 px-1 py-2 text-[14px] leading-[1.35] text-[#f0f0f0] placeholder:text-[#666666] focus:outline-none disabled:opacity-50 resize-none overflow-hidden min-h-9 max-h-50"
              />
              <Button
                type="submit"
                disabled={loading || !selectedDatabaseId || !question.trim()}
                className={cn(
                  "w-11 h-11 rounded-full p-0 self-center flex items-center justify-center transition-all duration-200 shrink-0",
                  !loading && question.trim() && selectedDatabaseId
                    ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/5"
                    : "bg-[#222222] text-white/20 opacity-50"
                )}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </Button>
            </div>
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
