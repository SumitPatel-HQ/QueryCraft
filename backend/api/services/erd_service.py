"""ERD (Entity Relationship Diagram) generation utilities"""

from typing import List, Dict, Any


def generate_mermaid_erd(tables: List[Dict], relationships: List[Dict]) -> str:
    """
    Generate Mermaid.js ERD syntax
    
    Args:
        tables: List of table information dictionaries
        relationships: List of relationship dictionaries
        
    Returns:
        Mermaid.js ERD syntax string
    """
    
    def clean_type(col_type: str) -> str:
        """Clean column type for Mermaid syntax"""
        # Remove size specifications like (10,2) or (50)
        col_type = col_type.split('(')[0] if '(' in col_type else col_type
        # Map to simple types
        type_map = {
            'VARCHAR': 'string',
            'INTEGER': 'int',
            'DECIMAL': 'decimal',
            'TEXT': 'text',
            'BOOLEAN': 'boolean',
            'TIMESTAMP': 'timestamp',
            'DATE': 'date',
            'REAL': 'float',
            'NUMERIC': 'number'
        }
        return type_map.get(col_type.upper(), col_type.lower())
    
    mermaid = "erDiagram\n"
    
    # Add tables - skip sqlite internal tables
    for table in tables[:10]:  # Limit to first 10 tables for readability
        if table["name"].lower().startswith("sqlite"):
            continue
            
        table_name = table["name"].upper().replace("_", "-")
        mermaid += f"    {table_name} {{\n"
        for col in table["columns"][:8]:  # Limit columns
            col_type = clean_type(col["type"])
            col_name = col['name'].replace("_", "-")
            col_key = col["key"]
            # Format: type name key (space separated, no special chars in key)
            if col_key:
                mermaid += f"        {col_type} {col_name} \"{col_key}\"\n"
            else:
                mermaid += f"        {col_type} {col_name}\n"
        mermaid += "    }\n"
    
    # Add relationships (simplified)
    seen_relationships = set()
    for rel in relationships[:15]:  # Limit relationships
        from_table = rel["from"].upper().replace("_", "-")
        to_table = rel["to"].upper().replace("_", "-")
        
        # Skip sqlite internal tables
        if "SQLITE" in from_table or "SQLITE" in to_table:
            continue
            
        rel_key = f"{from_table}-{to_table}"
        
        # Avoid duplicate relationships
        if rel_key not in seen_relationships:
            seen_relationships.add(rel_key)
            mermaid += f"    {from_table} }}o--|| {to_table} : \"has\"\n"
    
    return mermaid


def infer_relationships(schema_data: Dict[str, Any]) -> List[Dict]:
    """
    Infer relationships based on foreign key naming conventions
    
    Args:
        schema_data: Schema dictionary with table information
        
    Returns:
        List of inferred relationships
    """
    relationships = []
    
    for table_name, columns_list in schema_data.items():
        for col in columns_list:
            col_name = col.get("name", "")
            
            # Track foreign key relationships based on naming convention
            if "_id" in col_name.lower() and not col.get("primary_key"):
                # Try to infer relationship (simplified)
                ref_table = col_name.replace("_id", "")
                # Try to find matching table (singular or plural)
                possible_tables = [
                    ref_table, 
                    ref_table + "s", 
                    ref_table[:-1] if ref_table.endswith('s') else ref_table
                ]
                for possible in possible_tables:
                    if possible in schema_data:
                        relationships.append({
                            "from": table_name,
                            "to": possible,
                            "type": "many-to-one",
                            "via": col_name
                        })
                        break
    
    return relationships
