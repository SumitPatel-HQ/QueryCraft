"use client";

import Sidebar from "@/modules/dashboard/Sidebar";
import { usePathname } from "next/navigation";

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#f0f0f0] font-sans">
      <Sidebar />
      <main className="min-h-screen ml-[220px] p-6 lg:p-8 relative selection:bg-white/20">
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
