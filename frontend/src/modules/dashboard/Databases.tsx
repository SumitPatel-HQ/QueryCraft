"use client";

import { Database, Settings, Trash2, LayoutTemplate, Network, Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DatabasesView() {
  return (
    <div className="max-w-[1200px] mx-auto pb-12">
      <header className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">My Databases</h1>
          <p className="mt-1 text-[12px] text-[#888888] font-medium">
            3 databases connected
          </p>
        </div>
        <Button variant="default">
          <Plus size={16} />
          Add Database
        </Button>
      </header>

      <div className="flex flex-col gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="group flex flex-col bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-5 transition-all hover:shadow-md hover:border-[rgba(255,255,255,0.15)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[8px] bg-[#1a1a1a] border border-[rgba(255,255,255,0.05)] flex items-center justify-center">
                  <Database size={20} className="text-[#f0f0f0]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-[16px] font-semibold text-[#f0f0f0] leading-tight">
                      {i === 1 ? "E-commerce Production" : i === 2 ? "Analytics Warehouse" : "Local Test DB"}
                    </h2>
                    <div className="w-1.5 h-1.5 rounded-full bg-white ml-1" title="Active" />
                  </div>
                  <div className="text-[12px] text-[#888888]">
                    {i === 1 ? "PostgreSQL • ecommerce.acme.com" : i === 2 ? "Snowflake • us-east-1.snowflakecomputing.com" : "SQLite • local"}
                  </div>
                  <div className="text-[12px] text-[#444444] mt-1 font-mono">
                    Last queried: 2h ago
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 !p-0">
                  <Settings size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 !p-0 hover:text-red-400">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            <div className="mt-5 mb-5 h-px w-full bg-[rgba(255,255,255,0.08)]" />

            {/* Metadata chips */}
            <div className="flex flex-wrap gap-4 mb-5">
              {[
                { label: "45 tables", icon: LayoutTemplate },
                { label: "Schema synced 1d ago", icon: Network },
                { label: "128 queries this week", icon: Play },
              ].map((meta, idx) => {
                const MetaIcon = meta.icon;
                return (
                  <div key={idx} className="flex items-center gap-1.5 text-[12px] text-[#444444]">
                    <MetaIcon size={14} />
                    <span>{meta.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" size="sm" className="h-8 text-[12px]">View Schema</Button>
              <Button variant="ghost" size="sm" className="h-8 text-[12px]">View ERD</Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-[12px] text-white border-[rgba(255,255,255,0.25)] hover:border-white"
              >
                New Query
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-[12px]">Settings</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


