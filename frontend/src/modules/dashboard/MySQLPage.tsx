"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DatabaseZap, 
  Plus, 
  Server, 
  Loader2, 
  Search,
  MessageSquare,
  Trash2,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import MySQLConnectionModal from "@/components/database/MySQLConnectionModal";
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

  const liveConnections = useMemo(
    () => databases.filter((database) => database.db_type === "mysql"),
    [databases]
  );

  const filteredConnections = useMemo(() => {
    return liveConnections.filter((connection) => 
      connection.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (connection.connection_info?.host || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [liveConnections, searchQuery]);

  const loadDatabases = useCallback(async () => {
    if (loading || !user) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.getDatabases();
      setDatabases(result);
    } catch {
      setError(
        "Could not load live connections."
      );
    } finally {
      setIsLoading(false);
    }
  }, [api, loading, user]);

  const handleDelete = async (id: number) => {
    try {
      await api.deleteDatabase(id);
      setDatabases((prev) => prev.filter((db) => db.id !== id));
    } catch (err) {
      alert("Failed to delete connection.");
    }
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
            My SQL Connections
          </h1>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
            {liveConnections.length} Total
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
          <strong>Error loading connections:</strong> {error}
        </div>
      )}

      {/* Search */}
      {liveConnections.length > 0 && (
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]" />
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
              {searchQuery ? "No connections found" : "No live connections yet"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredConnections.map((connection) => {
              const info = connection.connection_info;
              return (
                <div
                  key={connection.id}
                  className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4 flex flex-col hover:-translate-y-1 transition-all cursor-pointer group"
                  onClick={() => router.push(`/dashboard/databases/${connection.id}/overview?from=mysql`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${connection.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-[#444444]'}`} />
                      <span className="text-[12px] text-[#f0f0f0] font-medium leading-none">
                        {connection.is_active ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(connection.id);
                        }}
                        className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
                        title="Delete connection"
                      >
                        <Trash2 size={14} className="text-[#666666] hover:text-[#ff4444]" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-[14px] font-semibold text-[#f0f0f0] mb-1">
                    {connection.display_name}
                  </div>
                  
                  <div className="text-[12px] text-[#666666] mb-3 truncate">
                    {info?.host || "Localhost"}
                  </div>

                  <div className="mt-auto pt-3 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                    <div className="text-[11px] text-[#666666] uppercase font-mono tracking-wider">
                      {info?.database || "MYSQL"}
                    </div>
                    <div className="text-[11px] text-[#444444]">
                      Port {info?.port || 3306}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 h-8 text-[11px] border border-[rgba(255,255,255,0.05)] hover:bg-[#1a1a1a] text-[#888888] hover:text-[#f0f0f0]"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert("Schema view coming soon");
                      }}
                    >
                      View Schema
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 px-2 border-[rgba(255,255,255,0.05)] hover:bg-[#1a1a1a]"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/dashboard/chat?db=${connection.id}`, '_self');
                      }}
                    >
                      <MessageSquare size={12} className="text-[#888888] hover:text-[#f0f0f0]" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <MySQLConnectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(database) => {
          setDatabases((current) => upsertDatabase(current, database));
        }}
      />
    </div>
  );
}

