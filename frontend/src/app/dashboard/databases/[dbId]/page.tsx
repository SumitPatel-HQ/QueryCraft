"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function DatabaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dbId = params.dbId;

  useEffect(() => {
    if (dbId) {
      router.replace(`/dashboard/databases/${dbId}/overview`);
    }
  }, [dbId, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-pulse text-[rgba(255,255,255,0.6)]">Loading database details...</div>
    </div>
  );
}
