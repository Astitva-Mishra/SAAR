'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';

interface SafetyStepProps {
  initialResponses?: Record<string, 'yes' | 'no'>;
  onProceed: (responses: Record<string, 'yes' | 'no'>) => void;
  onBack: () => void;
}

interface SafetyQuestion {
  id: string;
  text: string;
  subtext: string;
}

const SAFETY_QUESTIONS: SafetyQuestion[] = [
  {
    id: 'chest_pain',
    text: 'Are you currently experiencing severe chest pain or pressure?',
    subtext: 'Pain that feels tight, heavy, or radiates to the left shoulder or jaw.',
  },
  {
    id: 'breathing_difficulty',
    text: 'Are you having difficulty breathing or acute shortness of breath?',
    subtext: 'Struggling to catch your breath while resting or speaking.',
  },
  {
    id: 'loss_of_consciousness',
    text: 'Have you lost consciousness, fainted, or experienced sudden confusion?',
    subtext: 'Blackouts, sudden severe dizziness, or inability to respond.',
  },
];

export function SafetyStep({
  initialResponses = {
    chest_pain: 'no',
    breathing_difficulty: 'no',
    loss_of_consciousness: 'no',
  },
  onProceed,
  onBack,
}: SafetyStepProps) {
  const [responses, setResponses] = useState<Record<string, 'yes' | 'no'>>(initialResponses);

  const handleSelect = (id: string, value: 'yes' | 'no') => {
    setResponses((prev) => ({ ...prev, [id]: value }));
  };

  const hasAnyYes = Object.values(responses).some((v) => v === 'yes');

  const handleContinue = () => {
    onProceed(responses);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>Step 3: Safety Screening</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Safety Check
        </h2>
        <p className="text-sm text-slate-600">
          Please answer a few quick safety screening questions before continuing.
        </p>
      </div>

      {/* Neutral Informational Note */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 leading-relaxed space-y-1">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Intake Protocol Safety Notice</span>
        </div>
        <p>
          These screening questions help check for critical symptoms that might require immediate
          hospital attention. CareKare does not make final emergency medical decisions.
        </p>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {SAFETY_QUESTIONS.map((q, idx) => {
          const answer = responses[q.id];
          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{q.text}</h3>
                </div>
                <p className="text-xs text-slate-500 pl-7">{q.subtext}</p>
              </div>

              {/* Kiosk-Friendly Large Yes / No Buttons */}
              <div className="flex items-center gap-3 pl-7 md:pl-0 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelect(q.id, 'no')}
                  className={`h-11 px-6 rounded-xl text-sm font-semibold border-2 transition-all flex items-center gap-1.5 ${
                    answer === 'no'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-100 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${answer === 'no' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>No</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect(q.id, 'yes')}
                  className={`h-11 px-6 rounded-xl text-sm font-semibold border-2 transition-all flex items-center gap-1.5 ${
                    answer === 'yes'
                      ? 'bg-rose-50 border-rose-600 text-rose-800 ring-2 ring-rose-100 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 ${answer === 'yes' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span>Yes</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Emergency Advisory Callout if any 'Yes' selected */}
      {hasAnyYes && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 space-y-2 text-rose-900 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>Emergency Cautionary Advisory</span>
          </div>
          <p className="text-xs leading-relaxed text-rose-800">
            You indicated experiencing an acute symptom. If this is an active life-threatening emergency,
            please inform the nearest hospital triage nurse immediately or dial <strong>112</strong>.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          className="w-full sm:w-auto gap-2 h-12 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Understanding</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleContinue}
          className="w-full sm:w-auto gap-2 h-12 text-sm font-semibold px-6 shadow-sm hover:shadow-md"
        >
          <span>Continue to Department Questions</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
