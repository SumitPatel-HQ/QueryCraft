"use client";

export default function SQLCodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-[10px] p-4 overflow-x-auto text-[13px] bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] text-[#f0f0f0] font-mono leading-relaxed custom-scrollbar">
      <code>{code}</code>
    </pre>
  );
}
