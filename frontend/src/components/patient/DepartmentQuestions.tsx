'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export interface QuestionItem {
  id: string;
  text: string;
  placeholder?: string;
}

interface DepartmentQuestionsProps {
  departmentName?: string;
  questions?: QuestionItem[];
  onSubmit: (answers: Record<string, string>) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const DEFAULT_QUESTIONS: QuestionItem[] = [
  {
    id: 'pain_location',
    text: 'Where specifically is the discomfort located (e.g., upper stomach, lower right abdomen)?',
    placeholder: 'e.g., Upper center of abdomen, below the ribs',
  },
  {
    id: 'meal_relation',
    text: 'Does the discomfort feel worse before eating, immediately after eating, or between meals?',
    placeholder: 'e.g., Becomes worse roughly 30 minutes after eating oily food',
  },
  {
    id: 'associated_digestive',
    text: 'Have you noticed any vomiting, acidity, burning sensation, or loose stools?',
    placeholder: 'e.g., Mild acidity at night, no vomiting',
  },
  {
    id: 'previous_history',
    text: 'Have you had similar digestive or stomach issues previously?',
    placeholder: 'e.g., No prior history, first time experiencing this',
  },
];

export function DepartmentQuestions({
  departmentName = 'Gastroenterology',
  questions = DEFAULT_QUESTIONS,
  onSubmit,
  onBack,
  isLoading = false,
}: DepartmentQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleAnswerChange = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(answers);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-100/80 p-4 rounded-xl border border-slate-200">
        <div>
          <span className="text-xs text-slate-500 block uppercase font-medium">
            Recommended Clinical Department
          </span>
          <h4 className="text-base font-bold text-slate-900">{departmentName}</h4>
        </div>
        <Badge variant="indigo" size="md">
          Specific Clinical Protocol
        </Badge>
      </div>

      <div className="text-xs text-slate-500">
        Please answer these department-specific questions. Your answers will help the doctor
        understand your condition during consultation.
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="p-4 bg-white rounded-xl border border-slate-200/90 card-shadow space-y-2"
          >
            <label
              htmlFor={`q-${q.id}`}
              className="flex items-start gap-2 text-sm font-medium text-slate-800"
            >
              <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{q.text}</span>
            </label>
            <input
              id={`q-${q.id}`}
              type="text"
              value={answers[q.id] || ''}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              placeholder={q.placeholder || 'Type your answer here...'}
              className="w-full px-3.5 py-2 text-sm bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900"
            />
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="gap-1.5"
          >
            <span>Continue to Final Summary</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
