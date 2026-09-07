# Phase 6.3 — Bhashini Multilingual + Voice Architecture
## AI Skill Navigator for Informal Workers (Karnataka)

---

## 1. Architectural Role & Non-Negotiable Boundaries

Bhashini (National Language Translation Mission - NLTM, MeitY, Government of India) serves strictly as an **accessibility, voice, and translation layer**. It enables informal workers across Karnataka to interact with the AI Skill Navigator using spoken or written **Kannada (ಕನ್ನಡ)** and **Hindi (हिन्दी)** alongside English.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                 INFORMAL WORKER                         │
                  │   Speaks / Reads Kannada, Hindi, or English             │
                  └───────────────┬─────────────────────────▲───────────────┘
                                  │ Voice Audio (mic)       │ Audio Output (TTS)
                                  ▼                         │
                  ┌─────────────────────────────────────────┴───────────────┐
                  │       BHASHINI ACCESSIBILITY LAYER (Phase 6.3)          │
                  │                                                         │
                  │  • ASR: Audio (kn/hi) ───► Native Text                  │
                  │  • MT:  Native Text   ───► English Text (Normalized)    │
                  │  • MT:  English Resp  ───► Native Text (Localized)     │
                  │  • TTS: Native Text   ───► Synthesized Speech (kn/hi)   │
                  └───────────────┬─────────────────────────▲───────────────┘
                                  │ Normalized Text         │ English Text
                                  ▼                         │
                  ┌─────────────────────────────────────────┴───────────────┐
                  │            VOICEFLOW ASSISTANT (Phase 6.1)              │
                  │  Worker Intake, Dialogue Management, Review Screen      │
                  └─────────────────────────┬───────────────────────────────┘
                                            │ Confirmed WorkerProfileIn
                                            ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │              MAKE.COM BRIDGE (Phase 6.2)                │
                  │  Webhook Intake, Normalization, Router                  │
                  └─────────────────────────┬───────────────────────────────┘
                                            │ HTTP POST /api/recommendations
                                            ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │            FASTAPI CORE RECOMMENDATION ENGINE           │
                  │  • Authoritative Deterministic Skill Pathways           │
                  │  • PostGIS Nearest Training Centres (True GPS / Null)   │
                  │  • Deterministic Scheme Eligibility Engine              │
                  │  • pgvector Cosine RAG + EvidenceValidator (Gazettes)   │
                  │  • Grounded Gemini Explanation                          │
                  └─────────────────────────────────────────────────────────┘
```

### Strict Non-Negotiable Boundaries
1. **Zero Career/Eligibility Intelligence**: Bhashini NEVER determines career transitions, skill gaps, course recommendations, centre distances, or scheme eligibility. All logic and decision boundaries belong 100% to the deterministic FastAPI core.
2. **Zero Coordinate Modification**: If a worker profile has `latitude: null` and `longitude: null`, the language and voice layers strictly preserve `null`. Coordinates are never guessed or substituted from spoken or translated district names.
3. **Raw Worker Text Preservation**: Whenever translation occurs, both the original raw worker utterance (`raw_worker_text`) and the normalized translated text (`translated_text`) are preserved in the response contract.
4. **Honest Unconfigured Failure Mode**: If Bhashini credentials are not provided or `BHASHINI_ENABLED=false`, the system never crashes, never invents mock audio, and returns explicit status codes (`disabled` / `not_configured`) with safe fallbacks.

---

## 2. Verified Bhashini API Contract & Endpoints

From official MeitY Bhashini and ULCA (Universal Language Contribution Architecture) specifications:

### 2.1 Verified Endpoints
- **Pipeline Configuration Endpoint**:
  `POST https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline`
- **Dhruva Pipeline Inference Endpoint**:
  `POST https://dhruva-api.bhashini.gov.in/services/inference/pipeline`

### 2.2 Authentication Headers
- **Configuration Calls**:
  - `userID`: User ID issued via the Bhashini developer portal.
  - `ulcaApiKey`: ULCA API key for model discovery.
- **Inference Calls**:
  - `inference-api-key`: Dedicated authorization key for Dhruva inference pipelines.

### 2.3 Verified Language Mapping (ISO-639)
| User-Facing Language | ISO-639 Code | ASR Support | MT (Translation) | TTS Support |
|---|---|---|---|---|
| **English** | `en` | Direct | Passthrough / Source | Direct |
| **Kannada** | `kn` | Supported | Supported (kn ↔ en) | Supported |
| **Hindi** | `hi` | Supported | Supported (hi ↔ en) | Supported |

---

## 3. Implementation Structure

The Bhashini integration is built under `backend/app/integrations/bhashini/` as an isolated, modular package:

```
backend/
├── app/
│   ├── integrations/
│   │   ├── __init__.py
│   │   └── bhashini/
│   │       ├── __init__.py         # Package root & documentation index
│   │       ├── config.py           # BhashiniSettings, language codes, enums
│   │       ├── schemas.py          # Pydantic request/response models
│   │       ├── exceptions.py       # Typed hierarchical exceptions
│   │       ├── client.py           # Async HTTP client (httpx) for ULCA & Dhruva
│   │       └── provider.py         # Provider interface, Disabled & Real providers
│   ├── api/
│   │   └── routes/
│   │       └── bhashini.py         # REST endpoints (/api/bhashini/*)
│   ├── core/
│   │   ├── config.py               # Application-level bhashini_enabled flag
│   │   └── logging_config.py       # Strict secret & audio payload redaction
scripts/
└── smoke_test_bhashini.py          # Safe live connectivity verification script
backend/tests/
└── test_bhashini.py                # 20 regression & unit tests
```

---

## 4. Provider Architecture & Safe Fallback

### 4.1 `BhashiniProvider` Interface
An abstract interface (`app.integrations.bhashini.provider.BhashiniProvider`) enforces the contracts:
- `speech_to_text(request: ASRRequest) -> ASRResponse`
- `translate(request: TranslationRequest) -> TranslationResponse`
- `text_to_speech(request: TTSRequest) -> TTSResponse`
- `detect_language(request: LanguageDetectionRequest) -> LanguageDetectionResponse`
- `get_status() -> BhashiniServiceStatus`

### 4.2 `DisabledBhashiniProvider` (Default)
When `BHASHINI_ENABLED=false` (or when credentials are unconfigured):
- **ASR**: Returns `status="disabled"` or `"not_configured"` with empty `transcribed_text`. Zero network calls made.
- **Translate**: Returns `status="disabled"` or `"not_configured"`, preserving `raw_worker_text` and falling back cleanly to the source text as `translated_text`.
- **TTS**: Returns `status="disabled"` or `"not_configured"` with `audio_base64=None`.
- **Language Detection**: Uses deterministic Kannada Unicode block detection (`\u0C80-\u0CFF`) and Devanagari Hindi detection (`\u0900-\u097F`) as an offline fallback.

### 4.3 `RealBhashiniProvider`
When `BHASHINI_ENABLED=true` and all 4 required credentials (`BHASHINI_USER_ID`, `BHASHINI_ULCA_API_KEY`, `BHASHINI_INFERENCE_API_KEY`, `BHASHINI_PIPELINE_ID`) are set:
- Connects to the Dhruva pipeline inference endpoint via `BhashiniClient`.
- Implements exponential retry on network failures (2 retries, 30s timeout).
- Catches network timeouts and API errors, degrading gracefully to `BhashiniStatus.FAILED` or source text fallback without raising 500 server crashes.

---

## 5. REST API Endpoints (`/api/bhashini/*`)

The FastAPI application mounts the Bhashini router at `/api/bhashini`:

| Method | Path | Purpose | Request Model | Response Model |
|---|---|---|---|---|
| `GET` | `/api/bhashini/status` | Current status & capabilities | None | `BhashiniServiceStatus` |
| `POST` | `/api/bhashini/asr` | Speech-to-Text | `ASRRequest` | `ASRResponse` |
| `POST` | `/api/bhashini/translate` | Bidirectional Translation | `TranslationRequest` | `TranslationResponse` |
| `POST` | `/api/bhashini/tts` | Text-to-Speech | `TTSRequest` | `TTSResponse` |
| `POST` | `/api/bhashini/detect-language` | Informational Language ID | `LanguageDetectionRequest` | `LanguageDetectionResponse` |

---

## 6. Secret Redaction & Log Security

To ensure absolute compliance with security rules:
- `backend/app/core/logging_config.py` explicitly blocks:
  - `bhashini_api_key`, `ulca_api_key`, `inference_api_key`
  - `audio_base64`, `audiocontent` (prevents multi-megabyte binary dumps in JSON logs)
- No secret is ever printed to stdout, stderr, or stored in application caches.

---

## 7. Environment Configuration Guide

To enable live Bhashini services, set the following in `backend/.env`:

```bash
# --- Bhashini Multilingual / Voice Integration (Phase 6.3) ---
BHASHINI_ENABLED=true
BHASHINI_USER_ID="<your_bhashini_user_id>"
BHASHINI_ULCA_API_KEY="<your_ulca_api_key>"
BHASHINI_INFERENCE_API_KEY="<your_inference_api_key>"
BHASHINI_PIPELINE_ID="<your_pipeline_id>"
BHASHINI_CONFIG_URL="https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
BHASHINI_INFERENCE_URL="https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
BHASHINI_TIMEOUT_SECONDS=30
```

---

## 8. Verification & Smoke Testing

1. **Unit & Regression Suite**:
   ```bash
   python -m pytest backend/tests/test_bhashini.py -v
   ```
   *20/20 test cases verifying configuration loading, error isolation, language mapping, secret blocking, session propagation, and null-coordinate safety.*

2. **Safe Smoke Test**:
   ```bash
   python scripts/smoke_test_bhashini.py
   ```
   *Safely verifies live network connectivity if credentials are present, or exits with code 0 informing that Bhashini is currently disabled.*
