"""
LLM-based SQL Generator using Google Gemini AI
Provides intelligent natural language to SQL conversion with confidence scoring and explanations.
"""

import os
import re
import logging
from typing import Dict, Any, Optional, List
import google.generativeai as genai
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class LLMSQLGenerator:
    """
    Generates SQL queries using Google Gemini LLM with schema awareness and confidence scoring.
    """
    
    def __init__(self, model: str = None, timeout: int = None):
        """
        Initialize the LLM SQL Generator.
        
        Args:
            model: Gemini model to use (default: gemini-1.5-flash - FREE!)
            timeout: API timeout in seconds (default: 10)
        """
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        
        self.model_name = model or os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.timeout = timeout or int(os.getenv("LLM_TIMEOUT", "10"))
        self.model = genai.GenerativeModel(self.model_name)
        
        logger.info(f"Initialized LLM SQL Generator with model: {self.model_name}")
    
    def generate_sql_with_llm(self, user_question: str, schema_context: str) -> Dict[str, Any]:
        """
        Generate SQL query from natural language using Google Gemini LLM.
        
        Args:
            user_question: The natural language question
            schema_context: Formatted database schema information
            
        Returns:
            Dictionary containing:
                - sql: Generated SQL query
                - success: Boolean indicating success
                - error: Error message if failed
                - tokens_used: Number of tokens consumed (estimated for Gemini)
        """
        try:
            logger.info(f"🤖 CALLING GEMINI API - Model: {self.model_name}")
            logger.info(f"📝 Question: {user_question}")
            logger.info(f"Generating SQL for question: {user_question}")
            
            # Construct the prompt for Gemini
            prompt = f"""You are an expert SQL generator. Your task is to convert natural language questions into syntactically correct SQLite SQL queries.

IMPORTANT RULES:
1. Generate ONLY valid SQLite SQL syntax
2. Use ONLY tables and columns from the provided schema
3. Return ONLY the SQL query without any explanation, markdown formatting, or additional text
4. Use proper JOINs when querying multiple tables
5. Use appropriate WHERE clauses, GROUP BY, ORDER BY, and LIMIT as needed
6. Use table aliases for better readability (e.g., 'c' for customers, 'o' for orders)
7. For aggregate queries, always include proper GROUP BY clauses
8. Return the query without code blocks, backticks, or the word "SQL"

EXAMPLES:
Question: "How many customers do we have?"
Answer: SELECT COUNT(*) as customer_count FROM customers

Question: "Top 5 customers by spending"
Answer: SELECT c.customer_name, SUM(o.total_amount) as total_spent FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.customer_name ORDER BY total_spent DESC LIMIT 5

Database Schema:
{schema_context}

Question: {user_question}

Generate the SQL query:"""

            # Call Gemini API
            logger.info(f"⚡ SENDING REQUEST TO GEMINI...")
            logger.info(f"   Model: {self.model_name}")
            
            response = self.model.generate_content(prompt)
            
            logger.info(f"✅ RECEIVED RESPONSE FROM GEMINI")
            
            # Extract the SQL query
            sql_query = response.text.strip()
            
            # Clean up the response (remove markdown code blocks if present)
            sql_query = self._clean_sql_response(sql_query)
            
            # Estimate tokens (Gemini doesn't provide exact count in free tier)
            tokens_used = len(prompt.split()) + len(sql_query.split())
            
            logger.info(f"Successfully generated SQL. Estimated tokens: {tokens_used}")
            logger.info(f"Generated SQL: {sql_query}")
            
            return {
                "sql": sql_query,
                "success": True,
                "error": None,
                "tokens_used": tokens_used
            }
            
        except Exception as e:
            logger.error(f"Error generating SQL with LLM: {str(e)}")
            return {
                "sql": None,
                "success": False,
                "error": str(e),
                "tokens_used": 0
            }
    
    def generate_query_explanation(self, sql: str, user_question: str) -> str:
        """
        Generate a human-readable explanation of the SQL query.
        
        Args:
            sql: The SQL query to explain
            user_question: The original user question
            
        Returns:
            Human-readable explanation of the query
        """
        try:
            prompt = f"""Explain this SQL query in simple, human-readable language:

Question: {user_question}
SQL Query: {sql}

Provide a brief, clear explanation (1-2 sentences) of what this query does."""

            response = self.model.generate_content(prompt)
            explanation = response.text.strip()
            
            return explanation
            
        except Exception as e:
            logger.error(f"Error generating explanation: {str(e)}")
            # Fallback to basic explanation
            return f"This query retrieves data from the database related to: {user_question}"
    
    def calculate_confidence_score(self, sql: str, schema_info: Dict[str, Any]) -> int:
        """
        Calculate a confidence score for the generated SQL query.
        
        Args:
            sql: The generated SQL query
            schema_info: Database schema information
            
        Returns:
            Confidence score (0-100)
        """
        try:
            score = 85  # Base score for LLM-generated queries
            
            # Check if query is valid (basic syntax check)
            sql_lower = sql.lower()
            
            # Deduct points for potential issues
            if not sql_lower.startswith('select'):
                score -= 20
            
            # Check for table names in schema
            table_names = list(schema_info.keys()) if schema_info else []
            tables_found = sum(1 for table in table_names if table.lower() in sql_lower)
            
            if tables_found == 0:
                score -= 30  # No valid tables found
            elif tables_found == 1:
                score += 5   # Single table query
            else:
                score += 10  # Multi-table query with joins
            
            # Check for proper SQL keywords
            good_keywords = ['where', 'group by', 'order by', 'join', 'limit']
            keywords_found = sum(1 for kw in good_keywords if kw in sql_lower)
            score += keywords_found * 2
            
            # Ensure score is within 0-100 range
            score = max(0, min(100, score))
            
            return score
            
        except Exception as e:
            logger.error(f"Error calculating confidence score: {str(e)}")
            return 70  # Default moderate confidence
    
    def _clean_sql_response(self, sql: str) -> str:
        """
        Clean the SQL response by removing markdown formatting and extra text.
        
        Args:
            sql: Raw SQL response from LLM
            
        Returns:
            Cleaned SQL query
        """
        # Remove markdown code blocks
        sql = re.sub(r'```sql\n?', '', sql, flags=re.IGNORECASE)
        sql = re.sub(r'```\n?', '', sql)
        
        # Remove "SQL:" or "Answer:" prefixes
        sql = re.sub(r'^(SQL|Answer):\s*', '', sql, flags=re.IGNORECASE)
        
        # Remove extra whitespace
        sql = sql.strip()
        
        # If multiple lines, try to extract just the SQL query
        lines = [line.strip() for line in sql.split('\n') if line.strip()]
        if len(lines) > 1:
            # Look for the line that starts with SELECT (most common)
            for line in lines:
                if line.upper().startswith('SELECT'):
                    sql = line
                    break
            else:
                # If no SELECT found, take the first non-empty line
                sql = lines[0]
        
        return sql
    
    def extract_tables_from_sql(self, sql: str) -> List[str]:
        """
        Extract table names from a SQL query.
        
        Args:
            sql: SQL query string
            
        Returns:
            List of table names found in the query
        """
        try:
            sql_lower = sql.lower()
            tables = []
            
            # Simple regex to find table names after FROM and JOIN keywords
            from_pattern = r'from\s+(\w+)'
            join_pattern = r'join\s+(\w+)'
            
            from_matches = re.findall(from_pattern, sql_lower)
            join_matches = re.findall(join_pattern, sql_lower)
            
            tables.extend(from_matches)
            tables.extend(join_matches)
            
            # Remove duplicates and return
            return list(set(tables))
            
        except Exception as e:
            logger.error(f"Error extracting tables: {str(e)}")
            return []
    
    def validate_sql_syntax(self, sql: str) -> bool:
        """
        Validate basic SQL syntax.
        
        Args:
            sql: SQL query to validate
            
        Returns:
            True if SQL appears valid, False otherwise
        """
        try:
            if not sql or not isinstance(sql, str):
                return False
            
            sql_lower = sql.lower().strip()
            
            # Must start with SELECT (we only allow SELECT queries)
            if not sql_lower.startswith('select'):
                logger.warning(f"SQL validation failed: Query does not start with SELECT")
                return False
            
            # Must contain FROM
            if 'from' not in sql_lower:
                logger.warning(f"SQL validation failed: Query does not contain FROM clause")
                return False
            
            # Basic balanced parentheses check
            if sql.count('(') != sql.count(')'):
                logger.warning(f"SQL validation failed: Unbalanced parentheses")
                return False
            
            # Check for dangerous keywords (basic SQL injection prevention)
            dangerous_keywords = ['drop', 'delete', 'truncate', 'alter', 'create', 'insert', 'update']
            for keyword in dangerous_keywords:
                if keyword in sql_lower:
                    logger.warning(f"SQL validation failed: Contains dangerous keyword '{keyword}'")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating SQL: {str(e)}")
            return False
