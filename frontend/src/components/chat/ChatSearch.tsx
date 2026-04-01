"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useChat } from "@/hooks/use-chat";

export default function ChatSearch() {
  const router = useRouter();
  const { search } = useChat();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Array<{ message_id: number; session_id: number; session_title: string; snippet: string }>>([]);

  async function runSearch() {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const data = await search(q.trim());
    setResults(data);
  }

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0]">Search Chats</h1>
        <p className="text-[12px] text-[#777777] mt-1">Search across your chat history</p>
      </header>

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-md bg-[#111111] border border-[rgba(255,255,255,0.08)]">
          <Search size={14} className="text-[#666666]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search for SQL, schema, or analysis..."
            className="w-full bg-transparent outline-none text-sm text-[#f0f0f0] placeholder:text-[#666666]"
          />
        </div>
        <button onClick={runSearch} className="h-10 px-4 rounded-md bg-white text-black text-sm font-medium">
          Search
        </button>
      </div>

      <div className="space-y-2">
        {results.map((result) => (
          <button
            key={result.message_id}
            onClick={() => router.push(`/dashboard/chat?session=${result.session_id}&message=${result.message_id}`)}
            className="w-full text-left bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-md p-3 hover:bg-[#151515]"
          >
            <div className="text-sm text-[#f0f0f0]">{result.session_title}</div>
            <div className="text-xs text-[#888888] mt-1 line-clamp-2">{result.snippet}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
