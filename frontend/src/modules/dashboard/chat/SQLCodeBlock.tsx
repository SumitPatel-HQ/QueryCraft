"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function SQLCodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 p-2 rounded-md bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] text-[#888888] hover:text-[#f0f0f0] hover:bg-[#222222] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Copy to clipboard"
      >
        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      </button>
      <pre className="rounded-[10px] p-4 overflow-x-auto text-[13px] bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] text-[#f0f0f0] font-mono leading-relaxed custom-scrollbar min-h-[60px]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
