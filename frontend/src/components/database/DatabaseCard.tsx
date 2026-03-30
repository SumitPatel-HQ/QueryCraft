"use client";

import { Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DatabaseResponse } from "@/types/api";

interface DatabaseCardProps {
  database: DatabaseResponse;
  onDelete: (id: number) => Promise<void>;
}

export default function DatabaseCard({ database, onDelete }: DatabaseCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`Delete "${database.display_name}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await onDelete(database.id);
    } catch (err) {
      alert(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleView = () => {
    router.push(`/dashboard/databases/${database.id}/overview`);
  };

  return (
    <div 
      className="min-w-[280px] bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
      onClick={handleView}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${database.is_active ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span className="text-[12px] text-[#f0f0f0] font-medium leading-none">
            {database.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleView}
            className="p-1 hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors"
            title="View details"
          >
            <Eye size={14} className="text-[#888888]" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
            title="Delete database"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>
      
      <div className="text-[14px] font-semibold text-[#f0f0f0] mb-1">
        {database.display_name}
      </div>
      
      {database.description && (
        <div className="text-[12px] text-[#666666] mb-2 line-clamp-2">
          {database.description}
        </div>
      )}
      
      <div className="text-[12px] text-[#888888] mb-2">
        {database.db_type.toUpperCase()}
      </div>
      
      <div className="text-[11px] text-[#666666] mt-auto pt-2 border-t border-[rgba(255,255,255,0.05)]">
        {database.table_count} tables · {database.size_mb ? database.size_mb.toFixed(1) : '0.0'} MB
      </div>
    </div>
  );
}
