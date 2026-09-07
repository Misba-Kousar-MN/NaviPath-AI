# Phase 6.2 — Make.com Integration Specification
## AI Skill Navigator for Informal Workers (Karnataka)

*(See root [phase_6_2_make_integration.md](../phase_6_2_make_integration.md) for full authoritative document.)*

### Summary Checklist
- **Orchestration Layer**: Make.com acts solely as a message bridge.
- **Zero Intelligence in Make**: No courses, centres, distances, or schemes determined in Make.
- **Coordinate Safety**: `latitude` and `longitude` strictly preserved as `null`.
- **Public URL Status**: `BACKEND_PUBLIC_HTTPS_ENDPOINT_REQUIRED` (Cloudflare Tunnel, ngrok, or production deploy).
- **Importable Blueprint**: `frontend/make/skill_navigator_make_blueprint.json`.
