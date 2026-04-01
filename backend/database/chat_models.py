"""Chat history models for sessions, messages, and bookmarks."""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .models import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    __table_args__ = (Index("idx_chat_sessions_user", "user_id", "updated_at"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(128), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    bookmarks = relationship(
        "Bookmark",
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'assistant')", name="check_chat_messages_role"
        ),
        Index("idx_chat_messages_session", "session_id", "created_at"),
        Index("idx_chat_messages_user", "user_id"),
    )

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(String(128), nullable=False, index=True)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session = relationship("ChatSession", back_populates="messages", lazy="joined")
    bookmarks = relationship(
        "Bookmark",
        back_populates="message",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (Index("idx_bookmarks_user", "user_id", "bookmarked_at"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(128), nullable=False, index=True)
    session_id = Column(
        Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=True
    )
    message_id = Column(
        Integer, ForeignKey("chat_messages.id", ondelete="CASCADE"), nullable=True
    )
    note = Column(Text, nullable=True)
    bookmarked_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    session = relationship("ChatSession", back_populates="bookmarks", lazy="joined")
    message = relationship("ChatMessage", back_populates="bookmarks", lazy="joined")
