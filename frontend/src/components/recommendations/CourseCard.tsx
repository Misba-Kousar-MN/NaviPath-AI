import React from 'react';
import { GraduationCap, Clock, Award, CheckCircle } from 'lucide-react';
import { CourseOut } from '../../types/recommendation';
import { Badge } from '../ui/Badge';
import { useLanguage } from '../../context/LanguageContext';

interface CourseCardProps {
  course: CourseOut;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { t } = useLanguage();

  const isFree = course.fee_amount_inr === 0 || course.fee_type?.toLowerCase() === 'free';
  const durationText = course.duration_value
    ? `${course.duration_value} ${course.duration_unit || 'hours'}`
    : 'Short-term practical';

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-soft hover:shadow-medium transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant={isFree ? 'success' : 'neutral'} size="sm">
            {isFree ? '100% Free / Subsidized' : `₹${course.fee_amount_inr}`}
          </Badge>
          {course.level && (
            <span className="text-xs font-semibold text-brand-deep-teal px-2 py-0.5 rounded-md bg-brand-soft-mint">
              {course.level}
            </span>
          )}
        </div>

        <h4 className="text-base font-bold text-brand-text-dark mb-1.5 line-clamp-2">
          {course.title}
        </h4>

        {course.provider && (
          <p className="text-xs text-brand-text-muted mb-4 font-medium">
            {course.provider}
          </p>
        )}

        <div className="space-y-2 py-2 border-y border-brand-border/60 text-xs text-brand-text-muted">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-brand-deep-teal flex-shrink-0" />
            <span>Duration: <strong className="text-brand-text-dark">{durationText}</strong></span>
          </div>

          {course.certifying_body && (
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-brand-deep-teal flex-shrink-0" />
              <span>Certification: <strong className="text-brand-text-dark">{course.certifying_body}</strong></span>
            </div>
          )}

          {course.is_government_recognized && (
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-semibold">Government / NCVT Recognized</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-2">
        <button
          type="button"
          className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-brand-surface hover:bg-brand-soft-mint text-brand-dark-teal border border-brand-border transition-colors text-center"
        >
          {t.viewCourseDetails}
        </button>
      </div>
    </div>
  );
};
