from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.modules.auth.models import User
from app.modules.chat.schemas import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionUpdate,
    ChatSessionResponse,
    ChatSyncRequest,
    ChatSyncResponse,
)
from app.modules.chat.service import (
    check_rate_limit,
    create_chat_session,
    get_chat_session,
    list_chat_sessions,
    sync_chat_history,
    update_chat_session_title,
    delete_chat_session,
    send_chat_message,
    stream_chat_response,
)

router = APIRouter(prefix="/chat", tags=["Conversational Chat Assistant"])


@router.post("/sync", response_model=ChatSyncResponse)
def sync_chat_endpoint(
    payload: ChatSyncRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Batch synchronizes local-first chat sessions and messages with PostgreSQL."""
    return sync_chat_history(db=db, user_id=current_user.id, payload=payload)


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session_endpoint(
    payload: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new conversational chat session for authenticated citizen."""
    return create_chat_session(db=db, user_id=current_user.id, payload_or_title=payload)


@router.get("/sessions", response_model=list[ChatSessionResponse])
def list_sessions_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all previous chat sessions for the authenticated citizen."""
    return list_chat_sessions(db=db, user_id=current_user.id)


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session_endpoint(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve full chat history for a session by ID or session_uid."""
    return get_chat_session(db=db, session_id_or_uid=session_id, user_id=current_user.id)


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
def update_session_endpoint(
    session_id: str,
    payload: ChatSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rename a chat session title."""
    return update_chat_session_title(db=db, session_id=session_id, title=payload.title, user_id=current_user.id)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session_endpoint(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a chat session and all associated messages."""
    delete_chat_session(db=db, session_id=session_id, user_id=current_user.id)
    return None


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def send_message_endpoint(
    session_id: str,
    payload: ChatMessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send message in a chat session and get synchronous response with citations."""
    client_id = f"user_{current_user.id}"
    if not getattr(settings, "TESTING", False) and not check_rate_limit(client_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending another message.",
        )

    return send_chat_message(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
        content=payload.content,
        language_code=payload.language_code,
    )


@router.post("/sessions/{session_id}/messages/stream")
async def stream_message_endpoint(
    session_id: str,
    payload: ChatMessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send message and receive real-time Server-Sent Events (SSE) token stream."""
    client_id = f"user_{current_user.id}"
    if not getattr(settings, "TESTING", False) and not check_rate_limit(client_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending another message.",
        )

    # Validate session ownership before initiating streaming response
    get_chat_session(db=db, session_id_or_uid=session_id, user_id=current_user.id)
    return StreamingResponse(
        stream_chat_response(db=db, session_id=session_id, user_id=current_user.id, content=payload.content),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

