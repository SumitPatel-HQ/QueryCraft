"use client";

export default function SQLCodeBlock({ code }: { code: string }) {
  return (
    <pre
      className="rounded-xl p-5 overflow-x-auto text-sm"
      style={{
        background: "rgba(18,18,18,0.95)",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "#A5B4FC",
        lineHeight: 1.6,
      }}
    >
      <code>{code}</code>
    </pre>
  );
}


