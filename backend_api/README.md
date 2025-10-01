# QueryCraft Backend API

This is the FastAPI backend for the QueryCraft Natural Language to SQL platform.

## 🚀 Complete MVP Implementation

QueryCraft is now a fully functional Natural Language to SQL platform with:
- ✅ **AI-Powered Query Processing** - Converts natural language to SQL
- ✅ **Database Introspection** - Automatic schema detection
- ✅ **Real Query Execution** - Returns actual database results
- ✅ **Sample E-commerce Database** - Ready-to-use demo data
- ✅ **React Frontend Integration** - Complete UI interface

## Setup

1. Install Python 3.8 or higher
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. The sample database is automatically created on first run

## Running the API

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

- Interactive API docs: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

## 🎯 API Endpoints

### Health Check
- **GET** `/health` - Returns server status

### Natural Language Processing
- **POST** `/api/v1/query` - Process natural language query with AI
  - Request: `{"question": "What are the top 10 customers by spending?"}`
  - Response: Returns SQL query, explanation, and actual results

### Database Schema
- **GET** `/api/v1/schema` - Get complete database schema
  - Response: Returns table structures with column types

### Sample Queries
- **GET** `/api/v1/sample-queries` - Get example questions to try
  - Response: List of sample natural language queries

## 📊 Sample Database

The system includes a sample e-commerce database with:
- **customers** - Customer information (5 records)
- **products** - Product catalog (5 records)  
- **orders** - Order history (5 records)
- **order_items** - Order line items (6 records)

## 🧠 AI Query Examples

Try these natural language queries:
- "What are the top 5 customers by spending?"
- "How many customers do we have?"
- "Show me all products"
- "What is the average order value?"
- "Which products are selling the most?"
- "What is the total revenue?"

## 🏗️ Architecture

- **FastAPI** - Modern Python web framework
- **SQLite** - Lightweight database for demo
- **AI Query Processor** - Pattern-matching NL-to-SQL conversion
- **Schema Introspection** - Dynamic database structure analysis
- **CORS Enabled** - Frontend integration ready