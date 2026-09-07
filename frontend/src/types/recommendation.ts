/**
 * AI Skill Navigator — Unified TypeScript Definitions
 * Strictly aligned with FastAPI schemas in backend/app/schemas/recommendation.py
 * and backend/app/llm/service.py
 */

export type SupportedLanguage = 'en' | 'kn' | 'hi';
export type EligibilityVerdict = 'eligible' | 'not_eligible' | 'uncertain';
export type DistanceType = 'exact' | 'approximate' | 'district_only' | 'none';

export interface WorkerProfileIn {
  occupation: string;
  district: string;
  education?: string | null;
  language?: string | null;
  target_skill?: string | null;
  age?: number | null;
  social_security_status?: string | null;
  session_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pincode?: string | null;
  gender?: string | null;
  career_goal_text?: string | null;
  extra_attributes?: Record<string, string | number | boolean | null>;
}

export interface OccupationOut {
  id: string;
  name_en: string;
  name_hi?: string | null;
  name_kn?: string | null;
  sector: string;
  nco_code?: string | null;
  is_informal_sector?: boolean | null;
  description?: string | null;
}

export interface SkillOut {
  id: string;
  name_en: string;
  name_hi?: string | null;
  name_kn?: string | null;
  category: string;
  skill_level: string;
  is_certifiable?: boolean | null;
  certifying_body?: string | null;
  description?: string | null;
}

export interface CourseOut {
  id: string;
  title: string;
  skill_id: string;
  level?: string | null;
  duration_value?: number | null;
  duration_unit?: string | null;
  mode?: string | null;
  languages_supported?: string | null;
  certifying_body?: string | null;
  is_government_recognized?: boolean | null;
  fee_type?: string | null;
  fee_amount_inr?: number | null;
  source_id: string;
  last_verified?: string | null;
  provider?: string | null;
}

export interface MappedCourseOut {
  course_id: string;
  course_title: string;
  freshness_flag?: string | null;
  batch_schedule_note?: string | null;
}

export interface NearbyTrainingCentreOut {
  id: string;
  name: string;
  centre_name?: string | null;
  type?: string | null;
  district: string;
  taluk?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  recognition_status?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  distance_km?: number | null;
  distance_type?: DistanceType | string | null;
  mapped_courses?: MappedCourseOut[];
}

export interface SkillTransitionOut {
  target_skill: SkillOut;
  bridge_skills: SkillOut[];
  rationale: string;
  confidence?: string | null;
  courses: CourseOut[];
  centres: NearbyTrainingCentreOut[];
}

export interface SkillGapOut {
  skill_id: string;
  skill_name: string;
  skill_category?: string | null;
  gap_type?: 'target' | 'bridge' | string;
  rationale?: string | null;
  has_it: boolean;
  courses?: CourseOut[];
  how_to_close?: string | null;
}

export interface SchemeDocumentOut {
  document_id: string;
  document_name: string;
  scheme_id?: string | null;
  mandatory?: boolean | null;
  description?: string | null;
  issuing_authority?: string | null;
  how_to_obtain?: string | null;
  name_kn?: string | null;
}

export interface SchemeOut {
  id: string;
  name_en: string;
  name_hi?: string | null;
  name_kn?: string | null;
  issuing_authority: string;
  scheme_type?: string | null;
  benefit_summary?: string | null;
  official_url?: string | null;
  status?: string | null;
  last_verified?: string | null;
  documents?: SchemeDocumentOut[];
}

export interface RuleResultOut {
  rule_id: string;
  field_path: string;
  human_readable_condition?: string;
  condition?: string;
  result: 'pass' | 'fail' | 'unknown' | string;
  mandatory?: boolean | null;
}

export interface SchemeEligibilityResult {
  scheme_id: string;
  scheme_name: string;
  verdict: EligibilityVerdict | string;
  reasons: RuleResultOut[];
  required_documents?: SchemeDocumentOut[];
  documents?: SchemeDocumentOut[];
  evidence_citations?: Array<{
    source_id: string;
    authority: string;
    excerpt: string;
    page_or_section?: string | null;
  }>;
}

export interface CourseExplanation {
  course_id: string;
  title: string;
  why_recommended: string;
  official_details?: string | null;
}

export interface CentreExplanation {
  centre_id: string;
  name: string;
  district: string;
  distance_explanation: string;
  verified_location: boolean;
}

export interface SchemeExplanation {
  scheme_id: string;
  name: string;
  eligibility_summary: string;
  verified_benefits?: string | null;
}

export interface RecommendationExplanation {
  summary: string;
  skill_gap_explanation: string;
  pathway_explanation: string;
  course_explanations?: CourseExplanation[];
  centre_explanations?: CentreExplanation[];
  scheme_explanations?: SchemeExplanation[];
  next_steps: string[];
  limitations?: string[];
  evidence_references?: string[];
}

export interface ValidatedEvidenceRecord {
  chunk_id: string;
  source_id: string;
  authority: string;
  excerpt: string;
  source_url?: string | null;
  page_or_section?: string | null;
  is_valid?: boolean;
}

export interface RecommendationResponse {
  profile: WorkerProfileIn;
  matched_occupation?: OccupationOut | null;
  current_skills: SkillOut[];
  recommended_pathways: SkillTransitionOut[];
  skill_gaps: SkillGapOut[];
  courses: CourseOut[];
  nearby_centres: NearbyTrainingCentreOut[];
  schemes: SchemeOut[];
  eligibility: SchemeEligibilityResult[];
  documents: SchemeDocumentOut[];
  evidence_count: number;
  warnings: string[];
  explanation?: RecommendationExplanation | null;
  validated_evidence: ValidatedEvidenceRecord[];
  explanation_status?: 'available' | 'unavailable' | 'fallback' | string;
  evidence_status?: 'retrieved' | 'empty' | 'unverified' | string;
  skill_bridge?: SkillBridgeResult | null;
}

// ===========================================================================
// Innovation 3 — Skill-Bridge & Wage-Lift Engine Types
// ===========================================================================

export interface SkillOverlapOut {
  overlap_skill_ids: string[];
  overlap_skills: SkillOut[];
  target_skill_ids: string[];
  target_skills: SkillOut[];
  overlap_count: number;
  total_target_skills: number;
  overlap_percentage: number;
}

export interface WageBenchmarkOut {
  benchmark_id: string;
  occupation_id?: string | null;
  occupation_name: string;
  employment_type: string;
  wage_type: 'salary' | 'earning' | string;
  monthly_min_inr?: number | null;
  monthly_median_inr?: number | null;
  monthly_max_inr?: number | null;
  currency: string;
  data_period?: string | null;
  geography_level: string;
  district?: string | null;
  state?: string | null;
  source_id: string;
  source_title: string;
  source_url?: string | null;
  confidence: string;
  disclaimer: string;
  notes?: string | null;
  data_status?: string | null;
  source_label?: string | null;
  verified?: boolean;
}

export interface WageOccupationSummary {
  occupation: string;
  monthly_wage_inr?: number | null;
  status?: string;
}

export interface WageLiftOut {
  current_benchmark?: WageBenchmarkOut | null;
  target_benchmark?: WageBenchmarkOut | null;
  // Legacy field names (still present on some endpoints)
  absolute_lift_inr?: number | null;
  percentage_lift?: number | null;
  // Innovation 3 extended field names (canonical)
  absolute_difference_inr?: number | null;
  percentage_difference?: number | null;
  available?: boolean;
  current?: WageOccupationSummary | null;
  target?: WageOccupationSummary | null;
  unit?: string;
  data_status?: string | null;
  source_label?: string | null;
  status: 'available' | 'partial' | 'not_available' | string;
  disclaimer: string;
}

export interface PathwayScoreOut {
  total_score: number;
  label: 'Low' | 'Moderate' | 'Good' | 'Strong' | string;
  overlap_component: number;
  gap_component: number;
  transition_component: number;
  training_component: number;
  centre_component: number;
  explanation: string;
}

export interface SchemeOut {
  id: string;
  name_en: string;
  name_hi?: string | null;
  name_kn?: string | null;
  issuing_authority: string;
  scheme_type?: string | null;
  benefit_summary?: string | null;
  official_url?: string | null;
  status?: string | null;
}

export interface RuleResult {
  rule_id: string;
  description: string;
  passed: boolean;
  detail?: string | null;
}

export interface SchemeEligibilityResult {
  scheme_id: string;
  scheme_name: string;
  verdict: EligibilityVerdict | string;
  reasons: RuleResult[];
  disclaimer?: string | null;
}

export interface SkillBridgePathway {
  transition_id: string;
  pathway_type: 'direct' | 'bridge' | string;
  confidence?: string | null;
  confidence_note: string;
  current_occupation?: OccupationOut | null;
  target_occupation?: OccupationOut | null;
  target_skill: SkillOut;
  current_skills: SkillOut[];
  skill_overlap: SkillOverlapOut;
  skill_gaps: SkillGapOut[];
  bridge_skills: SkillOut[];
  courses: CourseOut[];
  nearby_centres: NearbyTrainingCentreOut[];
  // Innovation 3 — Scheme, Eligibility, Certification
  scheme?: SchemeOut | null;
  eligibility?: SchemeEligibilityResult | null;
  certification_status?: string | null;
  wage_lift: WageLiftOut;
  pathway_score: PathwayScoreOut;
  rationale: string;
  market_demand_note?: string | null;
  next_action?: string | null;
}

export interface SkillBridgeResult {
  current_occupation?: OccupationOut | null;
  current_skills: SkillOut[];
  pathways: SkillBridgePathway[];
  warnings: string[];
}

export interface PathwayComparisonField {
  label: string;
  pathway_a_value: string | number | null;
  pathway_b_value: string | number | null;
}

export interface SkillBridgeComparison {
  pathway_a: SkillBridgePathway;
  pathway_b: SkillBridgePathway;
  recommendation: string;
  comparison_fields: PathwayComparisonField[];
}

export interface SkillBridgeCompareRequest {
  occupation: string;
  target_skill_a: string;
  target_skill_b: string;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
}


