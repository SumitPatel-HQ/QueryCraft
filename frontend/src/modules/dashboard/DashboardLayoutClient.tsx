"use client";

import Sidebar from "@/modules/dashboard/Sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatRoute = pathname.startsWith("/dashboard/chat");

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#f0f0f0] font-sans">
      <Sidebar />
      <main
        className={`min-h-screen ml-55 relative selection:bg-white/20 ${
          isChatRoute ? "pt-6 px-6 lg:px-8 pb-0" : "p-6 lg:p-8"
        }`}
      >
        <div
          key={pathname}
          className="animate-in fade-in slide-in-from-bottom-[6px] duration-120 ease-out fill-mode-both"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
