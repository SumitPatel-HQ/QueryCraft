"""
Prompt templates for LLM SQL generation
Centralized prompt engineering for consistent results
"""


class PromptTemplates:
    """Templates for LLM prompts with best practices"""
    
    @staticmethod
    def get_sql_generation_prompt(user_question: str, schema_context: str, db_type: str = "sqlite") -> str:
        """
        Generate the main prompt for SQL generation
        
        Args:
            user_question: Natural language question from user
            schema_context: Formatted database schema
            db_type: Type of database (sqlite, postgresql, etc.)
            
        Returns:
            Complete prompt for LLM
        """
        db_type_upper = db_type.upper() if db_type else "SQLite"
        
        return f"""You are an expert SQL generator. Your task is to convert natural language questions into syntactically correct {db_type_upper} SQL queries.

IMPORTANT RULES:
1. Generate ONLY valid {db_type_upper} SQL syntax
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
    
    @staticmethod
    def get_explanation_prompt(user_question: str, sql: str, tables_used: list) -> str:
        """
        Generate prompt for explaining SQL queries
        
        Args:
            user_question: Original user question
            sql: SQL query to explain
            tables_used: List of tables used in the query
            
        Returns:
            Prompt for explanation generation
        """
        tables_str = ", ".join(tables_used) if tables_used else "database tables"
        
        return f"""You are an expert SQL Explainer. Explain this SQL query in simple, human-readable language:

Question: {user_question}
SQL Query: {sql}
Tables Used: {tables_str}

Provide a brief, clear explanation (1-2 sentences) of what this query does."""
    
    @staticmethod
    def get_fallback_explanation(sql: str, tables_used: list) -> str:
        """
        Get fallback explanation when LLM fails
        
        Args:
            sql: SQL query
            tables_used: List of tables used in the query
            
        Returns:
            Simple fallback explanation
        """
        tables_str = ", ".join(tables_used) if tables_used else "database tables"
        return f"This query retrieves data from {tables_str} using the following SQL: {sql}"
