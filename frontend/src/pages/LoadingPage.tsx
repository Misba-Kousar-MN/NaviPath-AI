import React, { useState, useEffect } from 'react';
import { Compass, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LoadingPage: React.FC = () => {
  const { t } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    t.loadingStep1,
    t.loadingStep2,
    t.loadingStep3,
    t.loadingStep4,
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);

    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fadeIn">
      {/* Animated Pulsing Icon */}
      <div className="relative w-20 h-20 mx-auto mb-8">
        <div className="absolute inset-0 rounded-3xl bg-brand-aqua-breeze/40 animate-ping" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-deep-teal to-brand-teal-mist text-white flex items-center justify-center shadow-lifted">
          <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-brand-text-dark mb-2">
        {t.loadingTitle}
      </h2>
      <p className="text-xs text-brand-text-muted mb-8 max-w-sm mx-auto">
        Analyzing occupational pathways and matching government accredited opportunities in Karnataka.
      </p>

      {/* Progressive Step Indicators */}
      <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-soft text-left space-y-3.5 max-w-md mx-auto">
        {steps.map((step, index) => {
          const isDone = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                index <= currentStepIndex ? 'opacity-100' : 'opacity-30'
              }`}
            >
              {isDone ? (
                <div className="w-5 h-5 rounded-full bg-brand-soft-mint text-brand-deep-teal flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : isCurrent ? (
                <div className="w-5 h-5 rounded-full border-2 border-brand-deep-teal border-t-transparent animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-brand-border bg-brand-surface flex-shrink-0" />
              )}

              <span
                className={`text-xs ${
                  isCurrent
                    ? 'font-semibold text-brand-dark-teal'
                    : isDone
                    ? 'font-medium text-brand-text-dark'
                    : 'text-brand-text-muted'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
