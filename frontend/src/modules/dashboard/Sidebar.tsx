"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Database,
  HelpCircle,
  Home,
  Loader2,
  MessageSquare,
  Plus,
  Server,
  Settings,
  ShieldCheck,
} from "lucide-react";

import MySQLConnectionModal from "@/components/database/MySQLConnectionModal";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/use-api";
import type { DatabaseResponse } from "@/types/api";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/dashboard/chat", label: "Chat", icon: MessageSquare },
  { to: "/dashboard/bookmarks", label: "Bookmarks", icon: Bookmark },
  { to: "/dashboard/databases", label: "Databases", icon: Database },
  { to: "/dashboard/samples", label: "Sample Questions", icon: HelpCircle },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function LogoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h10" />
    </svg>
  );
}

interface SidebarProps {
  onChatClick?: () => void;
}

function upsertDatabase(list: DatabaseResponse[], database: DatabaseResponse) {
  const withoutExisting = list.filter((item) => item.id !== database.id);
  return [database, ...withoutExisting];
}

export default function Sidebar({ onChatClick }: SidebarProps) {
  const pathname = usePathname();
  const api = useApi();
  const { loading, user } = useAuthContext();

  const [databases, setDatabases] = useState<DatabaseResponse[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);

  const liveConnections = useMemo(
    () => databases.filter((database) => database.db_type === "mysql"),
    [databases]
  );

  const loadDatabases = useCallback(async () => {
    if (loading || !user) {
      return;
    }

    setIsLoadingConnections(true);
    setConnectionsError(null);

    try {
      const result = await api.getDatabases();
      setDatabases(result);
    } catch (error) {
      setConnectionsError(
        error instanceof Error
          ? error.message
          : "Could not load live connections."
      );
    } finally {
      setIsLoadingConnections(false);
    }
  }, [api, loading, user]);

  useEffect(() => {
    void loadDatabases();
  }, [loadDatabases]);

  const userInitials = useMemo(() => {
    const email = user?.email ?? "Workspace User";
    return email
      .split(/[.@_-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "QC";
  }, [user]);

  return (
    <>
      <aside className="fixed left-0 top-0 z-[100] hidden h-screen w-[280px] flex-col border-r border-white/8 bg-[#0a0a0a] md:flex">
        <div className="border-b border-white/8 px-4 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
              <LogoIcon />
            </div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight text-[#f0f0f0]">
                QueryCraft
              </div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#6f7682]">
                Live workspace
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-4 px-3">
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
                      "flex h-[42px] items-center gap-3 rounded-xl px-3 text-[14px] transition-colors",
                      isActive
                        ? "bg-white text-black font-medium shadow-sm"
                        : "text-[#888888] hover:bg-[#151515] hover:text-[#f0f0f0]",
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
          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(20,184,166,0.10),rgba(255,255,255,0.02))] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/70">
                  Live Connections
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  Create a verified MySQL connection without leaving the dashboard.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => setModalOpen(true)}
                className="rounded-xl bg-emerald-300 px-3 text-[#04110d] hover:bg-emerald-200"
              >
                <Plus className="mr-1 h-4 w-4" />
                MySQL
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {isLoadingConnections ? (
                <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Refreshing live connections...
                </div>
              ) : null}

              {connectionsError ? (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-3 text-sm text-rose-200">
                  {connectionsError}
                </div>
              ) : null}

              {!isLoadingConnections && !connectionsError && liveConnections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-3 py-4 text-sm text-slate-400">
                  No live MySQL connections yet. Add one to see its connected and active status here.
                </div>
              ) : null}

              {liveConnections.map((connection) => {
                const info = connection.connection_info;

                return (
                  <div
                    key={connection.id}
                    className="rounded-2xl border border-white/8 bg-black/30 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                            <Server className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-white">
                              {connection.display_name}
                            </div>
                            <div className="truncate text-xs text-slate-400">
                              {info?.host ?? "Awaiting host"}
                            </div>
                          </div>
                        </div>
                        {connection.description ? (
                          <p className="mt-3 line-clamp-2 text-xs text-slate-400">
                            {connection.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge className="border-emerald-300/25 bg-emerald-300/10 text-emerald-100">
                          Connected
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={connection.is_active ? "border-sky-300/20 bg-sky-300/10 text-sky-100" : "border-white/10 bg-white/5 text-slate-400"}
                        >
                          {connection.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-slate-300">
                      <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                        <span className="text-slate-500">Database</span>
                        <div className="mt-1 font-medium text-white">
                          {info?.database ?? "Unknown database"}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                          <span className="text-slate-500">Port</span>
                          <div className="mt-1 font-medium text-white">
                            {info?.port ?? "3306"}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                          <span className="text-slate-500">Security</span>
                          <div className="mt-1 inline-flex items-center gap-1 font-medium text-white">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
                            {info?.ssl_enabled ? "SSL on" : "SSL off"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-white/8 p-4">
          <div className="flex items-center gap-2.5 rounded-2xl border border-white/8 bg-[#0f0f0f] px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-[#1a1a1a] text-[12px] font-medium tracking-wide text-[#f0f0f0]">
              {userInitials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium leading-tight text-[#f0f0f0]">
                {user?.displayName ?? user?.email ?? "Workspace User"}
              </div>
              <div className="truncate text-[11px] leading-tight text-[#666666]">
                {user?.email ?? "Authenticated session"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <MySQLConnectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(database) => {
          setDatabases((current) => upsertDatabase(current, database));
        }}
      />
    </>
  );
}
