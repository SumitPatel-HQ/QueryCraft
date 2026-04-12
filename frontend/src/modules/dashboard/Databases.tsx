"use client";

import { useState } from "react";
import { Database, Upload, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import DatabaseUploadModal from "@/components/database/DatabaseUploadModal";
import DatabaseCard from "@/components/database/DatabaseCard";
import type { DatabaseResponse, DatabaseUploadResponse } from "@/types/api";

interface DatabasesViewProps {
  databases: DatabaseResponse[];
  error?: string;
}

export default function DatabasesView({ databases: initialDatabases, error }: DatabasesViewProps) {
  const router = useRouter();
  const api = useApi();
  const [databases, setDatabases] = useState<DatabaseResponse[]>(initialDatabases);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleUploadSuccess = (data: DatabaseUploadResponse) => {
    // Redirect to chat page with the new database pre-selected
    router.push(`/dashboard/chat?db=${data.database_id}`);
  };

  const handleDelete = async (id: number) => {
    await api.deleteDatabase(id);
    setDatabases((prev) => prev.filter((db) => db.id !== id));
  };

  const filteredDatabases = databases.filter((db) =>
    db.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    db.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">
              Databases
            </h1>
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
              {databases.length} Total
            </div>
          </div>
          <Button
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload size={16} />
            Upload Database
          </Button>
        </header>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400 text-[14px]">
            <strong>Error loading databases:</strong> {error}
          </div>
        )}

        {/* Search */}
        {databases.length > 0 && (
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-[#666] group-focus-within:text-[#999] transition-colors" strokeWidth={1.5} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search databases..."
              className="w-full bg-[#0a0a0a] border border-white/[0.06] text-[#eee] rounded-[12px] pl-10 pr-4 py-2.5 text-[14px] outline-none transition-all placeholder:text-[#555] focus:border-white/[0.12]"
            />
          </div>
        )}

        {/* Databases Grid */}
        {filteredDatabases.length === 0 ? (
          <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] py-16 flex flex-col items-center justify-center text-center px-4">
            <Database size={48} strokeWidth={1.5} className="text-[#444444] mb-4" />
            <h3 className="text-[16px] font-semibold text-[#f0f0f0] mb-2">
              {searchQuery ? "No databases found" : "No databases uploaded"}
            </h3>
            <p className="text-[14px] text-[#888888] max-w-[36ch] mx-auto mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : "Upload a database to start querying with natural language"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setUploadModalOpen(true)}>
                <Upload size={16} className="mr-2" />
                Upload Database
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredDatabases.map((database) => (
              <DatabaseCard
                key={database.id}
                database={database}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <DatabaseUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
