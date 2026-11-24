import React from 'react';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <select
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-surface-2 border rounded-lg px-3 py-2 text-white text-sm',
            'transition-all duration-200 focus:outline-none focus:ring-1 focus:border-primary focus:ring-primary',
            'appearance-none cursor-pointer',
            error ? 'border-red-500' : 'border-border',
            className
          )}
          {...props}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} className="bg-surface-2">
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
