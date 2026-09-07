# Voiceflow Project — AI Skill Navigator (Phase 6.1)

## Overview
This folder contains the complete, worker-facing Voiceflow conversational architecture for the **AI Skill Navigator for Informal Workers (Karnataka)**.

In accordance with Phase 6.1 instructions:
- **Zero decision logic exists inside Voiceflow**. All career transitions, course recommendations, centre distances, and eligibility checks are performed exclusively by the Python/FastAPI backend.
- **Zero GPS coordinate fabrication**. `latitude` and `longitude` remain `null` unless genuine hardware coordinates are provided.
- **No Make.com or API connection yet**. Reaches a clean integration boundary at `READY_FOR_RECOMMENDATION_API` with `backend_ready = true` only after `profile_confirmed = true`.

---

## Artifacts in this Folder

1. **[`ai_skill_navigator_voiceflow.vf`](./ai_skill_navigator_voiceflow.vf)**:
   - Complete Voiceflow Project JSON export file.
   - Contains all canvas nodes, prompts (English, Kannada, Hindi), variable schemas, confirmation loops, correction routing, and Phase 6.2 integration boundary hooks.
2. **[`conversation_architecture.md`](./conversation_architecture.md)**:
   - Detailed specification of the conversation lifecycle, user experience rules, validation bounds, multilingual dialogue, and Make.com payload contract.

---

## How to Import into Voiceflow Creator

1. Open [Voiceflow Creator](https://creator.voiceflow.com/) in your browser.
2. Navigate to your Workspace and click **"New Assistant"** or **"Import"**.
3. Select **"Upload .vf file"** and choose `frontend/voiceflow/ai_skill_navigator_voiceflow.vf`.
4. Voiceflow will automatically instantiate the assistant with:
   - All 14 standardized variables and defaults.
   - The primary dialogue canvas containing all 16 steps from `START` to `RECOMMENDATION_RESULT`.
   - The confirmation review loop and correction branch.
5. In the canvas, locate the `READY_FOR_RECOMMENDATION_API` block. This is the designated hook point where Phase 6.2 will connect the Make.com webhook.

---

## Variables Dictionary

| Variable Name | Default Value | Role |
|---|---|---|
| `language` | `"English"` | Presentation preference (`"English"`, `"Kannada"`, or `"Hindi"`) |
| `occupation` | `""` | Worker's current trade (free-text string) |
| `career_goal_text` | `""` | Desired skill or role (free-text string) |
| `district` | `""` | Karnataka district name (free-text string) |
| `pincode` | `null` | Optional 6-digit postal code |
| `age` | `null` | Optional numeric age (14–80) |
| `gender` | `null` | Optional gender (`"Male"`, `"Female"`, `"Other"`, or `null`) |
| `latitude` | `null` | Strictly null unless genuine GPS coordinates captured |
| `longitude` | `null` | Strictly null unless genuine GPS coordinates captured |
| `session_id` | `null` | Request session correlation ID for Make.com / FastAPI |
| `extra_attributes` | `{}` | Extensible metadata dictionary |
| `profile_complete` | `false` | Sets to `true` once required intake fields are populated |
| `profile_confirmed` | `false` | Sets to `true` only when worker clicks "Yes, continue" on review |
| `backend_ready` | `false` | Sets to `true` when profile is locked and ready for API dispatch |

---

## Conversation Lifecycle

```
START
  ↓
WELCOME
  ↓
LANGUAGE SELECTION (English / Kannada / Hindi)
  ↓
CURRENT OCCUPATION (Free text)
  ↓
CAREER / SKILL GOAL (Free text)
  ↓
DISTRICT (Free text)
  ↓
OPTIONAL PINCODE (6-digit validation or skip)
  ↓
OPTIONAL AGE (14-80 integer validation or skip)
  ↓
OPTIONAL GENDER (Choice or skip)
  ↓
SET profile_complete = true
  ↓
PROFILE REVIEW
  ├── "No, change something" → CORRECTION_FLOW (Re-ask selected field → Loop to REVIEW)
  └── "Yes, continue"
        ↓
      SET profile_confirmed = true
      SET backend_ready = true
        ↓
      READY_FOR_RECOMMENDATION_API (Phase 6.2 Make.com Webhook Boundary)
        ↓
      RECOMMENDATION_LOADING ("Please wait while I check...")
        ↓
      [PHASE 6.2 API INTEGRATION]
        ↓
      RECOMMENDATION_RESULT (Placeholder for recommendation presentation)
```
