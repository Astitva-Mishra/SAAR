'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

interface ComplaintInputProps {
  initialValue?: string;
  onSubmit: (text: string) => void;
  isLoading?: boolean;
}

const SAMPLE_PROMPTS = [
  'I have stomach pain and nausea for three days.',
  'Dry cough with mild fever and throat irritation since Monday.',
  'Severe headache with sensitivity to light since yesterday evening.',
];

export function ComplaintInput({
  initialValue = '',
  onSubmit,
  isLoading = false,
}: ComplaintInputProps) {
  const [complaint, setComplaint] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (complaint.trim().length >= 5) {
      onSubmit(complaint.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-4 flex items-start space-x-3">
        <Sparkles className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-teal-900 font-semibold block text-sm mb-0.5">
            How can we assist you today?
          </strong>
          Describe your health symptoms in simple everyday language. Mention where it hurts, when
          it began, and any other changes you feel. CareKare will help structure this for your doctor.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="complaint-text" className="block text-sm font-medium text-slate-800 mb-1.5">
            Describe your health problem
          </label>
          <textarea
            id="complaint-text"
            rows={5}
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="e.g., I've had continuous dull pain in the upper abdomen for 3 days, feeling nauseous especially after meals..."
            className="w-full p-3.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors placeholder:text-slate-400 text-slate-900 resize-y min-h-[120px]"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
            <span>Minimum 5 characters for accurate structuring</span>
            <span>{complaint.length} characters</span>
          </div>
        </div>

        {/* Quick Demo Starters */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Or try a sample complaint for testing:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setComplaint(prompt)}
                className="text-xs text-left bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            size="lg"
            variant="primary"
            disabled={complaint.trim().length < 5 || isLoading}
            isLoading={isLoading}
          >
            <span>Continue to AI Understanding</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </div>
  );
}
