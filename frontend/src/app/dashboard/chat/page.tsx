"use client";

import { useEffect, useState } from "react";
import ChatPage from "@/modules/dashboard/ChatPage";
import { useApi } from "@/hooks/use-api";
import type { DatabaseResponse } from "@/types/api";

export default function MainChatPage() {
  const [databases, setDatabases] = useState<DatabaseResponse[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const api = useApi();


  useEffect(() => {
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
  }, [api]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return <ChatPage databases={databases} error={error} />;
}
