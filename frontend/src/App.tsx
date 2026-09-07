import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { StepIndicator } from './components/profile/StepIndicator';
import { LandingPage } from './pages/LandingPage';
import { LanguagePage } from './pages/LanguagePage';
import { ProfilePage } from './pages/ProfilePage';
import { ReviewPage } from './pages/ReviewPage';
import { LoadingPage } from './pages/LoadingPage';
import { ResultsPage } from './pages/ResultsPage';
import { VoiceAssistantModal } from './components/voice/VoiceAssistantModal';
import { WorkerProfileIn, RecommendationResponse } from './types/recommendation';
import { recommendationsApi, ApiError, getOrCreateSessionId } from './services/api';
import { DemoScenario } from './mocks/scenarios';
import { useLanguage } from './context/LanguageContext';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './components/ui/Button';

type AppStep = 'landing' | 'language' | 'profile' | 'review' | 'loading' | 'results' | 'error';

export const App: React.FC = () => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<AppStep>('landing');
  const [activeScenarioId, setActiveScenarioId] = useState<string | undefined>(undefined);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  // Core worker profile state — latitude/longitude strictly null; never fabricate
  const [profile, setProfile] = useState<WorkerProfileIn>({
    occupation: '',
    district: '',
    career_goal_text: '',
    education: null,
    pincode: null,
    age: null,
    gender: null,
    latitude: null,
    longitude: null,
    session_id: getOrCreateSessionId(),
  });

  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle Scenario Picker in Mock Mode
  const handleSelectDemoScenario = (scenario: DemoScenario) => {
    setActiveScenarioId(scenario.id);
    setProfile({
      ...scenario.initialProfile,
      session_id: getOrCreateSessionId(),
    });
  };

  /**
   * Core recommendation fetch — used by both the visual flow and the voice modal.
   * Accepts an optional profileOverride from the voice assistant when it has
   * collected profile data conversationally.
   */
  const handleFetchRecommendations = async (
    profileOverride?: WorkerProfileIn
  ): Promise<RecommendationResponse> => {
    const targetProfile = profileOverride || profile;
    setCurrentStep('loading');
    setErrorMessage('');
    const data = await recommendationsApi.getRecommendations(targetProfile, activeScenarioId);
    setRecommendation(data);
    setCurrentStep('results');
    return data;
  };

  // Visual-flow wrapper with local error handling
  const handleFetchRecommendationsVisual = async () => {
    try {
      await handleFetchRecommendations();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : (err as Error).message || t.errorMessage;
      setErrorMessage(msg);
      setCurrentStep('error');
    }
  };

  // Reset everything to initial state
  const handleStartOver = () => {
    setCurrentStep('landing');
    setActiveScenarioId(undefined);
    setRecommendation(null);
    setProfile({
      occupation: '',
      district: '',
      career_goal_text: '',
      education: null,
      pincode: null,
      age: null,
      gender: null,
      latitude: null,
      longitude: null,
      session_id: getOrCreateSessionId(),
    });
  };

  const getStepNumber = (): number => {
    switch (currentStep) {
      case 'profile':  return 1;
      case 'review':   return 3;
      case 'results':  return 4;
      default:         return 1;
    }
  };

  // Voice modal entry points
  const handleOpenVoice = () => setVoiceModalOpen(true);
  const handleCloseVoice = () => setVoiceModalOpen(false);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-surface selection:bg-brand-soft-mint selection:text-brand-dark-teal">
      <div>
        <Navbar onNavigateHome={handleStartOver} onOpenVoice={handleOpenVoice} />

        {/* Step Indicator shown during intake and review */}
        {(currentStep === 'profile' || currentStep === 'review') && (
          <div className="pt-6">
            <StepIndicator
              currentStep={getStepNumber()}
              onStepClick={(step) => {
                if (step === 1) setCurrentStep('profile');
                if (step === 3) setCurrentStep('review');
              }}
            />
          </div>
        )}

        <main>
          {currentStep === 'landing' && (
            <LandingPage
              onStart={() => setCurrentStep('language')}
              onVoiceStart={handleOpenVoice}
              onHowItWorks={() => {
                const el = document.getElementById('how-it-works-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          )}

          {currentStep === 'language' && (
            <LanguagePage
              onContinue={() => setCurrentStep('profile')}
              onBack={() => setCurrentStep('landing')}
            />
          )}

          {currentStep === 'profile' && (
            <ProfilePage
              profile={profile}
              onChange={setProfile}
              onNext={() => setCurrentStep('review')}
              onBack={() => setCurrentStep('language')}
              onSelectDemoScenario={handleSelectDemoScenario}
              activeScenarioId={activeScenarioId}
            />
          )}

          {currentStep === 'review' && (
            <ReviewPage
              profile={profile}
              onEdit={() => setCurrentStep('profile')}
              onConfirm={handleFetchRecommendationsVisual}
            />
          )}

          {currentStep === 'loading' && <LoadingPage />}

          {currentStep === 'results' && recommendation && (
            <ResultsPage
              recommendation={recommendation}
              onStartOver={handleStartOver}
              onOpenVoice={handleOpenVoice}
            />
          )}

          {currentStep === 'error' && (
            <div className="max-w-md mx-auto px-4 py-16 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-brand-text-dark mb-2">
                {t.errorTitle}
              </h2>
              <p className="text-xs sm:text-sm text-brand-text-muted mb-6 leading-relaxed">
                {errorMessage || t.errorMessage}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={() => setCurrentStep('profile')}>
                  {t.editBtn}
                </Button>
                <Button
                  onClick={handleFetchRecommendationsVisual}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  {t.tryAgain}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Voice Assistant Modal — mounted at root so it is accessible from any screen */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={handleCloseVoice}
        profile={profile}
        onProfileChange={setProfile}
        onFetchRecommendations={handleFetchRecommendations}
        initialRecommendation={recommendation}
      />
    </div>
  );
};

export default App;
