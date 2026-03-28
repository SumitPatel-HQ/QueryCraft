"use client";

import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#121212] text-[rgba(255,255,255,0.87)]">
      <Sidebar />
      <main
        className="min-h-screen ml-[240px] p-6 lg:p-8"
        style={{ backgroundColor: "#121212" }}
      >
        <div className="animate-[fade-in-up_0.3s_ease-out]">
          {children}
        </div>
      </main>
    </div>
  );
}


