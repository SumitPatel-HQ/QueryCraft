/**
 * useApi Hook
 * Convenient React hook wrapping client-side API calls
 * Automatically includes Firebase auth token
 */

"use client";

import { useCallback, useMemo, useRef } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import * as apiClient from "@/lib/api-client";
import type {
  DatabaseResponse,
  DatabaseUploadResponse,
  DeleteDatabaseResponse,
  SchemaDataResponse,
  DatabaseTablesResponse,
  DatabaseHistoryResponse,
  QueryResponse,
  CacheStatsResponse,
  CacheClearResponse,
  ERDResponse,
} from "@/types/api";

export function useApi() {
  const { getToken, loading, user } = useAuthContext();
  // Use refs to avoid stale closure issues in async functions
  const loadingRef = useRef(loading);
  const userRef = useRef(user);

  // Keep refs updated with latest values
  loadingRef.current = loading;
  userRef.current = user;

  // Helper to get token for each request
  const getAuthToken = useCallback(async () => {
    // Read current values from refs to avoid stale closure
    if (loadingRef.current) {
      throw new Error("Authentication is still loading");
    }

    if (!userRef.current) {
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

  const getDatabaseHistory = useCallback(
    async (databaseId: number): Promise<DatabaseHistoryResponse> => {
      const token = await getAuthToken();
      return apiClient.getDatabaseHistory(databaseId, token);
    },
    [getAuthToken]
  );

  const getDatabaseERD = useCallback(
    async (databaseId: number): Promise<ERDResponse> => {
      const token = await getAuthToken();
      return apiClient.getDatabaseERD(databaseId, token);
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
    getDatabaseHistory,
    // Query operations
    queryDatabase,
    getDatabaseERD,
    getCacheStats,
    clearCache,
  }), [
    getDatabases,
    getDatabase,
    uploadDatabase,
    deleteDatabase,
    getDatabaseSchema,
    getDatabaseTables,
    getDatabaseHistory,
    queryDatabase,
    getDatabaseERD,
    getCacheStats,
    clearCache,
  ]);
}
