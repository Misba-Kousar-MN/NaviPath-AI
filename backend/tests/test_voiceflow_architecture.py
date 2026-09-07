"""Phase 6.1 — Automated Validation for Voiceflow Conversation Architecture.
Validates:
1. Voiceflow project export (.vf) syntax, structure, and metadata.
2. All 14 standardized variables, types, and default values (strictly null coordinates).
3. Welcome, multilingual language selection, intake, review, and correction nodes.
4. State progression (profile_complete -> profile_confirmed -> backend_ready).
5. Integration boundary (READY_FOR_RECOMMENDATION_API) payload schema.
6. Absolute non-fabrication of GPS coordinates.
7. Strict absence of hard-coded courses, centres, schemes, or eligibility rules in Voiceflow.
8. Zero connection to Make.com or API yet (reserved for Phase 6.2).
"""
from __future__ import annotations

import json
from pathlib import Path
import pytest

VOICEFLOW_DIR = Path(__file__).resolve().parents[2] / "frontend" / "voiceflow"
VF_FILE = VOICEFLOW_DIR / "ai_skill_navigator_voiceflow.vf"
DOC_FILE = VOICEFLOW_DIR / "conversation_architecture.md"


def test_1_voiceflow_files_exist():
    """Confirms that Voiceflow export and architecture documentation files exist."""
    assert VF_FILE.exists(), f"Voiceflow project file missing at {VF_FILE}"
    assert DOC_FILE.exists(), f"Voiceflow documentation missing at {DOC_FILE}"


def test_2_voiceflow_project_is_valid_json():
    """Confirms that the .vf file parses as valid JSON."""
    with open(VF_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert isinstance(data, dict)
    assert data.get("version") == "1.0"
    assert "project" in data
    assert "variables" in data
    assert "diagrams" in data


def test_3_variables_completeness_and_safe_defaults():
    """Validates all 14 standardized variables and checks that coordinates are strictly null."""
    with open(VF_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    var_dict = {v["name"]: v for v in data["variables"]}
    expected_vars = {
        "language",
        "occupation",
        "career_goal_text",
        "district",
        "pincode",
        "age",
        "gender",
        "latitude",
        "longitude",
        "session_id",
        "extra_attributes",
        "profile_complete",
        "profile_confirmed",
        "backend_ready",
    }

    assert expected_vars.issubset(set(var_dict.keys())), f"Missing variables: {expected_vars - set(var_dict.keys())}"

    # Critical non-fabrication constraint: coordinates MUST default to null
    assert var_dict["latitude"]["defaultValue"] is None, "latitude must default to null"
    assert var_dict["longitude"]["defaultValue"] is None, "longitude must default to null"

    # State flags must default to false
    assert var_dict["profile_complete"]["defaultValue"] is False
    assert var_dict["profile_confirmed"]["defaultValue"] is False
    assert var_dict["backend_ready"]["defaultValue"] is False


def test_4_welcome_and_multilingual_selection():
    """Verifies welcome dialogue contains English, Kannada, and Hindi prompts."""
    with open(VF_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    nodes = data["diagrams"]["root"]["nodes"]
    welcome_node = nodes.get("node_welcome")
    assert welcome_node is not None
    dialogs = welcome_node.get("dialog", {})
    assert "en" in dialogs and "Namaskara" in dialogs["en"]
    assert "kn" in dialogs and "ನಮಸ್ಕಾರ" in dialogs["kn"]
    assert "hi" in dialogs and "नमस्कार" in dialogs["hi"]

    lang_node = nodes.get("node_language_select")
    assert lang_node is not None
    options = [opt["value"] for opt in lang_node.get("options", [])]
    assert "English" in options
    assert "Kannada" in options
    assert "Hindi" in options


def test_5_profile_intake_nodes_exist():
    """Verifies all profile collection nodes exist in the flow."""
    with open(VF_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    nodes = data["diagrams"]["root"]["nodes"]
    assert "node_occupation" in nodes
    assert "node_career_goal" in nodes
    assert "node_district" in nodes
    assert "node_pincode" in nodes
    assert "node_age" in nodes
    assert "node_gender" in nodes

    # Check that age has 14-80 range validation
    age_node = nodes["node_age"]
    assert age_node["validation"]["min"] == 14
    assert age_node["validation"]["max"] == 80


def test_6_profile_review_and_correction_flow():
    """Verifies the confirmation and correction loops."""
    with open(VF_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    nodes = data["diagrams"]["root"]["nodes"]
    review_node = nodes.get("node_profile_review")
    assert review_node is not None
    options = {opt["value"]: opt["nextId"] for opt in review_node.get("options", [])}
    assert "confirm" in options
    assert "change" in options
    assert options["confirm"] == "node_set_profile_confirmed"
    assert options["change"] == "node_correction_menu"

    correction_node = nodes.get("node_correction_menu")
    assert correction_node is not None
    correction_targets = {opt["value"]: opt["nextId"] for opt in correction_node.get("options", [])}
    assert correction_targets["change_occupation"] == "node_occupation"
    assert correction_targets["change_goal"] == "node_career_goal"
    assert correction_targets["change_district"] == "node_district"
    assert correction_targets["change_pincode"] == "node_pincode"
    assert correction_targets["change_age"] == "node_age"
    assert correction_targets["change_gender"] == "node_gender"


def test_7_state_progression_logic():
    """Verifies that profile_complete, profile_confirmed, and backend_ready are assigned in correct sequence."""
    with open(VF_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    nodes = data["diagrams"]["root"]["nodes"]

    # 1. Complete node
    complete_node = nodes.get("node_set_profile_complete")
    assert complete_node is not None
    assigns = {a["variable"]: a["value"] for a in complete_node.get("assignments", [])}
    assert assigns.get("profile_complete") is True

    # 2. Confirm node
    confirm_node = nodes.get("node_set_profile_confirmed")
    assert confirm_node is not None
    confirm_assigns = {a["variable"]: a["value"] for a in confirm_node.get("assignments", [])}
    assert confirm_assigns.get("profile_confirmed") is True
    assert confirm_assigns.get("backend_ready") is True


def test_8_ready_for_recommendation_api_boundary():
    """Verifies the READY_FOR_RECOMMENDATION_API boundary block and payload shape."""
    with open(VF_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    nodes = data["diagrams"]["root"]["nodes"]
    boundary_node = nodes.get("node_ready_for_recommendation_api")
    assert boundary_node is not None
    assert boundary_node["name"] == "READY_FOR_RECOMMENDATION_API"

    payload = boundary_node.get("payload", {})
    expected_keys = {
        "occupation",
        "career_goal_text",
        "district",
        "pincode",
        "age",
        "gender",
        "language",
        "latitude",
        "longitude",
        "session_id",
        "extra_attributes",
    }
    assert set(payload.keys()) == expected_keys
    assert payload["latitude"] is None, "latitude in payload must be null"
    assert payload["longitude"] is None, "longitude in payload must be null"


def test_9_result_and_error_placeholders():
    """Verifies loading, result, and error placeholder nodes."""
    with open(VF_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    nodes = data["diagrams"]["root"]["nodes"]
    assert "node_recommendation_loading" in nodes
    assert "node_recommendation_result" in nodes
    assert "node_recommendation_error" in nodes

    loading_dialogs = nodes["node_recommendation_loading"]["dialog"]
    assert "en" in loading_dialogs and "Please wait" in loading_dialogs["en"]
    assert "kn" in loading_dialogs and "ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇನೆ" in loading_dialogs["kn"]
    assert "hi" in loading_dialogs and "प्रतीक्षा" in loading_dialogs["hi"]


def test_10_no_backend_intelligence_duplicated_in_voiceflow():
    """Strictly checks that Voiceflow contains NO hardcoded course IDs, centres, schemes, or distances."""
    with open(VF_FILE, "r", encoding="utf-8") as f:
        raw_text = f.read().lower()

    forbidden_entities = [
        "crs-001", "crs-002", "crs-003", "crs-004", "crs-005", "crs-008",
        "tc-001", "tc-002", "tc-003",
        "sch-001", "sch-002", "sch-003", "sch-004", "sch-005",
        "st_distance", "postgis", "nsqf level",
    ]

    for entity in forbidden_entities:
        assert entity not in raw_text, f"Found forbidden backend intelligence entity '{entity}' inside Voiceflow export!"


def test_11_no_live_make_com_or_api_url_configured():
    """Confirms that no live Make.com webhook URL is wired in Phase 6.1."""
    with open(VF_FILE, "r", encoding="utf-8") as f:
        raw_text = f.read().lower()

    assert "hook.eu1.make.com" not in raw_text
    assert "hook.us1.make.com" not in raw_text
    assert "make.com/api" not in raw_text
    assert "http://localhost:8000/api/recommendations" not in raw_text
