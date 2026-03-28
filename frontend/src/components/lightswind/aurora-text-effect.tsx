"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface AuroraTextEffectProps {
  text: string;
  className?: string;
}

export function AuroraTextEffect({
  text,
  className,
}: AuroraTextEffectProps) {
  const keyframes = `
    @keyframes aurora-rotate {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }
  `;

  return (
    <>
      <style>{keyframes}</style>
      <span
        className={cn(
          "relative inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse",
          className
        )}
        style={{
          backgroundSize: "200% 200%",
          animation: "aurora-rotate 3s ease infinite",
        }}
      >
        {text}
      </span>
    </>
  );
}
