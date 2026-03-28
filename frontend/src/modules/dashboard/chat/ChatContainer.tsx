"use client";

import ChatInput from "./ChatInput";
import AIResponse from "./AIResponse";
import UserMessage from "./UserMessage";
import SampleQuestions from "./SampleQuestions";

export default function ChatContainer() {
  return (
    <div className="max-w-[1000px] mx-auto min-h-[calc(100vh-100px)] flex flex-col">
      <header className="py-5 mb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[1.5rem] font-bold">💬 Chat with E-commerce Database</div>
            <div className="text-xs text-[rgba(255,255,255,0.60)]">15 queries remaining in demo mode</div>
          </div>
          <button className="text-sm text-[#8B5CF6]">Clear Chat</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-6 flex flex-col gap-6">
        <UserMessage text="Show me top 10 customers by spending" time="2:29 PM" />
        <AIResponse />
      </div>

      <SampleQuestions />
      <ChatInput />
    </div>
  );
}


