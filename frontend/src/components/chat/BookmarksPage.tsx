"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bookmark as BookmarkIcon, Pin, MessageSquare, Search, Database } from "lucide-react";
import { useChat } from "@/hooks/use-chat";
import { useAuthContext } from "@/components/providers/auth-provider";

interface Bookmark {
  id: number;
  session_id: number | null;
  message_id?: number | null;
  note: string | null;
  bookmarked_at: string;
}

export default function BookmarksPage() {
  const router = useRouter();
  const { listBookmarks, deleteBookmark } = useChat();
  const { loading, user } = useAuthContext();
  
  const [bookmarksGrouped, setBookmarksGrouped] = useState<Record<string, Bookmark[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());

  // Load pinned items from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("qc_pinned_bookmarks");
      if (saved) {
        setPinnedIds(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      // Ignore local storage errors
    }
  }, []);

  const togglePin = (id: number) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem("qc_pinned_bookmarks", JSON.stringify(Array.from(next)));
      } catch (e) {}
      return next;
    });
  };

  useEffect(() => {
    async function load() {
      if (loading || !user) {
        return;
      }
      try {
        setError(null);
        const data = await listBookmarks();
        // The API returns Record<string, Bookmark[]>
        setBookmarksGrouped(data as Record<string, Bookmark[]>);
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
      setBookmarksGrouped(data as Record<string, Bookmark[]>);
      
      // Also unpin if it was pinned
      setPinnedIds((prev) => {
        if (prev.has(id)) {
           const next = new Set(prev);
           next.delete(id);
           try {
             localStorage.setItem("qc_pinned_bookmarks", JSON.stringify(Array.from(next)));
           } catch (e) {}
           return next;
        }
        return prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove bookmark");
    }
  }

  // Flatten logic
  const allBookmarks = useMemo(() => {
    const arr: Bookmark[] = [];
    for (const group of Object.values(bookmarksGrouped)) {
      arr.push(...group);
    }
    return arr;
  }, [bookmarksGrouped]);

  // Search logic
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return allBookmarks;
    const lower = searchQuery.toLowerCase();
    return allBookmarks.filter((b) => {
      const title = b.note || `Session #${b.session_id || "n/a"}`;
      return title.toLowerCase().includes(lower);
    });
  }, [allBookmarks, searchQuery]);

  // Separate pinned and unpinned
  const pinnedList = useMemo(() => {
    return filteredBookmarks.filter((b) => pinnedIds.has(b.id));
  }, [filteredBookmarks, pinnedIds]);

  const unpinnedGrouped = useMemo(() => {
    const groups: Record<string, Bookmark[]> = {};
    for (const [day, items] of Object.entries(bookmarksGrouped)) {
      const matched = items.filter(
        (b) => !pinnedIds.has(b.id) && filteredBookmarks.some((f) => f.id === b.id)
      );
      if (matched.length > 0) {
        groups[day] = matched;
      }
    }
    return groups;
  }, [bookmarksGrouped, pinnedIds, filteredBookmarks]);

  const BookmarkRow = ({ item, isPinned = false }: { item: Bookmark; isPinned?: boolean }) => {
    const title = item.note || `Session #${item.session_id ?? "n/a"}`;
    const isChat = !!item.session_id; 
    const Icon = isChat ? MessageSquare : Database;

    let timeString = "";
    try {
      timeString = new Date(item.bookmarked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      timeString = "Unknown time";
    }

    return (
      <div 
        className="group relative flex items-center justify-between py-3 px-4 -mx-4 rounded-[12px] hover:bg-white/[0.04] transition-colors duration-200 cursor-pointer"
        onClick={() => item.session_id && router.push(`/dashboard/chat?session=${item.session_id}`)}
      >
        <div className="flex items-center gap-4 min-w-0 pr-4">
          <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.04] text-[#888] group-hover:text-[#a0a0a0] transition-colors">
            <Icon size={16} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-medium text-[#eaeaea] truncate group-hover:text-white transition-colors">
              {title}
            </span>
            <span className="text-[13px] text-[#777] flex items-center gap-2 truncate mt-0.5">
              {isChat ? "Chat Session" : "Data Context"}
              <span className="w-1 h-1 rounded-full bg-white/[0.15] shrink-0" />
              {timeString}
            </span>
          </div>
        </div>

        {/* Actions - Visible on hover/focus -> mobile fallback uses lower opacity instead of 0 */}
        <div 
          className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200" 
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => togglePin(item.id)} 
            className={`p-2 rounded-lg transition-colors ${
              isPinned ? 'text-blue-400 hover:bg-blue-400/10' : 'text-[#777] hover:bg-white/[0.06] hover:text-[#eee]'
            }`}
            title={isPinned ? "Unpin Bookmark" : "Pin Bookmark"}
          >
            <Pin size={16} className={isPinned ? "fill-current" : ""} strokeWidth={isPinned ? 2 : 1.5} />
          </button>
          <button 
            onClick={() => remove(item.id)} 
            className="p-2 text-yellow-500/80 rounded-lg hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors"
            title="Unbookmark"
          >
            <BookmarkIcon size={16} className="fill-current" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col max-w-[1200px] w-full mx-auto pb-20 px-4">
      {/* Header */}
      <header className="mb-8 pt-2">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#fcfcfc] mb-1.5">Bookmarks</h1>
        <p className="text-[14px] text-[#888]">Quick access to your saved sessions and queries.</p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search size={16} className="text-[#666] group-focus-within:text-[#999] transition-colors" strokeWidth={1.5} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your bookmarks..."
          className="w-full bg-[#0a0a0a] border border-white/[0.06] text-[#eee] rounded-[12px] pl-10 pr-4 py-2.5 text-[14px] outline-none  transition-all placeholder:text-[#555]"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-[14px] text-red-200 mb-6 flex items-center">
          {error}
        </div>
      )}

      {/* Empty States */}
      {!loading && allBookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-white/[0.04] rounded-2xl bg-white/[0.01]">
          <div className="w-12 h-12 bg-white/[0.03] rounded-full flex items-center justify-center mb-4">
            <Pin size={20} className="text-[#666]" strokeWidth={1.5} />
          </div>
          <h3 className="text-[#dedede] font-medium mb-1.5">No bookmarks yet</h3>
          <p className="text-[#777] text-[14px] max-w-[260px]">
            Save important chats or database queries to access them quickly later.
          </p>
        </div>
      ) : !loading && filteredBookmarks.length === 0 ? (
        <div className="text-center py-16 text-[#777] text-[14px] border border-white/[0.03] rounded-2xl bg-white/[0.01]">
          No bookmarks match "{searchQuery}"
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Pinned Section */}
          {pinnedList.length > 0 && (
            <section>
              <h2 className="text-[11px] font-semibold tracking-widest uppercase text-[#555] mb-2 px-1">
                Pinned
              </h2>
              <div className="flex flex-col">
                {pinnedList.map((item) => (
                  <BookmarkRow key={item.id} item={item} isPinned={true} />
                ))}
              </div>
            </section>
          )}

          {/* Grouped Unpinned Bookmarks */}
          {Object.keys(unpinnedGrouped).map((day) => (
            <section key={day}>
              <h2 className="text-[11px] font-semibold tracking-widest uppercase text-[#555] mb-2 px-1 flex items-center gap-3">
                {day}
                <span className="h-px bg-white/[0.06] flex-grow"></span>
              </h2>
              <div className="flex flex-col">
                {unpinnedGrouped[day].map((item) => (
                 <BookmarkRow key={item.id} item={item} isPinned={false} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
