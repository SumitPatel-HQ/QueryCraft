import sqlite3
import json
import os

class SQLiteIntrospector:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = None

    def connect(self):
        self.conn = sqlite3.connect(self.db_path)

    def close(self):
        if self.conn:
            self.conn.close()

    def get_schema_details(self):
        try:
            self.connect()
            cur = self.conn.cursor()
            
            # Get all table names
            cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cur.fetchall()]
            
            schema = {}
            for table in tables:
                # Get column information for each table
                cur.execute(f"PRAGMA table_info({table});")
                columns = [
                    {"name": col[1], "type": col[2], "nullable": not col[3], "primary_key": bool(col[5])}
                    for col in cur.fetchall()
                ]
                schema[table] = columns
            
            cur.close()
            return schema
        finally:
            self.close()

    def execute_query(self, query):
        """Execute a SQL query and return results"""
        try:
            self.connect()
            cur = self.conn.cursor()
            cur.execute(query)
            
            # Get column names
            columns = [description[0] for description in cur.description] if cur.description else []
            
            # Get results
            results = cur.fetchall()
            
            # Convert to list of dictionaries
            formatted_results = [
                dict(zip(columns, row)) for row in results
            ]
            
            cur.close()
            return {"columns": columns, "data": formatted_results, "row_count": len(results)}
        except Exception as e:
            return {"error": str(e)}
        finally:
            self.close()

def create_sample_database():
    """Create a sample database with demo data"""
    db_path = "sample_ecommerce.db"
    
    # Remove existing database
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # Create tables
    cur.execute("""
    CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL,
        email TEXT UNIQUE,
        city TEXT,
        country TEXT,
        registration_date DATE
    )
    """)
    
    cur.execute("""
    CREATE TABLE products (
        product_id INTEGER PRIMARY KEY,
        product_name TEXT NOT NULL,
        category TEXT,
        price DECIMAL(10,2),
        stock_quantity INTEGER
    )
    """)
    
    cur.execute("""
    CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY,
        customer_id INTEGER,
        order_date DATE,
        total_amount DECIMAL(10,2),
        status TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
    )
    """)
    
    cur.execute("""
    CREATE TABLE order_items (
        item_id INTEGER PRIMARY KEY,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        unit_price DECIMAL(10,2),
        FOREIGN KEY (order_id) REFERENCES orders (order_id),
        FOREIGN KEY (product_id) REFERENCES products (product_id)  
    )
    """)
    
    # Insert sample data
    customers_data = [
        (1, 'John Smith', 'john.smith@email.com', 'New York', 'USA', '2023-01-15'),
        (2, 'Sarah Johnson', 'sarah.j@email.com', 'London', 'UK', '2023-02-20'),
        (3, 'Mike Chen', 'mike.chen@email.com', 'Toronto', 'Canada', '2023-03-10'),
        (4, 'Emily Davis', 'emily.d@email.com', 'Sydney', 'Australia', '2023-04-05'),
        (5, 'David Wilson', 'david.w@email.com', 'Berlin', 'Germany', '2023-05-12')
    ]
    
    products_data = [
        (1, 'Laptop Pro', 'Electronics', 1299.99, 50),
        (2, 'Wireless Headphones', 'Electronics', 199.99, 100),
        (3, 'Office Chair', 'Furniture', 299.99, 25),
        (4, 'Smartphone', 'Electronics', 799.99, 75),
        (5, 'Desk Lamp', 'Furniture', 89.99, 40)
    ]
    
    orders_data = [
        (1, 1, '2023-06-01', 1499.98, 'Completed'),
        (2, 2, '2023-06-02', 199.99, 'Completed'),
        (3, 3, '2023-06-03', 1099.98, 'Pending'),
        (4, 1, '2023-06-04', 89.99, 'Completed'),
        (5, 4, '2023-06-05', 799.99, 'Shipped')
    ]
    
    order_items_data = [
        (1, 1, 1, 1, 1299.99),
        (2, 1, 2, 1, 199.99),
        (3, 2, 2, 1, 199.99),
        (4, 3, 1, 1, 1299.99),
        (5, 4, 5, 1, 89.99),
        (6, 5, 4, 1, 799.99)
    ]
    
    cur.executemany("INSERT INTO customers VALUES (?, ?, ?, ?, ?, ?)", customers_data)
    cur.executemany("INSERT INTO products VALUES (?, ?, ?, ?, ?)", products_data)
    cur.executemany("INSERT INTO orders VALUES (?, ?, ?, ?, ?)", orders_data)
    cur.executemany("INSERT INTO order_items VALUES (?, ?, ?, ?, ?)", order_items_data)
    
    conn.commit()
    conn.close()
    
    return db_path

if __name__ == "__main__":
    # Create sample database
    db_path = create_sample_database()
    print(f"Sample database created: {db_path}")
    
    # Test introspection
    introspector = SQLiteIntrospector(db_path)
    schema = introspector.get_schema_details()
    print("Schema:", json.dumps(schema, indent=2))