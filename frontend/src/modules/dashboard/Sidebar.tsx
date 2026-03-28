"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const navItems = [
  { to: "/dashboard", label: "Home", icon: "🏠" },
  { to: "/dashboard/chat", label: "Chat", icon: "💬" },
  { to: "/dashboard/databases", label: "Databases", icon: "📊" },
  { to: "/dashboard/samples", label: "Sample Questions", icon: "📚" },
  { to: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] z-[100]"
      style={{
        background: "rgba(30,30,30,0.95)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      <div className="h-20 flex items-center gap-3 px-5">
        <div
          aria-hidden
          className="h-10 w-10 rounded-xl"
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            boxShadow: "0 8px 24px rgba(139,92,246,0.4)"
          }}
        />
        <div className="font-bold text-xl text-white">QueryCraft</div>
      </div>

      <div className="px-5">
        <div
          className="text-xs rounded-lg py-2.5 px-3"
          style={{
            background: "rgba(139, 92, 246, 0.15)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            color: "#A78BFA"
          }}
        >
          🎮 Demo Mode
        </div>
      </div>

      <nav className="mt-6">
        <ul className="flex flex-col">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            return (
              <li key={item.to}>
                <Link
                  href={item.to}
                  className={[
                    "h-11 px-5 flex items-center gap-3 transition-colors",
                    isActive
                      ? "text-[#8B5CF6]"
                      : "text-[rgba(255,255,255,0.6)] hover:text-[rgba(255,255,255,0.87)]",
                  ].join(" ")}
                  style={{
                    background: isActive
                      ? "rgba(139,92,246,0.15)"
                      : "transparent",
                    borderLeft: isActive ? "3px solid #8B5CF6" : "3px solid transparent"
                  }}
                >
                  <span className="text-lg" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="absolute bottom-0 left-0 w-full p-5">
        <div className="h-px w-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        <button
          className="mt-4 h-11 w-full rounded-xl font-semibold shadow-glow-lg transition-transform hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
            color: "#ffffff"
          }}
          onClick={() => router.push("/dashboard/chat")}
        >
          + New Query
        </button>
      </div>
    </aside>
  );
}
