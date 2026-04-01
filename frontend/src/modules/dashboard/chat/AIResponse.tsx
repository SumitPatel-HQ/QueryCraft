"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Code2, Copy, Check, Download, ThumbsUp, ThumbsDown, Edit2, Lightbulb, Table2 } from "lucide-react";
import SQLCodeBlock from "./SQLCodeBlock";
import ResultsTable from "./ResultsTable";
import { Button } from "@/components/ui/button";

export default function AIResponse() {
  const [copied, setCopied] = useState(false);
  const sqlCode = `SELECT c.customer_name, SUM(o.total_amount) AS total_spent\nFROM customers c\nJOIN orders o ON o.customer_id = c.customer_id\nGROUP BY c.customer_name\nORDER BY total_spent DESC\nLIMIT 10;`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sqlCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="self-start max-w-[85%] bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-6 shadow-sm">
      
      {/* SQL Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#f0f0f0] mb-3">
          <Code2 size={14} className="text-[#888888]" />
          Generated SQL
        </div>
        <SQLCodeBlock code={sqlCode} />
      </div>

      {/* Explanation Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#f0f0f0] mb-2">
          <Lightbulb size={14} className="text-[#888888]" />
          Explanation
        </div>
        <p className="text-[13px] text-[#888888] leading-relaxed">
          This query finds the top 10 customers by calculating their total spending. It joins the
          customers and orders tables, groups by customer, sums their order amounts, and sorts in
          descending order.
        </p>
      </div>

      {/* Metadata Indicators */}
      <div className="flex items-center gap-4 text-[11px] text-[#444444] mb-6 font-medium tracking-tight">
        <span className="flex items-center gap-1.5 text-[#f0f0f0]">
          <CheckCircle2 size={12} strokeWidth={2.5} />
          92% Confidence
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={12} />
          Generated in 0.8s
        </span>
      </div>

      {/* Results Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#f0f0f0] mb-3">
          <Table2 size={14} className="text-[#888888]" />
          Results <span className="text-[#444444] font-normal">(10 rows)</span>
        </div>
        <ResultsTable />
      </div>

      {/* Actions Section */}
      <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.08)]">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-8 text-[12px] gap-1.5 pointer-events-none opacity-50">
            <Edit2 size={12} /> Edit SQL
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-[12px] gap-1.5 hover:text-[#f0f0f0] hover:bg-white/5"
            onClick={handleCopy}
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy SQL"}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-[12px] gap-1.5 pointer-events-none opacity-50">
            <Download size={12} /> Export CSV
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#888888] hover:text-[#f0f0f0]">
            <ThumbsUp size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#888888] hover:text-[#f0f0f0]">
            <ThumbsDown size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
