"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useChat } from "@/hooks/use-chat";

export default function BookmarksPage() {
  const router = useRouter();
  const { listBookmarks, deleteBookmark } = useChat();
  const [bookmarks, setBookmarks] = useState<Record<string, Array<{ id: number; session_id: number | null; note: string | null; bookmarked_at: string }>>>({});

  useEffect(() => {
    async function load() {
      const data = await listBookmarks();
      setBookmarks(data);
    }
    load();
  }, [listBookmarks]);

  async function remove(id: number) {
    await deleteBookmark(id);
    const data = await listBookmarks();
    setBookmarks(data);
  }

  const days = Object.keys(bookmarks);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0]">Bookmarks</h1>
        <p className="text-[12px] text-[#777777] mt-1">Saved sessions and messages grouped by date</p>
      </header>

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
