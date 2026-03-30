/**
 * useApi Hook
 * Convenient React hook wrapping client-side API calls
 * Automatically includes Clerk auth token
 */

"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";
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
  const { getToken } = useAuth();

  // Helper to get token for each request
  const getAuthToken = useCallback(async () => {
    try {
      return await getToken();
    } catch (error) {
      console.warn("Failed to get auth token:", error);
      return null;
    }
  }, [getToken]);

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

  return {
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
  };
}
