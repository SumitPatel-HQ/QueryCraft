"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, PanelLeftClose, PlusSquare, Search, Trash2 } from "lucide-react";
import { useChat, type ChatSession } from "@/hooks/use-chat";
import { useAuth } from "@/hooks/use-auth";

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatHistorySidebar({ isOpen, onToggle }: ChatHistorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSession = Number(searchParams.get("session") || 0);
  const { listSessions, createSession, deleteSession, search } = useChat();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ message_id: number; session_id: number; session_title: string; snippet: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      setLoading(authLoading);
      return;
    }

    async function loadSessions() {
      try {
        const data = await listSessions();
        setSessions(data);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, [listSessions, authLoading, isAuthenticated]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    async function runSearch() {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      const data = await search(query.trim());
      setResults(data);
    }
    runSearch();
  }, [query, search, authLoading, isAuthenticated]);

  const visibleSessions = useMemo(() => {
    if (!query.trim()) {
      return sessions;
    }
    const ids = new Set(results.map((r) => r.session_id));
    return sessions.filter((s) => ids.has(s.id));
  }, [query, results, sessions]);

  async function handleCreateSession() {
    const session = await createSession();
    setSessions((prev) => [session, ...prev]);
    router.push(`/dashboard/chat?session=${session.id}`);
  }

  async function handleDeleteSession(sessionId: number) {
    await deleteSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (selectedSession === sessionId) {
      router.push("/dashboard/chat");
    }
  }

  if (!isOpen) return null;

  return (
    <aside className="fixed left-[220px] top-0 h-screen w-[260px] z-[90] bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.08)] hidden lg:flex flex-col animate-in slide-in-from-left duration-200">
      <div className="flex items-center justify-between p-4 pb-2 gap-2">
        <button
          onClick={handleCreateSession}
          className="flex items-center gap-2 px-3 h-9 rounded-md bg-[#111111] hover:bg-[#1a1a1a] transition-colors text-sm"
        >
          <PlusSquare size={15} />
          New chat
        </button>
        <button
          onClick={onToggle}
          className="p-2 text-[#888888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] rounded-md transition-all"
          title="Close sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-[#111111] border border-[rgba(255,255,255,0.08)]">
          <Search size={14} className="text-[#666666]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent outline-none text-sm text-[#f0f0f0] placeholder:text-[#666666]"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        <h3 className="px-2 py-2 text-[11px] font-bold text-[#444444] uppercase tracking-[0.05em]">Your Chats</h3>

        {loading ? (
          <div className="px-2 py-2 text-sm text-[#777777]">Loading...</div>
        ) : visibleSessions.length === 0 ? (
          <div className="px-2 py-2 text-sm text-[#777777]">No chats yet</div>
        ) : (
          visibleSessions.map((session) => (
            <div
              key={session.id}
              className={`group rounded-[10px] border ${selectedSession === session.id ? "border-[rgba(255,255,255,0.22)] bg-[#111111]" : "border-transparent hover:bg-[#111111]"}`}
            >
              <button
                onClick={() => router.push(`/dashboard/chat?session=${session.id}`)}
                className="w-full text-left px-3 py-2.5"
              >
                <div className="flex items-start gap-2">
                  <MessageSquare size={14} className="text-[#777777] mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-[#f0f0f0] truncate">{session.title || "Untitled"}</div>
                    <div className="text-[11px] text-[#666666] mt-1">
                      {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </button>
              <div className="px-3 pb-2">
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="text-[#666666] hover:text-[#f87171] transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete chat"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </nav>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 10px; }
      `}</style>
    </aside>
  );
}
