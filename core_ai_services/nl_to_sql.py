import re
import json
import logging
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NLToSQLProcessor:
    def __init__(self, schema: Dict[str, List[Dict]], introspector=None):
        self.schema = schema
        self.table_names = list(schema.keys())
        self.introspector = introspector
        self.llm_generator = None
        
        # Try to initialize LLM generator
        try:
            from llm_sql_generator import LLMSQLGenerator  # type: ignore
            self.llm_generator = LLMSQLGenerator()
            logger.info("LLM SQL Generator initialized successfully")
        except Exception as e:
            logger.warning(f"LLM Generator not available: {e}. Will use pattern-matching only.")
    
    def process_query(self, question: str) -> Dict[str, Any]:
        """
        Convert natural language to SQL query using hybrid approach:
        1. Try LLM generation first (if available)
        2. Fall back to pattern-matching if LLM fails
        
        Returns:
            Dictionary containing:
                - sql_query: The generated SQL
                - explanation: Human-readable explanation
                - generation_method: "llm" or "fallback"
                - confidence: Confidence score (0-100)
                - tables_used: List of tables referenced
        """
        # Try LLM approach first
        if self.llm_generator and self.introspector:
            try:
                logger.info(f"Attempting LLM generation for: {question}")
                
                # Get schema context for LLM
                schema_context = self.introspector.format_schema_for_llm()
                schema_dict = self.introspector.get_llm_context()
                
                # Generate SQL with LLM
                result = self.llm_generator.generate_sql_with_llm(question, schema_context)
                
                if result["success"] and result["sql"]:
                    sql = result["sql"]
                    
                    # Validate SQL syntax
                    if self.llm_generator.validate_sql_syntax(sql):
                        # Generate explanation
                        explanation = self.llm_generator.generate_query_explanation(sql, question)
                        
                        # Calculate confidence score
                        confidence = self.llm_generator.calculate_confidence_score(sql, schema_dict)
                        
                        # Extract tables used
                        tables_used = self.llm_generator.extract_tables_from_sql(sql)
                        
                        logger.info(f"LLM generation successful. Confidence: {confidence}")
                        
                        return {
                            "sql_query": sql,
                            "explanation": explanation,
                            "generation_method": "llm",
                            "confidence": confidence,
                            "tables_used": tables_used,
                            "tokens_used": result.get("tokens_used", 0)
                        }
                    else:
                        logger.warning("LLM generated invalid SQL syntax, falling back to pattern-matching")
                else:
                    logger.warning(f"LLM generation failed: {result.get('error')}, falling back to pattern-matching")
                    
            except Exception as e:
                logger.error(f"Error in LLM generation: {str(e)}, falling back to pattern-matching")
        
        # Fall back to pattern-matching
        logger.info("Using pattern-matching approach")
        return self._pattern_matching_query(question)
    
    def _pattern_matching_query(self, question: str) -> Dict[str, Any]:
        """Original pattern-matching logic with enhanced response format"""
        question_lower = question.lower()
        
        # Basic pattern matching for common queries
        if any(word in question_lower for word in ['top', 'highest', 'most', 'best']):
            result = self._handle_top_queries(question, question_lower)
        elif 'count' in question_lower or 'how many' in question_lower:
            result = self._handle_count_queries(question, question_lower)
        elif any(word in question_lower for word in ['average', 'avg', 'mean']):
            result = self._handle_average_queries(question, question_lower)
        elif any(word in question_lower for word in ['total', 'sum']):
            result = self._handle_sum_queries(question, question_lower)
        elif any(word in question_lower for word in ['list', 'show', 'all', 'get']):
            result = self._handle_list_queries(question, question_lower)
        else:
            result = self._handle_generic_query(question, question_lower)
        
        # Enhance result with additional metadata
        sql = result["sql_query"]
        result["generation_method"] = "fallback"
        result["confidence"] = self._calculate_pattern_confidence(question_lower)
        result["tables_used"] = self._extract_tables_from_sql(sql)
        result["tokens_used"] = 0
        
        return result
    
    def _identify_relevant_tables(self, question_lower: str) -> List[str]:
        """Identify which tables are relevant to the query"""
        relevant_tables = []
        
        # Check for table name mentions
        for table in self.table_names:
            if table.lower() in question_lower or table.lower()[:-1] in question_lower:
                relevant_tables.append(table)
        
        # Check for entity keywords
        if any(word in question_lower for word in ['customer', 'client', 'user']):
            if 'customers' in self.table_names:
                relevant_tables.append('customers')
        
        if any(word in question_lower for word in ['product', 'item']):
            if 'products' in self.table_names:
                relevant_tables.append('products')
        
        if any(word in question_lower for word in ['order', 'purchase', 'sale']):
            if 'orders' in self.table_names:
                relevant_tables.append('orders')
        
        return list(set(relevant_tables))
    
    def _handle_top_queries(self, question: str, question_lower: str) -> Dict[str, Any]:
        """Handle queries asking for top/highest/most items"""
        if 'customer' in question_lower:
            if 'value' in question_lower or 'amount' in question_lower or 'spend' in question_lower:
                return {
                    "sql_query": """SELECT c.customer_name, SUM(o.total_amount) as total_spent 
                                   FROM customers c 
                                   JOIN orders o ON c.customer_id = o.customer_id 
                                   GROUP BY c.customer_id, c.customer_name 
                                   ORDER BY total_spent DESC 
                                   LIMIT 10""",
                    "explanation": "This query finds the top 10 customers by total spending amount by joining customers and orders tables, grouping by customer, and summing their order totals."
                }
            else:
                return {
                    "sql_query": "SELECT customer_name, email FROM customers ORDER BY customer_id DESC LIMIT 10",
                    "explanation": "This query shows the top 10 most recent customers."
                }
        
        elif 'product' in question_lower:
            if 'selling' in question_lower or 'popular' in question_lower:
                return {
                    "sql_query": """SELECT p.product_name, SUM(oi.quantity) as total_sold 
                                   FROM products p 
                                   JOIN order_items oi ON p.product_id = oi.product_id 
                                   GROUP BY p.product_id, p.product_name 
                                   ORDER BY total_sold DESC 
                                   LIMIT 10""",
                    "explanation": "This query finds the top 10 best-selling products by total quantity sold."
                }
            elif 'expensive' in question_lower or 'price' in question_lower:
                return {
                    "sql_query": "SELECT product_name, price FROM products ORDER BY price DESC LIMIT 10",
                    "explanation": "This query shows the top 10 most expensive products."
                }
        
        return {
            "sql_query": "SELECT * FROM customers LIMIT 10",
            "explanation": "Showing top 10 records from customers table."
        }
    
    def _handle_count_queries(self, question: str, question_lower: str) -> Dict[str, Any]:
        """Handle count queries"""
        if 'customer' in question_lower:
            return {
                "sql_query": "SELECT COUNT(*) as customer_count FROM customers",
                "explanation": "This query counts the total number of customers."
            }
        elif 'order' in question_lower:
            return {
                "sql_query": "SELECT COUNT(*) as order_count FROM orders",
                "explanation": "This query counts the total number of orders."
            }
        elif 'product' in question_lower:
            return {
                "sql_query": "SELECT COUNT(*) as product_count FROM products",
                "explanation": "This query counts the total number of products."
            }
        
        return {
            "sql_query": "SELECT COUNT(*) as total_records FROM customers",
            "explanation": "This query counts total records in the main table."
        }
    
    def _handle_average_queries(self, question: str, question_lower: str) -> Dict[str, Any]:
        """Handle average queries"""
        if 'order' in question_lower and ('value' in question_lower or 'amount' in question_lower):
            return {
                "sql_query": "SELECT AVG(total_amount) as average_order_value FROM orders",
                "explanation": "This query calculates the average order value."
            }
        elif 'price' in question_lower:
            return {
                "sql_query": "SELECT AVG(price) as average_price FROM products",
                "explanation": "This query calculates the average product price."
            }
        
        return {
            "sql_query": "SELECT AVG(total_amount) as average_amount FROM orders",
            "explanation": "This query calculates the average amount from orders."
        }
    
    def _handle_sum_queries(self, question: str, question_lower: str) -> Dict[str, Any]:
        """Handle sum/total queries"""
        if 'revenue' in question_lower or 'sales' in question_lower:
            return {
                "sql_query": "SELECT SUM(total_amount) as total_revenue FROM orders WHERE status = 'Completed'",
                "explanation": "This query calculates total revenue from completed orders."
            }
        
        return {
            "sql_query": "SELECT SUM(total_amount) as total_amount FROM orders",
            "explanation": "This query calculates the total amount from all orders."
        }
    
    def _handle_list_queries(self, question: str, question_lower: str) -> Dict[str, Any]:
        """Handle list/show queries"""
        if 'customer' in question_lower:
            return {
                "sql_query": "SELECT customer_name, email, city, country FROM customers",
                "explanation": "This query lists all customers with their basic information."
            }
        elif 'product' in question_lower:
            return {
                "sql_query": "SELECT product_name, category, price, stock_quantity FROM products",
                "explanation": "This query lists all products with their details."
            }
        elif 'order' in question_lower:
            return {
                "sql_query": "SELECT o.order_id, c.customer_name, o.order_date, o.total_amount, o.status FROM orders o JOIN customers c ON o.customer_id = c.customer_id",
                "explanation": "This query lists all orders with customer information."
            }
        
        return {
            "sql_query": "SELECT * FROM customers LIMIT 50",
            "explanation": "This query shows a list of records from the main table."
        }
    
    def _handle_generic_query(self, question: str, question_lower: str) -> Dict[str, Any]:
        """Handle generic queries"""
        relevant_tables = self._identify_relevant_tables(question_lower)
        
        if relevant_tables:
            main_table = relevant_tables[0]
            return {
                "sql_query": f"SELECT * FROM {main_table} LIMIT 10",
                "explanation": f"This query shows data from the {main_table} table which seems relevant to your question."
            }
        
        # Default fallback
        return {
            "sql_query": "SELECT customer_name, email FROM customers LIMIT 10",
            "explanation": "This is a default query showing customer information. Please try rephrasing your question for better results."
        }
    
    def _calculate_pattern_confidence(self, question_lower: str) -> int:
        """Calculate confidence score for pattern-matching results"""
        # Simple heuristic based on keyword matches
        high_confidence_patterns = ['count', 'how many', 'total', 'sum', 'average', 'avg']
        medium_confidence_patterns = ['top', 'list', 'show', 'all']
        
        if any(pattern in question_lower for pattern in high_confidence_patterns):
            return 75
        elif any(pattern in question_lower for pattern in medium_confidence_patterns):
            return 65
        else:
            return 50
    
    def _extract_tables_from_sql(self, sql: str) -> List[str]:
        """Extract table names from SQL query"""
        tables = []
        sql_upper = sql.upper()
        
        # Find tables in FROM clause
        from_matches = re.findall(r'FROM\s+(\w+)', sql_upper)
        tables.extend(from_matches)
        
        # Find tables in JOIN clauses
        join_matches = re.findall(r'JOIN\s+(\w+)', sql_upper)
        tables.extend(join_matches)
        
        # Return unique table names
        return list(set([t.lower() for t in tables]))