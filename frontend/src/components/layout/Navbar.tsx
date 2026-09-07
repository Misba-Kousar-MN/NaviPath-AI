import React from 'react';
import { Compass, Globe, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage } from '../../types/recommendation';
import { isMockMode } from '../../services/api';
import { VoiceInputButton } from '../voice/VoiceInputButton';

interface NavbarProps {
  onNavigateHome?: () => void;
  onOpenVoice?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateHome, onOpenVoice }) => {
  const { language, setLanguage, t } = useLanguage();
  const mockMode = isMockMode();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-border/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-deep-teal to-brand-teal-mist flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-brand-text-dark tracking-tight">
                {t.appName}
              </span>
              {mockMode && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {t.demoModeBadge}
                </span>
              )}
            </div>
            <span className="text-xs text-brand-text-muted hidden sm:block">
              {t.appSubtitle}
            </span>
          </div>
        </button>

        {/* Controls: Voice Affordance & Language Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <VoiceInputButton onClick={onOpenVoice} isAvailable={true} />
          </div>

          <div className="flex items-center bg-brand-surface rounded-xl p-1 border border-brand-border">
            <Globe className="w-3.5 h-3.5 text-brand-deep-teal ml-1.5 mr-1 hidden xs:inline-block" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-white text-brand-dark-teal shadow-soft'
                  : 'text-brand-text-muted hover:text-brand-text-dark'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('kn')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === 'kn'
                  ? 'bg-white text-brand-dark-teal shadow-soft'
                  : 'text-brand-text-muted hover:text-brand-text-dark'
              }`}
            >
              ಕನ್ನಡ
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === 'hi'
                  ? 'bg-white text-brand-dark-teal shadow-soft'
                  : 'text-brand-text-muted hover:text-brand-text-dark'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
