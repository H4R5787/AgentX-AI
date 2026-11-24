import React from 'react';
import { cn } from '../../utils/cn';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  purple: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-yellow-400',
  error: 'bg-red-400',
  info: 'bg-blue-400',
  neutral: 'bg-slate-400',
  purple: 'bg-violet-400',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className, dot }) => (
  <span className={cn(
    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border',
    variants[variant],
    className
  )}>
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
    {children}
  </span>
);

export function statusToBadge(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case 'completed': case 'active': case 'online': return 'success';
    case 'running': case 'pending': return 'info';
    case 'failed': case 'error': return 'error';
    case 'cancelled': case 'inactive': case 'offline': return 'neutral';
    case 'awaiting_approval': return 'warning';
    default: return 'neutral';
  }
}
