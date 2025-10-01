# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create the database
WORKDIR /app
RUN python -c "import sys; sys.path.append('../core_ai_services'); from sqlite_introspection import create_sample_database; create_sample_database()"

EXPOSE 8000

CMD ["python", "main.py"]