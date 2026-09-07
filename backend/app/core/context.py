"""Request correlation and context tracking module.
Provides thread-safe and async-safe context propagation using standard library contextvars.
Allows tracing requests from FastAPI middleware through deterministic processing, RAG, validator, and LLM.
"""
from __future__ import annotations

import contextvars
import uuid
from typing import Any

_request_id_ctx_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "request_id", default=""
)
_session_id_ctx_var: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "session_id", default=None
)


def generate_request_id() -> str:
    """Generates a unique, non-colliding server-side request correlation identifier."""
    return f"req_{uuid.uuid4().hex[:12]}"


def set_request_context(
    request_id: str, session_id: str | None = None
) -> tuple[contextvars.Token, contextvars.Token]:
    """Binds request_id and optional session_id to the current async/execution context."""
    req_token = _request_id_ctx_var.set(request_id)
    sess_token = _session_id_ctx_var.set(session_id)
    return req_token, sess_token


def reset_request_context(tokens: tuple[contextvars.Token, contextvars.Token]) -> None:
    """Restores previous context tokens."""
    req_token, sess_token = tokens
    _request_id_ctx_var.reset(req_token)
    _session_id_ctx_var.reset(sess_token)


def set_session_id(session_id: str | None) -> contextvars.Token:
    """Updates the active session_id in the current context."""
    return _session_id_ctx_var.set(session_id)


def get_request_id() -> str:
    """Returns the current request correlation ID, or empty string if not set."""
    return _request_id_ctx_var.get()


def get_session_id() -> str | None:
    """Returns the current worker/client session_id if available."""
    return _session_id_ctx_var.get()


def get_context_metadata() -> dict[str, Any]:
    """Returns safe correlation identifiers for logging."""
    meta: dict[str, Any] = {}
    req_id = get_request_id()
    if req_id:
        meta["request_id"] = req_id
    sess_id = get_session_id()
    if sess_id:
        meta["session_id"] = sess_id
    return meta
