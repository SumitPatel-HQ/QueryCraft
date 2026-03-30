/**
 * TypeScript API type definitions matching backend Pydantic schemas
 * Corresponds to backend/api/schemas/
 */

// ============================================================================
// Database Types (database_schemas.py)
// ============================================================================

export interface DatabaseCreate {
  display_name: string;
  description?: string | null;
}

export interface DatabaseResponse {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  db_type: string;
  table_count: number;
  row_count: number;
  size_mb: number | null;
  created_at: string; // ISO 8601 datetime
  last_accessed: string; // ISO 8601 datetime
  is_active: boolean;
}

export interface SchemaResponse {
  schema_data: Record<string, unknown>;
}

// ============================================================================
// Query Types (query_schemas.py)
// ============================================================================

export interface QueryRequest {
  question: string;
}

export interface QueryResponse {
  original_question: string;
  sql_query: string;
  explanation: string;
  results: unknown[];
  columns?: string[] | null; // Column names for table rendering
  confidence?: number | null;
  generation_method?: string | null;
  tables_used?: string[] | null;
  execution_time_ms?: number | null;
  query_complexity?: string | null; // "Easy" | "Medium" | "Advanced"
  why_this_query?: string | null; // Detailed explanation
}

// ============================================================================
// Upload & Response Types
// ============================================================================

export interface DatabaseUploadResponse {
  success: boolean;
  database_id: number;
  message: string;
  stats: {
    table_count: number;
    row_count: number;
    size_mb: number;
  };
}

export interface DeleteDatabaseResponse {
  success: boolean;
  message: string;
}

export interface SchemaDataResponse {
  schema: Record<string, unknown>;
  source: "cached" | "fresh";
}

export interface TableInfo {
  table_name: string;
  column_count: number;
  columns: Array<{
    name: string;
    type: string;
    primary_key: boolean;
  }>;
}

export interface DatabaseTablesResponse {
  database_id: number;
  database_name: string;
  file_path: string | null;
  total_tables: number;
  tables: TableInfo[];
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheStatsResponse {
  cache_enabled: boolean;
  total_cached_queries?: number;
  valid_entries?: number;
  cache_ttl_minutes?: number;
  error?: string;
}

export interface CacheClearResponse {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================================================
// Error Response Type
// ============================================================================

export interface APIError {
  detail: string | Record<string, unknown>;
}
