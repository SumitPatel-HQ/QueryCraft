"use client";

import AiChatInput from "@/components/ui/ai-chat-input";

export default function ChatInput() {
  const handleSend = (message: string) => {
    console.log("Querying:", message);
    // TODO: Connect to backend NL-to-SQL processing
  };

  return (
    <div className="sticky fixed bottom-0 left-0 right-0 w-full py-4 z-10 flex justify-center">
      <div className="max-w-3xl px-6">
        <AiChatInput
          onSendMessage={handleSend}
        />
        <div className="text-[11px] text-[#444444] text-center mt-3">
          QueryCraft uses AI and may produce inaccurate SQL. Always verify before executing destructive operations.
        </div>
      </div>
    </div>
  );
}
