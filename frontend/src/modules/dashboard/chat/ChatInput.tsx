"use client";

import AiChatInput from "@/components/ui/ai-chat-input";

export default function ChatInput() {
  const handleSend = (message: string) => {
    console.log("Querying:", message);
    // TODO: Connect to backend NL-to-SQL processing
  };

  const handleUpload = (file: File) => {
    console.log("Uploading file:", file.name);
    // TODO: Connect to backend upload flow
  };

  return (
    <div className="sticky bottom-0 w-full pb-4 pt-2 z-20 flex justify-center bg-linear-to-t from-[#070707] via-[#070707]/95 to-transparent">
      <div className="w-full max-w-3xl px-6">
        <AiChatInput
          onSendMessage={handleSend}
          onUploadFile={handleUpload}
        />

      </div>
    </div>
  );
}
