"""LLM Explanation and Personalization Service (Phase 4).
Generates grounded worker-facing explanations exclusively from deterministic facts
and validated RAG evidence using Gemini. Never hallucinates courses, centres, schemes, or eligibility.
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
from dataclasses import asdict, dataclass
from typing import Any, Sequence

from pydantic import BaseModel, Field

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover
    genai = None
    types = None

from app.core.config import get_settings
from app.rag.embedding import MissingApiKeyError
from app.rag.validator import ValidatedEvidence

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are an explanation and personalization layer for a grounded skill-navigation system for informal workers in Karnataka, India.

Your primary duty is absolute truthfulness, empathy, and strict fidelity to the provided context.

You must use ONLY the supplied deterministic facts and validated official documentary evidence.

STRICT NEGATIVE CONSTRAINTS:
1. You MUST NOT invent or recommend any course not present in the supplied course list.
2. You MUST NOT invent any training centre not present in the supplied training centres list.
3. You MUST NOT invent or guess any distance, travel time, or geographic coordinate. If a centre's distance is null/unresolved, clearly state that distance is not available for this centre.
4. You MUST NOT alter or contradict any deterministic eligibility verdict. If eligibility is false or unknown, state it exactly as given.
5. You MUST NOT invent schemes, stipend amounts, loan terms, toolkit grants, or eligibility conditions not stated in the verified evidence.
6. If information is missing or not verified, explicitly state: "That information is not available in the current verified data."
7. You MUST distinguish clearly between database facts, official cited evidence, and supportive explanatory phrasing.
8. If the worker requested a specific language (e.g. Kannada, Hindi, English), reply in that language with warmth and clarity, but NEVER change factual numbers, course names, or identifiers.

OUTPUT FORMAT:
You must respond with a valid, clean JSON object conforming strictly to the requested schema. Do not enclose in markdown code fences.
"""


class CourseExplanation(BaseModel):
    course_id: str
    title: str
    why_recommended: str
    official_details: str | None = None


class CentreExplanation(BaseModel):
    centre_id: str
    name: str
    district: str
    distance_explanation: str
    verified_location: bool


class SchemeExplanation(BaseModel):
    scheme_id: str
    name: str
    eligibility_summary: str
    verified_benefits: str | None = None


class RecommendationExplanation(BaseModel):
    summary: str = Field(description="Warm, worker-facing summary of the recommended career pathway")
    skill_gap_explanation: str = Field(description="Clear explanation of the skill gap identified between current and target trade")
    pathway_explanation: str = Field(description="Explanation of why this transition pathway is viable and beneficial")
    course_explanations: list[CourseExplanation] = Field(default_factory=list)
    centre_explanations: list[CentreExplanation] = Field(default_factory=list)
    scheme_explanations: list[SchemeExplanation] = Field(default_factory=list)
    next_steps: list[str] = Field(default_factory=list, description="Actionable, sequential next steps for the worker")
    limitations: list[str] = Field(default_factory=list, description="Honest disclaimers regarding unverified data or missing evidence")
    evidence_references: list[str] = Field(default_factory=list, description="Cited chunk IDs supporting this explanation")


class LLMExplanationService:
    """Isolated service generating grounded explanations via Gemini."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        client: genai.Client | None = None,
    ) -> None:
        settings = get_settings()
        self.model = model or getattr(settings, "llm_model", "gemini-3.6-flash")

        raw_key = (
            api_key
            or os.getenv("SKILL")
            or settings.skill
        )
        if not raw_key or not raw_key.strip():
            raise MissingApiKeyError("Gemini API key (SKILL) is not configured in environment.")

        self._api_key = raw_key.strip()

        if client is not None:
            self._client = client
        else:
            if genai is None:  # pragma: no cover
                raise RuntimeError("google-genai package is not installed.")
            self._client = genai.Client(api_key=self._api_key)

    def generate_explanation(
        self,
        worker_profile: dict[str, Any],
        matched_occupation: dict[str, Any] | None,
        current_skills: Sequence[dict[str, Any]],
        skill_gaps: Sequence[dict[str, Any]],
        recommended_pathways: Sequence[dict[str, Any]],
        courses: Sequence[dict[str, Any]],
        nearby_centres: Sequence[dict[str, Any]],
        schemes: Sequence[dict[str, Any]],
        eligibility: Sequence[dict[str, Any]],
        validated_evidence: Sequence[ValidatedEvidence],
        language: str = "English",
        career_goal_text: str | None = None,
        skill_bridge: dict[str, Any] | None = None,
    ) -> RecommendationExplanation:
        """Constructs bounded prompt and invokes Gemini LLM to generate grounded explanation."""
        # 1. Build bounded context
        prompt = self._build_context_prompt(
            worker_profile=worker_profile,
            matched_occupation=matched_occupation,
            current_skills=current_skills,
            skill_gaps=skill_gaps,
            recommended_pathways=recommended_pathways,
            courses=courses,
            nearby_centres=nearby_centres,
            schemes=schemes,
            eligibility=eligibility,
            validated_evidence=validated_evidence,
            language=language,
            career_goal_text=career_goal_text,
            skill_bridge=skill_bridge,
        )

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.2,  # Low temperature for strict factual grounding
            response_mime_type="application/json",
            response_schema=RecommendationExplanation,
        ) if types else None

        start_time = time.perf_counter()
        logger.info(
            "LLM explanation generation started",
            extra={
                "event": "llm_generation_started",
                "operation": "generate_explanation",
                "model": self.model,
                "language": language,
            },
        )

        try:
            response = self._client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config,
            )

            raw_text = getattr(response, "text", "") or ""
            parsed = self._parse_json_response(raw_text)
            result = RecommendationExplanation.model_validate(parsed)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.info(
                "LLM explanation generation completed successfully in %.2fms",
                duration_ms,
                extra={
                    "event": "llm_generation_completed",
                    "operation": "generate_explanation",
                    "model": self.model,
                    "duration_ms": duration_ms,
                    "success": True,
                },
            )
            return result

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            # Safe logging: never leak API keys
            logger.error(
                "LLM explanation generation failed: %s",
                str(exc)[:120],
                extra={
                    "event": "llm_generation_failed",
                    "operation": "generate_explanation",
                    "model": self.model,
                    "duration_ms": duration_ms,
                    "error": str(exc)[:120],
                    "fallback_status": "applied",
                },
            )
            logger.info(
                "LLM fallback explanation generated",
                extra={
                    "event": "llm_fallback_used",
                    "operation": "generate_explanation",
                },
            )
            return self._build_fallback_explanation(
                matched_occupation=matched_occupation,
                skill_gaps=skill_gaps,
                courses=courses,
                nearby_centres=nearby_centres,
                schemes=schemes,
                eligibility=eligibility,
                validated_evidence=validated_evidence,
            )

    @staticmethod
    def _parse_json_response(text_data: str) -> dict[str, Any]:
        """Safely extracts and parses JSON from model output."""
        cleaned = text_data.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        return json.loads(cleaned.strip())

    @staticmethod
    def _build_context_prompt(
        worker_profile: dict[str, Any],
        matched_occupation: dict[str, Any] | None,
        current_skills: Sequence[dict[str, Any]],
        skill_gaps: Sequence[dict[str, Any]],
        recommended_pathways: Sequence[dict[str, Any]],
        courses: Sequence[dict[str, Any]],
        nearby_centres: Sequence[dict[str, Any]],
        schemes: Sequence[dict[str, Any]],
        eligibility: Sequence[dict[str, Any]],
        validated_evidence: Sequence[ValidatedEvidence],
        language: str,
        career_goal_text: str | None,
        skill_bridge: dict[str, Any] | None = None,
    ) -> str:
        """Constructs strictly bounded, traceable context for the LLM."""
        lines = [
            f"Please generate a grounded, structured explanation for the worker in {language}.",
            "",
            "=== 1. DETERMINISTIC WORKER PROFILE ===",
            f"Occupation Input: {worker_profile.get('occupation')}",
            f"Matched Occupation: {matched_occupation.get('name_en') if matched_occupation else 'None'}",
            f"District: {worker_profile.get('district')}",
            f"Education: {worker_profile.get('education') or 'Not specified'}",
            f"Age: {worker_profile.get('age') or 'Not specified'}",
            f"Worker Career Goal: {career_goal_text or 'None specified'}",
            "",
            "=== 2. CURRENT SKILLS ===",
        ]
        for sk in current_skills:
            lines.append(f"- {sk.get('name_en', '')} (ID: {sk.get('id')})")

        lines.append("\n=== 3. DETERMINISTIC SKILL GAPS ===")
        for sg in skill_gaps:
            lines.append(f"- Gap: {sg.get('skill_name', '')} (Severity: {sg.get('severity', '')})")

        lines.append("\n=== 4. RECOMMENDED TRANSITION PATHWAYS ===")
        for p in recommended_pathways:
            target_sk = p.get("target_skill", {})
            sk_name = target_sk.get("name_en") if isinstance(target_sk, dict) else str(target_sk)
            rationale = p.get("rationale", "")
            lines.append(f"- Pathway to target skill: '{sk_name}' (Rationale: {rationale[:100]})")

        if skill_bridge and skill_bridge.get("pathways"):
            lines.append("\n=== 4B. DETERMINISTIC SKILL-BRIDGE & WAGE-LIFT PATHWAYS (DO NOT ALTER NUMBERS) ===")
            lines.append("(IMPORTANT: Wage benchmarks are mock/illustrative demo figures stamped with 'Hackathon illustrative data' — not guaranteed income. Never fabricate wages).")
            for pw in skill_bridge.get("pathways", []):
                t_occ = pw.get("target_occupation", {})
                w_lift = pw.get("wage_lift") or {}
                abs_lift = w_lift.get("absolute_difference_inr")
                if abs_lift is None:
                    abs_lift = w_lift.get("absolute_lift_inr")
                if abs_lift is None:
                    abs_lift = w_lift.get("absolute_lift_monthly_inr")

                pct_lift = w_lift.get("percentage_difference")
                if pct_lift is None:
                    pct_lift = w_lift.get("percentage_lift")
                if pct_lift is None:
                    pct_lift = w_lift.get("percentage_lift_median")

                lift_str = f"+{abs_lift} INR/mo (+{pct_lift}%)" if abs_lift is not None else "wage lift not benchmarked"
                lines.append(
                    f"- Target: {t_occ.get('name_en')} | Overlap: {pw.get('overlap_percentage')}% | "
                    f"Gaps: {len(pw.get('skill_gaps', []))} | Feasibility: {pw.get('feasibility')} | "
                    f"Wage Lift: {lift_str} (Status: {w_lift.get('data_status', 'mock')}) | "
                    f"Certification: {pw.get('certification_status')} | Next Action: {pw.get('next_action')}"
                )

        lines.append("\n=== 5. DETERMINISTIC COURSES ===")
        for c in courses:
            lines.append(f"- Course ID: {c.get('id')}, Title: {c.get('title')}, NSQF: {c.get('nsqf_level')}, Duration: {c.get('duration_hours')} hrs")

        lines.append("\n=== 6. NEARBY TRAINING CENTRES (DETERMINISTIC POSTGIS RESULTS) ===")
        for cntr in nearby_centres:
            dist = cntr.get("distance_km")
            dist_str = f"{dist:.2f} km" if dist is not None else "NULL (Unresolved location)"
            lines.append(
                f"- Centre ID: {cntr.get('id')}, Name: {cntr.get('name')}, District: {cntr.get('district')}, "
                f"Distance: {dist_str}, Distance Type: {cntr.get('distance_type', 'none')}"
            )

        lines.append("\n=== 7. SCHEMES & DETERMINISTIC ELIGIBILITY RESULTS ===")
        for el in eligibility:
            lines.append(
                f"- Scheme ID: {el.get('scheme_id')}, Name: {el.get('scheme_name')}, "
                f"Eligible Verdict: {el.get('is_eligible')}, Reason: {el.get('reason')}"
            )

        lines.append("\n=== 8. VALIDATED OFFICIAL DOCUMENTARY EVIDENCE (ONLY USE THESE CHUNKS) ===")
        if not validated_evidence:
            lines.append("NO VALIDATED DOCUMENTARY EVIDENCE RETRIEVED.")
        else:
            for ev in validated_evidence:
                if ev.is_valid:
                    lines.append(
                        f"[Evidence {ev.chunk_id} | Source: {ev.source_id} | Authority: {ev.authority} | URL: {ev.source_url}]\n"
                        f"{ev.chunk_text}\n"
                    )

        return "\n".join(lines)

    @staticmethod
    def _build_fallback_explanation(
        matched_occupation: dict[str, Any] | None,
        skill_gaps: Sequence[dict[str, Any]],
        courses: Sequence[dict[str, Any]],
        nearby_centres: Sequence[dict[str, Any]],
        schemes: Sequence[dict[str, Any]],
        eligibility: Sequence[dict[str, Any]],
        validated_evidence: Sequence[ValidatedEvidence],
    ) -> RecommendationExplanation:
        """Deterministic fallback when LLM API call is unavailable or unparseable."""
        occ_name = matched_occupation.get("name_en") if matched_occupation else "your occupation"
        gap_names = [sg.get("skill_name", "") for sg in skill_gaps if sg.get("skill_name")]
        gap_str = ", ".join(gap_names) if gap_names else "no critical skill gaps identified"

        c_expls = [
            CourseExplanation(
                course_id=c.get("id", ""),
                title=c.get("title", ""),
                why_recommended=f"Addresses core competencies required for career progression from {occ_name}.",
            )
            for c in courses
        ]

        cntr_expls = [
            CentreExplanation(
                centre_id=cntr.get("id", ""),
                name=cntr.get("name", ""),
                district=cntr.get("district", ""),
                distance_explanation=(
                    f"Located {cntr['distance_km']:.1f} km away ({cntr.get('distance_type', 'exact')} calculation)."
                    if cntr.get("distance_km") is not None
                    else "Location coordinates are currently unresolved; verified distance is not available."
                ),
                verified_location=cntr.get("distance_km") is not None,
            )
            for cntr in nearby_centres
        ]

        sch_expls = [
            SchemeExplanation(
                scheme_id=el.get("scheme_id", ""),
                name=el.get("scheme_name", ""),
                eligibility_summary=f"Deterministic eligibility verdict: {el.get('verdict', 'unknown')}",
            )
            for el in eligibility
        ]

        ev_refs = [ev.chunk_id for ev in validated_evidence if ev.is_valid]

        return RecommendationExplanation(
            summary=f"Career transition pathway recommendation based on verified database records for {occ_name}.",
            skill_gap_explanation=f"Identified transition skill gaps: {gap_str}.",
            pathway_explanation="Structured pathway matching target technical skills and certified vocational curriculum.",
            course_explanations=c_expls,
            centre_explanations=cntr_expls,
            scheme_explanations=sch_expls,
            next_steps=[
                "Review the recommended courses and syllabus details.",
                "Visit or contact the nearest verified training centre.",
                "Apply for government skilling and welfare schemes where eligible.",
            ],
            limitations=[
                "Unresolved training centres lack verified geographic coordinates.",
                "Official documentary evidence is cited from verified government repositories.",
            ],
            evidence_references=ev_refs,
        )
