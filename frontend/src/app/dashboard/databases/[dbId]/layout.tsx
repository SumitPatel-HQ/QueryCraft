import Link from "next/link";
import { getDatabase } from "@/lib/api";

const tabs = [
  { to: "overview", label: "Overview" },
  { to: "schema", label: "Schema" },
  { to: "erd", label: "ERD" },
  { to: "chat", label: "Chat" },
  { to: "settings", label: "Settings" },
];

export default async function DatabaseDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ dbId: string }>;
}) {
  const { dbId } = await params;
  const id = parseInt(dbId, 10);

  let databaseName = `Database ${dbId}`;
  let status = "Unknown";

  try {
    const db = await getDatabase(id);
    databaseName = db.display_name;
    status = db.is_active ? "Active" : "Inactive";
  } catch {
    // Keep fallback label if database lookup fails
  }

  return (
    <div className="flex min-h-screen">
      <aside className="fixed h-screen w-[240px] bg-[#111111] border-r border-[rgba(255,255,255,0.08)]">
        <div className="p-6 border-b border-[rgba(255,255,255,0.08)]">
          <Link href="/dashboard/databases" className="text-sm text-[#888888] hover:text-[#f0f0f0] transition-colors">
            Back to Databases
          </Link>
          <div className="mt-3 font-semibold text-[#f0f0f0] truncate">{databaseName}</div>
          <div className="mt-2 inline-block text-xs px-2 py-1 rounded-md bg-[rgba(16,185,129,0.15)] text-[#10B981]">
            {status}
          </div>
        </div>
        <nav className="mt-4">
          {tabs.map((t) => {
            const href = `/dashboard/databases/${dbId}/${t.to}`;
            return (
              <Link
                key={t.to}
                href={href}
                className="h-11 px-6 flex items-center gap-3 text-sm text-[#888888] hover:text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="ml-[240px] w-full p-8 bg-[#0a0a0a]">
        {children}
      </main>
    </div>
  );
}
