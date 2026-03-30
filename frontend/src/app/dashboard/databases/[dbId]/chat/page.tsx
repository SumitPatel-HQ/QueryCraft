import { getDatabase } from "@/lib/api";
import QueryInterface from "@/components/query/QueryInterface";

export default async function DatabaseChatPage({
  params,
}: {
  params: Promise<{ dbId: string }>;
}) {
  const { dbId } = await params;
  const id = parseInt(dbId, 10);

  let database;
  let error;

  try {
    database = await getDatabase(id);
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

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">
          Query: {database.display_name}
        </h1>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
          {database.table_count} tables - {database.db_type}
        </div>
      </header>

      <QueryInterface databases={[database]} preselectedDatabaseId={database.id} />
    </div>
  );
}
