import React from 'react';
import { TrendingUp, HelpCircle, ExternalLink, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { WageLiftOut } from '../../types/recommendation';
import { Badge } from '../ui/Badge';

interface WageLiftCardProps {
  wageLift: WageLiftOut;
  currentOccupationName?: string;
  targetOccupationName?: string;
}

export const WageLiftCard: React.FC<WageLiftCardProps> = ({
  wageLift,
  currentOccupationName,
  targetOccupationName,
}) => {
  const { current_benchmark, target_benchmark, status, disclaimer } = wageLift;

  // Resolve canonical field names from Innovation 3 extended schema (with legacy fallback)
  const absolute_lift = wageLift.absolute_difference_inr ?? wageLift.absolute_lift_inr ?? null;
  const percentage_lift = wageLift.percentage_difference ?? wageLift.percentage_lift ?? null;
  const isMock = (wageLift.data_status ?? target_benchmark?.data_status) === 'mock';

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 sm:p-5 shadow-soft hover:shadow-medium transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-brand-text-dark">Wage-Lift Benchmark</h4>
            <span className="text-[11px] text-brand-text-muted">Indicative earnings comparison</span>
          </div>
        </div>

        <Badge
          variant={status === 'available' ? 'success' : status === 'partial' ? 'warning' : 'neutral'}
          size="sm"
        >
          {status === 'available'
            ? 'Benchmark Available'
            : status === 'partial'
            ? 'Partial Data'
            : 'Data Pending'}
        </Badge>
      </div>

      {/* Lift Metrics Display */}
      {status === 'available' && absolute_lift !== null && absolute_lift !== undefined && (
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/50 rounded-xl p-3 sm:p-4 border border-emerald-200/60 mb-4">
          <div className="text-xs text-emerald-800 font-medium mb-1">Estimated Monthly Uplift</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
              {absolute_lift >= 0 ? `+₹${absolute_lift.toLocaleString('en-IN')}` : `-₹${Math.abs(absolute_lift).toLocaleString('en-IN')}`}
            </span>
            <span className="text-xs font-semibold text-emerald-700">/ month</span>
            {percentage_lift !== null && percentage_lift !== undefined && (
              <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-200/60 text-emerald-900">
                {percentage_lift >= 0 ? `+${percentage_lift}%` : `${percentage_lift}%`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Mock/Illustrative Data Notice */}
      {isMock && (
        <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[10px] text-amber-800 mb-3">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
          <span>
            <strong>Illustrative hackathon data</strong> — not a guaranteed income figure. Source:{' '}
            {wageLift.source_label ?? target_benchmark?.source_title ?? 'Hackathon illustrative data'}.
          </span>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
        {/* Current Occupation Benchmark */}
        <div className="p-3 bg-brand-surface/60 rounded-xl border border-brand-border/60">
          <span className="text-[11px] text-brand-text-muted font-medium block mb-1">
            Current: {currentOccupationName || wageLift.current?.occupation || current_benchmark?.occupation_name || 'Baseline'}
          </span>
          {(current_benchmark?.monthly_median_inr || wageLift.current?.monthly_wage_inr) ? (
            <div>
              <div className="text-base font-bold text-brand-text-dark">
                ₹{(wageLift.current?.monthly_wage_inr ?? current_benchmark?.monthly_median_inr ?? 0).toLocaleString('en-IN')}{' '}
                <span className="text-[10px] text-brand-text-muted font-normal">/mo (median)</span>
              </div>
              {current_benchmark?.wage_type && (
                <div className="text-[10px] text-brand-text-muted mt-1">
                  Type: <span className="capitalize">{current_benchmark.wage_type} ({current_benchmark.employment_type})</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-brand-text-muted italic flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              Benchmark not registered for trade
            </div>
          )}
        </div>

        {/* Target Occupation Benchmark */}
        <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/50">
          <span className="text-[11px] text-emerald-800 font-medium block mb-1">
            Target: {targetOccupationName || wageLift.target?.occupation || target_benchmark?.occupation_name || 'Target Trade'}
          </span>
          {(target_benchmark?.monthly_median_inr || wageLift.target?.monthly_wage_inr) ? (
            <div>
              <div className="text-base font-bold text-emerald-900">
                ₹{(wageLift.target?.monthly_wage_inr ?? target_benchmark?.monthly_median_inr ?? 0).toLocaleString('en-IN')}{' '}
                <span className="text-[10px] text-emerald-700 font-normal">/mo (median)</span>
              </div>
              {target_benchmark && (
                <div className="text-[10px] text-emerald-700/80 mt-1">
                  Range: ₹{target_benchmark.monthly_min_inr?.toLocaleString('en-IN') || '—'} – ₹{target_benchmark.monthly_max_inr?.toLocaleString('en-IN') || '—'}
                </div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-brand-text-muted italic flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              Target benchmark pending
            </div>
          )}
        </div>
      </div>

      {/* Provenance & Source Attribution */}
      {(target_benchmark?.source_title || current_benchmark?.source_title) && (
        <div className="text-[11px] text-brand-text-muted border-t border-brand-border/60 pt-2.5 space-y-1 mb-2">
          {target_benchmark && (
            <div className="flex items-start justify-between gap-2">
              <span className="truncate">
                Source: <span className="font-medium text-brand-text-dark">{target_benchmark.source_title}</span>
                {target_benchmark.data_period && ` (${target_benchmark.data_period})`}
              </span>
              {target_benchmark.source_url && (
                <a
                  href={target_benchmark.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-dark-teal hover:underline flex items-center gap-0.5 flex-shrink-0"
                >
                  Govt Source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="bg-stone-50 rounded-lg p-2 border border-stone-200/70 text-[10px] text-stone-600 leading-tight flex items-start gap-1.5">
        <HelpCircle className="w-3 h-3 text-stone-400 flex-shrink-0 mt-0.5" />
        <span>{disclaimer}</span>
      </div>
    </div>
  );

