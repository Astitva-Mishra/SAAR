'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Stethoscope, Save } from 'lucide-react';

interface NotesEditorProps {
  initialNotes?: string;
  isCompleted?: boolean;
  onSaveNotes?: (notes: string) => void;
  onCompleteConsultation?: (notes: string) => void;
  isLoading?: boolean;
}

export function NotesEditor({
  initialNotes = '',
  isCompleted = false,
  onSaveNotes,
  onCompleteConsultation,
  isLoading = false,
}: NotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    if (onSaveNotes) {
      onSaveNotes(notes);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleComplete = () => {
    if (onCompleteConsultation) {
      onCompleteConsultation(notes);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <Stethoscope className="w-4 h-4 text-teal-600" />
          <h4 className="font-bold text-slate-900 text-sm">Physician Clinical Assessment &amp; Notes</h4>
        </div>
        {savedSuccess && (
          <span className="text-xs text-emerald-600 font-medium">Notes recorded!</span>
        )}
      </div>

      <div>
        <label htmlFor="clinical-notes" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Doctor&apos;s Examination &amp; Clinical Notes
        </label>
        <textarea
          id="clinical-notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isCompleted || isLoading}
          placeholder="Enter clinical findings, provisional diagnosis, advised laboratory investigations, or prescription remarks..."
          className="w-full p-3 text-sm bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900 resize-y"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          These notes are authored directly by the attending physician and saved into the patient&apos;s record.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isCompleted || isLoading}
          className="w-full sm:w-auto gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>Save Draft Notes</span>
        </Button>

        <Button
          type="button"
          variant="emerald"
          size="md"
          onClick={handleComplete}
          disabled={isCompleted || isLoading}
          isLoading={isLoading}
          className="w-full sm:w-auto gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          <span>{isCompleted ? 'Consultation Completed' : 'Complete Consultation'}</span>
        </Button>
      </div>
    </div>
  );
}
