import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-brand-border shadow-soft p-5 md:p-6 transition-smooth ${
        hoverable ? 'hover:shadow-medium hover:border-brand-teal-mist/50 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
