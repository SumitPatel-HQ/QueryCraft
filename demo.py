#!/usr/bin/env python3
"""
QueryCraft Demo Script
This script demonstrates all the key features of the QueryCraft MVP
"""

import requests
import json
import time

API_BASE = "http://localhost:8000"

def print_banner():
    print("=" * 80)
    print("🚀 QUERYCRAFT MVP DEMONSTRATION")
    print("   Natural Language to SQL Platform")
    print("=" * 80)
    print()

def test_health():
    print("🏥 Testing Health Check...")
    try:
        response = requests.get(f"{API_BASE}/health")
        print(f"✅ Health Status: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    print()

def test_schema():
    print("🔍 Testing Schema Introspection...")
    try:
        response = requests.get(f"{API_BASE}/api/v1/schema")
        schema = response.json()["schema"]
        print("✅ Database Schema Retrieved:")
        for table, columns in schema.items():
            print(f"   📊 {table}: {len(columns)} columns")
    except Exception as e:
        print(f"❌ Schema test failed: {e}")
    print()

def test_sample_queries():
    print("📝 Getting Sample Queries...")
    try:
        response = requests.get(f"{API_BASE}/api/v1/sample-queries")
        queries = response.json()["sample_queries"]
        print("✅ Available Sample Queries:")
        for i, query in enumerate(queries[:5], 1):
            print(f"   {i}. {query}")
    except Exception as e:
        print(f"❌ Sample queries test failed: {e}")
    print()

def test_query_processing():
    print("🧠 Testing AI Query Processing...")
    
    test_queries = [
        "How many customers do we have?",
        "What are the top 3 customers by spending?",
        "Show me all products",
        "What is the average order value?"
    ]
    
    for query in test_queries:
        print(f"\n🤔 Question: '{query}'")
        try:
            response = requests.post(
                f"{API_BASE}/api/v1/query",
                json={"question": query},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Generated SQL: {result['sql_query']}")
                print(f"📝 Explanation: {result['explanation']}")
                print(f"📊 Results: {len(result['results'])} rows returned")
                
                # Show first few results if available
                if result['results']:
                    print("   Sample data:")
                    for row in result['results'][:2]:
                        print(f"     {row}")
            else:
                print(f"❌ Query failed with status {response.status_code}")
                
        except Exception as e:
            print(f"❌ Query processing failed: {e}")
        
        time.sleep(1)  # Small delay between queries

def print_summary():
    print("\n" + "=" * 80)
    print("🎉 QUERYCRAFT MVP FEATURES DEMONSTRATED:")
    print("✅ Health check endpoint")
    print("✅ Database schema introspection")
    print("✅ Sample query suggestions")
    print("✅ Natural language to SQL conversion")
    print("✅ Real database query execution")
    print("✅ Structured result formatting")
    print("✅ Error handling and validation")
    print()
    print("🌐 Frontend available at: http://localhost:3000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print("=" * 80)

def main():
    print_banner()
    test_health()
    test_schema()
    test_sample_queries()
    test_query_processing()
    print_summary()

if __name__ == "__main__":
    main()