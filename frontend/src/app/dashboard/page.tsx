import DashboardHome from "@/modules/dashboard/index";
import { getDatabases } from "@/lib/api";

export default async function DashboardPage() {
  let databases;
  let error;

  try {
    databases = await getDatabases();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load databases";
    console.error("Error fetching databases:", e);
    databases = [];
  }

  return <DashboardHome databases={databases} error={error} />;
}
