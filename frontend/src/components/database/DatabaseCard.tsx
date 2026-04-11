"use client";

import { Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DatabaseResponse } from "@/types/api";
import DeleteDatabaseModal from "./DeleteDatabaseModal";
import { toast } from "sonner";

interface DatabaseCardProps {
  database: DatabaseResponse;
  onDelete: (id: number) => Promise<void>;
}

export default function DatabaseCard({ database, onDelete }: DatabaseCardProps) {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    try {
      await onDelete(database.id);
      toast.success("Database deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to delete: ${errorMessage}`);
      throw err; // Re-throw to let the modal know it failed if needed
    }
  };

  const handleView = () => {
    router.push(`/dashboard/databases/${database.id}/overview?from=databases`);
  };

  return (
    <>
      <div 
        className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4 flex items-center gap-6 hover:border-[rgba(255,255,255,0.2)] transition-all cursor-pointer group"
        onClick={handleView}
      >
        <div className="flex items-center gap-3 min-w-[100px]">
          <div className={`w-2 h-2 rounded-full ${database.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-[#444444]'}`} />
          <span className="text-[12px] text-[#f0f0f0] font-medium leading-none">
            {database.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="flex-1 flex items-center min-w-0 gap-8">
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-[#f0f0f0] truncate group-hover:text-white transition-colors">
              {database.display_name}
            </div>
            {database.description && (
              <div className="text-[12px] text-[#666666] truncate mt-0.5">
                {database.description}
              </div>
            )}
          </div>

          <div className="hidden md:flex flex-col min-w-[100px]">
            <div className="text-[10px] text-[#444444] uppercase font-mono tracking-wider font-bold">Type</div>
            <div className="text-[13px] text-[#888888] uppercase">{database.db_type}</div>
          </div>

          <div className="hidden lg:flex flex-col min-w-[140px]">
            <div className="text-[10px] text-[#444444] uppercase font-mono tracking-wider font-bold">Stats</div>
            <div className="text-[13px] text-[#888888] truncate">
              {database.table_count} tables · {database.size_mb ? database.size_mb.toFixed(1) : '0.0'} MB
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
            className="p-1.5 hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors text-[#888888] hover:text-[#f0f0f0]"
            title="View details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-[#444444] hover:text-red-500 group/trash"
            title="Delete database"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <DeleteDatabaseModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        databaseName={database.display_name}
      />
    </>
  );
}

