"use client";

import { MessageSquare, Trash2 } from "lucide-react";
import ChatInput from "./ChatInput";
import AIResponse from "./AIResponse";
import UserMessage from "./UserMessage";
import SampleQuestions from "./SampleQuestions";
import { Button } from "@/components/ui/button";

export default function ChatContainer() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] relative">
      <div className="max-w-[900px] w-full mx-auto flex-1 flex flex-col pt-4">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 mb-6 border-b border-[rgba(255,255,255,0.08)] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={18} className="text-[#f0f0f0]" />
              <h1 className="text-[20px] font-semibold text-[#f0f0f0] tracking-tight leading-tight">
                Chat with E-commerce Production
              </h1>
            </div>
            <div className="text-[12px] font-medium text-[#888888]">
              15 queries remaining
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-[12px] text-[#888888] hover:text-[#f0f0f0]">
            <Trash2 size={14} className="mr-1.5" />
            Clear Chat
          </Button>
        </header>

        <div className="flex flex-col gap-8 pb-32">
          <UserMessage text="Show me top 10 customers by spending" time="2:29 PM" />
          <AIResponse />
          <SampleQuestions />
        </div>
      </div>
      
      <ChatInput />
    </div>
  );
}
