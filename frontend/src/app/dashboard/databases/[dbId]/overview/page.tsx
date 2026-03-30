import { getDatabase, getDatabaseSchema } from "@/lib/api";
import { Database, Table2 } from "lucide-react";

export default async function DatabaseOverviewPage({
  params,
}: {
  params: Promise<{ dbId: string }>;
}) {
  const { dbId } = await params;
  const id = parseInt(dbId, 10);

  let database;
  let schema;
  let error;

  try {
    [database, schema] = await Promise.all([getDatabase(id), getDatabaseSchema(id)]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load database";
    console.error("Error fetching database:", e);
  }

  if (error || !database) {
    return (
      <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400">
        {error || "Database not found"}
      </div>
    );
  }

  const tables = Object.keys(schema?.schema || {});

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#111111] p-5 rounded-[10px] border border-[rgba(255,255,255,0.08)]">
          <div className="text-[#888888] mb-2 flex items-center gap-2">
            <Table2 size={16} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em]">Tables</span>
          </div>
          <div className="text-[26px] font-bold text-[#f0f0f0]">{database.table_count}</div>
        </div>

        <div className="bg-[#111111] p-5 rounded-[10px] border border-[rgba(255,255,255,0.08)]">
          <div className="text-[#888888] mb-2 flex items-center gap-2">
            <Database size={16} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em]">Total Rows</span>
          </div>
          <div className="text-[26px] font-bold text-[#f0f0f0]">{database.row_count.toLocaleString()}</div>
        </div>

        <div className="bg-[#111111] p-5 rounded-[10px] border border-[rgba(255,255,255,0.08)]">
          <div className="text-[#888888] mb-2 flex items-center gap-2">
            <Database size={16} />
            <span className="text-[11px] font-medium uppercase tracking-[0.08em]">Size</span>
          </div>
          <div className="text-[26px] font-bold text-[#f0f0f0]">{(database.size_mb ?? 0).toFixed(1)} MB</div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-6 space-y-4">
        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Name</div>
          <div className="text-[14px] text-[#f0f0f0]">{database.display_name}</div>
        </div>

        {database.description && (
          <div>
            <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Description</div>
            <div className="text-[14px] text-[#f0f0f0]">{database.description}</div>
          </div>
        )}

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Type</div>
          <div className="text-[14px] text-[#f0f0f0] uppercase">{database.db_type}</div>
        </div>

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Created</div>
          <div className="text-[14px] text-[#f0f0f0]">{new Date(database.created_at).toLocaleString()}</div>
        </div>

        <div>
          <div className="text-[11px] text-[#888888] font-medium uppercase tracking-[0.08em] mb-1">Last Accessed</div>
          <div className="text-[14px] text-[#f0f0f0]">{new Date(database.last_accessed).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888] mb-4">
          Tables ({tables.length})
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tables.map((table) => (
            <div
              key={table}
              className="bg-[#0a0a0a] border border-[rgba(255,255,255,0.05)] rounded-[8px] px-3 py-2 text-[13px] text-[#f0f0f0]"
            >
              {table}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
