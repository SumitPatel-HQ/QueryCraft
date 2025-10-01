import psycopg2
import json

class SchemaIntrospector:
    def __init__(self, host, user, password, dbname):
        self.host = host
        self.user = user
        self.password = password
        self.dbname = dbname
        self.conn = None

    def connect(self):
        self.conn = psycopg2.connect(
            host=self.host,
            user=self.user,
            password=self.password,
            dbname=self.dbname
        )

    def close(self):
        if self.conn:
            self.conn.close()

    def get_schema_details(self):
        try:
            self.connect()
            cur = self.conn.cursor()
            # Get all table names
            cur.execute("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
            """)
            tables = [row[0] for row in cur.fetchall()]
            schema = {}
            for table in tables:
                cur.execute(f"""
                    SELECT column_name, data_type FROM information_schema.columns
                    WHERE table_name = %s;
                """, (table,))
                columns = [
                    {"name": col[0], "type": col[1]}
                    for col in cur.fetchall()
                ]
                schema[table] = columns
            cur.close()
            return schema
        finally:
            self.close()
