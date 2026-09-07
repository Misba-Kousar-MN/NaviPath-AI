import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  MapPin,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SkillBridgePathway } from '../../types/recommendation';
import { Badge } from '../ui/Badge';
import { WageLiftCard } from './WageLiftCard';

interface SkillBridgeCardProps {
  pathway: SkillBridgePathway;
  currentOccupationName?: string;
  onSelectForComparison?: (pathway: SkillBridgePathway) => void;
  isComparisonSelected?: boolean;
}

export const SkillBridgeCard: React.FC<SkillBridgeCardProps> = ({
  pathway,
  currentOccupationName,
  onSelectForComparison,
  isComparisonSelected = false,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  const {
    target_skill,
    target_occupation,
    skill_overlap,
    skill_gaps,
    bridge_skills,
    courses,
    nearby_centres,
    wage_lift,
    pathway_score,
    confidence,
    confidence_note,
    rationale,
    market_demand_note,
  } = pathway;

  const scoreVariant =
    pathway_score.label === 'Strong'
      ? 'success'
      : pathway_score.label === 'Good'
      ? 'teal'
      : pathway_score.label === 'Moderate'
      ? 'warning'
      : 'neutral';

  return (
    <div className="bg-white rounded-3xl border border-brand-border p-5 sm:p-6 shadow-soft hover:shadow-medium transition-all mb-6">
      {/* Top Banner: Target Occupation & Score */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-border/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="teal" size="sm">
              {target_occupation ? target_occupation.sector : 'Career Transition'}
            </Badge>
            {confidence && (
              <Badge variant={confidence === 'heuristic' ? 'warning' : 'mint'} size="sm">
                {confidence === 'heuristic' ? 'Heuristic Transition' : confidence}
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-extrabold text-brand-text-dark">
            {target_occupation?.name_en || target_skill.name_en}
          </h3>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Primary Target Competency:{' '}
            <span className="font-semibold text-brand-text-dark">{target_skill.name_en}</span>
          </p>
        </div>

        {/* Score Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-brand-surface border border-brand-border/80 rounded-2xl p-2.5 sm:p-3 text-right">
            <div className="text-[10px] uppercase tracking-wider font-bold text-brand-text-muted">
              Feasibility Score
            </div>
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-2xl font-black text-brand-dark-teal">
                {pathway_score.total_score}
              </span>
              <span className="text-xs text-brand-text-muted font-medium">/100</span>
              <Badge variant={scoreVariant} size="sm" className="ml-1">
                {pathway_score.label}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Rationale & Explanation */}
      <div className="my-4 text-xs text-brand-text-dark/90 leading-relaxed bg-brand-surface/50 rounded-2xl p-3.5 border border-brand-border/40">
        <div className="font-semibold text-brand-dark-teal flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          Why this bridge works
        </div>
        <p>{rationale}</p>
        {market_demand_note && (
          <p className="mt-2 text-brand-text-muted italic border-t border-brand-border/40 pt-1.5">
            📈 Market Demand: {market_demand_note}
          </p>
        )}
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5 text-center">
        {/* Overlap */}
        <div className="bg-brand-surface rounded-2xl p-3 border border-brand-border/60">
          <div className="text-[10px] text-brand-text-muted font-medium uppercase tracking-wide">
            Skill Overlap
          </div>
          <div className="text-lg font-black text-brand-dark-teal mt-0.5">
            {skill_overlap.overlap_percentage.toFixed(0)}%
          </div>
          <div className="text-[10px] text-brand-text-muted">
            {skill_overlap.overlap_count} of {skill_overlap.total_target_skills} skills
          </div>
        </div>

        {/* Gaps */}
        <div className="bg-brand-surface rounded-2xl p-3 border border-brand-border/60">
          <div className="text-[10px] text-brand-text-muted font-medium uppercase tracking-wide">
            Skills to Learn
          </div>
          <div className="text-lg font-black text-amber-700 mt-0.5">
            {skill_gaps.length}
          </div>
          <div className="text-[10px] text-brand-text-muted">
            {skill_gaps.length === 0 ? 'Fully qualified' : 'Target gaps'}
          </div>
        </div>

        {/* Courses */}
        <div className="bg-brand-surface rounded-2xl p-3 border border-brand-border/60">
          <div className="text-[10px] text-brand-text-muted font-medium uppercase tracking-wide">
            Training Courses
          </div>
          <div className="text-lg font-black text-brand-deep-teal mt-0.5">
            {courses.length}
          </div>
          <div className="text-[10px] text-brand-text-muted">
            {courses.length > 0 ? 'Verified in DB' : 'No direct course'}
          </div>
        </div>

        {/* Nearby Centres */}
        <div className="bg-brand-surface rounded-2xl p-3 border border-brand-border/60">
          <div className="text-[10px] text-brand-text-muted font-medium uppercase tracking-wide">
            Training Centres
          </div>
          <div className="text-lg font-black text-brand-deep-teal mt-0.5">
            {nearby_centres.length}
          </div>
          <div className="text-[10px] text-brand-text-muted">Available in district</div>
        </div>
      </div>

      {/* Skills Detail (Overlap vs Gap Pills) */}
      <div className="mb-5 bg-white border border-brand-border/70 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-brand-text-dark flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-dark-teal" />
            Skills Analysis for Transition
          </span>
          {skill_overlap.overlap_skills.length + skill_gaps.length > 4 && (
            <button
              onClick={() => setShowAllSkills(!showAllSkills)}
              className="text-[11px] font-semibold text-brand-dark-teal hover:underline flex items-center gap-0.5"
            >
              {showAllSkills ? 'Show less' : 'View all'}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {/* Overlapping skills worker already has */}
          {skill_overlap.overlap_skills.length > 0 && (
            <div>
              <div className="text-[10px] uppercase font-bold text-emerald-800 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Skills You Already Have ({skill_overlap.overlap_skills.length}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(showAllSkills
                  ? skill_overlap.overlap_skills
                  : skill_overlap.overlap_skills.slice(0, 3)
                ).map((sk) => (
                  <span
                    key={sk.id}
                    className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium"
                  >
                    ✓ {sk.name_en}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gaps worker needs to build */}
          {skill_gaps.length > 0 && (
            <div className="pt-2 border-t border-brand-border/50">
              <div className="text-[10px] uppercase font-bold text-amber-800 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Skills to Build ({skill_gaps.length}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(showAllSkills ? skill_gaps : skill_gaps.slice(0, 3)).map((g) => (
                  <span
                    key={g.skill_id}
                    className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-medium"
                  >
                    + {g.skill_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bridge skills (intermediate stepping-stones) */}
          {bridge_skills.length > 0 && (
            <div className="pt-2 border-t border-brand-border/50">
              <div className="text-[10px] uppercase font-bold text-teal-800 mb-1 flex items-center gap-1">
                <Compass className="w-3 h-3 text-teal-600" />
                Intermediate Bridge Skills ({bridge_skills.length}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bridge_skills.map((bs) => (
                  <span
                    key={bs.id}
                    className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-medium"
                  >
                    {bs.name_en}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Wage Lift Card */}
      <div className="mb-5">
        <WageLiftCard
          wageLift={wage_lift}
          currentOccupationName={currentOccupationName}
          targetOccupationName={target_occupation?.name_en || target_skill.name_en}
        />
      </div>

      {/* Transparent Score Breakdown Accordion */}
      <div className="border-t border-brand-border/60 pt-3 mb-3">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between text-xs text-brand-text-muted hover:text-brand-text-dark font-medium py-1"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-brand-dark-teal" />
            How this score was calculated (100% Deterministic)
          </span>
          {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showBreakdown && (
          <div className="mt-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/70 text-xs text-stone-700 space-y-2">
            <p className="text-[11px] text-stone-600 italic mb-2">
              Formula: Overlap (max 40) + Skill Gap penalty (max 20) + Transition in DB (15) + Courses (15) + Centres (10)
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex justify-between bg-white p-2 rounded-lg border border-stone-200/60">
                <span>Skill Overlap:</span>
                <span className="font-bold">{pathway_score.overlap_component} / 40 pts</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-stone-200/60">
                <span>Skill Gaps:</span>
                <span className="font-bold">{pathway_score.gap_component} / 20 pts</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-stone-200/60">
                <span>Transition Record:</span>
                <span className="font-bold">{pathway_score.transition_component} / 15 pts</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-stone-200/60">
                <span>Course Availability:</span>
                <span className="font-bold">{pathway_score.training_component} / 15 pts</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg border border-stone-200/60 col-span-2">
                <span>Training Centres in Area:</span>
                <span className="font-bold">{pathway_score.centre_component} / 10 pts</span>
              </div>
            </div>
            <p className="text-[11px] text-stone-600 mt-2 font-medium">
              Summary: {pathway_score.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Honest Confidence Disclaimer */}
      {confidence_note && (
        <div className="bg-amber-50/70 rounded-xl p-2.5 border border-amber-200/60 text-[11px] text-amber-900 leading-snug flex items-start gap-2 mb-4">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>{confidence_note}</span>
        </div>
      )}

      {/* Actions: Compare Option */}
      {onSelectForComparison && (
        <div className="flex items-center justify-end pt-2 border-t border-brand-border/40">
          <button
            onClick={() => onSelectForComparison(pathway)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isComparisonSelected
                ? 'bg-brand-dark-teal text-white shadow-soft'
                : 'bg-brand-surface text-brand-dark-teal border border-brand-border hover:bg-brand-surface-alt'
            }`}
          >
            {isComparisonSelected ? 'Selected for Comparison ✓' : 'Compare with another trade'}
          </button>
        </div>
      )}
    </div>
  );
};
