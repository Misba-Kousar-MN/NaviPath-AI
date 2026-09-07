import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'mint' | 'teal' | 'success' | 'warning' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'mint',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantClasses = {
    mint: 'bg-brand-soft-mint text-brand-dark-teal border border-brand-pastel-green/60 font-medium',
    teal: 'bg-brand-aqua-breeze/40 text-brand-dark-teal border border-brand-teal-mist/40 font-medium',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200 font-medium',
    neutral: 'bg-stone-100 text-stone-700 border border-stone-200 font-normal',
    outline: 'bg-transparent text-brand-text-muted border border-brand-border font-medium',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};
