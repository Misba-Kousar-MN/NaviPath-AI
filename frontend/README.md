# /frontend — Member 2 territory (Conversational UX)

**Not implemented yet.** Implementation begins during the 24-hour sprint.

Owns:
- Voiceflow dialogue flow (profile intake → calls `POST /api/v1/advice` → renders response)
- Bhashini wiring for Kannada/Hindi speech-to-text, text-to-speech, and translation
- Optional Bubble/Glide web view rendering the same contract
- Language switching UX
- Rendering of `training_centres`, `financial_support`, `eligibility`, `next_steps`, `evidence` sections
- Uncertain/error-state UX driven by the `warnings` and `confidence` fields

**Hard rule:** this layer never queries PostgreSQL directly and never calls the LLM directly for facts. It only consumes `backend/contracts/response_contract.example.json` (see [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) Section J/L). Until the real backend exists, build and test against the five golden test cases in Architecture Section N, hand-filled as fixture JSON.
