"""Structured JSON logging configuration.
Uses Python standard logging to emit single-line JSON log entries with request correlation.
Strictly redacts sensitive keys, tokens, credentials, and PII.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from app.core.context import get_request_id, get_session_id

# Keys that must NEVER be emitted in structured logs
BLOCKED_KEYS = {
    "api_key",
    "apikey",
    "secret",
    "password",
    "token",
    "authorization",
    "auth",
    "skill",
    "worker_profile",
    "prompt",
    "contents",
    "gemini_response",
    "db_password",
    "bhashini_api_key",
    "ulca_api_key",
    "inference_api_key",
    "audio_base64",
    "audiocontent",
}

# Standard LogRecord attributes to ignore when harvesting extra fields
STANDARD_LOG_RECORD_ATTRS = {
    "args",
    "asctime",
    "created",
    "exc_info",
    "exc_text",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "module",
    "msecs",
    "message",
    "msg",
    "name",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "stack_info",
    "thread",
    "threadName",
}


class StructuredJsonFormatter(logging.Formatter):
    """Formats standard LogRecord instances as secure, single-line JSON records."""

    def format(self, record: logging.LogRecord) -> str:
        # 1. Base log record fields
        record_msg = record.getMessage()
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record_msg,
        }

        # 2. Event name: explicit extra or infer from record
        event = getattr(record, "event", None)
        if event:
            log_entry["event"] = str(event)

        # 3. Request correlation from contextvars or explicit extra
        req_id = getattr(record, "request_id", None) or get_request_id()
        if req_id:
            log_entry["request_id"] = req_id

        sess_id = getattr(record, "session_id", None) or get_session_id()
        if sess_id:
            log_entry["session_id"] = sess_id

        # 4. Operation metadata
        operation = getattr(record, "operation", None)
        if operation:
            log_entry["operation"] = str(operation)

        # 5. Harvest extra attributes, strictly filtering sensitive or internal keys
        for key, val in record.__dict__.items():
            if key in STANDARD_LOG_RECORD_ATTRS or key in log_entry:
                continue
            key_lower = key.lower()
            if any(blocked in key_lower for blocked in BLOCKED_KEYS):
                continue
            # Serialize simple primitives only (prevent massive nested dumps or vectors)
            if isinstance(val, (str, int, float, bool)) or val is None:
                log_entry[key] = val
            elif isinstance(val, (list, tuple)) and len(val) <= 10:
                # Allow small lists of simple types
                if all(isinstance(x, (str, int, float, bool)) for x in val):
                    log_entry[key] = list(val)

        # 6. Error handling
        if record.exc_info:
            exc_type = record.exc_info[0]
            exc_val = record.exc_info[1]
            log_entry["error_type"] = exc_type.__name__ if exc_type else "Exception"
            log_entry["error"] = str(exc_val)[:150] if exc_val else "Error"

        return json.dumps(log_entry, default=str)


def setup_logging(level: int = logging.INFO) -> None:
    """Configures structured JSON logging on the root logger and app loggers."""
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Avoid duplicate handlers on re-configuration
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)

    handler = logging.StreamHandler()
    handler.setFormatter(StructuredJsonFormatter())
    root_logger.addHandler(handler)
