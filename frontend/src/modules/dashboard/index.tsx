"use client";

import { 
  MessageSquare, 
  Database, 
  Upload, 
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { DatabaseResponse } from "@/types/api";

interface DashboardHomeProps {
  databases: DatabaseResponse[];
  error?: string;
}

export default function DashboardHome({ databases, error }: DashboardHomeProps) {
  const router = useRouter();
  const databaseCount = databases.length;
  const totalTables = databases.reduce((sum, db) => sum + db.table_count, 0);
  const totalRows = databases.reduce((sum, db) => sum + db.row_count, 0);

  const quickActions = [
    {
      title: "New Query",
      desc: "Start a fresh question",
      icon: MessageSquare,
      action: () => router.push("/dashboard/chat"),
    },
    {
      title: "Browse Databases",
      desc: "Explore your data context",
      icon: Database,
      action: () => router.push("/dashboard/databases"),
    },
    {
      title: "Upload Data",
      desc: "Add CSVs or raw files",
      icon: Upload,
      action: () => router.push("/dashboard/databases"),
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-10 pb-12">
      {/* Top Bar */}
      <header>
        <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">Overview</h1>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mt-1">
          Performance Insights
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Databases Available", value: String(databaseCount) },
          { label: "Total Tables", value: String(totalTables) },
          { label: "Total Rows", value: totalRows.toLocaleString() },
        ].map((stat) => (
          <div 
            key={stat.label} 
            className="bg-[#111111] p-5 rounded-[10px] border border-[rgba(255,255,255,0.08)] relative overflow-hidden"
          >
            <div className="text-[#444444] text-[11px] font-medium uppercase tracking-[0.08em] mb-3">
              {stat.label}
            </div>
            <div className="text-[26px] font-bold font-mono text-[#f0f0f0] tracking-tight">
              {stat.value}
            </div>
          </div>
        ))}
      </section>

      {error && (
        <div className="bg-red-900/20 border border-red-900/50 rounded-[10px] p-4 text-red-400 text-[14px]">
          <strong>Error loading dashboard data:</strong> {error}
        </div>
      )}

      {/* Quick Actions */}
      <section>
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#444444] mb-4">
          Quick Actions
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={action.action}
                className="group flex flex-col items-start text-left bg-[#111111] border border-[rgba(255,255,255,0.08)] p-5 rounded-[10px] transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer outline-none focus-visible:border-white focus-visible:ring-1 focus-visible:ring-white"
              >
                <div className="text-[#888888] mb-4 transition-colors group-hover:text-[#f0f0f0]">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div className="text-[14px] font-semibold text-[#f0f0f0]">
                  {action.title}
                </div>
                <div className="text-[12px] text-[#888888] mt-1">
                  {action.desc}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Queries */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-[#f0f0f0]">Recent Queries</h2>
          <button className="text-[12px] text-[#888888] hover:text-[#f0f0f0] transition-colors cursor-pointer">
            View All →
          </button>
        </div>
        
        {/* Empty State */}
        <div className="bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] py-16 flex flex-col items-center justify-center text-center px-4 animate-in fade-in slide-in-from-bottom-[8px] duration-300 delay-100 fill-mode-both">
          <Search size={32} strokeWidth={1.5} className="text-[#444444] mb-4" />
          <h3 className="text-[16px] font-semibold text-[#f0f0f0] mb-2">No queries yet</h3>
          <p className="text-[14px] text-[#888888] max-w-[36ch] mx-auto mb-6">
            Get started by asking a question about your connected data sources.
          </p>
          <Button variant="default">New Query</Button>
        </div>
      </section>

      {/* Connected Databases */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-[#f0f0f0]">Connected Databases</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/databases")}>+ Add Database</Button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
          {(databases.length ? databases : []).map((db) => (
            <div 
              key={db.id}
              className="min-w-[280px] bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4 flex flex-col hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer"
              onClick={() => router.push(`/dashboard/databases/${db.id}/overview`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${db.is_active ? "bg-white" : "bg-[#444444]"}`} />
                  <span className="text-[12px] text-[#f0f0f0] font-medium leading-none">
                    {db.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <Database size={14} className="text-[#444444]" />
              </div>
              <div className="text-[14px] font-semibold text-[#f0f0f0] mb-1">
                {db.display_name}
              </div>
              <div className="text-[12px] text-[#888888]">
                {db.db_type.toUpperCase()} - {db.table_count} tables
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


