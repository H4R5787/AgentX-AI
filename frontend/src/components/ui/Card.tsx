import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ children, className, header, padding = 'md' }) => {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div className={cn('bg-surface border border-border rounded-xl', className)}>
      {header && (
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          {typeof header === 'string' ? (
            <h3 className="font-semibold text-white">{header}</h3>
          ) : header}
        </div>
      )}
      <div className={paddings[padding]}>{children}</div>
    </div>
  );
};
