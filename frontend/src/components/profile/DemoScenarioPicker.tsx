import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { DEMO_SCENARIOS, DemoScenario } from '../../mocks/scenarios';
import { WorkerProfileIn } from '../../types/recommendation';
import { useLanguage } from '../../context/LanguageContext';

interface DemoScenarioPickerProps {
  onSelectScenario: (scenario: DemoScenario) => void;
  activeScenarioId?: string;
}

export const DemoScenarioPicker: React.FC<DemoScenarioPickerProps> = ({
  onSelectScenario,
  activeScenarioId,
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-gradient-to-r from-brand-soft-mint/40 to-brand-aqua-breeze/30 border border-brand-pastel-green/60 rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-brand-deep-teal" />
        <span className="text-xs font-bold text-brand-dark-teal uppercase tracking-wider">
          {t.demoScenarioSelect}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {DEMO_SCENARIOS.map((sc) => {
          const isSelected = activeScenarioId === sc.id;
          return (
            <button
              key={sc.id}
              type="button"
              onClick={() => onSelectScenario(sc)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-white border-brand-deep-teal shadow-soft ring-2 ring-brand-teal-mist/30'
                  : 'bg-white/80 hover:bg-white border-brand-border text-brand-text-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-brand-deep-teal px-1.5 py-0.5 rounded bg-brand-soft-mint">
                  {sc.badge}
                </span>
                <ArrowRight className="w-3 h-3 text-brand-text-muted" />
              </div>
              <div className="text-xs font-bold text-brand-text-dark leading-tight">
                {sc.name}
              </div>
              <div className="text-[11px] text-brand-text-muted truncate mt-0.5">
                {sc.initialProfile.district} • {sc.initialProfile.education}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
