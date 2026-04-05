"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DatabaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dbId = params.dbId as string;

  useEffect(() => {
    router.replace(`/dashboard/databases/${dbId}/overview`);
  }, [dbId, router]);

  return null;
}
