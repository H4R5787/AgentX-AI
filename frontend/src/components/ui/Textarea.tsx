import React from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-surface-2 border rounded-lg px-3 py-2 text-white text-sm',
            'placeholder:text-slate-500 resize-y transition-all duration-200',
            'focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary',
            error ? 'border-red-500 focus:ring-red-500' : 'border-border',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {helper && !error && <p className="text-xs text-slate-500">{helper}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
