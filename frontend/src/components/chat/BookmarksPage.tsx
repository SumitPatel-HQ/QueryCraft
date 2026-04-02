"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useAuthContext } from "@/components/providers/auth-provider";

export default function BookmarksPage() {
  const router = useRouter();
  const { listBookmarks, deleteBookmark } = useChat();
  const { loading, user } = useAuthContext();
  const [bookmarks, setBookmarks] = useState<Record<string, Array<{ id: number; session_id: number | null; note: string | null; bookmarked_at: string }>>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (loading || !user) {
        return;
      }
      try {
        setError(null);
        const data = await listBookmarks();
        setBookmarks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load bookmarks");
      }
    }
    load();
  }, [listBookmarks, loading, user]);

  async function remove(id: number) {
    try {
      setError(null);
      await deleteBookmark(id);
      const data = await listBookmarks();
      setBookmarks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update bookmarks");
    }
  }

  const days = Object.keys(bookmarks);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0]">Bookmarks</h1>
        <p className="text-[12px] text-[#777777] mt-1">Saved sessions and messages grouped by date</p>
      </header>

      {error ? (
        <div className="rounded-[10px] border border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.08)] px-4 py-3 text-sm text-[#fecaca]">
          {error}
        </div>
      ) : null}

      {days.length === 0 ? (
        <div className="text-[#888888] text-sm">No bookmarks yet.</div>
      ) : (
        days.map((day) => (
          <section key={day} className="rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#111111] p-4">
            <h2 className="text-xs uppercase tracking-[0.08em] text-[#777777] mb-3">{day}</h2>
            <div className="space-y-2">
              {bookmarks[day].map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-[#0a0a0a] rounded-md px-3 py-2">
                  <button
                    className="text-left text-sm text-[#e5e5e5] hover:text-white"
                    onClick={() => item.session_id && router.push(`/dashboard/chat?session=${item.session_id}`)}
                  >
                    {item.note || `Session #${item.session_id ?? "n/a"}`}
                  </button>
                  <button onClick={() => remove(item.id)} className="text-[#666666] hover:text-[#f87171]">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
