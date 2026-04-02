"use client";

import { useCallback, useEffect, useRef } from "react";
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
  const { getToken, loading, user } = useAuthContext();
  const loadingRef = useRef(loading);
  const userRef = useRef(user);

  useEffect(() => {
    loadingRef.current = loading;
    userRef.current = user;
  }, [loading, user]);

  const getAuthToken = useCallback(async () => {
    const maxWaitTime = 5000;
    const checkInterval = 50;
    let waited = 0;

    while (loadingRef.current && waited < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    if (loadingRef.current) {
      throw new Error("Authentication is still loading");
    }

    if (!userRef.current) {
      throw new Error("Missing authentication token");
    }

    const token = await getToken(true);
    if (!token) {
      throw new Error("Invalid authentication token");
    }
    return token;
  }, [getToken]);

  const listSessions = useCallback(async (): Promise<ChatSession[]> => {
    const token = await getAuthToken();
    return apiFetch<ChatSession[]>("/api/v1/chat/sessions", token);
  }, [getAuthToken]);

  const createSession = useCallback(async (title?: string): Promise<ChatSession> => {
    const token = await getAuthToken();
    return apiFetch<ChatSession>("/api/v1/chat/sessions", token, {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }, [getAuthToken]);

  const getSession = useCallback(async (sessionId: number) => {
    const token = await getAuthToken();
    return apiFetch<{ id: number; title: string; messages: ChatMessage[] }>(
      `/api/v1/chat/sessions/${sessionId}`,
      token
    );
  }, [getAuthToken]);

  const deleteSession = useCallback(async (sessionId: number) => {
    const token = await getAuthToken();
    return apiFetch<{ success: boolean }>(`/api/v1/chat/sessions/${sessionId}`, token, {
      method: "DELETE",
    });
  }, [getAuthToken]);

  const addMessage = useCallback(
    async (sessionId: number, role: "user" | "assistant", content: string): Promise<ChatMessage> => {
      const token = await getAuthToken();
      return apiFetch<ChatMessage>(`/api/v1/chat/sessions/${sessionId}/messages`, token, {
        method: "POST",
        body: JSON.stringify({ role, content }),
      });
    },
    [getAuthToken]
  );

  const search = useCallback(async (q: string) => {
    const token = await getAuthToken();
    return apiFetch<Array<{ message_id: number; session_id: number; session_title: string; snippet: string }>>(
      `/api/v1/chat/search?q=${encodeURIComponent(q)}`,
      token
    );
  }, [getAuthToken]);

  const listBookmarks = useCallback(async () => {
    const token = await getAuthToken();
    return apiFetch<Record<string, Bookmark[]>>("/api/v1/bookmarks", token);
  }, [getAuthToken]);

  const createBookmark = useCallback(
    async (sessionId?: number, messageId?: number, note?: string) => {
      const token = await getAuthToken();
      return apiFetch<Bookmark>("/api/v1/bookmarks", token, {
        method: "POST",
        body: JSON.stringify({ session_id: sessionId, message_id: messageId, note }),
      });
    },
    [getAuthToken]
  );

  const deleteBookmark = useCallback(async (bookmarkId: number) => {
    const token = await getAuthToken();
    return apiFetch<{ success: boolean }>(`/api/v1/bookmarks/${bookmarkId}`, token, {
      method: "DELETE",
    });
  }, [getAuthToken]);

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
