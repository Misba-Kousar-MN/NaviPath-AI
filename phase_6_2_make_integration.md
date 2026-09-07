# Phase 6.2 — Make.com Integration Specification
## AI Skill Navigator for Informal Workers (Karnataka)

## 1. Architectural Role & Non-Negotiable Boundaries

Make.com serves exclusively as an **orchestration and integration bridge** connecting the worker-facing Voiceflow conversational assistant to the production-hardened FastAPI recommendation backend.

```
WORKER
   ↓
VOICEFLOW (Phase 6.1)
   • Profile intake & basic validation
   • Profile review & correction loop
   • profile_complete = true → profile_confirmed = true → backend_ready = true
   • READY_FOR_RECOMMENDATION_API
   ↓
MAKE.COM (Phase 6.2 Orchestration Pipe)
   • Module 1: Custom Webhook ("voiceflow_worker_profile")
   • Module 2: Profile Validator & Normalizer (strips whitespace, preserves nulls)
   • Module 3: HTTP Request (POST {{BACKEND_BASE_URL}}/api/recommendations)
   • Module 4: Response Parser & Voiceflow Payload Formatter
   • Module 5: Error / Success Router
   ↓
FASTAPI BACKEND (Existing Grounded Engine)
   • Authoritative Deterministic Intelligence (occupations, skills, gaps, courses)
   • PostGIS Nearest Authorized Training Centres
   • Deterministic Scheme Eligibility Engine
   • pgvector Cosine Similarity RAG Retrieval (Phase 3D / 5.1 entity-scoped)
   • Phase 3E EvidenceValidator (strict source verification & provenance)
   • Phase 4 Grounded Gemini Explanation & Personalization (or deterministic fallback)
   • Request Tracing Middleware & Structured JSON Logging
   ↓
MAKE.COM
   • Forwards structured recommendation payload back to Voiceflow
   ↓
VOICEFLOW
   • Renders grounded summary, courses, centres, schemes, and next steps to worker
```

### Strict Non-Negotiable Boundaries
- **Zero Intelligence in Make.com**: Make.com NEVER determines career pathways, skill gaps, course recommendations, centre distances, or scheme eligibility. All logic and decision boundaries belong 100% to FastAPI.
- **Zero Coordinate Fabrication**: If Voiceflow sends `latitude: null` and `longitude: null`, Make.com forwards them strictly unchanged. Make.com NEVER geocodes district names or substitutes city/district centroids.
- **No Direct RAG / Gemini Calls**: Make.com never calls Gemini, pgvector, or Supabase directly.
- **Authoritative Backend Contract**: The request payload matches `WorkerProfileIn` exactly. The response schema preserves `RecommendationResponse` without dropping evidence citations or status fields.

---

## 2. Connectivity & Public HTTPS Requirement

> [!WARNING]
> ### BACKEND PUBLIC HTTPS ENDPOINT REQUIRED
> **Sentinel tag**: `BACKEND_PUBLIC_HTTPS_ENDPOINT_REQUIRED`
>
> Cloud-hosted Make.com workers execute in the public cloud and **cannot reach** `localhost`, `127.0.0.1`, or private local IP addresses.
>
> Because the backend is currently running locally in development (`http://localhost:8000`), a public HTTPS endpoint must be provided before the live Make.com scenario can dispatch requests.
>
> In the Make.com configuration and scenario blueprint, the base URL is parameterized as:
> `{{BACKEND_BASE_URL}}` (e.g. `https://api.skillnavigator.karnataka.gov.in` or a temporary secure tunnel).

### How to Expose the Local Backend for Live Testing:
1. **Option A — Cloudflare Tunnel (Recommended)**:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
   Copy the generated HTTPS URL (e.g. `https://random-words.trycloudflare.com`) and set it as `BACKEND_BASE_URL` in Make.com.
2. **Option B — ngrok**:
   ```bash
   ngrok http 8000
   ```
   Use the assigned `https://...ngrok-free.app` URL.
3. **Option C — Cloud Production Deployment**:
   Deploy the Docker container to AWS ECS, Google Cloud Run, Render, or Fly.io with an SSL/TLS certificate.

---

## 3. Voiceflow → Make.com Payload Contract

When the worker clicks *"Yes, continue"* on the profile review screen, Voiceflow executes an API / Webhook step sending the confirmed profile:

### HTTP Request
- **Method**: `POST`
- **URL**: `{{MAKE_WEBHOOK_URL}}`
- **Content-Type**: `application/json`

### Payload Schema (`WorkerProfileIn`):
```json
{
  "language": "Kannada",
  "occupation": "Delivery / Courier Rider",
  "career_goal_text": "I want to become an electrician",
  "district": "Bengaluru Urban",
  "pincode": "560001",
  "age": 26,
  "gender": "Male",
  "latitude": null,
  "longitude": null,
  "session_id": "sess_vf_98234710",
  "extra_attributes": {}
}
```

### Field Requirements & Handling:
| Field | Type | Required? | Handling in Make.com |
|---|---|---|---|
| `occupation` | string | **Yes** | Trim whitespace; if empty, return 400 error to Voiceflow. |
| `district` | string | **Yes** | Trim whitespace; preserve exact string; do NOT geocode. |
| `career_goal_text` | string | Optional | Preserve exact phrase; do NOT classify. |
| `language` | string | Optional | Default to `"English"` if omitted. |
| `pincode` | string \| null | Optional | If provided, pass as string; if empty/skipped, pass `null`. |
| `age` | integer \| null | Optional | Normalize to integer or `null`; if empty/skipped, pass `null`. |
| `gender` | string \| null | Optional | Preserve string or `null`. |
| `latitude` | float \| null | Optional | **Strictly preserved as null** (never fabricated). |
| `longitude` | float \| null | Optional | **Strictly preserved as null** (never fabricated). |
| `session_id` | string \| null | Optional | Preserved for request tracing and correlation. |
| `extra_attributes` | object | Optional | Pass as `{}` if absent. |

---

## 4. Make.com Scenario Design

The Make.com scenario contains 5 focused modules:

```
[Module 1: Webhook] 
       ↓ (receives worker profile)
[Module 2: JSON / Tools - Normalizer] 
       ↓ (trims strings, validates required fields, ensures nulls)
[Module 3: HTTP - Make a request] 
       ↓ (POST {{BACKEND_BASE_URL}}/api/recommendations)
[Module 4: JSON - Parse Response] 
       ↓ (parses RecommendationResponse)
[Module 5: Router]
   ├── Route A (HTTP 200 Success) → Webhook Response (Status 200, formatted data)
   └── Route B (Error Directive)   → Webhook Response (Status 500, worker-safe message)
```

### Module 1: Custom Webhook
- **Service**: Webhooks
- **Action**: Custom webhook
- **Webhook Name**: `voiceflow_worker_profile`
- **Output**: Raw JSON from Voiceflow.

### Module 2: Normalization & Validation
- Validates presence of `occupation` and `district`.
- If missing, routes to immediate client error response (400 Bad Request) with message: *"Missing required profile fields: occupation and district."*

### Module 3: HTTP Request to FastAPI
- **Action**: Make a request
- **URL**: `{{BACKEND_BASE_URL}}/api/recommendations`
- **Method**: `POST`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Accept`: `application/json`
  - `X-Session-ID`: `{{1.session_id}}` (optional correlation header)
- **Body type**: Raw
- **Content type**: JSON
- **Request content**:
  ```json
  {
    "occupation": "{{2.occupation}}",
    "district": "{{2.district}}",
    "career_goal_text": "{{2.career_goal_text}}",
    "language": "{{2.language}}",
    "pincode": {{if(empty(2.pincode); null; toText(2.pincode))}},
    "age": {{if(empty(2.age); null; toInt(2.age))}},
    "gender": {{if(empty(2.gender); null; toText(2.gender))}},
    "latitude": null,
    "longitude": null,
    "session_id": "{{1.session_id}}",
    "extra_attributes": {}
  }
  ```
- **Timeout**: 30 seconds (allows full deterministic engine + PostGIS + RAG + Gemini generation).

### Module 4: Response Processing & Preservation
Parses the backend `RecommendationResponse` preserving all authoritative data:
- `matched_occupation`: Trade name and code.
- `current_skills`: Verified initial skills.
- `skill_gaps`: Target skills needed for upward mobility.
- `courses`: Certified NCVET/PMKVY courses with NSQF levels.
- `nearby_centres`: PostGIS-ranked authorized training centres with physical addresses.
- `schemes`: Government welfare schemes with eligibility verdict (`eligible`, `ineligible`, `uncertain`).
- `explanation`: Grounded summary, skill gap rationale, course guidance, and next steps.
- `validated_evidence`: Citations from official gazettes and documents.
- `explanation_status`: `"available"` | `"fallback"`.
- `evidence_status`: `"retrieved"` | `"empty"`.

### Module 5: Webhook Response to Voiceflow
- **Status Code**: `200`
- **Headers**: `Content-Type: application/json`
- **Body**: Complete recommendation bundle returned to Voiceflow:
  ```json
  {
    "status": "success",
    "explanation": {
      "summary": "{{4.explanation.summary}}",
      "skill_gap_explanation": "{{4.explanation.skill_gap_explanation}}",
      "next_steps": {{4.explanation.next_steps}}
    },
    "courses": [
      {
        "id": "{{4.courses[1].id}}",
        "title": "{{4.courses[1].title_en}}",
        "duration_hours": {{4.courses[1].duration_hours}},
        "nsqf_level": {{4.courses[1].nsqf_level}}
      }
    ],
    "nearby_centres": [
      {
        "id": "{{4.nearby_centres[1].id}}",
        "name": "{{4.nearby_centres[1].name}}",
        "district": "{{4.nearby_centres[1].district}}",
        "distance_km": {{4.nearby_centres[1].distance_km}}
      }
    ],
    "schemes": [
      {
        "scheme_id": "{{4.eligibility[1].scheme_id}}",
        "scheme_name": "{{4.eligibility[1].scheme_name}}",
        "verdict": "{{4.eligibility[1].verdict}}"
      }
    ],
    "explanation_status": "{{4.explanation_status}}",
    "evidence_count": {{4.evidence_count}}
  }
  ```

---

## 5. Error Handling & Timeout Strategy

### HTTP Error Handling Matrix:
| Error Code | Cause | Make.com Directive | Worker-Facing Response |
|---|---|---|---|
| **400** | Missing required fields or invalid types | Don't retry; return Error payload | *"Please check your details and try again."* |
| **404** | Invalid endpoint path | Don't retry; log configuration error | *"Service endpoint configuration error."* |
| **408 / Timeout** | Pipeline took > 30s | Retry once after 2s; if fails, trigger fallback | *"The system is taking longer than expected. Please try again in a moment."* |
| **429** | Rate limited | Retry once after 5s backoff | *"The system is currently busy. Retrying..."* |
| **500** | Backend unexpected exception | Return safe error payload; do NOT retry | *"I’m sorry, I couldn’t retrieve your recommendations right now. Please try again."* |
| **502 / 503** | Server down / proxy disconnect | Retry once after 3s | *"Service temporarily unavailable. Please try again."* |

### Privacy & Secret Protection on Errors:
Under NO circumstances will Make.com forward:
- Python tracebacks
- SQLAlchemy database errors
- PostgreSQL connection strings
- Gemini API keys or `SKILL` secret values
- Internal server IP addresses

---

## 6. Step-by-Step Manual Make.com Setup Guide

If direct API import into your Make.com organization is not automated, follow these exact manual steps:

1. **Log in to Make.com**: Open [https://make.com](https://make.com) and navigate to **Scenarios**.
2. **Create New Scenario**: Click **"Create a new scenario"** in the top right.
3. **Import Blueprint**:
   - Click the three dots (`...`) at the bottom of the canvas.
   - Click **"Import Blueprint"**.
   - Select `frontend/make/skill_navigator_make_blueprint.json`.
   - All modules, connections, data mappings, and router error branches will automatically populate!
4. **Configure the Webhook**:
   - Click on **Module 1 (Custom Webhook)**.
   - Click **Add**, name it `voiceflow_worker_profile`, and click **Save**.
   - Copy the generated Webhook URL (e.g. `https://hook.eu1.make.com/abc123xyz...`).
5. **Configure the HTTP Module**:
   - Click on **Module 3 (HTTP - Make a request)**.
   - In the **URL** field, replace `{{BACKEND_BASE_URL}}` with your public HTTPS backend URL (e.g. `https://api.yourdomain.com` or your Cloudflare Tunnel URL).
   - Verify Method is set to `POST`.
   - Verify Headers contain `Content-Type: application/json`.
6. **Activate Scenario**:
   - Toggle the scheduling switch in the lower left from **OFF** to **ON**.
   - Select **"Immediately as data arrives"**.
7. **Wire Voiceflow**:
   - In Voiceflow Creator, open the assistant canvas.
   - Click on `READY_FOR_RECOMMENDATION_API`.
   - Set the API Request URL to the copied Make.com webhook URL.
   - Click **Publish**.

---

## 7. Phase 6.3 Boundary with Bhashini

- **Phase 6.2 Role**: Connects textual conversation intake in Voiceflow to the FastAPI backend through Make.com.
- **Phase 6.3 Role (Upcoming)**: Adds Bhashini speech-to-text (ASR), text-to-speech (TTS), and machine translation (MT) around the Voiceflow interface for native Kannada and Hindi voice interaction.
- Phase 6.2 remains completely independent of Bhashini API keys or endpoints.
