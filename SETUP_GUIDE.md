# 🚀 QueryCraft 2.0 - Setup Guide

## 📋 Quick Setup Instructions

### **Prerequisites**
- Python 3.11+ 
- Node.js 18+ & npm
- Docker Desktop (optional - for PostgreSQL)
- Git

---

## 🔧 **Installation Methods**

### **Method 1: Docker (Recommended)**

1. **Clone the repository**
```bash
git clone https://github.com/SumitPatel-HQ/QueryCraft.git
cd QueryCraft
```

2. **Setup environment variables**
```bash
# Create .env file in backend_api folder
 - Use env.example file as a reference
```

3. **Start with Docker Compose**
```bash
docker-compose up --build
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

### **Method 2: Manual Setup (Development)**

#### **1. Backend Setup**

```bash
# Navigate to backend directory
cd backend_api

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Setup environment variables
- Use env.example file as a reference
```

#### **2. Database Setup**

**Option A: Docker PostgreSQL (Recommended)**
```bash
# Start only PostgreSQL with Docker
docker-compose up postgres -d

# Wait for PostgreSQL to be ready, then run:
python main.py
```

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL locally, then:
createdb querycraft_main
psql -d querycraft_main -f init.sql

# Update .env with your local PostgreSQL URL
echo "DATABASE_URL=postgresql://your_user:your_password@localhost:5432/querycraft_main" > .env
```

#### **3. Frontend Setup**

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
pnpm install

# Start development server
pnpm dev
```

#### **4. Start Backend Server**

```bash
cd backend_api
python main.py
```

---

## 🔑 **Environment Configuration**

### **Required Environment Variables**

Create `backend_api/.env` file:
```env
# Gemini AI API Key (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration
DATABASE_URL=postgresql://querycraft_user:querycraft_pass@localhost:5432/querycraft_main

# Optional Configuration
LLM_TIMEOUT=10
GEMINI_MODEL=gemini-2.5-flash
```


---

## 🚀 **Running the Application**

### **Docker Method (Easiest):**
```bash
# Start everything
docker-compose up

# Access:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### **Manual Method:**
```bash
# Terminal 1: Start PostgreSQL
docker-compose up postgres

# Terminal 2: Start Backend
cd backend_api
python main.py

# Terminal 3: Start Frontend  
cd frontend
npm start
```

---

## 🗄️ **Database Information**

### **PostgreSQL (Metadata Storage)**
- **Host**: localhost:5432
- **Database**: querycraft_main  
- **User**: querycraft_user
- **Password**: querycraft_pass
- **Purpose**: Stores uploaded database metadata, query history

### **SQLite (User Data)**
- **Location**: `backend_api/uploads/`
- **Purpose**: User-uploaded databases (SQLite files)
- **Support**: CSV import converts to SQLite automatically

---

## 🧪 **Testing the Setup**

### **1. Check Backend Health**
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

### **2. Test API Endpoints**
```bash
# Get databases
curl http://localhost:8000/api/v1/databases

# Upload test database (optional)
# Use the frontend upload feature at http://localhost:3000
```

### **3. Test Frontend**
- Visit http://localhost:3000
- Navigate through Dashboard, Upload, Query interface
- Try uploading a CSV or SQLite file
- Test natural language queries

---

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **"ModuleNotFoundError: No module named 'xyz'"**
```bash
# Activate virtual environment first
cd backend_api
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
```

#### **"Connection refused" (Database)**
```bash
# Ensure PostgreSQL is running
docker-compose up postgres -d

# Check if container is running
docker ps
```

#### **"Invalid API key" (Gemini)**
```bash
# Verify API key in .env file
cat backend_api/.env

# Get new API key from:
# https://makersuite.google.com/app/apikey
```

#### **Frontend won't start**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

#### **CORS errors**
```bash
# Ensure backend is running on http://localhost:8000
# Frontend should automatically proxy to backend
```

---

## 📁 **Project Structure**
```
QueryCraft2.0/
├── backend_api/           # FastAPI backend
│   ├── database/         # Database management
│   ├── routers/          # API endpoints  
│   ├── services/         # Business logic
│   ├── uploads/          # User databases
│   └── main.py           # Application entry
├── core_ai_services/     # AI/ML modules
│   ├── llm/             # LLM SQL generation
│   ├── nl_to_sql/       # Natural language processing
│   └── schema_introspection/ # Database analysis
├── frontend/             # React frontend
└── docker-compose.yml    # Docker configuration
```

---

## ✅ **Verification Checklist**

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed  
- [ ] Docker Desktop running
- [ ] Gemini API key obtained
- [ ] `.env` file created with API key
- [ ] PostgreSQL container running
- [ ] Backend server running (port 8000)
- [ ] Frontend server running (port 3000)
- [ ] Can access http://localhost:3000
- [ ] Can upload database and run queries

---

## 🎯 **Success Indicators**

When everything is working correctly:
- ✅ Frontend loads at http://localhost:3000
- ✅ Dashboard shows database list
- ✅ Can upload CSV/SQLite files
- ✅ Natural language queries generate SQL (94-99% accuracy)
- ✅ Query results display with charts
- ✅ ERD viewer shows table relationships

---

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure API key is correct and valid
4. Check Docker containers are running: `docker ps`
5. Review backend logs for error details

**QueryCraft 2.0 is now ready to use! 🚀**