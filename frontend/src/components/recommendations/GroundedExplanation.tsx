import React from 'react';
import { HelpCircle, CheckCircle2, ListOrdered, AlertTriangle } from 'lucide-react';
import { RecommendationExplanation } from '../../types/recommendation';
import { useLanguage } from '../../context/LanguageContext';

interface GroundedExplanationProps {
  explanation?: RecommendationExplanation | null;
}

export const GroundedExplanation: React.FC<GroundedExplanationProps> = ({ explanation }) => {
  const { t } = useLanguage();

  if (!explanation) return null;

  return (
    <div className="space-y-8 my-8">
      {/* Why this pathway section */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-soft">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-soft-mint text-brand-deep-teal flex items-center justify-center">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-text-dark">
              {t.whyThisPathway}
            </h3>
            <p className="text-xs text-brand-text-muted">
              {t.whySub}
            </p>
          </div>
        </div>

        <p className="text-sm sm:text-base text-brand-text-dark/90 leading-relaxed mb-4 bg-brand-surface/60 p-4 rounded-2xl border border-brand-border/60">
          {explanation.summary}
        </p>

        {explanation.skill_gap_explanation && (
          <div className="mb-4">
            <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-1.5">
              Skill Transition Logic
            </h4>
            <p className="text-xs sm:text-sm text-brand-text-muted leading-relaxed">
              {explanation.skill_gap_explanation}
            </p>
          </div>
        )}

        {explanation.limitations && explanation.limitations.length > 0 && (
          <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200/80 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-stone-600">
              <span className="font-semibold block text-stone-700">Advisory Note:</span>
              <ul className="list-disc list-inside space-y-0.5 mt-0.5">
                {explanation.limitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Your next steps section */}
      {explanation.next_steps && explanation.next_steps.length > 0 && (
        <div className="bg-gradient-to-br from-white to-brand-surface rounded-3xl border border-brand-border p-6 sm:p-8 shadow-soft">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-xl bg-brand-deep-teal text-white flex items-center justify-center">
              <ListOrdered className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-text-dark">
                {t.nextSteps}
              </h3>
              <p className="text-xs text-brand-text-muted">
                {t.nextStepsSub}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {explanation.next_steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-brand-border shadow-soft"
              >
                <div className="w-7 h-7 rounded-xl bg-brand-soft-mint text-brand-dark-teal flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-sm font-medium text-brand-text-dark leading-snug">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
