"use client";

import { useCallback } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Bookmark {
  id: number;
  session_id: number | null;
  message_id: number | null;
  note: string | null;
  bookmarked_at: string;
}

async function apiFetch<T>(
  endpoint: string,
  token: string | null,
  options?: RequestInit
): Promise<T> {
  if (!token) {
    throw new Error("Missing authentication token");
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  return response.json();
}

export function useChat() {
  const { getToken } = useAuthContext();

  const withToken = useCallback(async () => {
    return getToken();
  }, [getToken]);

  const listSessions = useCallback(async (): Promise<ChatSession[]> => {
    const token = await withToken();
    return apiFetch<ChatSession[]>("/api/v1/chat/sessions", token);
  }, [withToken]);

  const createSession = useCallback(async (title?: string): Promise<ChatSession> => {
    const token = await withToken();
    return apiFetch<ChatSession>("/api/v1/chat/sessions", token, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }, [withToken]);

  const getSession = useCallback(async (sessionId: number) => {
    const token = await withToken();
    return apiFetch<{ id: number; title: string; messages: ChatMessage[] }>(
      `/api/v1/chat/sessions/${sessionId}`,
      token
    );
  }, [withToken]);

  const deleteSession = useCallback(async (sessionId: number) => {
    const token = await withToken();
    return apiFetch<{ success: boolean }>(`/api/v1/chat/sessions/${sessionId}`, token, {
      method: "DELETE",
    });
  }, [withToken]);

  const addMessage = useCallback(
    async (sessionId: number, role: "user" | "assistant", content: string): Promise<ChatMessage> => {
      const token = await withToken();
      return apiFetch<ChatMessage>(`/api/v1/chat/sessions/${sessionId}/messages`, token, {
        method: "POST",
        body: JSON.stringify({ role, content }),
      });
    },
    [withToken]
  );

  const search = useCallback(async (q: string) => {
    const token = await withToken();
    return apiFetch<Array<{ message_id: number; session_id: number; session_title: string; snippet: string }>>(
      `/api/v1/chat/search?q=${encodeURIComponent(q)}`,
      token
    );
  }, [withToken]);

  const listBookmarks = useCallback(async () => {
    const token = await withToken();
    return apiFetch<Record<string, Bookmark[]>>("/api/v1/bookmarks", token);
  }, [withToken]);

  const createBookmark = useCallback(
    async (sessionId?: number, messageId?: number, note?: string) => {
      const token = await withToken();
      return apiFetch<Bookmark>("/api/v1/bookmarks", token, {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, message_id: messageId, note }),
      });
    },
    [withToken]
  );

  const deleteBookmark = useCallback(async (bookmarkId: number) => {
    const token = await withToken();
    return apiFetch<{ success: boolean }>(`/api/v1/bookmarks/${bookmarkId}`, token, {
      method: "DELETE",
    });
  }, [withToken]);

  return {
    listSessions,
    createSession,
    getSession,
    deleteSession,
    addMessage,
    search,
    listBookmarks,
    createBookmark,
    deleteBookmark,
  };
}
