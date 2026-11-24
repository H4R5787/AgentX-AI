import React from 'react';
import { cn } from '../../utils/cn';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
    <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-500" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    {description && <p className="text-slate-400 text-sm max-w-sm mb-6">{description}</p>}
    {action && (
      <Button onClick={action.onClick}>{action.label}</Button>
    )}
  </div>
);
