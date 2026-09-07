import React from 'react';
import { ArrowRight, Briefcase, Zap, GraduationCap } from 'lucide-react';
import { RecommendationResponse } from '../../types/recommendation';
import { useLanguage } from '../../context/LanguageContext';

interface PathwayTimelineProps {
  recommendation: RecommendationResponse;
}

export const PathwayTimeline: React.FC<PathwayTimelineProps> = ({ recommendation }) => {
  const { t } = useLanguage();

  const currentWork =
    recommendation.matched_occupation?.name_en ||
    recommendation.profile.occupation ||
    'Informal Worker';

  const primaryPathway = recommendation.recommended_pathways?.[0];
  const targetSkill =
    primaryPathway?.target_skill.name_en ||
    recommendation.skill_gaps?.[0]?.skill_name ||
    'Certified Technical Trade';

  const primaryCourse =
    recommendation.courses?.[0]?.title ||
    primaryPathway?.courses?.[0]?.title ||
    'Accredited Government Skill Course';

  return (
    <div className="bg-gradient-to-br from-brand-soft-mint/30 via-white to-brand-aqua-breeze/20 border border-brand-pastel-green/80 rounded-3xl p-6 sm:p-8 shadow-soft mb-8">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-brand-deep-teal text-white flex items-center justify-center">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-brand-text-dark">
            {t.resultsHeading}
          </h2>
          <p className="text-xs text-brand-text-muted">
            {primaryPathway?.rationale || 'Suggested upward mobility pathway based on verified occupational taxonomy.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {/* Node 1: Current Work */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-soft relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider">
                {t.currentWork}
              </span>
              <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-brand-text-dark">
              {currentWork}
            </div>
            <div className="text-xs text-brand-text-muted mt-1">
              {recommendation.matched_occupation?.sector || recommendation.profile.district}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center gap-1.5 text-xs text-brand-dark-teal font-medium">
            <span>Starting point</span>
          </div>
        </div>

        {/* Node 2: Suggested Next Skill */}
        <div className="bg-white rounded-2xl p-5 border-2 border-brand-teal-mist/50 shadow-medium relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-brand-deep-teal uppercase tracking-wider">
                {t.suggestedNextSkill}
              </span>
              <div className="w-7 h-7 rounded-lg bg-brand-soft-mint text-brand-deep-teal flex items-center justify-center">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-brand-dark-teal">
              {targetSkill}
            </div>
            <div className="text-xs text-brand-text-muted mt-1">
              {primaryPathway?.target_skill.category || 'High urban & state demand'}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center gap-1.5 text-xs text-brand-deep-teal font-semibold">
            <span>Target competency</span>
          </div>
        </div>

        {/* Node 3: Recommended Course */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-soft relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-brand-text-muted uppercase tracking-wider">
                {t.recommendedCourse}
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-sm font-bold text-brand-text-dark line-clamp-2">
              {primaryCourse}
            </div>
            <div className="text-xs text-brand-text-muted mt-1">
              {recommendation.courses?.[0]?.certifying_body || 'Government Accredited'}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
            <span>Verified certification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
