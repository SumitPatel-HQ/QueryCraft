# QueryCraft - Intelligent Natural Language to SQL Platform

QueryCraft is an intelligent platform that converts natural language questions into SQL queries, making database interactions accessible to non-technical users.

## 🚀 Features

- **Natural Language Processing**: Convert plain English questions to SQL queries
- **Schema Intelligence**: Automatic database schema introspection and understanding
- **Real-time Results**: Execute generated SQL queries and display results instantly
- **Interactive UI**: Modern React-based interface with sample queries and schema viewer
- **RESTful API**: FastAPI backend with comprehensive documentation
- **Docker Support**: Easy deployment with Docker containers

## Project Structure

```
/querycraft
├── /frontend         # React TypeScript App ✅
├── /backend_api      # FastAPI App ✅
├── /core_ai_services # Python AI Services ✅
├── docker-compose.yml
└── README.md
```

## Technology Stack

- **Frontend**: React with TypeScript
- **Backend API**: Python with FastAPI
- **Core AI Services**: Python with SQLite
- **Database**: SQLite (for demo), PostgreSQL support available
- **Containerization**: Docker & Docker Compose

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

## 🎓 Educational Value

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