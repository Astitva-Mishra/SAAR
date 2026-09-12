'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, ArrowRight, ArrowLeft, CheckCircle2, HelpCircle } from 'lucide-react';

export interface DepartmentQuestionConfig {
  id: string;
  text: string;
  type: 'radio' | 'text';
  options?: string[];
  placeholder?: string;
}

export const GASTRO_DEMO_QUESTIONS: DepartmentQuestionConfig[] = [
  {
    id: 'pain_location',
    text: '1. Where exactly is the pain located?',
    type: 'radio',
    options: [
      'Upper abdomen (below ribs)',
      'Lower abdomen (near navel)',
      'Right side',
      'Generalized across entire stomach',
    ],
  },
  {
    id: 'pain_severity',
    text: '2. How severe is the pain?',
    type: 'radio',
    options: ['Mild (Noticeable but manageable)', 'Moderate (Interferes with daily tasks)', 'Severe (Intense discomfort)'],
  },
  {
    id: 'meal_relation',
    text: '3. Does the pain occur before or after eating?',
    type: 'radio',
    options: [
      'Worse 30-60 minutes after eating',
      'Worse on an empty stomach / before meals',
      'Constant throughout the day',
      'Unrelated to food intake',
    ],
  },
  {
    id: 'vomiting_status',
    text: '4. Have you experienced vomiting?',
    type: 'radio',
    options: ['No vomiting (Nausea only)', 'Yes, once or twice', 'Frequent vomiting'],
  },
  {
    id: 'bowel_changes',
    text: '5. Have you noticed any changes in bowel movements?',
    type: 'radio',
    options: ['No change (Normal)', 'Loose stools / Diarrhea', 'Constipation', 'Dark or black stools'],
  },
];

interface DepartmentQuestionsStepProps {
  departmentName?: string;
  questions?: DepartmentQuestionConfig[];
  initialAnswers?: Record<string, string>;
  onSubmit: (answers: Record<string, string>) => void;
  onBack: () => void;
}

export function DepartmentQuestionsStep({
  departmentName = 'Gastroenterology',
  questions = GASTRO_DEMO_QUESTIONS,
  initialAnswers = {
    pain_location: 'Upper abdomen (below ribs)',
    pain_severity: 'Moderate (Interferes with daily tasks)',
    meal_relation: 'Worse 30-60 minutes after eating',
    vomiting_status: 'No vomiting (Nausea only)',
    bowel_changes: 'No change (Normal)',
  },
  onSubmit,
  onBack,
}: DepartmentQuestionsStepProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);

  const handleSelect = (qId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: option }));
  };

  const handleTextChange = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider">
          <Stethoscope className="w-4 h-4" />
          <span>Step 4: Clinical Questions</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Department-Specific Details
        </h2>
        <p className="text-sm text-slate-600">
          Targeted questions to help your healthcare provider prepare for consultation.
        </p>
      </div>

      {/* Recommended Clinical Department Callout */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Recommended Clinical Department
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">{departmentName}</h3>
          </div>
          <Badge variant="indigo" size="md">
            Protocol Active
          </Badge>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed pt-1">
          Based on the information provided, these questions can help prepare the case for the
          healthcare provider. This recommendation is for clinical intake routing, not a medical diagnosis.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((q) => {
          const selected = answers[q.id];

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3"
            >
              <h4 className="font-bold text-sm sm:text-base text-slate-900">{q.text}</h4>

              {q.type === 'radio' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {q.options.map((opt, optIdx) => {
                    const isChecked = selected === opt;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelect(q.id, opt)}
                        className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-teal-50/80 border-teal-600 text-teal-900 ring-2 ring-teal-100 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isChecked ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'text' && (
                <input
                  type="text"
                  value={selected || ''}
                  onChange={(e) => handleTextChange(q.id, e.target.value)}
                  placeholder={q.placeholder || 'Type your response...'}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              )}
            </div>
          );
        })}

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
            <span>Back to Safety Check</span>
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto gap-2 h-12 text-sm font-semibold px-6 shadow-sm hover:shadow-md"
          >
            <span>Review Final Summary</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
