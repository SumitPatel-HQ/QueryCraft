"""
Configuration for schema introspection
"""


class IntrospectionConfig:
    """Configuration constants for schema introspection"""
    
    # Sample data limits
    MAX_SAMPLE_VALUES = 3
    MAX_SAMPLE_ROWS = 5
    
    # Formatting constants
    SECTION_SEPARATOR = "=" * 80
    SUBSECTION_SEPARATOR = "-" * 80
    
    # Query timeouts (seconds)
    QUERY_TIMEOUT = 30
    
    # Schema element types
    SUPPORTED_DB_TYPES = ["sqlite", "postgresql", "mysql"]
    
    # Column info indices for PRAGMA table_info
    PRAGMA_CID = 0
    PRAGMA_NAME = 1
    PRAGMA_TYPE = 2
    PRAGMA_NOTNULL = 3
    PRAGMA_DFLT_VALUE = 4
    PRAGMA_PK = 5
    
    # Foreign key info indices for PRAGMA foreign_key_list
    FK_ID = 0
    FK_SEQ = 1
    FK_TABLE = 2
    FK_FROM = 3
    FK_TO = 4
