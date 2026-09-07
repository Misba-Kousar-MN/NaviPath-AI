import React from 'react';
import { Mic } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface VoiceInputButtonProps {
  onClick?: () => void;
  onTranscript?: (text: string) => void;
  className?: string;
  isAvailable?: boolean;
  label?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onClick,
  className = '',
  isAvailable = true,
  label,
}) => {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isAvailable}
      aria-label={label || t.talkToSkillNavigator}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-soft active:scale-95 ${
        isAvailable
          ? 'bg-brand-soft-mint text-brand-dark-teal border-brand-teal-mist/50 hover:bg-brand-aqua-breeze cursor-pointer'
          : 'bg-brand-surface text-brand-text-muted/70 border-brand-border cursor-not-allowed'
      } ${className}`}
    >
      <Mic className="w-4 h-4 text-brand-deep-teal" />
      <span>{label || t.talkToSkillNavigator}</span>
    </button>
  );
};

