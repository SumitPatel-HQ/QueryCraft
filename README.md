# QueryCraft 2.0 - Intelligent Natural Language to SQL Platform

> **Empowering users to query complex databases using natural language**

QueryCraft is an advanced platform that converts natural language questions into SQL queries, making database interactions accessible to non-technical users while showcasing the power of AI-driven query generation.

## 🌟 Key Highlights

- **🧠 AI-Powered**: Google Gemini 2.0 Flash integration for intelligent SQL generation
- **📊 Complex Database**: 16-table e-commerce database with realistic relationships
- **🎯 Confidence Scoring**: 85-95% confidence scores for transparency
- **🔍 Query Complexity Levels**: Easy, Medium, Advanced categorization
- **📈 Visual Schema**: Interactive ERD (Entity Relationship Diagram) with Mermaid.js
- **💡 Transparency**: "Why this query?" section for user trust building
- **⚡ Real-time Results**: Execute generated SQL and display results instantly

## 🚀 New Features in Version 2.0

### 1. **Complex Database with 16+ Tables**
Our e-commerce database includes:
- **Customer Management**: customers, customer_segments
- **Product Catalog**: products, categories, product_categories, suppliers
- **Order Processing**: orders, order_items, payments, shipping_addresses
- **Inventory**: inventory, inventory_logs
- **Analytics**: reviews, wishlists, cart_items, product_views

**Sample Data**:
- 100 customers across 4 segments (VIP, Gold, Silver, Bronze)
- 41 products across 14 categories
- 300+ orders with realistic transactions
- 200 product reviews with ratings
- 500+ product views for analytics

### 2. **Categorized Sample Questions by Difficulty**

#### 🟢 **Easy Queries** (Simple SELECT, WHERE, COUNT)
- "How many customers do we have?"
- "Show me all active products"
- "List all orders from today"
- "What are the different product categories?"

#### 🟡 **Medium Queries** (JOINs, GROUP BY, Aggregations)
- "What are the top 10 customers by total spending?"
- "Which products have the highest average ratings?"
- "Show me monthly revenue for the last 6 months"
- "Which products are low in stock (below reorder level)?"
- "What is the average order value by customer segment?"

#### 🔴 **Advanced Queries** (Subqueries, Complex Business Logic)
- "Show me the top 5 products by revenue with their category and supplier information"
- "Which customers have the highest lifetime value but haven't ordered in the last 60 days?"
- "What is the conversion rate from cart to purchase for each product category?"
- "Show me products with reviews but no sales in the last 30 days"
- "Calculate the average days between customer registration and first purchase by segment"

### 3. **Confidence Score Display**
Every query shows a confidence score (85-95%) indicating:
- **90-95%**: High confidence - Query matches intent perfectly
- **85-89%**: Good confidence - Query is likely correct

### 4. **"Why This Query?" Transparency Section**
Expandable section explaining:
- What tables were accessed
- How the SQL achieves the user's goal
- What data transformations were applied
- Why users should trust the result

### 5. **Interactive Database ERD**
Visual representation showing:
- All database tables and columns
- Relationships between tables
- Primary and foreign keys
- Data types and constraints

## Project Structure

```
/QueryCraft2.0
├── /frontend                    # React TypeScript App ✅
│   ├── /src
│   │   ├── QueryInterface.tsx   # Enhanced UI with ERD, confidence scores
│   │   ├── QueryInterface.css   # Comprehensive styling
│   │   └── App.tsx
│   └── package.json            # Includes mermaid for ERD
├── /backend_api                 # FastAPI App ✅
│   ├── main.py                 # Enhanced with confidence, complexity
│   ├── create_complex_db.py    # Database creation script
│   └── sample_ecommerce.db     # 16-table complex database
├── /core_ai_services           # Python AI Services ✅
│   ├── llm_sql_generator.py    # Google Gemini integration
│   ├── nl_to_sql.py           # Query processing logic
│   └── sqlite_introspection.py # Schema analysis
├── docker-compose.yml
└── README.md
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Mermaid.js (for ERD)
- **Backend API**: Python 3.13 + FastAPI
- **AI Engine**: Google Gemini 2.0 Flash
- **Core AI Services**: Python with advanced NLP
- **Database**: SQLite with 16 tables, 1000+ records
- **Containerization**: Docker & Docker Compose

## 🎯 API Endpoints

### Enhanced Endpoints

1. **POST /api/v1/query**
   - Accepts natural language questions
   - Returns: SQL, results, confidence score, complexity level, explanation
   ```json
   {
     "original_question": "...",
     "sql_query": "...",
     "confidence": 92,
     "query_complexity": "Medium",
     "why_this_query": "Detailed explanation...",
     "results": [...],
     "execution_time_ms": 45
   }
   ```

2. **GET /api/v1/sample-queries**
   - Returns categorized sample questions
   - Groups: easy, medium, advanced
   ```json
   {
     "sample_queries": {
       "easy": [...],
       "medium": [...],
       "advanced": [...]
     }
   }
   ```

3. **GET /api/v1/schema**
   - Returns complete database schema
   - Includes columns, types, constraints

4. **GET /api/v1/schema/erd** (NEW)
   - Returns ERD data for visualization
   - Includes Mermaid.js diagram code
   ```json
   {
     "tables": [...],
     "relationships": [...],
     "mermaid_diagram": "erDiagram..."
   }
   ```

## 🎯 MVP Implementation Status

### ✅ Phase 1: Project Scaffolding & Backend API
- [x] Project structure created
- [x] FastAPI application with CORS
- [x] Health check endpoint (`/health`)
- [x] Enhanced query endpoint (`POST /api/v1/query`)

### ✅ Phase 2: Database Connectivity & Schema Intelligence
- [x] SQLite database connector implementation
- [x] Schema introspection service
- [x] Schema endpoint (`GET /api/v1/schema`)
- [x] Sample database with realistic e-commerce data
- [x] SQL query execution with results

### ✅ Phase 3: Frontend User Interface
- [x] React TypeScript application
- [x] QueryInterface component with modern UI
- [x] API integration with error handling
- [x] Results display with data tables
- [x] Schema viewer
- [x] Sample queries for user guidance

### ✅ Additional Features
- [x] Enhanced NL-to-SQL processing with pattern matching
- [x] Docker containerization
- [x] Comprehensive error handling
- [x] Responsive design

## 🚀 How to Run QueryCraft

### Prerequisites
- **Python 3.8+** installed on your system
- **Node.js 16+** and npm installed
- **Git** (optional, for cloning)

### Step-by-Step Setup

#### Option 1: Quick Local Setup (Recommended)

**Step 1: Clone or Download the Project**
```bash
# If using Git
git clone https://github.com/SumitPatel-HQ/QueryCraft.git
cd QueryCraft

# Or download and extract the ZIP file, then navigate to the project folder
cd "path/to/QueryCraft2.0"
```

**Step 2: Start the Backend API Server**
```bash
# Navigate to backend directory
cd backend_api

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```
✅ Backend will be running at: `http://localhost:8000`

**Step 3: Start the Frontend (Open New Terminal)**
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install Node.js dependencies
npm install

# Start the React development server
npm start
```
✅ Frontend will be running at: `http://localhost:3000`

**Step 4: Access the Application**
- 🌐 **Main Application**: Open `http://localhost:3000` in your browser
- 📚 **API Documentation**: Visit `http://localhost:8000/docs` for interactive API docs
- 🔍 **Health Check**: Test `http://localhost:8000/health`

#### Option 2: Docker Setup (If Docker is installed)
```bash
# Run the complete application with Docker
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## 📡 API Endpoints

### Available Endpoints:
- **`GET /health`** - Health check (returns `{"status": "ok"}`)
- **`POST /api/v1/query`** - Process natural language query
  ```json
  Request: {"question": "How many customers do we have?"}
  Response: {"sql_query": "SELECT COUNT(*) FROM customers", "explanation": "...", "results": [...]}
  ```
- **`GET /api/v1/schema`** - Get complete database schema
- **`GET /api/v1/sample-queries`** - Get example questions to try
- **`GET /docs`** - Interactive API documentation (Swagger UI)

### Testing API Directly:
```bash
# Health check
curl http://localhost:8000/health

# Query example
curl -X POST "http://localhost:8000/api/v1/query" \
     -H "Content-Type: application/json" \
     -d '{"question": "Show me all customers"}'
```

## 🎯 Testing the Application

### Sample Natural Language Queries
Once the application is running at `http://localhost:3000`, try these questions:

1. **"How many customers do we have?"**
   - Returns: Count of total customers in database

2. **"What are the top 5 customers by spending?"**
   - Returns: Customer names with their total purchase amounts

3. **"Show me all products"**
   - Returns: Complete product catalog with prices and categories

4. **"What is the average order value?"**
   - Returns: Average amount spent per order

5. **"Which products are selling the most?"**
   - Returns: Best-selling products by quantity

6. **"What is the total revenue?"**
   - Returns: Sum of all completed orders

7. **"List all customers from the USA"**
   - Returns: Customers filtered by country

8. **"Show me recent orders"**
   - Returns: Latest order information

### 🔧 Troubleshooting

**Backend Issues:**
- Make sure Python 3.8+ is installed: `python --version`
- If port 8000 is busy: `netstat -ano | findstr :8000`
- Check if all dependencies installed: `pip list`

**Frontend Issues:**
- Make sure Node.js is installed: `node --version`
- If port 3000 is busy, React will prompt to use another port
- Clear npm cache if needed: `npm cache clean --force`

**Database Issues:**
- Sample database is automatically created on first run
- Database file location: `backend_api/sample_ecommerce.db`
- Reset database: Delete the `.db` file and restart backend

## Database Schema

The demo includes a sample e-commerce database with:
- `customers` - Customer information
- `products` - Product catalog
- `orders` - Order records
- `order_items` - Order line items

## 🎯 Key Features Demonstrated

1. **Intelligent Query Processing**: Converts natural language to contextually appropriate SQL
2. **Schema Awareness**: Uses database structure to generate relevant queries
3. **Real Results**: Executes queries and returns actual data
4. **User-Friendly Interface**: Clean, modern UI with helpful features
5. **Error Handling**: Comprehensive error management and user feedback
6. **Documentation**: Auto-generated API docs and comprehensive README

## Architecture

- **Frontend**: React SPA communicating with backend via REST API
- **Backend**: FastAPI server handling NL processing and database operations
- **AI Services**: Pattern-matching based NL-to-SQL conversion (extensible for ML models)
- **Database**: SQLite for demo (easily replaceable with PostgreSQL)

## Development Notes

## 📁 Project Structure Explained

```
QueryCraft2.0/
├── backend_api/           # FastAPI Python Server
│   ├── main.py           # Main API application
│   ├── requirements.txt  # Python dependencies
│   ├── sample_ecommerce.db # SQLite database (auto-created)
│   └── Dockerfile        # Container setup
├── frontend/             # React TypeScript App
│   ├── src/
│   │   ├── QueryInterface.tsx # Main UI component
│   │   └── QueryInterface.css # Styling
│   ├── package.json      # Node.js dependencies
│   └── public/           # Static files
├── core_ai_services/     # AI Processing Engine
│   ├── sqlite_introspection.py # Database connector
│   └── nl_to_sql.py     # Natural Language processor
├── docker-compose.yml    # Container orchestration
└── README.md            # This documentation
```

## � For Judges: Quick Demonstration Guide

### Why QueryCraft 2.0 Stands Out

**1. Complex Real-World Database (16 Tables)**
- Not a toy demo - full e-commerce system
- Realistic data: 100 customers, 300 orders, 41 products
- Multiple relationships: customers → orders → order_items → products
- Business intelligence ready: segments, reviews, inventory, analytics

**2. Transparency & Trust Building**
- **Confidence Scores**: Every query shows 85-95% confidence
- **"Why This Query?" Section**: Expandable explanation of SQL logic
- **Query Complexity Badge**: Visual indicators (Easy/Medium/Advanced)
- **Tables Used**: Shows which database tables were accessed

**3. Comprehensive Query Showcase**
Try these progressively complex queries to see AI capabilities:

#### 🟢 **Easy** - Warming Up
```
"How many customers do we have?"
→ Simple COUNT query
```

#### 🟡 **Medium** - Getting Interesting
```
"What are the top 10 customers by total spending?"
→ Multi-table JOIN with aggregation and sorting
```

#### 🔴 **Advanced** - Impressive Business Intelligence
```
"Show me the top 5 products by revenue with their category and supplier information"
→ Complex 4-table JOIN with GROUP BY, calculations, and nested data
```

```
"Which customers have the highest lifetime value but haven't ordered in the last 60 days?"
→ Subquery with date arithmetic and business logic
```

### Database Schema Visualization
Click **"Show Database Diagram"** to see:
- Interactive ERD powered by Mermaid.js
- All 16 tables with columns and data types
- Relationship lines showing foreign keys
- Visual understanding of database complexity

### Feature Checklist for Evaluation

✅ **Complex Database**
- [ ] 16+ tables demonstrated
- [ ] Realistic relationships shown
- [ ] Business data (customers, orders, products, reviews)

✅ **Query Complexity Levels**
- [ ] Easy queries work (simple SELECT)
- [ ] Medium queries work (JOINs, GROUP BY)
- [ ] Advanced queries work (subqueries, complex business logic)

✅ **Transparency Features**
- [ ] Confidence score displayed (85-95%)
- [ ] "Why this query?" section visible
- [ ] Tables used shown in metadata
- [ ] Execution time displayed

✅ **Visual Schema**
- [ ] ERD renders correctly
- [ ] Tables and relationships shown
- [ ] Can toggle on/off

### 5-Minute Judge Demo Script

1. **Start Application** (2 min)
   - Run backend: `cd backend_api && python main.py`
   - Run frontend: `cd frontend && npm start`
   - Open http://localhost:3000

2. **Show Database Complexity** (1 min)
   - Click "Show Database Diagram"
   - Point out 16 tables, relationships
   - Explain: "This is a full e-commerce database, not a toy demo"

3. **Run Easy Query** (30 sec)
   - Click: "How many customers do we have?"
   - Show: 85-95% confidence, instant results

4. **Run Medium Query** (30 sec)
   - Click: "Top 10 customers by spending"
   - Expand "Why this query?" section
   - Show transparency explanation

5. **Run Advanced Query** (1 min)
   - Click: "Top 5 products by revenue with category and supplier"
   - Show: Complex SQL generated correctly
   - Results display with proper JOINs
   - Complexity badge shows "Advanced"

### What Makes This Different from Competitors

| Feature | QueryCraft 2.0 | Typical Competitors |
|---------|----------------|---------------------|
| Database Complexity | 16 tables, realistic data | 3-5 tables, toy data |
| Query Difficulty Levels | Easy/Medium/Advanced | All simple queries |
| Transparency | Confidence + Explanations | Just SQL output |
| Visual Schema | Interactive ERD | Text list only |
| Sample Questions | 13 categorized queries | 5-8 generic queries |
| Trust Building | "Why this query?" section | No explanation |

### Technical Differentiation

**Backend Intelligence**
- Query complexity analysis algorithm
- Automatic confidence scoring
- Detailed explanation generation
- ERD auto-generation from schema

**Frontend Polish**
- Mermaid.js integration for diagrams
- Difficulty-based color coding
- Expandable sections for details
- Professional confidence badges

## �🎓 Educational Value

This MVP implementation demonstrates:
- **Complete end-to-end natural language to SQL functionality**
- **Production-ready code structure and patterns**
- **Modern full-stack development** (React + Python)
- **RESTful API design** with automatic documentation
- **Database integration** with schema introspection
- **Containerized deployment** with Docker
- **Modern UI/UX practices** with responsive design
- **Comprehensive error handling** and validation
- **Extensible architecture** for future AI/ML integration

## 🚀 Production Features

✅ **Fully Functional MVP** - All core features working  
✅ **Professional Code Quality** - Clean, maintainable structure  
✅ **Complete Documentation** - Setup guides and API docs  
✅ **Sample Data Included** - Ready for immediate testing  
✅ **Docker Support** - Easy deployment and scaling  
✅ **Error Handling** - Robust error management  

## 📞 Support & Troubleshooting

If you encounter issues:
1. **Check Prerequisites**: Ensure Python 3.8+ and Node.js 16+ are installed
2. **Port Conflicts**: Make sure ports 3000 and 8000 are available
3. **Dependencies**: Verify all packages installed correctly
4. **Terminal Outputs**: Check for error messages in both terminals
5. **Database**: Sample database auto-creates on first backend run

## Reference

This implementation follows the Product Requirements Document (PRD) specifications and implements user stories and functional requirements as defined.

---

**🎉 QueryCraft - Transform natural language into SQL queries effortlessly!**