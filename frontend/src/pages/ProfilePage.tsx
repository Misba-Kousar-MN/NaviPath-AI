import React, { useState } from 'react';
import { Briefcase, Target, ArrowRight, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { WorkerProfileIn } from '../types/recommendation';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';
import { DistrictSelect } from '../components/profile/DistrictSelect';
import { DemoScenarioPicker } from '../components/profile/DemoScenarioPicker';
import { DemoScenario } from '../mocks/scenarios';
import { isMockMode } from '../services/api';

interface ProfilePageProps {
  profile: WorkerProfileIn;
  onChange: (updated: WorkerProfileIn) => void;
  onNext: () => void;
  onBack: () => void;
  onSelectDemoScenario?: (scenario: DemoScenario) => void;
  activeScenarioId?: string;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  onChange,
  onNext,
  onBack,
  onSelectDemoScenario,
  activeScenarioId,
}) => {
  const { t } = useLanguage();
  const mockMode = isMockMode();

  const [showOptional, setShowOptional] = useState(
    Boolean(profile.pincode || profile.age || profile.gender)
  );

  const [errors, setErrors] = useState<{
    occupation?: string;
    career_goal_text?: string;
    district?: string;
    age?: string;
    pincode?: string;
  }>({});

  const validate = (): boolean => {
    const errs: typeof errors = {};

    if (!profile.occupation?.trim()) {
      errs.occupation = 'Please enter your current work or job title.';
    }

    if (!profile.career_goal_text?.trim()) {
      errs.career_goal_text = 'Please tell us what you would like to learn or do next.';
    }

    if (!profile.district?.trim()) {
      errs.district = 'Please select your district in Karnataka.';
    }

    if (profile.age !== null && profile.age !== undefined) {
      const numAge = Number(profile.age);
      if (isNaN(numAge) || numAge < 14 || numAge > 80) {
        errs.age = 'Age must be between 14 and 80.';
      }
    }

    if (profile.pincode && profile.pincode.trim()) {
      if (!/^\d{6}$/.test(profile.pincode.trim())) {
        errs.pincode = 'Pincode must be exactly 6 digits.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 animate-fadeIn">
      {/* Mock Mode Helper Picker */}
      {mockMode && onSelectDemoScenario && (
        <DemoScenarioPicker
          onSelectScenario={onSelectDemoScenario}
          activeScenarioId={activeScenarioId}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Occupation Free-Text Input */}
        <div className="bg-white rounded-2xl border border-brand-border p-5 sm:p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-1.5">
            <Briefcase className="w-4 h-4 text-brand-deep-teal flex-shrink-0" />
            <label htmlFor="occupation" className="text-sm font-semibold text-brand-text-dark">
              {t.occupationHeading} <span className="text-red-500">*</span>
            </label>
          </div>
          <p className="text-xs text-brand-text-muted mb-3">
            {t.occupationSubheading}
          </p>

          <input
            id="occupation"
            type="text"
            value={profile.occupation || ''}
            onChange={(e) => {
              onChange({ ...profile, occupation: e.target.value });
              if (errors.occupation) setErrors({ ...errors, occupation: undefined });
            }}
            placeholder={t.occupationPlaceholder}
            className={`w-full px-4 py-3 rounded-xl border text-sm text-brand-text-dark transition-all placeholder:text-brand-text-muted/60 focus:outline-none ${
              errors.occupation
                ? 'border-red-400 ring-2 ring-red-100'
                : 'border-brand-border focus:border-brand-deep-teal focus:ring-2 focus:ring-brand-soft-mint'
            }`}
          />
          {errors.occupation && (
            <p className="text-xs text-red-600 mt-1.5">{errors.occupation}</p>
          )}
        </div>

        {/* Career Goal Free-Text Input */}
        <div className="bg-white rounded-2xl border border-brand-border p-5 sm:p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-1.5">
            <Target className="w-4 h-4 text-brand-deep-teal flex-shrink-0" />
            <label htmlFor="career_goal" className="text-sm font-semibold text-brand-text-dark">
              {t.goalHeading} <span className="text-red-500">*</span>
            </label>
          </div>
          <p className="text-xs text-brand-text-muted mb-3">
            {t.goalSubheading}
          </p>

          <textarea
            id="career_goal"
            rows={2}
            value={profile.career_goal_text || ''}
            onChange={(e) => {
              onChange({ ...profile, career_goal_text: e.target.value });
              if (errors.career_goal_text) setErrors({ ...errors, career_goal_text: undefined });
            }}
            placeholder={t.goalPlaceholder}
            className={`w-full px-4 py-3 rounded-xl border text-sm text-brand-text-dark transition-all placeholder:text-brand-text-muted/60 focus:outline-none resize-none ${
              errors.career_goal_text
                ? 'border-red-400 ring-2 ring-red-100'
                : 'border-brand-border focus:border-brand-deep-teal focus:ring-2 focus:ring-brand-soft-mint'
            }`}
          />
          {errors.career_goal_text && (
            <p className="text-xs text-red-600 mt-1.5">{errors.career_goal_text}</p>
          )}
        </div>

        {/* District Selector */}
        <div className="bg-white rounded-2xl border border-brand-border p-5 sm:p-6 shadow-soft">
          <DistrictSelect
            value={profile.district || ''}
            onChange={(district) => {
              onChange({ ...profile, district });
              if (errors.district) setErrors({ ...errors, district: undefined });
            }}
            error={errors.district}
          />
        </div>

        {/* Collapsible Optional Details */}
        <div className="bg-white rounded-2xl border border-brand-border shadow-soft overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptional(!showOptional)}
            className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-brand-surface/50 transition-colors"
          >
            <div>
              <span className="text-sm font-semibold text-brand-text-dark block">
                {t.optionalDetails}
              </span>
              <span className="text-xs text-brand-text-muted">
                {t.optionalHint}
              </span>
            </div>
            {showOptional ? (
              <ChevronUp className="w-4 h-4 text-brand-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-brand-text-muted" />
            )}
          </button>

          {showOptional && (
            <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-brand-border/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Pincode */}
              <div>
                <label className="block text-xs font-semibold text-brand-text-dark mb-1">
                  {t.pincodeLabel}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={profile.pincode || ''}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    onChange({ ...profile, pincode: clean || null });
                    if (errors.pincode) setErrors({ ...errors, pincode: undefined });
                  }}
                  placeholder={t.pincodePlaceholder}
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-brand-text-dark focus:outline-none ${
                    errors.pincode
                      ? 'border-red-400'
                      : 'border-brand-border focus:border-brand-deep-teal focus:ring-2 focus:ring-brand-soft-mint'
                  }`}
                />
                {errors.pincode && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.pincode}</p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-brand-text-dark mb-1">
                  {t.ageLabel} (14–80)
                </label>
                <input
                  type="number"
                  min={14}
                  max={80}
                  value={profile.age ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    onChange({ ...profile, age: isNaN(val as number) ? null : val });
                    if (errors.age) setErrors({ ...errors, age: undefined });
                  }}
                  placeholder={t.agePlaceholder}
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-brand-text-dark focus:outline-none ${
                    errors.age
                      ? 'border-red-400'
                      : 'border-brand-border focus:border-brand-deep-teal focus:ring-2 focus:ring-brand-soft-mint'
                  }`}
                />
                {errors.age && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.age}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-brand-text-dark mb-1">
                  {t.genderLabel}
                </label>
                <select
                  value={profile.gender || ''}
                  onChange={(e) =>
                    onChange({ ...profile, gender: e.target.value || null })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-brand-border text-sm text-brand-text-dark bg-white focus:outline-none focus:border-brand-deep-teal focus:ring-2 focus:ring-brand-soft-mint"
                >
                  <option value="">{t.genderSelect}</option>
                  <option value="Male">{t.genderMale}</option>
                  <option value="Female">{t.genderFemale}</option>
                  <option value="Other">{t.genderOther}</option>
                  <option value="Prefer not to say">{t.genderPreferNot}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <Button variant="ghost" type="button" onClick={onBack}>
            {t.backBtn}
          </Button>

          <Button
            type="submit"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="px-8"
          >
            {t.continueBtn}
          </Button>
        </div>
      </form>
    </div>
  );
};
