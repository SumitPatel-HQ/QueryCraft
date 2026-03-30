import ChatPage from "@/modules/dashboard/ChatPage";
import { getDatabases } from "@/lib/api";

export default async function MainChatPage() {
  let databases;
  let error;

  try {
    databases = await getDatabases();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load databases";
    console.error("Error fetching databases:", e);
    databases = [];
  }

  return <ChatPage databases={databases} error={error} />;
}
