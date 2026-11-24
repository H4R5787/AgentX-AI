import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-surface-2 border rounded-lg px-3 py-2 text-white text-sm',
            'placeholder:text-slate-500 transition-all duration-200',
            'focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary',
            error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-border',
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
Input.displayName = 'Input';
