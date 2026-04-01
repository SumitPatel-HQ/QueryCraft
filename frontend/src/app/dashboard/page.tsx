"use client";

import { useEffect, useState } from "react";
import DashboardHome from "@/modules/dashboard/index";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import type { DatabaseResponse } from "@/types/api";

export default function DashboardPage() {
  const [databases, setDatabases] = useState<DatabaseResponse[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setError("Missing authentication token");
      setLoading(false);
      return;
    }

    async function fetchDatabases() {
      try {
        const data = await api.getDatabases();
        setDatabases(data);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load databases";
        setError(errorMessage);
        console.error("Error fetching databases:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchDatabases();
  }, [api, authLoading, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return <DashboardHome databases={databases} error={error} />;
}
