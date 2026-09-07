import React from 'react';
import { ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t border-brand-border mt-16 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 font-bold text-brand-dark-teal">
              <ShieldCheck className="w-5 h-5 text-brand-deep-teal" />
              <span>{t.appName}</span>
            </div>
            <p className="text-xs text-brand-text-muted leading-relaxed">
              {t.heroSubheading}
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-brand-text-dark tracking-wider uppercase mb-2 block">
              Information Integrity
            </span>
            <p className="text-xs text-brand-text-muted leading-relaxed">
              Pathways and course curricula are mapped against verified National Qualification Registers (NQR) and Karnataka Skill Development Corporation (KSDC) directories.
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-brand-text-dark tracking-wider uppercase mb-2 block">
              Jurisdiction & Coverage
            </span>
            <div className="flex items-center gap-1.5 text-xs text-brand-text-muted">
              <MapPin className="w-4 h-4 text-brand-deep-teal flex-shrink-0" />
              <span>Covering all 31 districts across Karnataka State.</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-brand-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-brand-text-muted">
          <p>© 2026 AI Skill Navigator — Built for Karnataka Informal Workers.</p>
          <div className="flex items-center gap-4 text-xs">
            <span>Non-commercial social initiative</span>
            <span>•</span>
            <span>Privacy First — No PII Sold</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
