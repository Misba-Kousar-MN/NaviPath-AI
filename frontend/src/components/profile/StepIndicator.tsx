import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface StepIndicatorProps {
  currentStep: number; // 1, 2, 3, 4
  onStepClick?: (step: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  const { t } = useLanguage();

  const steps = [
    { num: 1, label: t.stepWorkGoal },
    { num: 2, label: t.stepLocation },
    { num: 3, label: t.stepReview },
    { num: 4, label: t.resultsHeading },
  ];

  return (
    <div className="w-full max-w-xl mx-auto mb-8 px-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-brand-border -z-0" />
        <div
          className="absolute left-6 top-4 -translate-y-1/2 h-0.5 bg-brand-deep-teal transition-all duration-300 -z-0"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isCompleted = step.num < currentStep;
          const isCurrent = step.num === currentStep;

          return (
            <div key={step.num} className="flex flex-col items-center relative z-10">
              <button
                type="button"
                disabled={!isCompleted && !isCurrent}
                onClick={() => isCompleted && onStepClick?.(step.num)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-brand-deep-teal text-white shadow-soft cursor-pointer'
                    : isCurrent
                    ? 'bg-white text-brand-dark-teal border-2 border-brand-deep-teal shadow-soft ring-4 ring-brand-soft-mint'
                    : 'bg-brand-surface text-brand-text-muted border border-brand-border cursor-not-allowed'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.num}
              </button>
              <span
                className={`mt-2 text-[11px] sm:text-xs font-medium text-center ${
                  isCurrent ? 'text-brand-dark-teal font-semibold' : 'text-brand-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
