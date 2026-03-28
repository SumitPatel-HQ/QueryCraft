"use client";

export default function ChatInput() {
  return (
    <div
      className="fixed left-[240px] right-0 bottom-0 w-[calc(100%-240px)]"
      style={{
        background: "rgba(18,18,18,0.98)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-[1000px] mx-auto p-6">
        <div className="flex items-center gap-3">
          <input
            aria-label="Type your question"
            placeholder="Type your question here..."
            className="flex-1 h-14 rounded-xl px-5 text-sm"
            style={{
              background: "rgba(30,30,30,0.8)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.87)",
            }}
          />
          <button
            aria-label="Submit"
            className="w-14 h-14 rounded-xl grid place-items-center text-white"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}


