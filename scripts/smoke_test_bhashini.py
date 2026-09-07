"""Safe Bhashini smoke test / connectivity verification script.

Behaves safely:
- If credentials are not configured or BHASHINI_ENABLED is false:
  Prints 'BHASHINI NOT CONFIGURED — LIVE SMOKE TEST SKIPPED' and exits 0 cleanly.
- If credentials exist:
  Runs the minimal verified pipeline config check without logging or printing secrets.

Usage:
  python scripts/smoke_test_bhashini.py
"""
import asyncio
import sys
from pathlib import Path

# Ensure backend directory is on sys.path
BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.integrations.bhashini.client import BhashiniClient
from app.integrations.bhashini.config import get_bhashini_settings
from app.integrations.bhashini.exceptions import BhashiniError


async def main() -> int:
    settings = get_bhashini_settings()

    print("=" * 60)
    print("BHASHINI INTEGRATION SMOKE TEST (PHASE 6.3)")
    print("=" * 60)

    if not settings.bhashini_enabled:
        print("BHASHINI NOT CONFIGURED — LIVE SMOKE TEST SKIPPED")
        print("Reason: BHASHINI_ENABLED is false.")
        print("When credentials arrive, set BHASHINI_ENABLED=true in .env and re-run.")
        print("=" * 60)
        return 0

    if not settings.is_configured:
        print("BHASHINI NOT CONFIGURED — LIVE SMOKE TEST SKIPPED")
        print("Reason: One or more required credentials / pipelineId are empty.")
        print("When credentials arrive, update .env and re-run.")
        print("=" * 60)
        return 0

    print("Credentials detected. Executing minimal connectivity test...")
    client = BhashiniClient(settings)

    try:
        # Minimal query: check available translation pipeline tasks
        config_result = await client.get_pipeline_config(["translation"])
        print("SUCCESS: Connected to Bhashini getModelsPipeline endpoint.")
        languages = config_result.get("languages", [])
        print(f"Bhashini pipeline returned {len(languages)} supported language configurations.")
        print("LIVE BHASHINI CONNECTION VERIFIED.")
        return 0
    except BhashiniError as exc:
        print(f"FAILED: Bhashini connectivity test encountered an error: {exc.message}")
        return 1
    except Exception as exc:
        print(f"FAILED: Unexpected error: {type(exc).__name__}: {str(exc)[:100]}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
