# Phase 6.3 — Bhashini Multilingual + Voice Architecture
## AI Skill Navigator for Informal Workers (Karnataka)

*(See root [phase_6_3_bhashini.md](../phase_6_3_bhashini.md) for the full authoritative architecture specification.)*

### Summary Checklist
- **Language & Voice Layer**: Bhashini acts strictly as an accessibility layer for Kannada (ಕನ್ನಡ), Hindi (हिन्दी), and English.
- **Zero Intelligence in Bhashini**: No pathways, gaps, courses, centres, distances, or scheme eligibility calculated in language layer.
- **Coordinate Safety**: `latitude` and `longitude` are strictly preserved as `null` when not provided. Never inferred or geocoded from language text.
- **Safe Default**: Starts cleanly in disabled mode (`BHASHINI_ENABLED=false`) with zero external network requests.
- **REST API Endpoints**: Mounted at `/api/bhashini/` (`/status`, `/asr`, `/translate`, `/tts`, `/detect-language`).
- **Secret Redaction**: All Bhashini keys, tokens, and raw base64 audio payloads are strictly blocked from JSON structured logs.
- **Automated Tests**: 20/20 test cases passing in `backend/tests/test_bhashini.py`.
