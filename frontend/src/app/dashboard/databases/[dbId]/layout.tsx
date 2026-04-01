"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { MessageSquare } from "lucide-react";
import DetailNav from "./_components/DetailNav";
import type { DatabaseResponse } from "@/types/api";

const tabs = [
  { to: "overview", label: "Overview" },
  { to: "schema", label: "Schema" },
  { to: "erd", label: "ERD" },
  { to: "chat", label: "Chat" },
];

export default function DatabaseDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const dbId = params.dbId as string;
  const id = parseInt(dbId, 10);
  
  const [database, setDatabase] = useState<DatabaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();


  useEffect(() => {
    async function fetchDatabase() {
      try {
        const db = await api.getDatabase(id);
        setDatabase(db);
      } catch (error) {
        console.error("Error fetching database:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDatabase();
  }, [id, api]);

  const databaseName = database?.display_name || `Database ${dbId}`;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed left-[220px] top-0 h-screen w-[240px] bg-[#0a0a0a] border-r border-[rgba(255,255,255,0.08)] z-10">
        <div className="p-6 border-b border-[rgba(255,255,255,0.08)]">
          <Link href="/dashboard/databases" className="text-sm text-[#888888] hover:text-[#f0f0f0] transition-colors">
            Back to Databases
          </Link>
          <div className="mt-3 font-semibold text-[#f0f0f0] truncate">
            {loading ? "Loading..." : databaseName}
          </div>
          <Link 
            href={`/dashboard/chat?db=${dbId}`}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-[#f0f0f0] text-black rounded-[8px] text-[13px] font-semibold hover:bg-white transition-colors"
          >
            <MessageSquare size={16} />
            New Chat
          </Link>
        </div>
        <DetailNav dbId={dbId} tabs={tabs} />
      </aside>

      <main className="ml-[240px] flex-1 p-8 bg-[#0a0a0a]">
        {children}
      </main>
    </div>
  );
}
