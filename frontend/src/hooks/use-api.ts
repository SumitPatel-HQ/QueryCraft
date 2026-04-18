/**
 * useApi Hook
 * Convenient React hook wrapping client-side API calls
 * Automatically includes Firebase auth token
 */

"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import * as apiClient from "@/lib/api-client";
import type {
  DatabaseResponse,
  DatabaseUploadResponse,
  DeleteDatabaseResponse,
  MySQLActionResponse,
  SchemaDataResponse,
  DatabaseTablesResponse,
  DatabaseHistoryResponse,
  MySQLConnectionCreate,
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

  // Keep refs updated via useEffect — avoids side effects during render
  useEffect(() => {
    loadingRef.current = loading;
    userRef.current = user;
  }, [loading, user]);

  // Helper to get token for each request
  const getAuthToken = useCallback(async () => {
    // Wait for auth to be ready (handles race condition on page reload)
    const maxWaitTime = 5000; // 5 seconds max wait
    const checkInterval = 50; // Check every 50ms
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

    try {
      // Use cached token (Firebase auto-refreshes before expiry); forceRefresh only when needed
      const token = await getToken(false);

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

  const createMySQLConnection = useCallback(
    async (payload: MySQLConnectionCreate): Promise<DatabaseResponse> => {
      const token = await getAuthToken();
      return apiClient.createMySQLConnection(payload, token);
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

  const getMySQLConnections = useCallback(async (): Promise<DatabaseResponse[]> => {
    const token = await getAuthToken();
    return apiClient.getMySQLConnections(token);
  }, [getAuthToken]);

  const deactivateMySQLConnection = useCallback(
    async (databaseId: number): Promise<MySQLActionResponse> => {
      const token = await getAuthToken();
      return apiClient.deactivateMySQLConnection(databaseId, token);
    },
    [getAuthToken]
  );

  const reactivateMySQLConnection = useCallback(
    async (databaseId: number): Promise<MySQLActionResponse> => {
      const token = await getAuthToken();
      return apiClient.reactivateMySQLConnection(databaseId, token);
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
    createMySQLConnection,
    deleteDatabase,
    getMySQLConnections,
    deactivateMySQLConnection,
    reactivateMySQLConnection,
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
    createMySQLConnection,
    deleteDatabase,
    getMySQLConnections,
    deactivateMySQLConnection,
    reactivateMySQLConnection,
    getDatabaseSchema,
    getDatabaseTables,
    getDatabaseHistory,
    queryDatabase,
    getDatabaseERD,
    getCacheStats,
    clearCache,
  ]);
}
