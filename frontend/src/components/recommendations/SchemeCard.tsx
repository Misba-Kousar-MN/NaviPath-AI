import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, FileText, ChevronDown, ExternalLink } from 'lucide-react';
import { SchemeOut, SchemeEligibilityResult } from '../../types/recommendation';
import { Badge } from '../ui/Badge';
import { useLanguage } from '../../context/LanguageContext';

interface SchemeCardProps {
  scheme: SchemeOut;
  eligibility?: SchemeEligibilityResult;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme, eligibility }) => {
  const { t } = useLanguage();
  const [showDocs, setShowDocs] = useState(false);

  const verdict = eligibility?.verdict || 'uncertain';
  const verdictConfig = {
    eligible: {
      badge: 'success' as const,
      label: t.statusEligible,
      icon: CheckCircle,
      textColor: 'text-emerald-800',
    },
    not_eligible: {
      badge: 'warning' as const,
      label: t.statusNotEligible,
      icon: XCircle,
      textColor: 'text-red-700',
    },
    uncertain: {
      badge: 'neutral' as const,
      label: t.statusUncertain,
      icon: AlertCircle,
      textColor: 'text-amber-800',
    },
  }[verdict] || {
    badge: 'neutral' as const,
    label: t.statusUncertain,
    icon: AlertCircle,
    textColor: 'text-amber-800',
  };

  const VerdictIcon = verdictConfig.icon;
  const docs = eligibility?.required_documents || eligibility?.documents || scheme.documents || [];

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-soft hover:shadow-medium transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant={verdictConfig.badge} size="sm">
            <VerdictIcon className="w-3.5 h-3.5" />
            <span>{verdictConfig.label}</span>
          </Badge>

          {scheme.scheme_type && (
            <span className="text-[11px] text-brand-text-muted">
              {scheme.scheme_type}
            </span>
          )}
        </div>

        <h4 className="text-base font-bold text-brand-text-dark mb-1">
          {scheme.name_en}
        </h4>

        {scheme.issuing_authority && (
          <p className="text-xs text-brand-deep-teal font-medium mb-3">
            {scheme.issuing_authority}
          </p>
        )}

        {scheme.benefit_summary && (
          <p className="text-xs text-brand-text-muted leading-relaxed mb-4">
            {scheme.benefit_summary}
          </p>
        )}

        {/* Required Documents Toggle */}
        {docs.length > 0 && (
          <div className="mt-3 border-t border-brand-border/60 pt-3">
            <button
              type="button"
              onClick={() => setShowDocs(!showDocs)}
              className="w-full flex items-center justify-between text-xs font-semibold text-brand-dark-teal hover:text-brand-deep-teal transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-deep-teal" />
                <span>{t.requiredDocs} ({docs.length})</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDocs ? 'rotate-180' : ''}`} />
            </button>

            {showDocs && (
              <ul className="mt-2.5 space-y-1.5 bg-brand-surface/70 p-3 rounded-xl border border-brand-border/50 text-xs text-brand-text-muted">
                {docs.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-deep-teal mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-brand-text-dark">{doc.document_name}</span>
                      {doc.description && (
                        <span className="block text-[11px] text-brand-text-muted">{doc.description}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {scheme.official_url && (
        <div className="mt-4 pt-3 border-t border-brand-border/60">
          <a
            href={scheme.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-deep-teal hover:text-brand-dark-teal transition-colors"
          >
            <span>Official Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
