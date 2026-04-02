"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  MessageSquare, 
  Database, 
  HelpCircle, 
  Settings,
  Bookmark,
  DatabaseZap
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { to: "/dashboard/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/dashboard/databases", label: "Databases", icon: Database },
  { to: "/dashboard/mysql", label: "My SQL", icon: DatabaseZap },
  { to: "/dashboard/samples", label: "Sample Questions", icon: HelpCircle },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function LogoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <path d="M7 7h10"></path>
      <path d="M7 12h10"></path>
      <path d="M7 17h10"></path>
    </svg>
  );
}

interface SidebarProps {
  onChatClick?: () => void;
}

export default function Sidebar({ onChatClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] z-[100] bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.08)] hidden md:flex flex-col"
    >
      <div className="pt-6 px-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-white" aria-hidden="true">
            <LogoIcon />
          </div>
          <div className="font-semibold text-[15px] text-[#f0f0f0] tracking-tight">QueryCraft</div>
        </div>
      </div>

      <nav className="mt-8 px-3">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  href={item.to}
                  onClick={() => {
                    if (item.label === "Chat" && onChatClick) {
                      onChatClick();
                    }
                  }}
                  className={[
                    "flex items-center gap-3 h-[40px] px-3 transition-colors rounded-[6px] text-[14px]",
                    isActive
                      ? "bg-white text-black font-medium shadow-sm"
                      : "text-[#888888] hover:bg-[#1a1a1a] hover:text-[#f0f0f0]",
                  ].join(" ")}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
        {/* Navigation placeholder */}
      </div>

      <div className="p-4 flex flex-col gap-3 border-t border-[rgba(255,255,255,0.08)]">
        <div className="rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#0f0f0f] px-2.5 py-2 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.12)] flex items-center justify-center text-[#f0f0f0] text-[12px] font-medium tracking-wide shrink-0">
            SP
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-[#f0f0f0] leading-tight truncate">Workspace User</div>
            <div className="text-[11px] text-[#666666] leading-tight truncate">Demo Mode</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
