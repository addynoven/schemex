from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    language_code: str | None = "en"


class SchemeCitation(BaseModel):
    title: str
    slug: str
    summary: str | None = None
    category: str | None = None
    state: str | None = None
    jurisdiction: str | None = None


class TokenUsageMetrics(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    sender: str
    content: str
    status: str = "success"
    intent: str | None = None
    error_code: str | None = None
    stack_trace: str | None = None
    citations: list[str] = Field(default_factory=list)
    sources: list[SchemeCitation] = Field(default_factory=list)
    token_usage: TokenUsageMetrics | None = None
    memory_trace: dict[str, Any] | None = None
    created_at: datetime


class ChatSessionCreate(BaseModel):
    title: str | None = "New Welfare Conversation"
    language_code: str | None = "en"


class ChatSessionUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_uid: str | None = None
    user_id: int | None
    title: str
    language_code: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse] = Field(default_factory=list)


class SyncSessionItem(BaseModel):
    session_uid: str
    title: str = "New Welfare Conversation"
    language_code: str = "en"
    created_at: str | None = None


class SyncMessageItem(BaseModel):
    session_uid: str
    message_uid: str
    sender: str
    content: str
    citations: list[str] = Field(default_factory=list)
    created_at: str | None = None


class ChatSyncRequest(BaseModel):
    sessions: list[SyncSessionItem] = Field(default_factory=list)
    messages: list[SyncMessageItem] = Field(default_factory=list)


class ChatSyncResponse(BaseModel):
    synced_session_uids: list[str] = Field(default_factory=list)
    synced_message_uids: list[str] = Field(default_factory=list)
    cloud_sessions: list[ChatSessionResponse] = Field(default_factory=list)

