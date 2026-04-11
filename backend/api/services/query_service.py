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
    Generate a concise plain-text explanation for why this query was chosen.

    Args:
        question: Original natural language question
        sql: Generated SQL query
        tables: List of tables used in the query
        results: Query execution results

    Returns:
        Clean explanation string without markdown
    """
    result_count = len(results)
    tables_str = ", ".join(tables) if tables else "the database"
    parts: list[str] = []

    parts.append(f"Queried {tables_str} to answer your question.")

    if "join" in sql.lower():
        parts.append("Joins multiple tables for a complete view.")
    if "group by" in sql.lower():
        parts.append("Groups and aggregates results.")
    if "order by" in sql.lower():
        parts.append("Sorted for relevance.")
    if "limit" in sql.lower():
        parts.append("Limited to top results.")

    parts.append(f"Returned {result_count} record{'s' if result_count != 1 else ''}.")

    return " ".join(parts)
