/**
 * SkillUpliftJourney.tsx — Innovation 3 UI Component
 *
 * Renders the complete Skill Uplift Pipeline as a visual timeline:
 * Current Occupation → Skills → Gaps → Bridge → Target Occupation →
 * Course → Training Centre → Scheme → Eligibility → Certification →
 * Wage Benchmark → Wage Lift → Next Action
 *
 * Design palette: green/mint (#CFE5D5, #B8D6B2, #A6D2C8, #8FC6B7, #6EA89E)
 * All wages are shown with mandatory mock/illustrative disclaimer.
 */
import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  Info,
  MapPin,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  SkillBridgePathway,
  SkillOut,
  WageLiftOut,
} from '../../types/recommendation';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const MINT = {
  50: '#f0f9f4',
  100: '#CFE5D5',
  200: '#B8D6B2',
  300: '#A6D2C8',
  400: '#8FC6B7',
  500: '#6EA89E',
  600: '#4d8e85',
  700: '#3a6e67',
  800: '#2a5050',
  900: '#1a3438',
};

// ---------------------------------------------------------------------------
// Helper: numeric wage formatting
// ---------------------------------------------------------------------------
function fmtINR(n: number | null | undefined): string {
  if (n == null) return '—';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function resolveAbsLift(w: WageLiftOut): number | null {
  return w.absolute_difference_inr ?? w.absolute_lift_inr ?? null;
}

function resolvePctLift(w: WageLiftOut): number | null {
  return w.percentage_difference ?? w.percentage_lift ?? null;
}

// ---------------------------------------------------------------------------
// Step badge
// ---------------------------------------------------------------------------
interface StepBadgeProps {
  step: number;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  done?: boolean;
}
const StepBadge: React.FC<StepBadgeProps> = ({ step, label, icon, active, done }) => (
  <div
    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all
      ${active
        ? 'bg-[#6EA89E] text-white shadow-md scale-105'
        : done
        ? 'bg-[#B8D6B2] text-[#2a5050]'
        : 'bg-[#f0f9f4] text-[#4d8e85] border border-[#CFE5D5]'}`}
  >
    <span className="shrink-0">{icon}</span>
    <span className="hidden sm:inline">{step}. {label}</span>
    <span className="sm:hidden">{step}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Expandable section wrapper
// ---------------------------------------------------------------------------
interface SectionProps {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({
  title, subtitle, icon, accent = MINT[100], children, defaultOpen = true, badge,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-[#CFE5D5] overflow-hidden mb-4 shadow-sm">
      <button
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        style={{ background: accent }}
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center text-[#4d8e85]">
            {icon}
          </div>
          <div>
            <div className="text-sm font-bold text-[#2a5050]">{title}</div>
            {subtitle && <div className="text-[11px] text-[#4d8e85] mt-0.5">{subtitle}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {open ? <ChevronDown className="w-4 h-4 text-[#6EA89E]" /> : <ChevronRight className="w-4 h-4 text-[#6EA89E]" />}
        </div>
      </button>
      {open && <div className="px-4 py-3 bg-white">{children}</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Skill pill
// ---------------------------------------------------------------------------
const SkillPill: React.FC<{ skill: SkillOut; variant?: 'overlap' | 'gap' | 'bridge' | 'current' }> = ({
  skill, variant = 'current',
}) => {
  const styles: Record<string, string> = {
    overlap: 'bg-[#B8D6B2]/60 text-[#2a5050] border-[#8FC6B7]',
    gap: 'bg-amber-50 text-amber-800 border-amber-200',
    bridge: 'bg-blue-50 text-blue-800 border-blue-200',
    current: 'bg-[#f0f9f4] text-[#4d8e85] border-[#CFE5D5]',
  };
  const icons: Record<string, React.ReactNode> = {
    overlap: <CheckCircle2 className="w-3 h-3 text-[#6EA89E]" />,
    gap: <HelpCircle className="w-3 h-3 text-amber-500" />,
    bridge: <Zap className="w-3 h-3 text-blue-500" />,
    current: null,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${styles[variant]}`}>
      {icons[variant]}
      {skill.name_en}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Wage lift display
// ---------------------------------------------------------------------------
const WageLiftDisplay: React.FC<{ wageLift: WageLiftOut }> = ({ wageLift }) => {
  const abs = resolveAbsLift(wageLift);
  const pct = resolvePctLift(wageLift);
  const isAvailable = wageLift.status === 'available' && abs != null;
  const isMock = (wageLift.data_status ?? wageLift.target_benchmark?.data_status) === 'mock';

  return (
    <div>
      {isAvailable ? (
        <div className="rounded-xl p-3 mb-3" style={{ background: 'linear-gradient(135deg, #f0f9f4 0%, #CFE5D5 100%)' }}>
          <div className="text-[11px] font-semibold text-[#4d8e85] mb-1 uppercase tracking-wide">
            Estimated Monthly Uplift
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-extrabold text-[#2a5050]">
              {abs! >= 0 ? '+' : ''}{fmtINR(abs)}
            </span>
            <span className="text-xs text-[#6EA89E] font-medium">/ month</span>
            {pct != null && (
              <span
                className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: '#B8D6B2', color: '#2a5050' }}
              >
                {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
              </span>
            )}
          </div>

          {/* Current → Target bar */}
          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
            <div className="bg-white/70 rounded-lg p-2">
              <div className="text-[#6EA89E] font-medium mb-0.5">Current</div>
              <div className="font-bold text-[#2a5050]">
                {wageLift.current?.monthly_wage_inr != null
                  ? fmtINR(wageLift.current.monthly_wage_inr)
                  : wageLift.current_benchmark?.monthly_median_inr != null
                  ? fmtINR(wageLift.current_benchmark.monthly_median_inr)
                  : '—'}
                <span className="font-normal text-[#6EA89E]"> /mo</span>
              </div>
            </div>
            <div className="bg-[#6EA89E]/10 rounded-lg p-2">
              <div className="text-[#4d8e85] font-medium mb-0.5">Target</div>
              <div className="font-bold text-[#2a5050]">
                {wageLift.target?.monthly_wage_inr != null
                  ? fmtINR(wageLift.target.monthly_wage_inr)
                  : wageLift.target_benchmark?.monthly_median_inr != null
                  ? fmtINR(wageLift.target_benchmark.monthly_median_inr)
                  : '—'}
                <span className="font-normal text-[#4d8e85]"> /mo</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-3 bg-stone-50 border border-stone-200 mb-3 text-[12px] text-stone-600 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          {wageLift.status === 'partial'
            ? 'Wage benchmark partially available — one occupation not in dataset.'
            : 'Wage benchmark not yet available for this transition.'}
        </div>
      )}

      {/* Mock data badge */}
      {isMock && (
        <div className="flex items-start gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[10px] text-amber-800 mb-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
          <span>
            <strong>Illustrative hackathon data</strong> — not a guaranteed income figure. Source:{' '}
            {wageLift.source_label ?? wageLift.target_benchmark?.source_title ?? 'Hackathon illustrative data'}.
          </span>
        </div>
      )}

      {/* Mandatory disclaimer */}
      <div className="flex items-start gap-1.5 rounded-lg bg-stone-50 border border-stone-200/70 px-2.5 py-2 text-[10px] text-stone-500">
        <HelpCircle className="w-3 h-3 shrink-0 mt-0.5 text-stone-400" />
        <span>{wageLift.disclaimer}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface SkillUpliftJourneyProps {
  pathway: SkillBridgePathway;
  defaultExpanded?: boolean;
}

export const SkillUpliftJourney: React.FC<SkillUpliftJourneyProps> = ({
  pathway,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const {
    current_occupation,
    target_occupation,
    target_skill,
    current_skills,
    skill_overlap,
    skill_gaps,
    bridge_skills,
    courses,
    nearby_centres,
    scheme,
    eligibility,
    certification_status,
    wage_lift,
    pathway_score,
    confidence_note,
    rationale,
    next_action,
    pathway_type,
    market_demand_note,
  } = pathway;

  const overlapSkillIds = new Set(skill_overlap.overlap_skill_ids);
  const isEligible = eligibility?.verdict === 'eligible';
  const scoreColor =
    pathway_score.label === 'Strong'
      ? '#6EA89E'
      : pathway_score.label === 'Good'
      ? '#8FC6B7'
      : pathway_score.label === 'Moderate'
      ? '#A6D2C8'
      : '#CFE5D5';

  // Pipeline step nav
  const steps = [
    { label: 'Current', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { label: 'Skills', icon: <Star className="w-3.5 h-3.5" /> },
    { label: 'Gaps', icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { label: 'Bridge', icon: <Zap className="w-3.5 h-3.5" /> },
    { label: 'Target', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { label: 'Course', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { label: 'Centre', icon: <MapPin className="w-3.5 h-3.5" /> },
    { label: 'Scheme', icon: <Shield className="w-3.5 h-3.5" /> },
    { label: 'Eligibility', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { label: 'Cert.', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { label: 'Wages', icon: <CircleDollarSign className="w-3.5 h-3.5" /> },
    { label: 'Action', icon: <ArrowRight className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-full bg-white rounded-3xl border border-[#CFE5D5] shadow-lg overflow-hidden">
      {/* ── Header ── */}
      <div
        className="px-5 py-4"
        style={{ background: `linear-gradient(135deg, ${MINT[100]} 0%, ${MINT[300]} 100%)` }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-[#4d8e85]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1a3438]">
                Skill Uplift Journey
              </h3>
              <p className="text-[12px] text-[#4d8e85]">
                {current_occupation?.name_en ?? 'Current Role'}{' '}
                <ArrowRight className="inline w-3 h-3" />{' '}
                {target_occupation?.name_en ?? target_skill.name_en}
              </p>
            </div>
          </div>

          {/* Pathway score badge */}
          <div className="flex flex-col items-end gap-1">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ background: scoreColor, color: '#1a3438' }}
            >
              <Star className="w-3.5 h-3.5" />
              {pathway_score.label} Pathway — {pathway_score.total_score.toFixed(0)}/100
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                pathway_type === 'bridge'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-[#B8D6B2] text-[#2a5050]'
              }`}
            >
              {pathway_type === 'bridge' ? '⚡ Bridge Pathway' : '✅ Direct Pathway'}
            </span>
          </div>
        </div>

        {/* Pipeline step strip */}
        <div className="flex items-center gap-1 flex-wrap mt-3 pb-1 overflow-x-auto">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <StepBadge
                step={i + 1}
                label={s.label}
                icon={s.icon}
                done={true}
              />
              {i < steps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-[#8FC6B7] flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Expand toggle ── */}
      <button
        className="w-full flex items-center justify-between px-5 py-2.5 text-[12px] text-[#4d8e85] font-medium hover:bg-[#f0f9f4] transition-colors border-b border-[#CFE5D5]"
        onClick={() => setExpanded(e => !e)}
      >
        <span>{expanded ? 'Collapse journey details' : 'View full skill uplift journey'}</span>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-4 py-4 space-y-0">

          {/* ── Step 1–2: Current Occupation & Skills ── */}
          <Section
            title={`Step 1–2: Current Role & Skills`}
            subtitle={current_occupation?.name_en}
            icon={<Briefcase className="w-4 h-4" />}
            accent={MINT[50]}
            defaultOpen={true}
          >
            <div className="text-[12px] text-[#4d8e85] mb-2">
              {current_skills.length} skill{current_skills.length !== 1 ? 's' : ''} registered for this occupation
            </div>
            <div className="flex flex-wrap gap-1.5">
              {current_skills.map(sk => (
                <SkillPill
                  key={sk.id}
                  skill={sk}
                  variant={overlapSkillIds.has(sk.id) ? 'overlap' : 'current'}
                />
              ))}
              {current_skills.length === 0 && (
                <span className="text-[11px] text-stone-400 italic">Skills data not available</span>
              )}
            </div>
            {skill_overlap.overlap_count > 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#4d8e85]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#6EA89E]" />
                <span>
                  <strong>{skill_overlap.overlap_count}</strong> of your current skills directly transfer (
                  {skill_overlap.overlap_percentage.toFixed(0)}% overlap)
                </span>
              </div>
            )}
          </Section>

          {/* ── Step 3: Skill Gaps ── */}
          <Section
            title="Step 3: Skill Gaps to Bridge"
            subtitle={`${skill_gaps.length} gap${skill_gaps.length !== 1 ? 's' : ''} identified`}
            icon={<HelpCircle className="w-4 h-4" />}
            accent="#fffbeb"
            badge={
              skill_gaps.length > 0
                ? <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">{skill_gaps.length}</span>
                : <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">None!</span>
            }
          >
            {skill_gaps.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {skill_gaps.map(g => (
                    <span
                      key={g.skill_id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      <HelpCircle className="w-3 h-3 text-amber-500" />
                      {g.skill_name}
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-stone-500 italic">
                  These skills require specific training — covered by courses below.
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-[12px] text-[#4d8e85]">
                <CheckCircle2 className="w-4 h-4 text-[#6EA89E]" />
                Excellent — your current skills fully cover this transition!
              </div>
            )}
          </Section>

          {/* ── Step 4: Bridge Skills (if bridge pathway) ── */}
          {pathway_type === 'bridge' && bridge_skills.length > 0 && (
            <Section
              title="Step 4: Bridge Skills Required"
              subtitle="Intermediate skills to acquire before target role"
              icon={<Zap className="w-4 h-4" />}
              accent="#eff6ff"
            >
              <div className="flex flex-wrap gap-1.5">
                {bridge_skills.map(sk => (
                  <SkillPill key={sk.id} skill={sk} variant="bridge" />
                ))}
              </div>
            </Section>
          )}

          {/* ── Step 5: Target Occupation ── */}
          <Section
            title={`Step 5: Target Occupation`}
            subtitle={`${target_occupation?.name_en ?? target_skill.name_en} · ${target_occupation?.sector ?? ''}`}
            icon={<Sparkles className="w-4 h-4" />}
            accent={MINT[100]}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <div>
                <div className="text-[11px] text-[#6EA89E] font-medium mb-0.5">Target Skill</div>
                <div className="font-semibold text-[#2a5050]">{target_skill.name_en}</div>
                {target_skill.certifying_body && (
                  <div className="text-[10px] text-[#6EA89E] mt-0.5">Cert body: {target_skill.certifying_body}</div>
                )}
              </div>
              {target_occupation && (
                <div>
                  <div className="text-[11px] text-[#6EA89E] font-medium mb-0.5">Sector</div>
                  <div className="font-semibold text-[#2a5050]">{target_occupation.sector}</div>
                  {target_occupation.nco_code && (
                    <div className="text-[10px] text-[#6EA89E] mt-0.5">NCO: {target_occupation.nco_code}</div>
                  )}
                </div>
              )}
            </div>
            {rationale && (
              <div className="mt-3 rounded-xl bg-[#f0f9f4] border border-[#CFE5D5] p-3 text-[11px] text-[#4d8e85]">
                <strong>Transition rationale:</strong> {rationale}
              </div>
            )}
            {market_demand_note && (
              <div className="mt-2 flex items-start gap-1.5 text-[11px] text-[#4d8e85]">
                <Users className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#8FC6B7]" />
                {market_demand_note}
              </div>
            )}
          </Section>

          {/* ── Step 6: Course ── */}
          <Section
            title="Step 6: Recommended Course"
            subtitle={`${courses.length} course${courses.length !== 1 ? 's' : ''} available`}
            icon={<BookOpen className="w-4 h-4" />}
            accent={MINT[50]}
          >
            {courses.length > 0 ? (
              <div className="space-y-2">
                {courses.slice(0, 3).map(c => (
                  <div key={c.id} className="rounded-xl border border-[#CFE5D5] p-3 text-[12px]">
                    <div className="font-semibold text-[#2a5050] mb-1">{c.title}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#6EA89E]">
                      {c.mode && <span>Mode: {c.mode}</span>}
                      {c.duration_value != null && c.duration_unit && (
                        <span>Duration: {c.duration_value} {c.duration_unit}</span>
                      )}
                      {c.fee_type && <span>Fee: {c.fee_type}{c.fee_amount_inr ? ` ₹${c.fee_amount_inr}` : ''}</span>}
                      {c.is_government_recognized && (
                        <span className="flex items-center gap-0.5 text-[#4d8e85] font-semibold">
                          <ShieldCheck className="w-3 h-3" /> Govt. recognized
                        </span>
                      )}
                    </div>
                    {c.certifying_body && (
                      <div className="text-[10px] text-[#6EA89E] mt-1">Certifying body: {c.certifying_body}</div>
                    )}
                  </div>
                ))}
                {courses.length > 3 && (
                  <div className="text-[11px] text-[#6EA89E] text-center">+{courses.length - 3} more courses</div>
                )}
              </div>
            ) : (
              <div className="text-[12px] text-stone-400 italic">Course data pending verification</div>
            )}
          </Section>

          {/* ── Step 7: Training Centre ── */}
          <Section
            title="Step 7: Training Centre"
            subtitle={`${nearby_centres.length} centre${nearby_centres.length !== 1 ? 's' : ''} found`}
            icon={<MapPin className="w-4 h-4" />}
            accent={MINT[50]}
          >
            {nearby_centres.length > 0 ? (
              <div className="space-y-2">
                {nearby_centres.slice(0, 2).map(tc => (
                  <div key={tc.id} className="rounded-xl border border-[#CFE5D5] p-3 text-[12px]">
                    <div className="font-semibold text-[#2a5050]">{tc.name}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[#6EA89E] mt-1">
                      {tc.district && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{tc.district}</span>}
                      {tc.distance_km != null && <span>{tc.distance_km.toFixed(1)} km away</span>}
                      {tc.recognition_status && <span>Status: {tc.recognition_status}</span>}
                    </div>
                    {tc.contact_phone && (
                      <div className="text-[10px] text-[#6EA89E] mt-1">📞 {tc.contact_phone}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-stone-400 italic">No centres found in your district. Search nearby districts.</div>
            )}
          </Section>

          {/* ── Step 8–9: Scheme & Eligibility ── */}
          <Section
            title="Step 8–9: Government Scheme & Eligibility"
            subtitle={scheme?.name_en ?? 'No scheme matched'}
            icon={<Shield className="w-4 h-4" />}
            accent={isEligible ? '#f0fdf4' : '#faf9f7'}
            badge={
              eligibility ? (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isEligible
                      ? 'bg-green-100 text-green-700'
                      : eligibility.verdict === 'not_eligible'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {isEligible ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {isEligible ? 'Eligible' : eligibility.verdict === 'not_eligible' ? 'Not eligible' : 'Uncertain'}
                </span>
              ) : null
            }
          >
            {scheme ? (
              <div className="space-y-2">
                <div className="rounded-xl border border-[#CFE5D5] p-3 text-[12px]">
                  <div className="font-semibold text-[#2a5050] mb-1">{scheme.name_en}</div>
                  <div className="text-[10px] text-[#6EA89E] mb-1">
                    {scheme.issuing_authority} · Type: {scheme.scheme_type ?? 'skilling'}
                  </div>
                  {scheme.benefit_summary && (
                    <div className="text-[11px] text-[#4d8e85] leading-relaxed">{scheme.benefit_summary}</div>
                  )}
                  {scheme.official_url && scheme.official_url !== 'REQUIRES OFFICIAL SOURCE VERIFICATION' && (
                    <a
                      href={scheme.official_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[#6EA89E] hover:underline mt-1"
                    >
                      Official website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {eligibility && (
                  <div className={`rounded-xl p-3 text-[12px] border ${
                    isEligible
                      ? 'bg-green-50 border-green-200'
                      : eligibility.verdict === 'not_eligible'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-1.5 font-semibold mb-1">
                      {isEligible
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        : eligibility.verdict === 'not_eligible'
                        ? <XCircle className="w-3.5 h-3.5 text-red-500" />
                        : <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      }
                      <span>
                        {isEligible ? 'You appear eligible' : eligibility.verdict === 'not_eligible' ? 'May not be eligible' : 'Eligibility uncertain'}
                      </span>
                    </div>
                    {eligibility.reasons.length > 0 && (
                      <ul className="space-y-0.5 mt-1">
                        {eligibility.reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-1 text-[10px]">
                            {r.passed
                              ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                              : <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />}
                            <span>{r.description}{r.detail ? ` — ${r.detail}` : ''}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {eligibility.disclaimer && (
                      <div className="mt-1 text-[10px] text-stone-500 italic">{eligibility.disclaimer}</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[12px] text-stone-400 italic">No government scheme matched for this pathway.</div>
            )}
          </Section>

          {/* ── Step 10: Certification ── */}
          <Section
            title="Step 10: Certification Status"
            subtitle={certification_status ?? 'Certification information not verified'}
            icon={<GraduationCap className="w-4 h-4" />}
            accent={MINT[50]}
          >
            <div className={`rounded-xl p-3 text-[12px] flex items-start gap-2 ${
              certification_status?.toLowerCase().includes('government recognized')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : certification_status?.toLowerCase().includes('certified')
                ? 'bg-blue-50 border border-blue-200 text-blue-800'
                : 'bg-stone-50 border border-stone-200 text-stone-600'
            }`}>
              {certification_status?.toLowerCase().includes('government recognized') ? (
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
              ) : (
                <GraduationCap className="w-4 h-4 shrink-0 mt-0.5 text-stone-400" />
              )}
              <span>{certification_status}</span>
            </div>
          </Section>

          {/* ── Step 11: Wage Benchmark & Lift ── */}
          <Section
            title="Step 11: Wage Benchmark & Lift"
            subtitle="Mock / illustrative data — not verified"
            icon={<CircleDollarSign className="w-4 h-4" />}
            accent={MINT[100]}
          >
            <WageLiftDisplay wageLift={wage_lift} />
          </Section>

          {/* ── Step 12: Confidence & Evidence ── */}
          <Section
            title="Evidence & Confidence"
            subtitle="How this pathway was determined"
            icon={<ClipboardList className="w-4 h-4" />}
            accent={MINT[50]}
            defaultOpen={false}
          >
            <div className="rounded-xl bg-[#f0f9f4] border border-[#CFE5D5] p-3 text-[11px] text-[#4d8e85] leading-relaxed">
              {confidence_note}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
              {[
                { label: 'Overlap', val: `${skill_overlap.overlap_percentage.toFixed(0)}%`, color: '#6EA89E' },
                { label: 'Score', val: `${pathway_score.total_score.toFixed(0)}/100`, color: '#4d8e85' },
                { label: 'Gaps', val: `${skill_gaps.length}`, color: '#8FC6B7' },
              ].map(m => (
                <div key={m.label} className="rounded-xl bg-white border border-[#CFE5D5] p-2">
                  <div className="text-[10px] text-stone-400 mb-0.5">{m.label}</div>
                  <div className="font-bold" style={{ color: m.color }}>{m.val}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Step 12: Next Action ── */}
          {next_action && (
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: `linear-gradient(135deg, ${MINT[200]} 0%, ${MINT[300]} 100%)` }}
            >
              <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-sm shrink-0">
                <ArrowRight className="w-4 h-4 text-[#4d8e85]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1a3438] mb-1">⚡ Your Next Action</div>
                <p className="text-[12px] text-[#2a5050] font-medium leading-relaxed">{next_action}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillUpliftJourney;
