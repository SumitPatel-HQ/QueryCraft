"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Server,
  Loader2,
  Search,
  MessageSquare,
  Trash2,
  PowerOff,
  Power,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import MySQLConnectionModal from "@/components/database/MySQLConnectionModal";
import DeleteDatabaseModal from "@/components/database/DeleteDatabaseModal";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useApi } from "@/hooks/use-api";
import type { DatabaseResponse } from "@/types/api";

function upsertDatabase(list: DatabaseResponse[], database: DatabaseResponse) {
  const withoutExisting = list.filter((item) => item.id !== database.id);
  return [database, ...withoutExisting];
}

export default function MySQLPage() {
  const router = useRouter();
  const api = useApi();
  const { loading, user } = useAuthContext();

  const [databases, setDatabases] = useState<DatabaseResponse[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<DatabaseResponse | null>(null);

  // Pending deactivate/reactivate in-flight IDs
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const liveConnections = useMemo(
    () => databases.filter((database) => database.db_type === "mysql"),
    [databases]
  );

  const activeCount = useMemo(
    () => liveConnections.filter((c) => c.is_active).length,
    [liveConnections]
  );

  const filteredConnections = useMemo(() => {
    return liveConnections.filter(
      (connection) =>
        connection.display_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (connection.connection_info?.host || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [liveConnections, searchQuery]);

  const loadDatabases = useCallback(async () => {
    if (loading || !user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.getMySQLConnections();
      setDatabases(result);
    } catch {
      setError("Could not load live connections.");
    } finally {
      setIsLoading(false);
    }
  }, [api, loading, user]);

  const handleDeactivate = async (id: number) => {
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await api.deactivateMySQLConnection(id);
      setDatabases((prev) =>
        prev.map((db) => (db.id === id ? { ...db, is_active: false } : db))
      );
    } catch {
      setError("Failed to deactivate connection.");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReactivate = async (id: number) => {
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await api.reactivateMySQLConnection(id);
      setDatabases((prev) =>
        prev.map((db) => (db.id === id ? { ...db, is_active: true } : db))
      );
    } catch {
      setError("Failed to reactivate connection.");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api.deleteDatabase(deleteTarget.id);
    setDatabases((prev) => prev.filter((db) => db.id !== deleteTarget.id));
  };

  useEffect(() => {
    void loadDatabases();
  }, [loadDatabases]);

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-12">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">
            MySQL Connections
          </h1>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
            {activeCount} Active · {liveConnections.length} Total
          </div>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-[#f0f0f0] text-[#0a0a0a] hover:bg-[#ffffff] transition-all"
        >
          <Plus size={16} />
          New Connection
        </Button>
      </header>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400 text-[14px]">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Search */}
      {liveConnections.length > 0 && (
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search connections..."
            className="w-full bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] pl-12 pr-4 py-3 text-[14px] text-[#f0f0f0] placeholder:text-[#666666] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-[#444444]" />
            <p className="text-[#666666] text-sm">Loading connections...</p>
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] py-16 flex flex-col items-center justify-center text-center px-4">
            <Server size={48} strokeWidth={1.5} className="text-[#444444] mb-4" />
            <h3 className="text-[16px] font-semibold text-[#f0f0f0] mb-2">
              {searchQuery ? "No connections found" : "No MySQL connections yet"}
            </h3>
            <p className="text-[14px] text-[#888888] max-w-[36ch] mx-auto mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : "Connect your MySQL instance to query your live data with natural language."}
            </p>

            {!searchQuery && (
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-[#f0f0f0] text-[#0a0a0a] hover:bg-[#ffffff] transition-all"
              >
                <Plus size={16} className="mr-2" />
                New Connection
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredConnections.map((connection) => {
              const info = connection.connection_info;
              const isActive = connection.is_active;
              const isPending = pendingIds.has(connection.id);

              return (
                <div
                  key={connection.id}
                  className={`bg-[#111111] border rounded-[10px] p-4 flex items-center gap-6 transition-all cursor-pointer group ${
                    isActive
                      ? "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]"
                      : "border-[rgba(255,255,255,0.04)] opacity-60 hover:opacity-80 hover:border-[rgba(255,255,255,0.12)]"
                  }`}
                  onClick={() => {
                    if (isActive) {
                      router.push(
                        `/dashboard/databases/${connection.id}/overview?from=mysql`
                      );
                    }
                  }}
                >
                  {/* Status Badge */}
                  <div className="flex items-center gap-3 min-w-[100px]">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isActive
                          ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                          : "bg-[#444444]"
                      }`}
                    />
                    <span className="text-[12px] text-[#f0f0f0] font-medium leading-none">
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Connection Info */}
                  <div className="flex-1 flex items-center min-w-0 gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-[#f0f0f0] truncate group-hover:text-white transition-colors">
                        {connection.display_name}
                      </div>
                      <div className="text-[12px] text-[#666666] truncate mt-0.5 font-mono">
                        {info?.host || "Localhost"}
                      </div>
                    </div>

                    <div className="hidden md:flex flex-col min-w-[140px]">
                      <div className="text-[10px] text-[#444444] uppercase font-mono tracking-wider font-bold">
                        Database
                      </div>
                      <div className="text-[13px] text-[#888888] truncate">
                        {info?.database || "—"}
                      </div>
                    </div>

                    <div className="hidden lg:flex flex-col min-w-[80px]">
                      <div className="text-[10px] text-[#444444] uppercase font-mono tracking-wider font-bold">
                        Port
                      </div>
                      <div className="text-[13px] text-[#888888]">
                        {info?.port || 3306}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isActive ? (
                      <>
                        {/* Chat shortcut — only for active */}
                        <Button
                          variant="outline"
                          className="h-8 px-2.5 border-[rgba(255,255,255,0.05)] hover:bg-[#1a1a1a]"
                          title="Open chat"
                          onClick={() =>
                            window.open(
                              `/dashboard/chat?db=${connection.id}`,
                              "_self"
                            )
                          }
                        >
                          <MessageSquare
                            size={16}
                            className="text-[#888888] group-hover:text-[#f0f0f0]"
                          />
                        </Button>

                        {/* Deactivate */}
                        <button
                          onClick={() => handleDeactivate(connection.id)}
                          disabled={isPending}
                          className="flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-[11px] font-medium text-[#888888] border border-[rgba(255,255,255,0.05)] hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Deactivate — hides from all views except this page"
                        >
                          {isPending ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <PowerOff size={12} />
                          )}
                          Deactivate
                        </button>
                      </>
                    ) : (
                      /* Reactivate */
                      <button
                        onClick={() => handleReactivate(connection.id)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-[6px] text-[11px] font-medium text-[#888888] border border-[rgba(255,255,255,0.05)] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Reactivate this connection"
                      >
                        {isPending ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Power size={12} />
                        )}
                        Reactivate
                      </button>
                    )}

                    {/* Delete — always available */}
                    <button
                      onClick={() => setDeleteTarget(connection)}
                      disabled={isPending}
                      className="p-1.5 hover:bg-red-500/10 rounded transition-colors group/trash disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Delete connection permanently"
                    >
                      <Trash2
                        size={16}
                        className="text-[#444444] group-hover/trash:text-red-500"
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Connection Modal */}
      <MySQLConnectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(database) => {
          setDatabases((current) => upsertDatabase(current, database));
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDatabaseModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        databaseName={deleteTarget?.display_name ?? ""}
      />
    </div>
  );
}
