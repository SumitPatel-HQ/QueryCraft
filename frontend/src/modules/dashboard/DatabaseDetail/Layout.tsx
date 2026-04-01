"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";

const tabs = [
  { to: "overview", label: "📋 Overview" },
  { to: "schema", label: "📊 Schema" },
  { to: "erd", label: "🗺️ ERD" },
  { to: "chat", label: "💬 Chat" },
];

export default function DatabaseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const dbId = params.dbId;

  return (
    <div className="flex min-h-screen">
      <aside
        className="fixed left-[220px] top-0 h-screen w-[240px] z-10"
        style={{
          background: "#0a0a0a",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button className="text-sm text-[#8B5CF6]" onClick={() => router.back()}>
            ← Back to Databases
          </button>
          <div className="mt-3 font-semibold text-white">E-commerce Database</div>
          <Link 
            href={`/dashboard/chat?db=${dbId}`}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-[#f0f0f0] text-black rounded-[8px] text-[13px] font-semibold hover:bg-white transition-colors"
          >
            New Chat
          </Link>
        </div>
        <nav className="mt-4">
          {tabs.map((t) => {
            const href = `/dashboard/databases/${dbId}/${t.to}`;
            const isActive = pathname === href || pathname?.endsWith(`/${t.to}`);
            return (
              <Link
                key={t.to}
                href={href}
                className={[
                  "h-11 px-6 flex items-center gap-3 text-sm transition-colors",
                  isActive ? "text-[#8B5CF6]" : "text-[rgba(255,255,255,0.6)]",
                ].join(" ")}
                style={{
                  background: isActive ? "rgba(139,92,246,0.15)" : "transparent",
                  borderLeft: isActive ? "3px solid #8B5CF6" : "3px solid transparent",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="ml-[240px] flex-1 p-8" style={{ background: "#121212" }}>
        {children}
      </main>
    </div>
  );
}
