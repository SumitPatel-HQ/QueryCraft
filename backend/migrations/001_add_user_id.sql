ALTER TABLE databases ADD COLUMN IF NOT EXISTS user_id VARCHAR(128);
CREATE INDEX IF NOT EXISTS idx_databases_user_id ON databases(user_id);

ALTER TABLE query_history ADD COLUMN IF NOT EXISTS user_id VARCHAR(128);
CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);

ALTER TABLE databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS databases_user_isolation ON databases;
CREATE POLICY databases_user_isolation ON databases
USING (user_id = current_setting('app.current_user_id', true));

DROP POLICY IF EXISTS query_history_user_isolation ON query_history;
CREATE POLICY query_history_user_isolation ON query_history
USING (user_id = current_setting('app.current_user_id', true));
