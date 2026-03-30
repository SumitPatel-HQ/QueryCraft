"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavTab = {
  to: string;
  label: string;
};

interface DetailNavProps {
  dbId: string;
  tabs: NavTab[];
}

export default function DetailNav({ dbId, tabs }: DetailNavProps) {
  const pathname = usePathname();

  return (
    <nav className="mt-4">
      {tabs.map((t) => {
        const href = `/dashboard/databases/${dbId}/${t.to}`;
        const active = pathname === href;

        return (
          <Link
            key={t.to}
            href={href}
            className={[
              "h-11 px-6 flex items-center gap-3 text-sm transition-colors border-l-2",
              active
                ? "text-[#f0f0f0] bg-[rgba(255,255,255,0.06)] border-l-[#f0f0f0]"
                : "text-[#888888] hover:text-[#f0f0f0] hover:bg-[rgba(255,255,255,0.05)] border-l-transparent",
            ].join(" ")}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
