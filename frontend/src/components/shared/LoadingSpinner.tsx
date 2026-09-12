import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  message,
  className,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4 border-2',
    md: 'w-7 h-7 border-[2.5px]',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div
      className={twMerge(
        clsx('flex flex-col items-center justify-center p-6 space-y-3', className)
      )}
    >
      <div
        className={clsx(
          'animate-spin rounded-full border-teal-200 border-t-teal-600',
          sizeMap[size]
        )}
      />
      {message && <p className="text-xs font-medium text-slate-500">{message}</p>}
    </div>
  );
}
