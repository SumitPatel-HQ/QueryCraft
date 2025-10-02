"""
Complex E-commerce Database Creation Script
Creates a realistic database with 12+ tables and complex relationships
Designed to showcase advanced SQL query capabilities
"""

import sqlite3
import random
from datetime import datetime, timedelta

def create_complex_database(db_path="sample_ecommerce.db"):
    """Create a comprehensive e-commerce database with realistic data"""
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Drop existing tables
    tables = [
        'order_items', 'orders', 'reviews', 'inventory_logs', 'inventory',
        'product_categories', 'products', 'categories', 'shipping_addresses',
        'payments', 'suppliers', 'customers', 'customer_segments', 'wishlists',
        'cart_items', 'product_views'
    ]
    
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table}")
    
    # 1. CUSTOMER SEGMENTS (for customer classification)
    cursor.execute("""
    CREATE TABLE customer_segments (
        segment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        segment_name VARCHAR(50) NOT NULL,
        description TEXT,
        min_lifetime_value DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 2. CUSTOMERS (enhanced with more fields)
    cursor.execute("""
    CREATE TABLE customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        country VARCHAR(50),
        state VARCHAR(50),
        city VARCHAR(50),
        zip_code VARCHAR(10),
        segment_id INTEGER,
        registration_date DATE,
        last_login_date TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        lifetime_value DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (segment_id) REFERENCES customer_segments(segment_id)
    )
    """)
    
    # 3. CATEGORIES (product categorization)
    cursor.execute("""
    CREATE TABLE categories (
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_name VARCHAR(100) NOT NULL,
        parent_category_id INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_category_id) REFERENCES categories(category_id)
    )
    """)
    
    # 4. SUPPLIERS
    cursor.execute("""
    CREATE TABLE suppliers (
        supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_name VARCHAR(100) NOT NULL,
        contact_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        country VARCHAR(50),
        rating DECIMAL(3,2),
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 5. PRODUCTS (enhanced)
    cursor.execute("""
    CREATE TABLE products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name VARCHAR(200) NOT NULL,
        description TEXT,
        category_id INTEGER,
        supplier_id INTEGER,
        price DECIMAL(10,2) NOT NULL,
        cost_price DECIMAL(10,2),
        sku VARCHAR(50) UNIQUE,
        weight_kg DECIMAL(8,2),
        is_featured BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(category_id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id)
    )
    """)
    
    # 6. PRODUCT_CATEGORIES (many-to-many relationship)
    cursor.execute("""
    CREATE TABLE product_categories (
        product_id INTEGER,
        category_id INTEGER,
        PRIMARY KEY (product_id, category_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
    )
    """)
    
    # 7. INVENTORY
    cursor.execute("""
    CREATE TABLE inventory (
        inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER UNIQUE,
        quantity_available INTEGER NOT NULL DEFAULT 0,
        quantity_reserved INTEGER DEFAULT 0,
        reorder_level INTEGER DEFAULT 10,
        reorder_quantity INTEGER DEFAULT 50,
        warehouse_location VARCHAR(50),
        last_restock_date DATE,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
    """)
    
    # 8. INVENTORY LOGS (track inventory changes)
    cursor.execute("""
    CREATE TABLE inventory_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        change_type VARCHAR(20),
        quantity_change INTEGER,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
    """)
    
    # 9. ORDERS (enhanced)
    cursor.execute("""
    CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending',
        total_amount DECIMAL(10,2),
        discount_amount DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        shipping_cost DECIMAL(10,2) DEFAULT 0,
        payment_method VARCHAR(50),
        shipping_method VARCHAR(50),
        notes TEXT,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )
    """)
    
    # 10. ORDER ITEMS
    cursor.execute("""
    CREATE TABLE order_items (
        item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        discount_percent DECIMAL(5,2) DEFAULT 0,
        subtotal DECIMAL(10,2),
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
    """)
    
    # 11. SHIPPING ADDRESSES
    cursor.execute("""
    CREATE TABLE shipping_addresses (
        address_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        customer_id INTEGER,
        address_line1 VARCHAR(200),
        address_line2 VARCHAR(200),
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        zip_code VARCHAR(20),
        is_default BOOLEAN DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )
    """)
    
    # 12. PAYMENTS
    cursor.execute("""
    CREATE TABLE payments (
        payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        amount DECIMAL(10,2),
        payment_method VARCHAR(50),
        transaction_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'completed',
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
    )
    """)
    
    # 13. REVIEWS
    cursor.execute("""
    CREATE TABLE reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        customer_id INTEGER,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        title VARCHAR(200),
        comment TEXT,
        is_verified_purchase BOOLEAN DEFAULT 0,
        helpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )
    """)
    
    # 14. WISHLISTS
    cursor.execute("""
    CREATE TABLE wishlists (
        wishlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        product_id INTEGER,
        added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        priority INTEGER DEFAULT 1,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
    """)
    
    # 15. CART ITEMS (active shopping carts)
    cursor.execute("""
    CREATE TABLE cart_items (
        cart_id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        product_id INTEGER,
        quantity INTEGER DEFAULT 1,
        added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )
    """)
    
    # 16. PRODUCT VIEWS (analytics)
    cursor.execute("""
    CREATE TABLE product_views (
        view_id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        customer_id INTEGER,
        view_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(100),
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
    )
    """)
    
    print("✓ Database schema created successfully")
    
    # ==================== INSERT SAMPLE DATA ====================
    
    # Insert Customer Segments
    segments = [
        ('VIP', 'High-value customers with lifetime value > $5000', 5000.00),
        ('Gold', 'Regular customers with lifetime value > $2000', 2000.00),
        ('Silver', 'Moderate customers with lifetime value > $500', 500.00),
        ('Bronze', 'New or low-frequency customers', 0.00)
    ]
    cursor.executemany("""
        INSERT INTO customer_segments (segment_name, description, min_lifetime_value)
        VALUES (?, ?, ?)
    """, segments)
    
    # Insert Categories
    categories_data = [
        ('Electronics', None, 'Electronic devices and accessories'),
        ('Computers', 1, 'Laptops, desktops, and accessories'),
        ('Mobile Phones', 1, 'Smartphones and tablets'),
        ('Audio', 1, 'Headphones, speakers, and audio equipment'),
        ('Home & Garden', None, 'Home improvement and garden supplies'),
        ('Furniture', 5, 'Indoor and outdoor furniture'),
        ('Tools', 5, 'Power tools and hand tools'),
        ('Clothing', None, 'Apparel and accessories'),
        ('Men\'s Clothing', 8, 'Men\'s apparel'),
        ('Women\'s Clothing', 8, 'Women\'s apparel'),
        ('Sports & Outdoors', None, 'Sports equipment and outdoor gear'),
        ('Fitness', 11, 'Fitness equipment and accessories'),
        ('Books', None, 'Books and magazines'),
        ('Kitchen & Dining', None, 'Kitchenware and dining essentials')
    ]
    cursor.executemany("""
        INSERT INTO categories (category_name, parent_category_id, description)
        VALUES (?, ?, ?)
    """, categories_data)
    
    # Insert Suppliers
    suppliers_data = [
        ('TechSupply Co.', 'John Smith', 'john@techsupply.com', '+1-555-0101', 'USA', 4.5, 1),
        ('Global Electronics', 'Sarah Johnson', 'sarah@globalelec.com', '+1-555-0102', 'China', 4.8, 1),
        ('Home Essentials Ltd.', 'Michael Brown', 'mike@homeessentials.com', '+1-555-0103', 'USA', 4.2, 1),
        ('Fashion Forward', 'Emma Davis', 'emma@fashionforward.com', '+1-555-0104', 'Italy', 4.7, 1),
        ('Sports Gear Pro', 'David Wilson', 'david@sportsgear.com', '+1-555-0105', 'Germany', 4.4, 1),
        ('Book Distributors Inc.', 'Lisa Anderson', 'lisa@bookdist.com', '+1-555-0106', 'UK', 4.6, 1)
    ]
    cursor.executemany("""
        INSERT INTO suppliers (supplier_name, contact_name, email, phone, country, rating, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, suppliers_data)
    
    # Insert Products (50+ products)
    products_data = [
        # Electronics
        ('MacBook Pro 16"', 'High-performance laptop with M2 chip', 2, 2, 2499.99, 1899.99, 'LAPTOP-001', 2.1, 1, 1),
        ('Dell XPS 15', 'Premium Windows laptop', 2, 1, 1799.99, 1299.99, 'LAPTOP-002', 1.8, 1, 1),
        ('iPhone 15 Pro', 'Latest Apple smartphone', 3, 2, 1199.99, 899.99, 'PHONE-001', 0.206, 1, 1),
        ('Samsung Galaxy S24', 'Android flagship phone', 3, 2, 999.99, 749.99, 'PHONE-002', 0.168, 1, 1),
        ('Sony WH-1000XM5', 'Noise-cancelling headphones', 4, 2, 399.99, 249.99, 'AUDIO-001', 0.25, 1, 1),
        ('Bose QuietComfort 45', 'Premium wireless headphones', 4, 2, 329.99, 219.99, 'AUDIO-002', 0.24, 0, 1),
        ('iPad Air', 'Versatile tablet', 3, 2, 599.99, 449.99, 'TABLET-001', 0.461, 1, 1),
        ('AirPods Pro', 'Wireless earbuds with ANC', 4, 2, 249.99, 149.99, 'AUDIO-003', 0.056, 1, 1),
        ('Samsung 4K Monitor 32"', '4K UHD display', 2, 2, 449.99, 299.99, 'MONITOR-001', 5.5, 0, 1),
        ('Logitech MX Master 3', 'Ergonomic wireless mouse', 2, 1, 99.99, 59.99, 'MOUSE-001', 0.141, 1, 1),
        
        # Home & Garden
        ('Dyson V15 Vacuum', 'Cordless vacuum cleaner', 6, 3, 649.99, 449.99, 'HOME-001', 2.9, 1, 1),
        ('Ergonomic Office Chair', 'Premium mesh office chair', 6, 3, 399.99, 249.99, 'FURN-001', 18.5, 1, 1),
        ('Standing Desk', 'Electric height-adjustable desk', 6, 3, 599.99, 399.99, 'FURN-002', 35.0, 1, 1),
        ('LED Desk Lamp', 'Adjustable brightness desk lamp', 6, 3, 49.99, 29.99, 'HOME-002', 0.8, 0, 1),
        ('Cordless Drill Set', 'Professional power drill kit', 7, 3, 179.99, 119.99, 'TOOL-001', 3.2, 1, 1),
        
        # Clothing
        ('Men\'s Leather Jacket', 'Genuine leather jacket', 9, 4, 299.99, 179.99, 'CLOTH-001', 1.2, 1, 1),
        ('Women\'s Winter Coat', 'Warm winter parka', 10, 4, 249.99, 149.99, 'CLOTH-002', 0.9, 1, 1),
        ('Running Shoes - Men', 'Lightweight running shoes', 9, 5, 129.99, 79.99, 'SHOE-001', 0.4, 1, 1),
        ('Yoga Pants - Women', 'High-waist yoga leggings', 10, 4, 49.99, 24.99, 'CLOTH-003', 0.2, 0, 1),
        ('Cotton T-Shirt Pack (5)', 'Basic cotton t-shirts', 9, 4, 39.99, 19.99, 'CLOTH-004', 0.6, 0, 1),
        
        # Sports & Outdoors
        ('Treadmill Pro 3000', 'Commercial-grade treadmill', 12, 5, 1299.99, 899.99, 'FIT-001', 95.0, 1, 1),
        ('Adjustable Dumbbells', '5-52.5 lbs per dumbbell', 12, 5, 399.99, 249.99, 'FIT-002', 24.0, 1, 1),
        ('Yoga Mat Premium', 'Extra-thick yoga mat', 12, 5, 59.99, 29.99, 'FIT-003', 1.2, 0, 1),
        ('Camping Tent 4-Person', 'Waterproof camping tent', 11, 5, 249.99, 149.99, 'OUTDOOR-001', 5.5, 1, 1),
        ('Mountain Bike', '21-speed mountain bike', 11, 5, 599.99, 399.99, 'BIKE-001', 14.0, 1, 1),
        
        # Books
        ('The Art of Programming', 'Complete programming guide', 13, 6, 49.99, 24.99, 'BOOK-001', 1.5, 0, 1),
        ('Business Strategy Handbook', 'MBA-level business book', 13, 6, 39.99, 19.99, 'BOOK-002', 1.2, 0, 1),
        ('Fiction Bestseller Collection', 'Top 10 fiction novels', 13, 6, 89.99, 49.99, 'BOOK-003', 3.5, 1, 1),
        
        # Kitchen & Dining
        ('KitchenAid Stand Mixer', 'Professional stand mixer', 14, 3, 449.99, 299.99, 'KITCHEN-001', 10.5, 1, 1),
        ('Ninja Blender Pro', 'High-power blender', 14, 3, 129.99, 79.99, 'KITCHEN-002', 2.8, 1, 1),
        ('Cookware Set 12-Piece', 'Stainless steel cookware', 14, 3, 299.99, 179.99, 'KITCHEN-003', 8.5, 0, 1),
        ('Espresso Machine', 'Professional espresso maker', 14, 3, 799.99, 549.99, 'KITCHEN-004', 12.0, 1, 1),
        ('Knife Set Professional', '15-piece knife set with block', 14, 3, 199.99, 119.99, 'KITCHEN-005', 3.2, 1, 1),
        
        # Additional Electronics
        ('Gaming Laptop', 'High-performance gaming laptop', 2, 1, 1899.99, 1399.99, 'LAPTOP-003', 2.5, 1, 1),
        ('Wireless Keyboard', 'Mechanical wireless keyboard', 2, 1, 149.99, 89.99, 'KB-001', 0.9, 0, 1),
        ('Webcam 4K', 'Ultra HD webcam', 2, 1, 129.99, 79.99, 'CAM-001', 0.3, 1, 1),
        ('External SSD 1TB', 'Portable solid state drive', 2, 2, 149.99, 99.99, 'STORAGE-001', 0.05, 1, 1),
        ('USB-C Hub', 'Multi-port USB-C adapter', 2, 1, 49.99, 29.99, 'ACC-001', 0.08, 0, 1),
        ('Smart Watch', 'Fitness tracking smartwatch', 3, 2, 399.99, 249.99, 'WATCH-001', 0.04, 1, 1),
        ('Bluetooth Speaker', 'Portable waterproof speaker', 4, 2, 89.99, 54.99, 'AUDIO-004', 0.5, 1, 1),
        ('Gaming Mouse RGB', 'High DPI gaming mouse', 2, 1, 79.99, 49.99, 'MOUSE-002', 0.12, 1, 1),
    ]
    cursor.executemany("""
        INSERT INTO products (product_name, description, category_id, supplier_id, price, cost_price, sku, weight_kg, is_featured, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, products_data)
    
    # Create product_categories relationships
    product_count = len(products_data)
    for i in range(1, product_count + 1):
        # Each product maps to its primary category (already set in products table)
        cursor.execute("SELECT category_id FROM products WHERE product_id = ?", (i,))
        cat_id = cursor.fetchone()[0]
        cursor.execute("INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)", (i, cat_id))
    
    # Insert Inventory for all products
    for product_id in range(1, product_count + 1):
        quantity = random.randint(10, 500)
        cursor.execute("""
            INSERT INTO inventory (product_id, quantity_available, quantity_reserved, reorder_level, reorder_quantity, warehouse_location, last_restock_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (product_id, quantity, random.randint(0, 20), random.randint(10, 30), random.randint(50, 100), f'WH-{random.choice(["A", "B", "C"])}{random.randint(1, 20)}', (datetime.now() - timedelta(days=random.randint(1, 90))).date()))
    
    # Insert Customers (100 customers)
    first_names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Emma', 
                   'James', 'Olivia', 'Daniel', 'Sophia', 'Matthew', 'Ava', 'Christopher', 'Isabella', 'Andrew', 'Mia',
                   'Joseph', 'Charlotte', 'Ryan', 'Amelia', 'Kevin', 'Harper', 'Brian', 'Evelyn', 'Thomas', 'Abigail']
    last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']
    countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Australia', 'Japan', 'India']
    states = ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia']
    cities = ['Los Angeles', 'Houston', 'New York City', 'Miami', 'Chicago', 'Philadelphia', 'Columbus', 'Atlanta']
    
    for i in range(100):
        first = random.choice(first_names)
        last = random.choice(last_names)
        email = f'{first.lower()}.{last.lower()}{i}@email.com'
        country = random.choice(countries)
        lifetime_val = round(random.uniform(0, 8000), 2)
        
        # Determine segment based on lifetime value
        if lifetime_val >= 5000:
            segment = 1
        elif lifetime_val >= 2000:
            segment = 2
        elif lifetime_val >= 500:
            segment = 3
        else:
            segment = 4
        
        cursor.execute("""
            INSERT INTO customers (first_name, last_name, email, phone, country, state, city, zip_code, segment_id, registration_date, last_login_date, is_active, lifetime_value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            first, last, email, f'+1-555-{random.randint(1000, 9999)}', country,
            random.choice(states), random.choice(cities), f'{random.randint(10000, 99999)}',
            segment, (datetime.now() - timedelta(days=random.randint(30, 730))).date(),
            datetime.now() - timedelta(days=random.randint(0, 30)),
            random.choice([1, 1, 1, 0]),  # 75% active
            lifetime_val
        ))
    
    # Insert Orders (300 orders)
    statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    payment_methods = ['Credit Card', 'PayPal', 'Debit Card', 'Bank Transfer', 'Apple Pay']
    shipping_methods = ['Standard', 'Express', 'Next Day', 'International']
    
    for i in range(300):
        customer_id = random.randint(1, 100)
        order_date = datetime.now() - timedelta(days=random.randint(0, 365))
        status = random.choice(statuses)
        
        cursor.execute("""
            INSERT INTO orders (customer_id, order_date, status, payment_method, shipping_method, total_amount, discount_amount, tax_amount, shipping_cost)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            customer_id, order_date, status,
            random.choice(payment_methods), random.choice(shipping_methods),
            0, 0, 0, round(random.uniform(0, 25), 2)  # Will update total_amount later
        ))
        
        order_id = cursor.lastrowid
        
        # Insert 1-5 order items per order
        num_items = random.randint(1, 5)
        order_total = 0
        
        for _ in range(num_items):
            product_id = random.randint(1, product_count)
            cursor.execute("SELECT price FROM products WHERE product_id = ?", (product_id,))
            unit_price = cursor.fetchone()[0]
            quantity = random.randint(1, 3)
            discount = round(random.uniform(0, 15), 2)
            subtotal = round(unit_price * quantity * (1 - discount/100), 2)
            order_total += subtotal
            
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount_percent, subtotal)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (order_id, product_id, quantity, unit_price, discount, subtotal))
        
        # Update order total
        tax = round(order_total * 0.08, 2)  # 8% tax
        cursor.execute("SELECT shipping_cost FROM orders WHERE order_id = ?", (order_id,))
        shipping = cursor.fetchone()[0]
        total = round(order_total + tax + shipping, 2)
        
        cursor.execute("""
            UPDATE orders SET total_amount = ?, tax_amount = ? WHERE order_id = ?
        """, (total, tax, order_id))
        
        # Insert payment for completed orders
        if status in ['delivered', 'shipped']:
            cursor.execute("""
                INSERT INTO payments (order_id, payment_date, amount, payment_method, transaction_id, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                order_id, order_date + timedelta(minutes=random.randint(1, 60)),
                total, random.choice(payment_methods),
                f'TXN-{random.randint(100000, 999999)}', 'completed'
            ))
        
        # Insert shipping address
        cursor.execute("SELECT state, city, zip_code FROM customers WHERE customer_id = ?", (customer_id,))
        cust_data = cursor.fetchone()
        cursor.execute("""
            INSERT INTO shipping_addresses (order_id, customer_id, address_line1, city, state, country, zip_code)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            order_id, customer_id,
            f'{random.randint(100, 9999)} {random.choice(["Main", "Oak", "Maple", "Cedar"])} St',
            cust_data[1], cust_data[0], 'USA', cust_data[2]
        ))
    
    # Insert Reviews (200 reviews)
    for _ in range(200):
        product_id = random.randint(1, product_count)
        customer_id = random.randint(1, 100)
        rating = random.choices([1, 2, 3, 4, 5], weights=[5, 5, 15, 35, 40])[0]  # Skew toward positive
        
        titles = {
            5: ['Excellent!', 'Perfect product!', 'Highly recommend', 'Amazing quality', 'Best purchase ever'],
            4: ['Very good', 'Great product', 'Worth the price', 'Satisfied', 'Good quality'],
            3: ['It\'s okay', 'Average product', 'Decent', 'Met expectations', 'Fair'],
            2: ['Disappointed', 'Not great', 'Could be better', 'Below average', 'Issues'],
            1: ['Poor quality', 'Waste of money', 'Very disappointed', 'Do not buy', 'Terrible']
        }
        
        cursor.execute("""
            INSERT INTO reviews (product_id, customer_id, rating, title, comment, is_verified_purchase, helpful_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            product_id, customer_id, rating,
            random.choice(titles[rating]),
            f'Sample review comment for rating {rating}.',
            random.choice([0, 1]), random.randint(0, 50),
            datetime.now() - timedelta(days=random.randint(0, 180))
        ))
    
    # Insert Wishlists
    for _ in range(150):
        cursor.execute("""
            INSERT INTO wishlists (customer_id, product_id, priority)
            VALUES (?, ?, ?)
        """, (random.randint(1, 100), random.randint(1, product_count), random.randint(1, 5)))
    
    # Insert Cart Items
    for _ in range(80):
        cursor.execute("""
            INSERT INTO cart_items (customer_id, product_id, quantity)
            VALUES (?, ?, ?)
        """, (random.randint(1, 100), random.randint(1, product_count), random.randint(1, 3)))
    
    # Insert Product Views (analytics)
    for _ in range(500):
        cursor.execute("""
            INSERT INTO product_views (product_id, customer_id, session_id, view_date)
            VALUES (?, ?, ?, ?)
        """, (
            random.randint(1, product_count),
            random.randint(1, 100),
            f'sess-{random.randint(10000, 99999)}',
            datetime.now() - timedelta(days=random.randint(0, 30))
        ))
    
    # Insert Inventory Logs
    log_types = ['restock', 'sale', 'return', 'damage', 'adjustment']
    for _ in range(200):
        cursor.execute("""
            INSERT INTO inventory_logs (product_id, change_type, quantity_change, reason)
            VALUES (?, ?, ?, ?)
        """, (
            random.randint(1, product_count),
            random.choice(log_types),
            random.randint(-50, 100),
            'Inventory adjustment'
        ))
    
    conn.commit()
    print(f"✓ Inserted sample data:")
    print(f"  - {len(segments)} customer segments")
    print(f"  - {len(categories_data)} categories")
    print(f"  - {len(suppliers_data)} suppliers")
    print(f"  - {len(products_data)} products")
    print(f"  - 100 customers")
    print(f"  - 300 orders with items")
    print(f"  - 200 reviews")
    print(f"  - 150 wishlist items")
    print(f"  - 500 product views")
    
    conn.close()
    print(f"\n✓ Database created successfully: {db_path}")
    return db_path

if __name__ == "__main__":
    create_complex_database()
