/**
 * useApi Hook
 * Convenient React hook wrapping client-side API calls
 * Automatically includes Firebase auth token
 */

"use client";

import { useAuthContext } from "@/components/providers/auth-provider";
import { useCallback, useMemo } from "react";
import * as apiClient from "@/lib/api-client";
import type {
  DatabaseResponse,
  DatabaseUploadResponse,
  DeleteDatabaseResponse,
  SchemaDataResponse,
  DatabaseTablesResponse,
  QueryResponse,
  CacheStatsResponse,
  CacheClearResponse,
} from "@/types/api";

export function useApi() {
  const { getToken, loading, user } = useAuthContext();

  // Helper to get token for each request
  const getAuthToken = useCallback(async () => {
    if (loading) {
      throw new Error("Authentication is still loading");
    }

    if (!user) {
      throw new Error("Missing authentication token");
    }

    try {
      const token = await getToken(true);

      if (!token) {
        throw new Error("Invalid authentication token");
      }

      return token;
    } catch (error) {
      console.warn("Failed to get auth token:", error);
      throw error;
    }
  }, [getToken, loading, user]);

  // ============================================================================
  // Database Operations
  // ============================================================================

  const getDatabases = useCallback(async (): Promise<DatabaseResponse[]> => {
    const token = await getAuthToken();
    return apiClient.getDatabases(token);
  }, [getAuthToken]);

  const getDatabase = useCallback(
    async (databaseId: number): Promise<DatabaseResponse> => {
      const token = await getAuthToken();
      return apiClient.getDatabase(databaseId, token);
    },
    [getAuthToken]
  );

  const uploadDatabase = useCallback(
    async (
      file: File,
      displayName: string,
      description?: string
    ): Promise<DatabaseUploadResponse> => {
      const token = await getAuthToken();
      return apiClient.uploadDatabase(file, displayName, description, token);
    },
    [getAuthToken]
  );

  const deleteDatabase = useCallback(
    async (databaseId: number): Promise<DeleteDatabaseResponse> => {
      const token = await getAuthToken();
      return apiClient.deleteDatabase(databaseId, token);
    },
    [getAuthToken]
  );

  const getDatabaseSchema = useCallback(
    async (databaseId: number): Promise<SchemaDataResponse> => {
      const token = await getAuthToken();
      return apiClient.getDatabaseSchema(databaseId, token);
    },
    [getAuthToken]
  );

  const getDatabaseTables = useCallback(
    async (databaseId: number): Promise<DatabaseTablesResponse> => {
      const token = await getAuthToken();
      return apiClient.getDatabaseTables(databaseId, token);
    },
    [getAuthToken]
  );

  // ============================================================================
  // Query Operations
  // ============================================================================

  const queryDatabase = useCallback(
    async (databaseId: number, question: string): Promise<QueryResponse> => {
      const token = await getAuthToken();
      return apiClient.queryDatabase(databaseId, question, token);
    },
    [getAuthToken]
  );

  // ============================================================================
  // Cache Operations
  // ============================================================================

  const getCacheStats = useCallback(async (): Promise<CacheStatsResponse> => {
    const token = await getAuthToken();
    return apiClient.getCacheStats(token);
  }, [getAuthToken]);

  const clearCache = useCallback(async (): Promise<CacheClearResponse> => {
    const token = await getAuthToken();
    return apiClient.clearCache(token);
  }, [getAuthToken]);

  return useMemo(() => ({
    // Database operations
    getDatabases,
    getDatabase,
    uploadDatabase,
    deleteDatabase,
    getDatabaseSchema,
    getDatabaseTables,
    // Query operations
    queryDatabase,
    // Cache operations
    getCacheStats,
    clearCache,
  }), [
    getDatabases,
    getDatabase,
    uploadDatabase,
    deleteDatabase,
    getDatabaseSchema,
    getDatabaseTables,
    queryDatabase,
    getCacheStats,
    clearCache,
  ]);
}
