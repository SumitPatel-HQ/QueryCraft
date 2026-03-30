import { getDatabaseSchema } from "@/lib/api";

export default async function DatabaseSchemaPage({
  params,
}: {
  params: Promise<{ dbId: string }>;
}) {
  const { dbId } = await params;
  const id = parseInt(dbId, 10);

  let schema;
  let error;

  try {
    schema = await getDatabaseSchema(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load schema";
    console.error("Error fetching schema:", e);
  }

  if (error || !schema) {
    return (
      <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400">
        {error || "Schema not found"}
      </div>
    );
  }

  const tables = Object.entries(schema.schema);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#888888]">
        {tables.length} Tables - {schema.source === "cached" ? "Cached" : "Fresh"}
      </div>

      {tables.map(([tableName, columns]) => {
        const typedColumns = columns as Array<{
          name: string;
          type: string;
          primary_key?: boolean;
          nullable?: boolean;
          foreign_key?: { table: string; column: string };
        }>;

        return (
          <div
            key={tableName}
            className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] overflow-hidden"
          >
            <div className="bg-[#0a0a0a] px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
              <h3 className="text-[16px] font-semibold text-[#f0f0f0]">{tableName}</h3>
              <div className="text-[12px] text-[#666666] mt-1">{typedColumns.length} columns</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0a0a0a]">
                  <tr>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#888888] uppercase tracking-[0.08em]">
                      Column
                    </th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#888888] uppercase tracking-[0.08em]">
                      Type
                    </th>
                    <th className="text-left px-6 py-3 text-[11px] font-semibold text-[#888888] uppercase tracking-[0.08em]">
                      Constraints
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {typedColumns.map((col, i) => (
                    <tr
                      key={i}
                      className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)]"
                    >
                      <td className="px-6 py-3 text-[13px] font-mono text-[#f0f0f0]">{col.name}</td>
                      <td className="px-6 py-3 text-[13px] text-[#888888]">{col.type}</td>
                      <td className="px-6 py-3 text-[12px] text-[#666666]">
                        {col.primary_key && (
                          <span className="inline-block bg-blue-900/30 text-blue-400 px-2 py-1 rounded mr-2">
                            PRIMARY KEY
                          </span>
                        )}
                        {col.nullable === false && (
                          <span className="inline-block bg-orange-900/30 text-orange-400 px-2 py-1 rounded mr-2">
                            NOT NULL
                          </span>
                        )}
                        {col.foreign_key && (
                          <span className="inline-block bg-purple-900/30 text-purple-400 px-2 py-1 rounded">
                            FK {"->"} {col.foreign_key.table}.{col.foreign_key.column}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
