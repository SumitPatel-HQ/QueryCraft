-- QueryCraft PostgreSQL Initialization Script
-- Creates main database schema for managing user databases

-- Create databases table (metadata for user-uploaded databases)
CREATE TABLE IF NOT EXISTS databases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    db_type VARCHAR(50) NOT NULL, -- 'postgresql', 'sqlite', 'csv'
    connection_string TEXT, -- For PostgreSQL connections
    file_path TEXT, -- For SQLite/CSV files
    schema_data JSONB, -- Cached schema information
    table_count INTEGER DEFAULT 0,
    row_count BIGINT DEFAULT 0,
    size_mb DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_queried TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create sample_questions table (AI-generated questions per database)
-- (sample_questions table removed)

-- Create query_history table (track all queries)
CREATE TABLE IF NOT EXISTS query_history (
    id SERIAL PRIMARY KEY,
    database_id INTEGER REFERENCES databases(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    sql_query TEXT NOT NULL,
    execution_time_ms INTEGER,
    result_count INTEGER,
    confidence_score INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_databases_active ON databases(is_active);
CREATE INDEX IF NOT EXISTS idx_databases_created ON databases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_history_db ON query_history(database_id);
CREATE INDEX IF NOT EXISTS idx_query_history_created ON query_history(created_at DESC);
