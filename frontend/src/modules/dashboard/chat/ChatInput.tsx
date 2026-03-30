"use client";

import { GradientAIChatInput } from "@/components/ui/gradient-ai-chat-input";

export default function ChatInput() {
  const handleSend = (message: string) => {
    console.log("Querying:", message);
    // TODO: Connect to backend NL-to-SQL processing
  };

  return (
    <div className="sticky fixed bottom-0 left-0 right-0 w-full bg-background py-4 z-10">
      <div className="max-w-3xl mx-auto px-6">
        <GradientAIChatInput
          placeholder="Query sales data, trends, or user stats..."
          onSend={handleSend}
        />
        <div className="text-[11px] text-[#444444] text-center mt-3">
          QueryCraft uses AI and may produce inaccurate SQL. Always verify before executing destructive operations.
        </div>
      </div>
    </div>
  );
}
