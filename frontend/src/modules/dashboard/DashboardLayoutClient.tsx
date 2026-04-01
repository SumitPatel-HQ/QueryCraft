"use client";

import { useState } from "react";
import Sidebar from "@/modules/dashboard/Sidebar";
import ChatHistorySidebar from "@/modules/dashboard/chat/ChatHistorySidebar";
import { usePathname } from "next/navigation";
import { PanelLeftOpen } from "lucide-react";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatRoute = pathname.startsWith("/dashboard/chat");
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const toggleHistory = () => setIsHistoryOpen(!isHistoryOpen);

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#f0f0f0] font-sans flex">
      <Sidebar onChatClick={() => setIsHistoryOpen(true)} />
      
      {isChatRoute && (
        <ChatHistorySidebar 
          isOpen={isHistoryOpen} 
          onToggle={toggleHistory} 
        />
      )}

      <main
        className={`min-h-screen relative selection:bg-white/20 transition-all duration-200 flex-1 ${
          isChatRoute 
            ? `pt-6 px-6 lg:px-8 pb-0 ${isHistoryOpen ? "ml-[480px]" : "ml-[220px]"}` 
            : "p-6 lg:p-8 ml-[220px]"
        }`}
        style={{
          ["--chat-left-offset" as string]: isChatRoute
            ? (isHistoryOpen ? "480px" : "220px")
            : "220px",
        }}
      >
        {isChatRoute && !isHistoryOpen && (
          <button
            onClick={toggleHistory}
            className="fixed left-[236px] top-6 z-[100] p-1.5 text-[#888888] hover:text-[#f0f0f0] hover:bg-[#1a1a1a] rounded-md transition-all border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a]"
            title="Open sidebar"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        <div
          key={pathname}
          className={isChatRoute ? "" : "animate-in fade-in slide-in-from-bottom-[6px] duration-120 ease-out fill-mode-both"}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
