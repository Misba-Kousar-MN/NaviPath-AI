import React from 'react';
import { GitCompare, X, Award, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';
import { SkillBridgePathway } from '../../types/recommendation';
import { Badge } from '../ui/Badge';

interface PathwayComparisonProps {
  pathwayA: SkillBridgePathway;
  pathwayB: SkillBridgePathway;
  onClose: () => void;
}

export const PathwayComparison: React.FC<PathwayComparisonProps> = ({
  pathwayA,
  pathwayB,
  onClose,
}) => {
  const scoreA = pathwayA.pathway_score.total_score;
  const scoreB = pathwayB.pathway_score.total_score;

  const winner =
    scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'TIE';

  return (
    <div className="bg-white rounded-3xl border-2 border-brand-deep-teal/30 p-5 sm:p-6 shadow-medium mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-brand-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-aqua-breeze/40 border border-brand-teal-mist/60 flex items-center justify-center text-brand-dark-teal">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-black text-brand-text-dark">
              Career Pathway Comparison
            </h3>
            <p className="text-xs text-brand-text-muted">
              Side-by-side deterministic feasibility analysis
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Recommendation Banner */}
      <div className="my-4 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/70 text-xs flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-emerald-900 block mb-0.5">
            Deterministic Recommendation:
          </span>
          <span className="text-emerald-800">
            {winner === 'A'
              ? `${pathwayA.target_occupation?.name_en || pathwayA.target_skill.name_en} scores higher in overall feasibility (${scoreA} vs ${scoreB} pts) due to greater skill overlap and faster path to certification.`
              : winner === 'B'
              ? `${pathwayB.target_occupation?.name_en || pathwayB.target_skill.name_en} scores higher in overall feasibility (${scoreB} vs ${scoreA} pts) due to greater skill overlap and faster path to certification.`
              : `Both pathways offer comparable feasibility scores (${scoreA} pts). Consider your wage uplift goals and personal preference.`}
          </span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs">
        {/* Metric Label Column */}
        <div className="space-y-3 font-semibold text-brand-text-muted pt-10">
          <div className="py-1">Sector</div>
          <div className="py-1">Feasibility Score</div>
          <div className="py-1">Skill Overlap</div>
          <div className="py-1">Skills to Learn</div>
          <div className="py-1">Intermediate Bridge Skills</div>
          <div className="py-1">Courses Available</div>
          <div className="py-1">Training Centres</div>
          <div className="py-1">Indicative Median Wage</div>
          <div className="py-1">Monthly Wage Lift</div>
          <div className="py-1">Confidence / Status</div>
        </div>

        {/* Pathway A Column */}
        <div className={`p-3 rounded-2xl border transition-all ${
          winner === 'A' ? 'bg-emerald-50/30 border-emerald-300 shadow-soft' : 'bg-brand-surface/40 border-brand-border/60'
        }`}>
          <div className="mb-3 text-center">
            {winner === 'A' && (
              <Badge variant="success" size="sm" className="mb-1">
                ★ Higher Score
              </Badge>
            )}
            <h4 className="font-extrabold text-brand-text-dark text-sm sm:text-base truncate">
              {pathwayA.target_occupation?.name_en || pathwayA.target_skill.name_en}
            </h4>
            <span className="text-[10px] text-brand-text-muted block">Option A</span>
          </div>

          <div className="space-y-3 text-center text-brand-text-dark">
            <div className="py-1 text-brand-text-muted">{pathwayA.target_occupation?.sector || '—'}</div>
            <div className="py-1 font-extrabold text-brand-dark-teal text-base">
              {scoreA} / 100
            </div>
            <div className="py-1 font-bold text-brand-dark-teal">
              {pathwayA.skill_overlap.overlap_percentage.toFixed(0)}%
            </div>
            <div className="py-1 font-semibold text-amber-800">{pathwayA.skill_gaps.length}</div>
            <div className="py-1">{pathwayA.bridge_skills.length}</div>
            <div className="py-1">{pathwayA.courses.length}</div>
            <div className="py-1">{pathwayA.nearby_centres.length}</div>
            <div className="py-1 font-bold">
              {(pathwayA.wage_lift.target_benchmark?.monthly_median_inr ?? pathwayA.wage_lift.target?.monthly_wage_inr)
                ? `₹${(pathwayA.wage_lift.target_benchmark?.monthly_median_inr ?? pathwayA.wage_lift.target?.monthly_wage_inr ?? 0).toLocaleString('en-IN')}`
                : 'Pending'}
            </div>
            <div className="py-1 font-extrabold text-emerald-800">
              {(() => { const lift = pathwayA.wage_lift.absolute_difference_inr ?? pathwayA.wage_lift.absolute_lift_inr; return lift != null ? `+₹${lift.toLocaleString('en-IN')}` : '—'; })()}
            </div>
            <div className="py-1 capitalize text-[11px] text-brand-text-muted">
              {pathwayA.confidence || 'Heuristic'}
            </div>
          </div>
        </div>

        {/* Pathway B Column */}
        <div className={`p-3 rounded-2xl border transition-all ${
          winner === 'B' ? 'bg-emerald-50/30 border-emerald-300 shadow-soft' : 'bg-brand-surface/40 border-brand-border/60'
        }`}>
          <div className="mb-3 text-center">
            {winner === 'B' && (
              <Badge variant="success" size="sm" className="mb-1">
                ★ Higher Score
              </Badge>
            )}
            <h4 className="font-extrabold text-brand-text-dark text-sm sm:text-base truncate">
              {pathwayB.target_occupation?.name_en || pathwayB.target_skill.name_en}
            </h4>
            <span className="text-[10px] text-brand-text-muted block">Option B</span>
          </div>

          <div className="space-y-3 text-center text-brand-text-dark">
            <div className="py-1 text-brand-text-muted">{pathwayB.target_occupation?.sector || '—'}</div>
            <div className="py-1 font-extrabold text-brand-dark-teal text-base">
              {scoreB} / 100
            </div>
            <div className="py-1 font-bold text-brand-dark-teal">
              {pathwayB.skill_overlap.overlap_percentage.toFixed(0)}%
            </div>
            <div className="py-1 font-semibold text-amber-800">{pathwayB.skill_gaps.length}</div>
            <div className="py-1">{pathwayB.bridge_skills.length}</div>
            <div className="py-1">{pathwayB.courses.length}</div>
            <div className="py-1">{pathwayB.nearby_centres.length}</div>
            <div className="py-1 font-bold">
              {(pathwayB.wage_lift.target_benchmark?.monthly_median_inr ?? pathwayB.wage_lift.target?.monthly_wage_inr)
                ? `₹${(pathwayB.wage_lift.target_benchmark?.monthly_median_inr ?? pathwayB.wage_lift.target?.monthly_wage_inr ?? 0).toLocaleString('en-IN')}`
                : 'Pending'}
            </div>
            <div className="py-1 font-extrabold text-emerald-800">
              {(() => { const lift = pathwayB.wage_lift.absolute_difference_inr ?? pathwayB.wage_lift.absolute_lift_inr; return lift != null ? `+₹${lift.toLocaleString('en-IN')}` : '—'; })()}
            </div>
            <div className="py-1 capitalize text-[11px] text-brand-text-muted">
              {pathwayB.confidence || 'Heuristic'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
