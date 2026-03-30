/**
 * Server-Side API Client
 * For use in Server Components and Server Actions
 * Uses fetch with Node.js runtime
 */

import { auth } from "@clerk/nextjs/server";
import type {
  DatabaseResponse,
  DatabaseUploadResponse,
  DeleteDatabaseResponse,
  SchemaDataResponse,
  DatabaseTablesResponse,
  QueryRequest,
  QueryResponse,
  CacheStatsResponse,
  CacheClearResponse,
} from "@/types/api";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

/**
 * Get authorization headers with Clerk JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      };
    }
  } catch (error) {
    console.warn("Failed to get auth token:", error);
  }

  return {};
}

/**
 * Base fetch wrapper with auth and error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
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
// Database API
// ============================================================================

export async function getDatabases(): Promise<DatabaseResponse[]> {
  return apiFetch<DatabaseResponse[]>("/api/v1/databases");
}

export async function getDatabase(databaseId: number): Promise<DatabaseResponse> {
  return apiFetch<DatabaseResponse>(`/api/v1/databases/${databaseId}`);
}

export async function uploadDatabase(
  file: File,
  displayName: string,
  description?: string
): Promise<DatabaseUploadResponse> {
  const authHeaders = await getAuthHeaders();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("display_name", displayName);
  if (description) {
    formData.append("description", description);
  }

  const response = await fetch(`${BACKEND_URL}/api/v1/databases/upload`, {
    method: "POST",
    headers: authHeaders,
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
  databaseId: number
): Promise<DeleteDatabaseResponse> {
  return apiFetch<DeleteDatabaseResponse>(`/api/v1/databases/${databaseId}`, {
    method: "DELETE",
  });
}

export async function getDatabaseSchema(
  databaseId: number
): Promise<SchemaDataResponse> {
  return apiFetch<SchemaDataResponse>(`/api/v1/databases/${databaseId}/schema`);
}

export async function getDatabaseTables(
  databaseId: number
): Promise<DatabaseTablesResponse> {
  return apiFetch<DatabaseTablesResponse>(
    `/api/v1/databases/${databaseId}/tables`
  );
}

// ============================================================================
// Query API
// ============================================================================

export async function queryDatabase(
  databaseId: number,
  question: string
): Promise<QueryResponse> {
  const requestBody: QueryRequest = { question };

  return apiFetch<QueryResponse>(
    `/api/v1/databases/${databaseId}/query`,
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
// Cache API
// ============================================================================

export async function getCacheStats(): Promise<CacheStatsResponse> {
  return apiFetch<CacheStatsResponse>("/api/v1/cache/stats");
}

export async function clearCache(): Promise<CacheClearResponse> {
  return apiFetch<CacheClearResponse>("/api/v1/cache/clear", {
    method: "POST",
  });
}
