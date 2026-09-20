"""
Chat Module Facade.
Re-exports sub-module services for backward compatibility across routers and test suites.
"""

from app.modules.chat.agent_orchestrator import (
    _build_user_context,
    _call_agy_cli,
    _call_gemini_api,
    call_llm_provider,
    orchestrate_agentic_turn,
    send_chat_message,
    stream_chat_response,
)
from app.modules.chat.prompts import SYSTEM_INSTRUCTION
from app.modules.chat.rate_limit import check_rate_limit
from app.modules.chat.session_service import (
    create_chat_session,
    delete_chat_session,
    get_chat_session,
    list_chat_sessions,
    sync_chat_history,
    update_chat_session_title,
)

__all__ = [
    "SYSTEM_INSTRUCTION",
    "check_rate_limit",
    "create_chat_session",
    "get_chat_session",
    "list_chat_sessions",
    "sync_chat_history",
    "update_chat_session_title",
    "delete_chat_session",
    "_build_user_context",
    "_call_gemini_api",
    "_call_agy_cli",
    "call_llm_provider",
    "orchestrate_agentic_turn",
    "send_chat_message",
    "stream_chat_response",
]
