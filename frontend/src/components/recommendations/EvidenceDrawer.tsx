import React, { useState } from 'react';
import { ShieldCheck, ChevronDown, ExternalLink, BookOpen } from 'lucide-react';
import { ValidatedEvidenceRecord } from '../../types/recommendation';
import { useLanguage } from '../../context/LanguageContext';

interface EvidenceDrawerProps {
  evidence: ValidatedEvidenceRecord[];
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ evidence }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (!evidence || evidence.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-border/80 shadow-soft overflow-hidden my-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-brand-surface/40 hover:bg-brand-surface text-left transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-brand-text-dark">
                {t.evidenceBacked}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-soft-mint text-brand-dark-teal">
                {evidence.length} Verified Sources
              </span>
            </div>
            <p className="text-[11px] text-brand-text-muted">
              {t.evidenceSub}
            </p>
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-brand-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="p-5 border-t border-brand-border/60 divide-y divide-brand-border/40 space-y-4">
          {evidence.map((ev, index) => (
            <div key={index} className={index > 0 ? 'pt-4' : ''}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark-teal">
                  <BookOpen className="w-3.5 h-3.5 text-brand-deep-teal flex-shrink-0" />
                  <span>{ev.authority}</span>
                </div>
                {ev.source_url && (
                  <a
                    href={ev.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-brand-deep-teal hover:underline flex items-center gap-1 flex-shrink-0"
                  >
                    <span>View Gazette</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <blockquote className="text-xs text-brand-text-muted italic border-l-2 border-brand-pastel-green pl-3 my-2 leading-relaxed bg-brand-surface/30 py-1">
                "{ev.excerpt}"
              </blockquote>

              {ev.page_or_section && (
                <span className="text-[10px] text-brand-text-muted/80 block">
                  Reference: {ev.page_or_section}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
