"use client";

export default function UserMessage({ text, time }: { text: string; time: string }) {
  return (
    <div className="self-end max-w-[70%]">
      <div
        className="rounded-[16px] rounded-br-[16px] rounded-bl-[4px] p-4 text-sm"
        style={{
          background: "rgba(139,92,246,0.15)",
          border: "1px solid rgba(139,92,246,0.3)",
          color: "rgba(255,255,255,0.87)",
        }}
      >
        {text}
      </div>
      <div className="text-[0.75rem] text-right mt-2 text-[rgba(255,255,255,0.38)]">{time}</div>
    </div>
  );
}


