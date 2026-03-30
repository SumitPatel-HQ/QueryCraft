"use client";

export default function UserMessage({ text, time }: { text: string; time: string }) {
  return (
    <div className="self-end max-w-[60%] flex flex-col items-end">
      <div className="bg-white text-black rounded-[10px] py-[12px] px-[16px] text-[14px] leading-relaxed shadow-sm">
        {text}
      </div>
      <div className="text-[11px] text-[#444444] mt-1.5 font-medium">{time}</div>
    </div>
  );
}
