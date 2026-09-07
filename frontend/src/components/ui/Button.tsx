import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium',
    md: 'px-5 py-2.5 text-sm font-semibold',
    lg: 'px-6 py-3.5 text-base font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-brand-deep-teal hover:bg-brand-dark-teal text-white shadow-soft hover:shadow-medium border border-transparent',
    secondary:
      'bg-brand-soft-mint hover:bg-brand-aqua-breeze/80 text-brand-dark-teal border border-brand-pastel-green',
    outline:
      'bg-white hover:bg-brand-surface text-brand-text-dark border border-brand-border hover:border-brand-teal-mist',
    ghost:
      'bg-transparent hover:bg-brand-soft-mint/40 text-brand-text-dark border border-transparent',
  }[variant];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-all active:scale-[0.98] ${sizeClasses} ${variantClasses} ${
        fullWidth ? 'w-full' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} ${className}`}
      {...props}
    >
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
