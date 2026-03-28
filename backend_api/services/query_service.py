"""Query processing utilities and helper functions"""

from typing import List, Any


def determine_query_complexity(sql_query: str) -> str:
    """
    Determine query complexity based on SQL features
    
    Args:
        sql_query: SQL query string to analyze
        
    Returns:
        Complexity level: "Easy", "Medium", or "Advanced"
    """
    sql_lower = sql_query.lower()
    
    # Count complexity indicators
    complexity_score = 0
    
    if 'join' in sql_lower:
        complexity_score += 2
    if 'group by' in sql_lower:
        complexity_score += 1
    if 'having' in sql_lower:
        complexity_score += 2
    if 'subquery' in sql_lower or '(select' in sql_lower:
        complexity_score += 3
    if 'union' in sql_lower or 'intersect' in sql_lower:
        complexity_score += 2
    if 'case when' in sql_lower:
        complexity_score += 1
    if 'window' in sql_lower or 'over(' in sql_lower:
        complexity_score += 3
    
    # Classify based on score
    if complexity_score >= 6:
        return "Advanced"
    elif complexity_score >= 3:
        return "Medium"
    else:
        return "Easy"


def generate_query_explanation(
    question: str, 
    sql: str, 
    tables: List[str], 
    results: List[Any]
) -> str:
    """
    Generate detailed explanation for transparency
    
    Args:
        question: Original natural language question
        sql: Generated SQL query
        tables: List of tables used in the query
        results: Query execution results
        
    Returns:
        Detailed explanation string
    """
    result_count = len(results)
    tables_str = ", ".join(tables) if tables else "the database"
    
    explanation = f"""
**Understanding This Query:**

**What you asked:** "{question}"

**Tables accessed:** {tables_str}

**What the SQL does:**
The query searches through {tables_str} to find the information you requested. 
"""
    
    if 'join' in sql.lower():
        explanation += "It combines data from multiple tables to give you a complete picture. "
    
    if 'group by' in sql.lower():
        explanation += "The results are grouped and aggregated to provide summary information. "
    
    if 'order by' in sql.lower():
        explanation += "Results are sorted to show you the most relevant items first. "
    
    if 'limit' in sql.lower():
        explanation += "Only the top results are shown for clarity. "
    
    explanation += f"""

**Results:** Found {result_count} matching record{"s" if result_count != 1 else ""}.

**Why trust this?** This query was generated using AI analysis of your database schema and validated against actual data structures.
"""
    
    return explanation.strip()
