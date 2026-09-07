"""External service integrations package.

Each integration is a self-contained sub-package with its own:
  - config.py   — settings and feature-flag logic
  - schemas.py  — Pydantic request/response models
  - exceptions.py — typed exceptions
  - client.py   — HTTP/transport layer
  - provider.py — provider interface + concrete implementations
"""
