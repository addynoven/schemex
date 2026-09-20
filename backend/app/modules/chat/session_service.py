import re
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.uid_generator import generate_session_uid
from app.modules.chat.models import ChatSession


def get_chat_session(
    db: Session,
    session_id_or_uid: int | str,
    user_id: int,
) -> ChatSession:
    """Retrieve chat session by ID or session_uid and verify ownership."""
    val_str = str(session_id_or_uid).strip()
    session = None

    if val_str.isdigit():
        session = db.scalar(
            select(ChatSession)
            .where(ChatSession.id == int(val_str))
            .options(selectinload(ChatSession.messages))
        )

    if not session:
        session = db.scalar(
            select(ChatSession)
            .where(ChatSession.session_uid == val_str)
            .options(selectinload(ChatSession.messages))
        )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat session '{session_id_or_uid}' not found",
        )
    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you do not own this chat session",
        )

    if not session.session_uid:
        session.session_uid = generate_session_uid()
        try:
            db.commit()
            db.refresh(session)
        except Exception:
            db.rollback()

    return session


def create_chat_session(
    db: Session,
    user_id: int,
    payload_or_title: Any = None,
    language_code: str | None = "en",
) -> ChatSession:
    """Create a new chat session with secure non-sequential session_uid for an authenticated citizen."""
    title = "New Welfare Conversation"
    lang = language_code or "en"
    if isinstance(payload_or_title, str):
        title = payload_or_title
    elif payload_or_title is not None and hasattr(payload_or_title, "title"):
        title_val = getattr(payload_or_title, "title", None)
        if isinstance(title_val, str) and title_val:
            title = title_val
        lang = getattr(payload_or_title, "language_code", None) or lang

    session = ChatSession(
        session_uid=generate_session_uid(),
        user_id=user_id,
        title=title,
        language_code=lang,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def list_chat_sessions(db: Session, user_id: int, limit: int = 50) -> list[ChatSession]:
    """List chat sessions for an authenticated citizen ordered by last update."""
    query = (
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .options(selectinload(ChatSession.messages))
        .order_by(ChatSession.updated_at.desc())
        .limit(limit)
    )
    sessions = list(db.scalars(query).all())

    generic_names = ("New Welfare Conversation", "New Citizen Consultation", "New Welfare Consultation", "New Consultation")
    updated = False
    for s in sessions:
        if not s.session_uid:
            s.session_uid = generate_session_uid()
            updated = True
        if s.title in generic_names or not s.title or s.title.startswith("New "):
            if s.messages:
                first_user_msg = next((m for m in s.messages if m.sender == "user"), None)
                if first_user_msg and first_user_msg.content:
                    clean = re.sub(r'[\r\n\t]+', ' ', first_user_msg.content).strip()
                    stripped = re.sub(r'^(hello|hi|namaste|hey|who are you|tell me about|what about)\s*,?\s*', '', clean, flags=re.IGNORECASE).strip()
                    chosen = stripped if len(stripped) >= 3 else clean
                    s.title = chosen[:40] + ("..." if len(chosen) > 40 else "")
                    updated = True
    if updated:
        try:
            db.commit()
        except Exception:
            db.rollback()

    return sessions


def update_chat_session_title(
    db: Session,
    session_id: int | str,
    title: str,
    user_id: int,
) -> ChatSession:
    session = get_chat_session(db, session_id, user_id)
    session.title = title
    db.commit()
    db.refresh(session)
    return session


def delete_chat_session(
    db: Session,
    session_id: int | str,
    user_id: int,
) -> None:
    """Delete a chat session."""
    session = get_chat_session(db, session_id, user_id)
    db.delete(session)
    db.commit()


def sync_chat_history(
    db: Session,
    user_id: int,
    payload: Any,
) -> dict:
    from app.modules.chat.models import ChatMessage

    synced_session_uids = []
    synced_message_uids = []
    session_map = {}

    for sess in payload.sessions:
        existing = db.scalar(
            select(ChatSession).where(ChatSession.session_uid == sess.session_uid)
        )
        if not existing:
            new_sess = ChatSession(
                session_uid=sess.session_uid,
                user_id=user_id,
                title=sess.title or "New Welfare Conversation",
                language_code=sess.language_code or "en",
            )
            db.add(new_sess)
            db.flush()
            session_map[sess.session_uid] = new_sess.id
        else:
            session_map[sess.session_uid] = existing.id
        synced_session_uids.append(sess.session_uid)

    for msg in payload.messages:
        sess_id = session_map.get(msg.session_uid)
        if not sess_id:
            existing_sess = db.scalar(
                select(ChatSession).where(ChatSession.session_uid == msg.session_uid)
            )
            if existing_sess and existing_sess.user_id == user_id:
                sess_id = existing_sess.id
                session_map[msg.session_uid] = sess_id
            else:
                continue

        chat_msg = ChatMessage(
            session_id=sess_id,
            sender=msg.sender,
            content=msg.content,
            citations=msg.citations or [],
        )
        db.add(chat_msg)
        synced_message_uids.append(msg.message_uid)

    try:
        db.commit()
    except Exception:
        db.rollback()

    cloud_sessions = list_chat_sessions(db=db, user_id=user_id)
    return {
        "synced_session_uids": synced_session_uids,
        "synced_message_uids": synced_message_uids,
        "cloud_sessions": cloud_sessions,
    }
