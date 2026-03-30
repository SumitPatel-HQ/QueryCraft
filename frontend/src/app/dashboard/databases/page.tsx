import DatabasesView from "@/modules/dashboard/Databases";
import { getDatabases } from "@/lib/api";
import type { DatabaseResponse } from "@/types/api";

export default async function DatabasesPage() {
  let databases: DatabaseResponse[] = [];
  let error: string | undefined;

  try {
    databases = await getDatabases();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load databases";
    console.error("Error fetching databases:", e);
    databases = [];
  }

  return <DatabasesView databases={databases} error={error} />;
}
