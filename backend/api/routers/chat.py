"""Chat history and bookmarks API endpoints."""

from datetime import datetime, UTC
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from api.middleware.auth import get_current_user
from database.chat_models import ChatSession, ChatMessage, Bookmark
from database.session import get_db, set_current_user_context


router = APIRouter(prefix="/api/v1", tags=["chat"])


class CreateSessionRequest(BaseModel):
    title: Optional[str] = None


class CreateMessageRequest(BaseModel):
    role: str
    content: str


class CreateBookmarkRequest(BaseModel):
    session_id: Optional[int] = None
    message_id: Optional[int] = None
    note: Optional[str] = None


def _auto_title(content: str) -> str:
    text = (content or "").strip()
    if not text:
        return "New Chat"
    return text[:60]


@router.get("/chat/sessions")
async def list_chat_sessions(user: dict = Depends(get_current_user)):
    user_id = user.get("uid")
    with get_db() as db:
        set_current_user_context(db, user_id)
        sessions = (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
            .all()
        )
        return [
            {
                "id": s.id,
                "title": s.title,
                "created_at": s.created_at,
                "updated_at": s.updated_at,
            }
            for s in sessions
        ]


@router.post("/chat/sessions")
async def create_chat_session(
    request: CreateSessionRequest, user: dict = Depends(get_current_user)
):
    user_id = user.get("uid")
    with get_db() as db:
        set_current_user_context(db, user_id)
        session = ChatSession(user_id=user_id, title=request.title or "New Chat")
        db.add(session)
        db.flush()
        return {
            "id": session.id,
            "title": session.title,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
        }


@router.get("/chat/sessions/{session_id}")
async def get_chat_session(session_id: int, user: dict = Depends(get_current_user)):
    user_id = user.get("uid")
    with get_db() as db:
        set_current_user_context(db, user_id)
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id)
            .filter(ChatSession.user_id == user_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        messages = (
            db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .filter(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        return {
            "id": session.id,
            "title": session.title,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at,
                }
                for m in messages
            ],
        }


@router.delete("/chat/sessions/{session_id}")
async def delete_chat_session(session_id: int, user: dict = Depends(get_current_user)):
    user_id = user.get("uid")
    with get_db() as db:
        set_current_user_context(db, user_id)
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id)
            .filter(ChatSession.user_id == user_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        db.delete(session)
        return {"success": True}


@router.post("/chat/sessions/{session_id}/messages")
async def add_chat_message(
    session_id: int,
    request: CreateMessageRequest,
    user: dict = Depends(get_current_user),
):
    if request.role not in {"user", "assistant"}:
        raise HTTPException(
            status_code=400, detail="Role must be 'user' or 'assistant'"
        )

    user_id = user.get("uid")
    with get_db() as db:
        set_current_user_context(db, user_id)
        session = (
            db.query(ChatSession)
            .filter(ChatSession.id == session_id)
            .filter(ChatSession.user_id == user_id)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        message = ChatMessage(
            session_id=session_id,
            user_id=user_id,
            role=request.role,
            content=request.content,
        )
        db.add(message)

        if request.role == "user" and (
            not session.title or session.title == "New Chat"
        ):
            session.title = _auto_title(request.content)

        session.updated_at = datetime.now(UTC)
        db.flush()

        return {
            "id": message.id,
            "session_id": session_id,
            "role": message.role,
            "content": message.content,
            "created_at": message.created_at,
        }


@router.post("/bookmarks")
async def create_bookmark(
    request: CreateBookmarkRequest, user: dict = Depends(get_current_user)
):
    if not request.session_id and not request.message_id:
        raise HTTPException(
            status_code=400, detail="session_id or message_id is required"
        )

    user_id = user.get("uid")
    with get_db() as db:
        set_current_user_context(db, user_id)

        if request.session_id:
            session = (
                db.query(ChatSession)
                .filter(ChatSession.id == request.session_id)
                .filter(ChatSession.user_id == user_id)
                .first()
            )
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")

        if request.message_id:
            message = (
                db.query(ChatMessage)
                .filter(ChatMessage.id == request.message_id)
                .filter(ChatMessage.user_id == user_id)
                .first()
            )
            if not message:
                raise HTTPException(status_code=404, detail="Message not found")

        bookmark = Bookmark(
            user_id=user_id,
            session_id=request.session_id,
            message_id=request.message_id,
            note=request.note,
        )
        db.add(bookmark)
        db.flush()

        return {
            "id": bookmark.id,
            "session_id": bookmark.session_id,
            "message_id": bookmark.message_id,
            "note": bookmark.note,
            "bookmarked_at": bookmark.bookmarked_at,
        }


@router.get("/bookmarks")
async def list_bookmarks(user: dict = Depends(get_current_user)):
    user_id = user.get("uid")
    with get_db() as db:
        set_current_user_context(db, user_id)
        bookmarks = (
            db.query(Bookmark)
            .filter(Bookmark.user_id == user_id)
            .order_by(Bookmark.bookmarked_at.desc())
            .all()
        )

        grouped = {}
        for b in bookmarks:
            day = b.bookmarked_at.date().isoformat()
            grouped.setdefault(day, []).append(
                {
                    "id": b.id,
                    "session_id": b.session_id,
                    "message_id": b.message_id,
                    "note": b.note,
                    "bookmarked_at": b.bookmarked_at,
                }
            )
        return grouped


@router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: int, user: dict = Depends(get_current_user)):
    user_id = user.get("uid")
    with get_db() as db:
        set_current_user_context(db, user_id)
        bookmark = (
            db.query(Bookmark)
            .filter(Bookmark.id == bookmark_id)
            .filter(Bookmark.user_id == user_id)
            .first()
        )
        if not bookmark:
            raise HTTPException(status_code=404, detail="Bookmark not found")

        db.delete(bookmark)
        return {"success": True}


@router.get("/chat/search")
async def search_chat(
    q: str = Query(..., min_length=1), user: dict = Depends(get_current_user)
):
    user_id = user.get("uid")
    with get_db() as db:
        set_current_user_context(db, user_id)
        messages = (
            db.query(ChatMessage)
            .join(ChatSession, ChatSession.id == ChatMessage.session_id)
            .filter(ChatMessage.user_id == user_id)
            .filter(ChatMessage.content.ilike(f"%{q}%"))
            .order_by(ChatMessage.created_at.desc())
            .limit(50)
            .all()
        )

        return [
            {
                "message_id": m.id,
                "session_id": m.session_id,
                "session_title": m.session.title if m.session else "Untitled",
                "role": m.role,
                "snippet": m.content[:200],
                "created_at": m.created_at,
            }
            for m in messages
        ]
