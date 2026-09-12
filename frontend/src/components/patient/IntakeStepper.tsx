import React from 'react';
import { clsx } from 'clsx';
import { Check, AlertTriangle, HelpCircle, FileText, MessageSquare, UploadCloud } from 'lucide-react';

interface Step {
  id: number;
  name: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  { id: 1, name: 'Complaint', shortDesc: 'Describe issue', icon: MessageSquare },
  { id: 2, name: 'Understanding', shortDesc: 'AI structure', icon: Check },
  { id: 3, name: 'Safety Check', shortDesc: 'Triage screening', icon: AlertTriangle },
  { id: 4, name: 'Questions', shortDesc: 'Clinical details', icon: HelpCircle },
  { id: 5, name: 'Documents', shortDesc: 'Upload records', icon: UploadCloud },
  { id: 6, name: 'Summary', shortDesc: 'Confirm & submit', icon: FileText },
];

interface IntakeStepperProps {
  currentStep: number;
  className?: string;
}

export function IntakeStepper({ currentStep, className }: IntakeStepperProps) {
  return (
    <div className={clsx('w-full py-4', className)}>
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2 relative">
        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center text-center group">
              {/* Step indicator circle */}
              <div
                className={clsx(
                  'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 border-2 mb-2',
                  isCompleted &&
                    'bg-teal-600 border-teal-600 text-white shadow-sm',
                  isCurrent &&
                    'bg-teal-50 border-teal-600 text-teal-700 ring-4 ring-teal-100',
                  !isCompleted &&
                    !isCurrent &&
                    'bg-white border-slate-200 text-slate-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </div>

              {/* Step title */}
              <span
                className={clsx(
                  'text-[11px] sm:text-xs font-medium tracking-tight',
                  isCurrent ? 'text-teal-900 font-semibold' : 'text-slate-600'
                )}
              >
                {step.name}
              </span>
              <span className="text-[10px] text-slate-400 hidden md:block mt-0.5">
                {step.shortDesc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-slate-200 h-1 rounded-full mt-4 overflow-hidden">
        <div
          className="bg-teal-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / 5) * 100))}%` }}
        />
      </div>
    </div>
  );
}
