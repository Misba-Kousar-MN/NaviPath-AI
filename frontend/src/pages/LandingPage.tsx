import React from 'react';
import { ArrowRight, Compass, ShieldCheck, Sparkles, BookOpen, Building2, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Button } from '../components/ui/Button';

interface LandingPageProps {
  onStart: () => void;
  onVoiceStart?: () => void;
  onHowItWorks?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onVoiceStart, onHowItWorks }) => {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden">
      {/* Organic Background Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-brand-soft-mint/40 blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-1/2 left-0 -ml-20 w-80 h-80 rounded-full bg-brand-aqua-breeze/30 blur-3xl pointer-events-none -z-0" />

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-soft-mint text-brand-dark-teal border border-brand-pastel-green mb-6 text-xs font-semibold animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-brand-deep-teal" />
          <span>Karnataka Informal Workers Initiative</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-brand-text-dark tracking-tight leading-tight max-w-4xl mx-auto mb-6">
          {t.heroHeading}
        </h1>

        <p className="text-base sm:text-lg text-brand-text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
          {t.heroSubheading}
        </p>

        {/* Primary Voice Action + Form Alternative */}
        <div className="flex flex-col items-center justify-center mb-14">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onVoiceStart}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-brand-deep-teal hover:bg-brand-dark-teal text-white font-bold text-base px-8 py-4 rounded-2xl shadow-medium hover:shadow-lifted transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-base">🎙️</span>
              </div>
              <span>{t.talkToSkillNavigator}</span>
            </button>

            <Button
              variant="outline"
              size="lg"
              onClick={onStart}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto text-base px-7 py-4"
            >
              {t.findMyPathway}
            </Button>
          </div>

          <p className="text-xs text-brand-text-muted mt-3 font-medium flex items-center gap-1.5">
            <span>{t.speakLanguageHint}</span>
          </p>
        </div>

        {/* Flowing Pathway Visual Graphic */}
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-white/95 via-brand-surface/90 to-white/95 border border-brand-border rounded-3xl p-6 sm:p-8 shadow-medium relative">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-deep-teal mb-4 text-center">
            How Your Next Opportunity Connects
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
            <div className="bg-white rounded-2xl p-4 border border-brand-border text-center shadow-soft flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase">Current Work</span>
              <span className="text-xs sm:text-sm font-bold text-brand-text-dark mt-1">Delivery, Domestic, Labor</span>
            </div>

            <div className="bg-brand-soft-mint/40 rounded-2xl p-4 border border-brand-pastel-green text-center shadow-soft flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-brand-deep-teal uppercase">Skill Gap</span>
              <span className="text-xs sm:text-sm font-bold text-brand-dark-teal mt-1">Identified Need</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-brand-border text-center shadow-soft flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-brand-text-muted uppercase">Accredited Course</span>
              <span className="text-xs sm:text-sm font-bold text-brand-text-dark mt-1">NCVT / PMKVY</span>
            </div>

            <div className="bg-brand-aqua-breeze/30 rounded-2xl p-4 border border-brand-teal-mist/60 text-center shadow-soft flex flex-col items-center justify-center">
              <span className="text-[10px] font-bold text-brand-deep-teal uppercase">Verified Scheme</span>
              <span className="text-xs sm:text-sm font-bold text-brand-dark-teal mt-1">CMKKY & Toolkits</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & How It Works Section */}
      <section id="how-it-works-section" className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-3xl border border-brand-border p-8 shadow-soft">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-brand-text-dark mb-2">
              {t.howItWorks}
            </h2>
            <p className="text-xs sm:text-sm text-brand-text-muted">
              A 3-step personalized journey connecting your experience with government opportunities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft-mint text-brand-dark-teal flex items-center justify-center font-bold text-base mb-4 shadow-soft">
                1
              </div>
              <h3 className="font-bold text-base text-brand-text-dark mb-1.5">
                Tell Us Your Work
              </h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Describe your day-to-day job and career aspirations in your own words.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-aqua-breeze/50 text-brand-dark-teal flex items-center justify-center font-bold text-base mb-4 shadow-soft">
                2
              </div>
              <h3 className="font-bold text-base text-brand-text-dark mb-1.5">
                Discover Your Pathway
              </h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Our database pairs your existing strengths with certified technical qualifications.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-pastel-green/70 text-brand-dark-teal flex items-center justify-center font-bold text-base mb-4 shadow-soft">
                3
              </div>
              <h3 className="font-bold text-base text-brand-text-dark mb-1.5">
                Find Training & Schemes
              </h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Locate authorized centres in your district and check free training subsidies.
              </p>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="mt-10 p-4 rounded-2xl bg-brand-surface border border-brand-border/80 flex items-center justify-center gap-2.5 text-center text-xs text-brand-dark-teal font-medium">
            <ShieldCheck className="w-4 h-4 text-brand-deep-teal flex-shrink-0" />
            <span>{t.trustBanner}</span>
          </div>
        </div>
      </section>
    </div>
  );
};
