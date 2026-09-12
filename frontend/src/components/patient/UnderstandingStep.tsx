'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  Edit3,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Quote,
  ShieldCheck,
} from 'lucide-react';

export interface ExtractedComplaint {
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: string;
  clarifications?: string;
}

interface UnderstandingStepProps {
  rawComplaint: string;
  extracted: ExtractedComplaint;
  onConfirm: () => void;
  onEdit: () => void;
  onUpdateExtracted?: (updated: ExtractedComplaint) => void;
}

export function UnderstandingStep({
  rawComplaint,
  extracted,
  onConfirm,
  onEdit,
  onUpdateExtracted,
}: UnderstandingStepProps) {
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [editableComplaint, setEditableComplaint] = useState(extracted.chiefComplaint);
  const [editableDuration, setEditableDuration] = useState(extracted.duration);
  const [editableSymptoms, setEditableSymptoms] = useState(extracted.symptoms.join(', '));

  const handleSaveInline = () => {
    if (onUpdateExtracted) {
      onUpdateExtracted({
        ...extracted,
        chiefComplaint: editableComplaint,
        duration: editableDuration,
        symptoms: editableSymptoms.split(',').map((s) => s.trim()).filter(Boolean),
      });
    }
    setIsInlineEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="space-y-1 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Step 2: Understanding Your Symptoms</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Here&apos;s what was understood
        </h2>
        <p className="text-sm text-slate-600">
          CareKare structured your symptoms into clinical categories. Please verify accuracy.
        </p>
      </div>

      {/* What the patient originally said */}
      <div className="bg-slate-100/70 border border-slate-200/90 rounded-xl p-4 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Quote className="w-3.5 h-3.5 text-slate-400" />
          <span>You Said:</span>
        </div>
        <p className="text-sm font-medium text-slate-800 italic">
          &ldquo;{rawComplaint}&rdquo;
        </p>
      </div>

      {/* Prominent Confirmation Card */}
      <div className="bg-white border-2 border-teal-600/30 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-teal-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-base text-slate-900">
              Structured Complaint Summary
            </h3>
          </div>
          <Badge variant="teal" size="sm">
            AI Structured
          </Badge>
        </div>

        {!isInlineEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Chief Complaint */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Chief Complaint
              </span>
              <p className="font-semibold text-slate-900 capitalize text-base">
                {extracted.chiefComplaint}
              </p>
            </div>

            {/* Duration */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Duration
              </span>
              <p className="font-semibold text-slate-900 text-base">
                {extracted.duration}
              </p>
            </div>

            {/* Symptoms */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Extracted Symptoms
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {extracted.symptoms.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Inline Correction Form */
          <div className="space-y-4 p-4 bg-teal-50/40 rounded-xl border border-teal-200 text-sm">
            <h4 className="font-bold text-teal-900 text-xs uppercase tracking-wider">
              Adjust Extracted Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chief Complaint
                </label>
                <input
                  type="text"
                  value={editableComplaint}
                  onChange={(e) => setEditableComplaint(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={editableDuration}
                  onChange={(e) => setEditableDuration(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Symptoms (comma-separated)
                </label>
                <input
                  type="text"
                  value={editableSymptoms}
                  onChange={(e) => setEditableSymptoms(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsInlineEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveInline}
              >
                Apply Adjustments
              </Button>
            </div>
          </div>
        )}

        {/* Informational reassurance */}
        <div className="flex items-start gap-2.5 text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <span>
            CareKare structures your complaint to give your doctor an organized overview.
            You will always have an opportunity to review the final summary before submission.
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            if (isInlineEditing) {
              setIsInlineEditing(false);
            } else {
              onEdit();
            }
          }}
          className="w-full sm:w-auto gap-2 h-12 text-sm font-medium"
        >
          <Edit3 className="w-4 h-4" />
          <span>I&apos;d like to correct something</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onConfirm}
          className="w-full sm:w-auto gap-2 h-12 text-sm font-semibold px-6 shadow-sm hover:shadow-md"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Yes, that&apos;s correct</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
