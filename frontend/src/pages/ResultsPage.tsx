import React, { useState } from 'react';
import { RefreshCw, Download, Share2, AlertCircle, Building2, GraduationCap, Shield, Target, Compass } from 'lucide-react';
import { RecommendationResponse, SkillBridgePathway } from '../types/recommendation';
import { useLanguage } from '../context/LanguageContext';
import { PathwayTimeline } from '../components/recommendations/PathwayTimeline';
import { SkillGapCard } from '../components/recommendations/SkillGapCard';
import { CourseCard } from '../components/recommendations/CourseCard';
import { CentreCard } from '../components/recommendations/CentreCard';
import { SchemeCard } from '../components/recommendations/SchemeCard';
import { GroundedExplanation } from '../components/recommendations/GroundedExplanation';
import { EvidenceDrawer } from '../components/recommendations/EvidenceDrawer';
import { SkillBridgeCard } from '../components/recommendations/SkillBridgeCard';
import { SkillUpliftJourney } from '../components/recommendations/SkillUpliftJourney';
import { PathwayComparison } from '../components/recommendations/PathwayComparison';
import { Button } from '../components/ui/Button';

interface ResultsPageProps {
  recommendation: RecommendationResponse;
  onStartOver: () => void;
  onOpenVoice?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  recommendation,
  onStartOver,
  onOpenVoice,
}) => {
  const { t } = useLanguage();
  const [selectedForComparison, setSelectedForComparison] = useState<SkillBridgePathway[]>([]);

  const courses = recommendation.courses || [];
  const skillGaps = recommendation.skill_gaps || [];
  const centres = recommendation.nearby_centres || [];
  const schemes = recommendation.schemes || [];
  const eligibilityList = recommendation.eligibility || [];
  const evidenceList = recommendation.validated_evidence || [];
  const bridgePathways = recommendation.skill_bridge?.pathways || [];

  const handleToggleComparison = (pathway: SkillBridgePathway) => {
    setSelectedForComparison((prev) => {
      const exists = prev.find((p) => p.transition_id === pathway.transition_id);
      if (exists) {
        return prev.filter((p) => p.transition_id !== pathway.transition_id);
      }
      if (prev.length >= 2) {
        return [prev[1], pathway];
      }
      return [...prev, pathway];
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn space-y-10">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-brand-border/60">
        <div>
          <span className="text-xs font-bold text-brand-deep-teal uppercase tracking-wider">
            Verified Karnataka Recommendation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text-dark">
            {recommendation.matched_occupation?.name_en || recommendation.profile.occupation}
          </h1>
          <span className="text-xs text-brand-text-muted">
            Location: {recommendation.profile.district} • Profile Confirmed
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenVoice && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenVoice}
              leftIcon={<span className="text-sm">🎙️</span>}
              className="bg-brand-soft-mint text-brand-dark-teal border border-brand-teal-mist/50 hover:bg-brand-aqua-breeze shadow-soft"
            >
              {t.listenRecommendations}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onStartOver}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            {t.startOver}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
          >
            Print
          </Button>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {recommendation.warnings && recommendation.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-bold block mb-0.5">Notice on Current Data Coverage</span>
            <ul className="list-disc list-inside space-y-0.5">
              {recommendation.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Section 1: Visual Pathway Timeline */}
      <PathwayTimeline recommendation={recommendation} />

      {/* Section 1B: Skill-Bridge & Wage-Lift Pathways (Innovation 3) */}
      {bridgePathways.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-text-dark">
                  Skill-Bridge & Wage-Lift Pathways
                </h3>
                <p className="text-xs text-brand-text-muted">
                  Deterministic transition feasibility, skill overlap, and indicative earnings uplift
                </p>
              </div>
            </div>

            {selectedForComparison.length === 1 && (
              <span className="text-xs text-brand-dark-teal font-semibold animate-pulse">
                Select 1 more trade to compare
              </span>
            )}
          </div>

          {/* Side-by-side comparison active if 2 pathways selected */}
          {selectedForComparison.length === 2 && (
            <PathwayComparison
              pathwayA={selectedForComparison[0]}
              pathwayB={selectedForComparison[1]}
              onClose={() => setSelectedForComparison([])}
            />
          )}

          {/* List of Skill-Bridge Pathways */}
          <div className="space-y-4">
            {bridgePathways.map((pathway) => (
              <SkillBridgeCard
                key={pathway.transition_id}
                pathway={pathway}
                currentOccupationName={
                  recommendation.matched_occupation?.name_en || recommendation.profile.occupation
                }
                onSelectForComparison={handleToggleComparison}
                isComparisonSelected={selectedForComparison.some(
                  (p) => p.transition_id === pathway.transition_id
                )}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Skills to Build */}
      {skillGaps.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-brand-soft-mint text-brand-deep-teal flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-brand-text-dark">
                {t.skillsToBuild}
              </h3>
              <p className="text-xs text-brand-text-muted">
                {t.skillsToBuildSub}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillGaps.map((gap) => (
              <SkillGapCard key={gap.skill_id} gap={gap} />
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Recommended Courses */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-text-dark">
              {t.recommendedCourses}
            </h3>
            <p className="text-xs text-brand-text-muted">
              {t.coursesSub}
            </p>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-6 text-center text-xs text-brand-text-muted">
            No specific course found matching this trade in current verified records.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* Section 4: Authorized Training Centres */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-brand-aqua-breeze/50 text-brand-dark-teal flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-text-dark">
              {t.trainingCentres}
            </h3>
            <p className="text-xs text-brand-text-muted">
              {t.centresSub}
            </p>
          </div>
        </div>

        {centres.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-6 text-center text-xs text-brand-text-muted">
            No authorized training centre with confirmed course availability was found nearby.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {centres.map((centre) => (
              <CentreCard key={centre.id} centre={centre} />
            ))}
          </div>
        )}
      </section>

      {/* Section 5: Government Support & Schemes */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-brand-soft-mint text-brand-deep-teal flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-text-dark">
              {t.governmentSupport}
            </h3>
            <p className="text-xs text-brand-text-muted">
              {t.supportSub}
            </p>
          </div>
        </div>

        {schemes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-6 text-center text-xs text-brand-text-muted">
            No specific government welfare schemes currently mapped to this exact profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemes.map((scheme) => {
              const el = eligibilityList.find((e) => e.scheme_id === scheme.id);
              return <SchemeCard key={scheme.id} scheme={scheme} eligibility={el} />;
            })}
          </div>
        )}
      </section>

      {/* Section 6: Grounded Explanation & Next Steps */}
      <GroundedExplanation explanation={recommendation.explanation} />

      {/* Section 7: Verified Documentary Evidence Drawer */}
      <EvidenceDrawer evidence={evidenceList} />

      {/* Bottom CTA to test another profile */}
      <div className="pt-8 border-t border-brand-border text-center">
        <Button
          size="lg"
          onClick={onStartOver}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="px-8"
        >
          {t.startOver}
        </Button>
      </div>
    </div>
  );
};
