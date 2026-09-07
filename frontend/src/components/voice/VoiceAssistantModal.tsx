import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  ArrowLeft,
  X,
  Send,
  HelpCircle,
  Sparkles,
  AlertCircle,
  Globe,
  Keyboard,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SupportedLanguage, WorkerProfileIn, RecommendationResponse } from '../../types/recommendation';
import {
  VoiceAssistantService,
  VoiceAssistantState,
} from '../../services/voiceAssistantService';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: WorkerProfileIn;
  onProfileChange: (profile: WorkerProfileIn) => void;
  onFetchRecommendations: (profile: WorkerProfileIn) => Promise<RecommendationResponse>;
  initialRecommendation?: RecommendationResponse | null;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileChange,
  onFetchRecommendations,
  initialRecommendation,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [service, setService] = useState<VoiceAssistantService | null>(null);
  const [state, setState] = useState<VoiceAssistantState | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [typedText, setTypedText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize service when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const voiceService = new VoiceAssistantService(
      language,
      profile,
      async (p) => {
        onProfileChange(p);
        return await onFetchRecommendations(p);
      }
    );

    const unsubscribe = voiceService.subscribe((newState) => {
      setState(newState);
      if (newState.profile) {
        onProfileChange(newState.profile);
      }
    });

    setService(voiceService);

    // If already has recommendation, start progressive explanation, otherwise start conversation
    if (initialRecommendation) {
      voiceService.startProgressiveExplanation(initialRecommendation);
    } else {
      voiceService.startConversation();
    }

    return () => {
      unsubscribe();
      voiceService.stopListening();
    };
  }, [isOpen]);

  // Keep language in sync with context
  useEffect(() => {
    if (service && language) {
      service.setLanguage(language);
    }
  }, [language, service]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state?.messages, state?.currentTranscript]);

  if (!isOpen || !state) return null;

  const handleLanguageSwitch = (lang: SupportedLanguage) => {
    setLanguage(lang);
    service?.setLanguage(lang);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedText.trim() || !service) return;
    service.handleUserInput(typedText);
    setTypedText('');
  };

  const handleQuickReply = (reply: string) => {
    service?.handleUserInput(reply);
  };

  const getStatusBadge = () => {
    switch (state.voiceState) {
      case 'LISTENING':
        return {
          text: t.listeningState,
          bg: 'bg-brand-seafoam text-brand-dark-teal border-brand-teal-mist animate-pulse',
          icon: <Mic className="w-4 h-4 text-brand-dark-teal animate-bounce" />,
        };
      case 'PROCESSING':
        return {
          text: t.processingState,
          bg: 'bg-brand-aqua-breeze text-brand-dark-teal border-brand-teal-mist',
          icon: <Sparkles className="w-4 h-4 text-brand-dark-teal animate-spin" />,
        };
      case 'SPEAKING':
        return {
          text: t.speakingState,
          bg: 'bg-brand-soft-mint text-brand-dark-teal border-brand-teal-mist',
          icon: <Volume2 className="w-4 h-4 text-brand-deep-teal animate-pulse" />,
        };
      case 'ERROR':
        return {
          text: state.errorMessage || t.voiceErrorState,
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertCircle className="w-4 h-4 text-red-600" />,
        };
      default:
        return {
          text: t.tapToSpeak,
          bg: 'bg-brand-surface text-brand-text-muted border-brand-border',
          icon: <Mic className="w-4 h-4 text-brand-deep-teal" />,
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-brand-dark-teal/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-brand-card rounded-3xl shadow-lifted border border-brand-border flex flex-col h-[90vh] max-h-[720px] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-brand-surface border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-soft-mint border border-brand-teal-mist/30 flex items-center justify-center text-brand-dark-teal shadow-soft">
              <Sparkles className="w-5 h-5 text-brand-deep-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-brand-text-dark">
                  {t.appName}
                </h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-soft-mint text-brand-dark-teal border border-brand-teal-mist/40">
                  {t.voiceModeDevBadge}
                </span>
              </div>
              <p className="text-[11px] text-brand-text-muted">
                {t.speakLanguageHint}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={t.closeVoiceAssistant}
            className="w-8 h-8 rounded-full hover:bg-brand-border/60 text-brand-text-muted flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Quick Switcher */}
        <div className="px-4 py-2 bg-brand-surface/70 border-b border-brand-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-brand-text-muted">
            <Globe className="w-3.5 h-3.5 text-brand-deep-teal" />
            <span>Language:</span>
          </div>
          <div className="flex items-center gap-1">
            {(['en', 'kn', 'hi'] as SupportedLanguage[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageSwitch(lang)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  language === lang
                    ? 'bg-brand-deep-teal text-white shadow-soft font-semibold'
                    : 'bg-white text-brand-text-muted hover:bg-brand-soft-mint/50 border border-brand-border'
                }`}
              >
                {lang === 'en' ? 'English' : lang === 'kn' ? 'ಕನ್ನಡ' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </div>

        {/* Message / Conversation Subtitles Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-brand-surface/30">
          {state.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              } animate-fadeIn`}
            >
              <div className="flex items-center gap-1 mb-1 px-1">
                <span className="text-[11px] font-semibold text-brand-text-muted/80 uppercase tracking-wide">
                  {msg.sender === 'user' ? 'You said' : 'Assistant'}
                </span>
              </div>
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brand-deep-teal text-white rounded-tr-none shadow-soft font-medium'
                    : 'bg-brand-card text-brand-text-dark rounded-tl-none border border-brand-border shadow-soft'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Real-time Interim Voice Subtitle */}
          {state.currentTranscript && (
            <div className="flex flex-col items-end animate-fadeIn">
              <span className="text-[10px] text-brand-text-muted mb-1 px-1">
                Listening...
              </span>
              <div className="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-brand-seafoam/80 text-brand-dark-teal border border-brand-teal-mist/50 italic rounded-tr-none">
                {state.currentTranscript}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Reply Suggestions (Low Literacy Friendly 1-Tap Chips) */}
        {state.quickReplies && state.quickReplies.length > 0 && (
          <div className="px-4 py-2.5 bg-brand-surface/80 border-t border-brand-border flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {state.quickReplies.map((reply, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickReply(reply)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium bg-brand-card hover:bg-brand-soft-mint text-brand-dark-teal border border-brand-teal-mist/40 transition-all shadow-soft flex-shrink-0"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Central Voice Control Footer */}
        <div className="p-4 bg-brand-card border-t border-brand-border flex flex-col items-center gap-3">
          {/* Status Pill */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${statusBadge.bg}`}
          >
            {statusBadge.icon}
            <span>{statusBadge.text}</span>
          </div>

          {/* Primary Microphone Action Button */}
          <div className="flex items-center justify-center gap-6 w-full pt-1">
            {/* Go Back / Repeat Controls */}
            <button
              type="button"
              onClick={() => service?.handleUserInput('go back')}
              title="Go back"
              className="w-10 h-10 rounded-full bg-brand-surface hover:bg-brand-soft-mint text-brand-dark-teal border border-brand-border flex items-center justify-center transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Central Pulse Microphone Button */}
            <div className="relative">
              {state.voiceState === 'LISTENING' && (
                <div className="absolute inset-0 rounded-full bg-brand-seafoam animate-ping opacity-60 pointer-events-none scale-125" />
              )}
              <button
                type="button"
                onClick={() => service?.toggleListening()}
                aria-label={t.tapToSpeak}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lifted ${
                  state.voiceState === 'LISTENING'
                    ? 'bg-brand-seafoam text-brand-dark-teal border-4 border-brand-teal-mist scale-105'
                    : state.voiceState === 'SPEAKING'
                    ? 'bg-brand-aqua-breeze text-brand-dark-teal border-4 border-brand-teal-mist'
                    : 'bg-brand-deep-teal hover:bg-brand-dark-teal text-white hover:scale-105 active:scale-95'
                }`}
              >
                {state.voiceState === 'LISTENING' ? (
                  <Mic className="w-8 h-8 text-brand-dark-teal animate-pulse" />
                ) : state.voiceState === 'SPEAKING' ? (
                  <Volume2 className="w-8 h-8 text-brand-dark-teal" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
            </div>

            {/* Repeat Audio Button */}
            <button
              type="button"
              onClick={() => service?.handleUserInput('repeat')}
              title="Repeat last response"
              className="w-10 h-10 rounded-full bg-brand-surface hover:bg-brand-soft-mint text-brand-dark-teal border border-brand-border flex items-center justify-center transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-brand-text-muted font-medium text-center">
            {state.voiceState === 'LISTENING'
              ? t.listeningState
              : state.voiceState === 'SPEAKING'
              ? t.speakingState
              : t.tapToSpeak}
          </p>

          {/* Text Fallback Drawer Toggle */}
          <div className="w-full pt-1 border-t border-brand-border/60">
            {!showTextInput ? (
              <button
                type="button"
                onClick={() => setShowTextInput(true)}
                className="w-full text-center text-xs text-brand-deep-teal font-medium hover:underline flex items-center justify-center gap-1.5 py-1"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>{t.typeInstead}</span>
              </button>
            ) : (
              <form onSubmit={handleSendText} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  placeholder={t.typeMessagePlaceholder}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-brand-border focus:outline-none focus:ring-2 focus:ring-brand-teal-mist bg-brand-surface"
                />
                <button
                  type="submit"
                  disabled={!typedText.trim()}
                  className="px-3 py-2 rounded-xl bg-brand-deep-teal disabled:opacity-50 text-white text-xs font-semibold hover:bg-brand-dark-teal flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>{t.sendText}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTextInput(false)}
                  className="p-2 rounded-xl text-brand-text-muted hover:bg-brand-surface"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
