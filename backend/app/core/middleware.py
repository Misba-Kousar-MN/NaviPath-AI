"""FastAPI / Starlette middleware for request correlation and execution tracing.
Captures request correlation IDs, tracks duration, and emits safe structured lifecycle logs.
"""
from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.context import (
    generate_request_id,
    reset_request_context,
    set_request_context,
)

logger = logging.getLogger("app.access")


class RequestTracingMiddleware(BaseHTTPMiddleware):
    """Binds request correlation IDs to contextvars and logs start/completion events safely."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Correlation: reuse client header or generate server-side UUID
        request_id = request.headers.get("X-Request-ID") or generate_request_id()
        session_id = request.headers.get("X-Session-ID") or None

        tokens = set_request_context(request_id=request_id, session_id=session_id)
        start_time = time.perf_counter()

        is_health = request.url.path in ("/health", "/health/")
        if not is_health:
            logger.info(
                "Request started: %s %s",
                request.method,
                request.url.path,
                extra={
                    "event": "request_started",
                    "method": request.method,
                    "path": request.url.path,
                    "request_id": request_id,
                    "session_id": session_id,
                },
            )

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            if not is_health:
                logger.info(
                    "Request completed: %s %s status=%d duration=%.2fms",
                    request.method,
                    request.url.path,
                    response.status_code,
                    duration_ms,
                    extra={
                        "event": "request_completed",
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "duration_ms": duration_ms,
                        "request_id": request_id,
                        "session_id": session_id,
                    },
                )
            # Expose correlation ID safely in response headers
            response.headers["X-Request-ID"] = request_id
            return response

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                "Request failed: %s %s duration=%.2fms error=%s",
                request.method,
                request.url.path,
                duration_ms,
                str(exc)[:120],
                extra={
                    "event": "request_failed",
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "request_id": request_id,
                    "session_id": session_id,
                    "error": str(exc)[:120],
                },
            )
            raise
        finally:
            reset_request_context(tokens)
