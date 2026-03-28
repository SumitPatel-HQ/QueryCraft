"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RippleButtonProps {
  text?: string;
  bgColor?: string;
  circleColor?: string;
  width?: string;  // e.g., "200px" or "100%"
  height?: string; // e.g., "50px"
  onClick?: () => void;
  className?: string;
}

const RippleButton: React.FC<RippleButtonProps> = ({
  text = "Click Me",
  bgColor,
  circleColor = "#6c006c",
  width,
  height,
  onClick,
  className = "",
}) => {
  const buttonId = React.useId();
  
  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          "relative inline-flex items-center justify-center font-bold px-8 py-4",
          "border-none rounded-xl cursor-pointer overflow-hidden",
          "text-white dark:text-black dark:bg-white bg-black",
          "transition-all duration-300 ease-in-out",
          className
        )}
        style={{
          backgroundColor: bgColor,
          width: width,
          height: height,
        }}
        data-button-id={buttonId}
      >
        <span 
          className="absolute left-1/2 top-1/2 h-[30px] w-[30px] rounded-full transition-all duration-600 ease-in-out pointer-events-none -translate-x-[3.3em] -translate-y-[4em]"
          style={{ backgroundColor: circleColor }}
        ></span>
        <span 
          className="absolute left-1/2 top-1/2 h-[30px] w-[30px] rounded-full transition-all duration-600 ease-in-out pointer-events-none -translate-x-[6em] translate-y-[1.3em]"
          style={{ backgroundColor: circleColor }}
        ></span>
        <span 
          className="absolute left-1/2 top-1/2 h-[30px] w-[30px] rounded-full transition-all duration-600 ease-in-out pointer-events-none -translate-x-[0.2em] translate-y-[1.8em]"
          style={{ backgroundColor: circleColor }}
        ></span>
        <span 
          className="absolute left-1/2 top-1/2 h-[30px] w-[30px] rounded-full transition-all duration-600 ease-in-out pointer-events-none translate-x-[3.5em] translate-y-[1.4em]"
          style={{ backgroundColor: circleColor }}
        ></span>
        <span 
          className="absolute left-1/2 top-1/2 h-[30px] w-[30px] rounded-full transition-all duration-600 ease-in-out pointer-events-none translate-x-[3.5em] -translate-y-[3.8em]"
          style={{ backgroundColor: circleColor }}
        ></span>
        <span className="relative z-10">{text}</span>
      </button>

      <style dangerouslySetInnerHTML={{
        __html: `
          button[data-button-id="${buttonId}"]:hover span:not(:last-child) {
            transform: translate(-50%, -50%) scale(4) !important;
            transition: 1.5s ease;
          }
        `
      }} />
    </>
  );
};

export default RippleButton;
