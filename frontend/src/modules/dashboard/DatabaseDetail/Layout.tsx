"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";

const tabs = [
  { to: "overview", label: "📋 Overview" },
  { to: "schema", label: "📊 Schema" },
  { to: "erd", label: "🗺️ ERD" },
  { to: "chat", label: "💬 Chat" },
  { to: "settings", label: "⚙️ Settings" },
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
        className="fixed h-screen w-[240px]"
        style={{
          background: "rgba(30,30,30,0.95)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button className="text-sm text-[#8B5CF6]" onClick={() => router.back()}>
            ← Back to Databases
          </button>
          <div className="mt-3 font-semibold text-white">E-commerce Database</div>
          <div
            className="mt-2 inline-block text-xs px-2 py-1 rounded-md"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
          >
            ✓ Connected
          </div>
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

      <main className="ml-[240px] w-full p-8" style={{ background: "#121212" }}>
        {children}
      </main>
    </div>
  );
}
