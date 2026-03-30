"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Paperclip,
  ArrowUp,
  StopCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AiChatInput({
  onSendMessage,
  onUploadFile,
  isLoading = false,
}: {
  onSendMessage: (message: string) => void
  onUploadFile?: (file: File) => void
  isLoading?: boolean
}) {
  const [input, setInput] = useState("")

  const handleSubmit = () => {
    if (!input.trim()) return
    onSendMessage(input.trim())
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full max-w-2xl px-4">
      <div className={cn(
        "relative flex items-center gap-2 p-1.5 rounded-[28px] bg-[#222222] border border-white/5 shadow-2xl",
        "transition-all duration-300 focus-within:ring-1 focus-within:ring-white/10"
      )}>
        {/* File Upload */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white/50 hover:text-white rounded-full transition-colors"
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <input
          id="file-input"
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0] && onUploadFile) {
              onUploadFile(e.target.files[0])
            }
          }}
        />

        {/* Input Area */}
        <div className="flex-1 flex items-center py-1 pl-1">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={cn(
              "resize-none bg-transparent border-0 text-white placeholder:text-white/30",
              // "focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
              "text-sm leading-relaxed min-h-[36px] max-h-[180px] p-0"
            )}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = target.scrollHeight + "px";
            }}
          />
        </div>

        {/* Action Group */}
        <div className="flex items-center pr-1">
          {/* Send Button matching the screenshot */}
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() && !isLoading}
            className={cn(
              "h-8 w-8 rounded-full p-0 flex items-center justify-center transition-all duration-200",
              input.trim() || isLoading
                ? "bg-white text-black hover:bg-white/90 scale-100 shadow-lg shadow-white/5"
                : "bg-white/10 text-white/20 scale-95 opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <StopCircle className="h-5 w-5" />
            ) : (
              <ArrowUp className="h-5 w-5 stroke-[2.5]" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
