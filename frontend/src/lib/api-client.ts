/**
 * Client-Side API Client
 * For use in Client Components (with "use client" directive)
 * Uses fetch with browser runtime and Firebase auth tokens
 */

import type {
  DatabaseResponse,
  DatabaseUploadResponse,
  DeleteDatabaseResponse,
  SchemaDataResponse,
  DatabaseTablesResponse,
  DatabaseHistoryResponse,
  QueryRequest,
  QueryResponse,
  CacheStatsResponse,
  CacheClearResponse,
} from "@/types/api";

/**
 * Base fetch wrapper for client-side requests
 * Token must be passed from the calling component (via useAuth)
 */
async function clientFetch<T>(
  endpoint: string,
  token: string | null,
  options?: RequestInit
): Promise<T> {
  if (!token) {
    throw new Error("Missing authentication token");
  }

  const headers: Record<string, string> = {};

  if (options?.headers) {
    const incoming = new Headers(options.headers);
    incoming.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// ============================================================================
// Database API (Client-Side)
// ============================================================================

export async function getDatabases(
  token: string | null
): Promise<DatabaseResponse[]> {
  return clientFetch<DatabaseResponse[]>("/api/v1/databases", token);
}

export async function getDatabase(
  databaseId: number,
  token: string | null
): Promise<DatabaseResponse> {
  return clientFetch<DatabaseResponse>(
    `/api/v1/databases/${databaseId}`,
    token
  );
}

export async function uploadDatabase(
  file: File,
  displayName: string,
  description: string | undefined,
  token: string | null
): Promise<DatabaseUploadResponse> {
  if (!token) {
    throw new Error("Missing authentication token");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("display_name", displayName);
  if (description) {
    formData.append("description", description);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch("/api/v1/databases/upload", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: response.statusText,
    }));
    throw new Error(error.detail || `Upload failed: ${response.status}`);
  }

  return response.json();
}

export async function deleteDatabase(
  databaseId: number,
  token: string | null
): Promise<DeleteDatabaseResponse> {
  return clientFetch<DeleteDatabaseResponse>(
    `/api/v1/databases/${databaseId}`,
    token,
    {
      method: "DELETE",
    }
  );
}

export async function getDatabaseSchema(
  databaseId: number,
  token: string | null
): Promise<SchemaDataResponse> {
  return clientFetch<SchemaDataResponse>(
    `/api/v1/databases/${databaseId}/schema`,
    token
  );
}

export async function getDatabaseTables(
  databaseId: number,
  token: string | null
): Promise<DatabaseTablesResponse> {
  return clientFetch<DatabaseTablesResponse>(
    `/api/v1/databases/${databaseId}/tables`,
    token
  );
}

export async function getDatabaseHistory(
  databaseId: number,
  token: string | null
): Promise<DatabaseHistoryResponse> {
  return clientFetch<DatabaseHistoryResponse>(
    `/api/v1/databases/${databaseId}/history`,
    token
  );
}

// ============================================================================
// Query API (Client-Side)
// ============================================================================

export async function queryDatabase(
  databaseId: number,
  question: string,
  token: string | null
): Promise<QueryResponse> {
  const requestBody: QueryRequest = { question };

  return clientFetch<QueryResponse>(
    `/api/v1/databases/${databaseId}/query`,
    token,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );
}

// ============================================================================
// Cache API (Client-Side)
// ============================================================================

export async function getCacheStats(
  token: string | null
): Promise<CacheStatsResponse> {
  return clientFetch<CacheStatsResponse>("/api/v1/cache/stats", token);
}

export async function clearCache(
  token: string | null
): Promise<CacheClearResponse> {
  return clientFetch<CacheClearResponse>("/api/v1/cache/clear", token, {
    method: "POST",
  });
}
