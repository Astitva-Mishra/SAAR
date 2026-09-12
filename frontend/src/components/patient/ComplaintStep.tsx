'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Mic, HelpCircle, MessageSquare } from 'lucide-react';
import { VoiceDictation } from './VoiceDictation';

interface ComplaintStepProps {
  initialValue: string;
  onSubmit: (complaint: string) => void;
}

const SAMPLE_CHIPS = [
  'I have stomach pain and nausea for three days.',
  'Persistent dry cough and sore throat for 5 days.',
  'Skin rash on forearm with itching since yesterday.',
];

export function ComplaintStep({ initialValue, onSubmit }: ComplaintStepProps) {
  const [text, setText] = useState(initialValue || 'I have stomach pain and nausea for three days.');
  const [voiceTooltip, setVoiceTooltip] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length >= 5) {
      onSubmit(text.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Prompt */}
      <div className="space-y-1.5 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider">
          <MessageSquare className="w-4 h-4" />
          <span>Step 1: Patient Complaint Intake</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          What brings you in today?
        </h2>
        <p className="text-sm text-slate-600">
          Describe what you&apos;re experiencing in your own words.
        </p>
      </div>

      {/* Info Callout */}
      <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
        <Sparkles className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-teal-950 block text-sm mb-0.5">
            Describe your health problem naturally
          </span>
          You don&apos;t need to use medical terms. Mention what hurts, when it started, and anything
          that makes it better or worse. CareKare will structure this information for your attending doctor.
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="patient-complaint" className="block text-sm font-semibold text-slate-800">
              Your Health Concern
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {text.length} characters
            </span>
          </div>

          <div className="relative">
            <textarea
              id="patient-complaint"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g., I have had stomach pain and nausea for three days, feeling worse after meals..."
              className="w-full p-4 text-base bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all text-slate-900 shadow-inner resize-y min-h-[140px]"
            />
          </div>

          {/* Real Browser Web Speech API Dictation Control */}
          <VoiceDictation
            currentText={text}
            onTranscriptReady={(transcript) => setText(transcript)}
          />
        </div>

        {/* Quick Example Starters */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Or click an example complaint below:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setText(chip)}
                className="text-xs text-left bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50/60 text-slate-700 px-3 py-2 rounded-lg transition-colors shadow-xs"
              >
                &ldquo;{chip}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={text.trim().length < 5}
            className="w-full sm:w-auto justify-center h-12 text-sm font-semibold px-6 gap-2 shadow-sm hover:shadow-md"
          >
            <span>Continue to Understanding</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
