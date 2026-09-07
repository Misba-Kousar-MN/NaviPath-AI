import React from 'react';
import { Target, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { SkillGapOut } from '../../types/recommendation';
import { Badge } from '../ui/Badge';

interface SkillGapCardProps {
  gap: SkillGapOut;
}

export const SkillGapCard: React.FC<SkillGapCardProps> = ({ gap }) => {
  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 sm:p-5 shadow-soft hover:shadow-medium transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant={gap.gap_type === 'target' ? 'teal' : 'mint'} size="sm">
            {gap.gap_type === 'target' ? 'Primary Target' : 'Bridge Skill'}
          </Badge>
          {gap.skill_category && (
            <span className="text-[11px] text-brand-text-muted">
              {gap.skill_category}
            </span>
          )}
        </div>

        <h4 className="text-base font-bold text-brand-text-dark mb-1">
          {gap.skill_name}
        </h4>

        {gap.rationale && (
          <p className="text-xs text-brand-text-muted leading-relaxed mb-3">
            {gap.rationale}
          </p>
        )}
      </div>

      {gap.how_to_close && (
        <div className="mt-3 pt-3 border-t border-brand-border/60 flex items-start gap-2 text-xs text-brand-dark-teal bg-brand-surface/60 rounded-xl p-2.5">
          <CheckCircle2 className="w-4 h-4 text-brand-deep-teal flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">How to build this:</span>
            <span className="text-brand-text-muted">{gap.how_to_close}</span>
          </div>
        </div>
      )}
    </div>
  );
};
