"""Query caching service for faster responses"""

import hashlib
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

class QueryCache:
    """In-memory cache for query results"""
    
    def __init__(self, ttl_minutes: int = 60):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = timedelta(minutes=ttl_minutes)
    
    def _generate_key(self, question: str, schema_hash: str) -> str:
        """Generate cache key from question and schema"""
        combined = f"{question.lower().strip()}:{schema_hash}"
        return hashlib.md5(combined.encode()).hexdigest()
    
    def get(self, question: str, schema_hash: str) -> Optional[Dict[str, Any]]:
        """Get cached query result if available and not expired"""
        key = self._generate_key(question, schema_hash)
        
        if key in self.cache:
            cached = self.cache[key]
            if datetime.now() - cached["timestamp"] < self.ttl:
                return cached["result"]
            else:
                # Expired, remove it
                del self.cache[key]
        
        return None
    
    def set(self, question: str, schema_hash: str, result: Dict[str, Any]):
        """Cache a query result"""
        key = self._generate_key(question, schema_hash)
        self.cache[key] = {
            "result": result,
            "timestamp": datetime.now()
        }
    
    def clear(self):
        """Clear all cached queries"""
        self.cache.clear()
    
    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        return {
            "total_entries": len(self.cache),
            "valid_entries": sum(
                1 for v in self.cache.values()
                if datetime.now() - v["timestamp"] < self.ttl
            )
        }


# Global cache instance
query_cache = QueryCache(ttl_minutes=60)
