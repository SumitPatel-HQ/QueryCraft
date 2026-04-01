"use client";

import {
  Plus,
  Search,
  MessageSquare,
  PanelLeftClose,
  MoreHorizontal,
  PlusSquare
} from "lucide-react";

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatHistorySidebar({ isOpen, onToggle }: ChatHistorySidebarProps) {
  if (!isOpen) return null;

  return (
    <aside
      className="fixed left-[220px] top-0 h-screen w-[260px] z-[90] bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.08)] hidden lg:flex flex-col animate-in slide-in-from-left duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-end p-4 pb-2">
        <button
          onClick={onToggle}
          className="p-2 text-[#888888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] rounded-md transition-all"
          title="Close sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* Main Actions */}
      <div className="px-3 py-2 flex flex-col gap-0.5">
        <button className="flex items-center justify-between w-full h-[42px] px-3 hover:bg-[#111111] rounded-[10px] transition-colors group text-left">
          <div className="flex items-center gap-3">
            <div className="p-0.5 rounded-full text-[#f0f0f0]">
              <PlusSquare size={18} />
            </div>
            <span className="text-[14px] font-medium text-[#f0f0f0]">New chat</span>
          </div>
          <div className="text-[#555555] group-hover:text-[#888888] opacity-0 group-hover:opacity-100 transition-opacity">
            <MessageSquare size={14} />
          </div>
        </button>

        <button className="flex items-center gap-3 w-full h-[42px] px-3 hover:bg-[#111111] rounded-[10px] transition-colors group text-left mt-1">
          <div className="text-[#888888] group-hover:text-[#f0f0f0]">
            <Search size={18} />
          </div>
          <span className="text-[14px] font-normal text-[#888888] group-hover:text-[#f0f0f0]">Search chats</span>
        </button>
      </div>

      {/* Navigation Groups / History */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 custom-scrollbar">
        {/* History Sections */}
        <div className="mt-4">
          <h3 className="px-3 py-2 text-[11px] font-bold text-[#444444] uppercase tracking-[0.05em] mb-1">bookmarks</h3>
          <div className="flex items-center justify-between group px-3 py-2.5 hover:bg-[#111111] rounded-[10px] cursor-pointer transition-colors">
            <span className="text-[13px] text-[#cccccc] truncate block group-hover:text-[#f0f0f0] flex-1">Analyze lead database schema</span>
            <MoreHorizontal size={14} className="text-[#444444] opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
          </div>
          <div className="flex items-center justify-between group px-3 py-2.5 hover:bg-[#111111] rounded-[10px] cursor-pointer transition-colors">
            <span className="text-[13px] text-[#cccccc] truncate block group-hover:text-[#f0f0f0] flex-1">Sales query examples for tech</span>
            <MoreHorizontal size={14} className="text-[#444444] opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="px-3 py-2 text-[11px] font-bold text-[#444444] uppercase tracking-[0.05em] mb-1">Your Chats</h3>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between group px-3 py-2.5 hover:bg-[#111111] rounded-[10px] cursor-pointer transition-colors">
              <span className="text-[13px] text-[#cccccc] truncate block group-hover:text-[#f0f0f0] flex-1">
                {["SQL optimization tips", "Schema introspection logic", "Mock data generation"][i - 1]}
              </span>
              <MoreHorizontal size={14} className="text-[#444444] opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
            </div>
          ))}
        </div>
      </nav>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </aside>
  );
}
