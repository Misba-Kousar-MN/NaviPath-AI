import React from 'react';
import { Briefcase, Target, MapPin, Hash, Calendar, User, Edit3, ArrowRight } from 'lucide-react';
import { WorkerProfileIn } from '../types/recommendation';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';

interface ReviewPageProps {
  profile: WorkerProfileIn;
  onEdit: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ReviewPage: React.FC<ReviewPageProps> = ({
  profile,
  onEdit,
  onConfirm,
  isLoading,
}) => {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-text-dark mb-2">
          {t.reviewHeading}
        </h2>
        <p className="text-sm text-brand-text-muted">
          {t.reviewSubheading}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-soft mb-8 space-y-6">
        {/* Work & Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-brand-border/60">
          <div className="bg-brand-surface/70 rounded-2xl p-4 border border-brand-border/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-text-muted uppercase mb-1">
              <Briefcase className="w-3.5 h-3.5 text-brand-deep-teal" />
              <span>Current Work</span>
            </div>
            <p className="text-base font-bold text-brand-text-dark">
              {profile.occupation}
            </p>
          </div>

          <div className="bg-brand-surface/70 rounded-2xl p-4 border border-brand-border/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-text-muted uppercase mb-1">
              <Target className="w-3.5 h-3.5 text-brand-deep-teal" />
              <span>Goal / Interest</span>
            </div>
            <p className="text-base font-bold text-brand-dark-teal">
              {profile.career_goal_text}
            </p>
          </div>
        </div>

        {/* Location & Optional Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-brand-text-muted mb-1">
              <MapPin className="w-3 h-3 text-brand-deep-teal" />
              <span>District</span>
            </div>
            <span className="text-sm font-semibold text-brand-text-dark block">
              {profile.district}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-brand-text-muted mb-1">
              <Hash className="w-3 h-3 text-brand-deep-teal" />
              <span>Pincode</span>
            </div>
            <span className="text-sm font-semibold text-brand-text-dark block">
              {profile.pincode || 'Not specified'}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-brand-text-muted mb-1">
              <Calendar className="w-3 h-3 text-brand-deep-teal" />
              <span>Age</span>
            </div>
            <span className="text-sm font-semibold text-brand-text-dark block">
              {profile.age ? `${profile.age} years` : 'Not specified'}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-brand-text-muted mb-1">
              <User className="w-3 h-3 text-brand-deep-teal" />
              <span>Gender</span>
            </div>
            <span className="text-sm font-semibold text-brand-text-dark block">
              {profile.gender || 'Not specified'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={onEdit}
          leftIcon={<Edit3 className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          {t.editBtn}
        </Button>

        <Button
          size="lg"
          onClick={onConfirm}
          disabled={isLoading}
          rightIcon={<ArrowRight className="w-5 h-5" />}
          className="w-full sm:w-auto px-8 shadow-medium"
        >
          {t.confirmBtn}
        </Button>
      </div>
    </div>
  );
};
