"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Send, Image, X } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface GradientAIChatInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  onFileAttach?: () => void;
  enableAnimations?: boolean;
  className?: string;
  disabled?: boolean;

  buttonBorderColor?: {
    light: string;
    dark: string;
  };
}

export function GradientAIChatInput({
  placeholder = "Send message...",
  onSend,
  enableAnimations = true,
  className,
  disabled = false,

  buttonBorderColor = {
    light: "#DBDBD8",  // Light gray for light mode
    dark: "#4A4A4A"    // Darker gray for dark mode
  },
}: GradientAIChatInputProps) {
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  // Fix hydration mismatch - only apply theme after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current theme's colors
  const isDark = mounted && theme === "dark";
  const currentButtonBorderColor = isDark ? buttonBorderColor.dark : buttonBorderColor.light;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSend && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
    e.target.value = ''; // Reset input
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      className={cn(
        "relative",
        className
      )}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      }}
    >
      <div className="relative rounded-[20px] bg-background">
        <div className="relative p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className={cn(
                  "w-full resize-none border-0 bg-transparent",
                  "text-foreground placeholder:text-muted-foreground",
                  "text-base leading-6 py-2 px-0",
                  "focus:outline-none focus:ring-0 outline-none",
                  "overflow-hidden",
                  "transition-colors duration-200",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  minHeight: "40px",
                  maxHeight: "120px",
                  height: "auto",
                  outline: "none !important",
                  boxShadow: "none !important",
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 120) + "px";
                }}
              />
            </div>

            <motion.button
              type="submit"
              onClick={handleSubmit}
              disabled={disabled || !message.trim()}
              className={cn(
                "flex items-center justify-center",
                "w-8 h-8 mt-1",
                "text-muted-foreground hover:text-foreground",
                "transition-colors cursor-pointer",
                (disabled || !message.trim()) && "opacity-50 cursor-not-allowed"
              )}
              whileHover={shouldAnimate && message.trim() ? { scale: 1.1 } : {}}
              whileTap={shouldAnimate && message.trim() ? { scale: 0.9 } : {}}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={handleFileAttachment}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5",
                "text-sm text-muted-foreground hover:text-foreground",
                "rounded-full transition-colors cursor-pointer",
                "bg-muted/30 hover:bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{
                border: `1px solid ${currentButtonBorderColor}`
              }}
              whileHover={shouldAnimate ? { scale: 1.02 } : {}}
              whileTap={shouldAnimate ? { scale: 0.98 } : {}}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
            >
              <Image className="w-3 h-3" aria-hidden="true" />
              <span>Attach File</span>
            </motion.button>

            {attachedFiles.length > 0 && (
            <div
              className="h-6 w-px"
              style={{ backgroundColor: currentButtonBorderColor }}
            />
            )}
             {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5",
                      "text-sm text-muted-foreground",
                      "rounded-full border",
                      "bg-muted/50"
                    )}
                    style={{
                      border: `1px solid ${currentButtonBorderColor}`
                    }}
                  >
                    <span className="truncate max-w-[100px]">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0 w-4 h-4 rounded-full bg-muted-foreground/20 hover:bg-destructive/20 flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-foreground hover:text-destructive" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </motion.div>
  );
}
