import React from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SupportedLanguage } from '../types/recommendation';
import { Button } from '../components/ui/Button';
import { VoiceInputButton } from '../components/voice/VoiceInputButton';

interface LanguagePageProps {
  onContinue: () => void;
  onBack: () => void;
}

export const LanguagePage: React.FC<LanguagePageProps> = ({ onContinue, onBack }) => {
  const { language, setLanguage, t } = useLanguage();

  const languages: Array<{
    code: SupportedLanguage;
    title: string;
    nativeTitle: string;
    description: string;
  }> = [
    {
      code: 'kn',
      title: 'Kannada',
      nativeTitle: 'ಕನ್ನಡ',
      description: 'ಕರ್ನಾಟಕದ ರಾಜ್ಯ ಭಾಷೆ — ಸ್ಥಳೀಯ ಭಾಷೆಯಲ್ಲಿ ಸಂಪೂರ್ಣ ವಿವರಗಳು.',
    },
    {
      code: 'en',
      title: 'English',
      nativeTitle: 'English',
      description: 'Standard English interface for statewide vocational programs.',
    },
    {
      code: 'hi',
      title: 'Hindi',
      nativeTitle: 'हिन्दी',
      description: 'प्रवासी और उत्तर कर्नाटक के श्रमिकों के लिए सहज भाषा सहायता।',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fadeIn">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-text-dark mb-2">
          {t.selectLanguage}
        </h2>
        <p className="text-sm text-brand-text-muted">
          {t.selectLanguageSubtitle}
        </p>
      </div>

      {/* Language Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {languages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`p-6 rounded-2xl border text-center transition-all flex flex-col justify-between relative group ${
                isSelected
                  ? 'bg-white border-brand-deep-teal shadow-medium ring-2 ring-brand-teal-mist/40 scale-[1.02]'
                  : 'bg-white/80 hover:bg-white border-brand-border text-brand-text-dark hover:border-brand-teal-mist/60 shadow-soft'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-deep-teal text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <div>
                <div className="text-2xl font-bold text-brand-text-dark mb-1 group-hover:text-brand-deep-teal transition-colors">
                  {lang.nativeTitle}
                </div>
                <div className="text-xs font-semibold text-brand-text-muted mb-3">
                  {lang.title}
                </div>
              </div>

              <p className="text-[11px] text-brand-text-muted/90 leading-relaxed border-t border-brand-border/60 pt-3">
                {lang.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Voice Mode Future Affordance */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <span className="text-xs font-semibold text-brand-text-dark block">
            Accessibility Options
          </span>
          <span className="text-xs text-brand-text-muted">
            Spoken voice intake in Kannada & Hindi powered by Whisper & Gemini.
          </span>
        </div>
        <VoiceInputButton isAvailable={true} />
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack}>
          {t.backBtn}
        </Button>
        <Button
          onClick={onContinue}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="px-8"
        >
          {t.continueBtn}
        </Button>
      </div>
    </div>
  );
};
