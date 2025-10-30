"""
Database models for QueryCraft
SQLAlchemy models for PostgreSQL
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, BigInteger, Numeric, ForeignKey, JSON, Index
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
from datetime import UTC

Base = declarative_base()

class Database(Base):
    """Model for user-uploaded databases"""
    __tablename__ = 'databases'
    __table_args__ = (
        Index('ix_databases_last_accessed', 'last_accessed'),
        Index('ix_databases_is_active', 'is_active'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    display_name = Column(String(255), nullable=False)
    description = Column(Text)
    db_type = Column(String(50), nullable=False)
    connection_string = Column(Text)
    file_path = Column(Text)
    schema_data = Column(JSON)
    table_count = Column(Integer, default=0)
    row_count = Column(BigInteger, default=0)
    size_mb = Column(Numeric(10, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_queried = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    query_history = relationship(
        "QueryHistory",
        back_populates="database",
        cascade="all, delete-orphan",
        lazy="selectin",
    )





class QueryHistory(Base):
    """Model for query execution history"""
    __tablename__ = 'query_history'
    __table_args__ = (
        Index('ix_query_history_db_created', 'database_id', 'created_at'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    database_id = Column(Integer, ForeignKey('databases.id', ondelete='CASCADE'))
    question = Column(Text, nullable=False)
    sql_query = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    result_count = Column(Integer, nullable=True, default=0)
    confidence_score = Column(Integer, nullable=True)
    success = Column(Boolean, default=True, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationship
    database = relationship("Database", back_populates="query_history", lazy="joined")
