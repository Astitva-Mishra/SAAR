'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  ArrowLeft,
  User,
  AlertCircle,
  Clock,
  Stethoscope,
} from 'lucide-react';
import { ExtractedComplaint } from './UnderstandingStep';
import { CaseDocument } from '@/types';

interface SummaryStepProps {
  patientName: string;
  extracted: ExtractedComplaint;
  departmentName: string;
  safetyStatus: string;
  departmentAnswers: Record<string, string>;
  documents?: CaseDocument[];
  isSubmitting?: boolean;
  onSubmitCase: () => void;
  onBack: () => void;
}

export function SummaryStep({
  patientName,
  extracted,
  departmentName,
  safetyStatus,
  departmentAnswers,
  documents = [],
  isSubmitting = false,
  onSubmitCase,
  onBack,
}: SummaryStepProps) {
  const answerEntries = Object.entries(departmentAnswers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Step 6: Final Case Summary</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Review Your Intake Summary
        </h2>
        <p className="text-sm text-slate-600">
          Please review your information before submitting to the clinical queue.
        </p>
      </div>

      {/* Prominent Intake Summary Card */}
      <div className="bg-white border-2 border-teal-600/30 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-900 text-sm">{patientName}</span>
          </div>
          <Badge variant="teal" size="sm">
            Ready to Submit
          </Badge>
        </div>

        {/* Structured Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Chief Complaint
            </span>
            <p className="font-semibold text-slate-900 mt-0.5">{extracted.chiefComplaint}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Duration
            </span>
            <p className="font-semibold text-slate-900 mt-0.5">{extracted.duration}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Recommended Clinical Department
            </span>
            <div className="mt-1">
              <Badge variant="indigo">{departmentName}</Badge>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 sm:col-span-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Symptoms Reported
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {extracted.symptoms.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Safety Screening
            </span>
            <div className="mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800">{safetyStatus}</span>
            </div>
          </div>
        </div>

        {/* Question Responses Section */}
        {answerEntries.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Department Questionnaire Responses ({departmentName})
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {answerEntries.map(([key, val], idx) => (
                <div
                  key={key}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                >
                  <span className="font-semibold text-slate-700 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-slate-900 font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attached Medical Documents Preview */}
        {documents && documents.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Attached Medical Records ({documents.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {documents.map((doc) => (
                <div
                  key={doc.documentId}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">
                      {doc.originalName || doc.filename}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {doc.extractedSummary?.documentType || doc.mimeType}
                    </p>
                  </div>
                  <Badge
                    variant={doc.extractionStatus === 'EXTRACTED' ? 'emerald' : 'amber'}
                    size="sm"
                    className="text-[10px] flex-shrink-0"
                  >
                    {doc.extractionStatus === 'EXTRACTED' ? 'Extracted' : 'Attached'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Case Summary Box */}
        <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-700" />
            <h4 className="font-bold text-sm text-teal-950">Intake Case Summary</h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Patient reports {extracted.chiefComplaint.toLowerCase()} with {extracted.symptoms.join(', ').toLowerCase()} for approximately {extracted.duration.toLowerCase()}.
            The information collected during intake is intended to help the healthcare provider
            understand the patient&apos;s complaint and relevant details before consultation.
          </p>
        </div>

        {/* Non-Diagnostic Disclaimer */}
        <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Clinical Note:</strong> This is a structured case-intake summary. It does not
            represent a medical diagnosis, clinical assessment, prescription, or treatment plan.
            Your doctor will perform the clinical evaluation.
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:w-auto gap-2 h-12 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back &amp; Edit</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onSubmitCase}
          isLoading={isSubmitting}
          className="w-full sm:w-auto gap-2 h-12 text-sm font-semibold px-8 shadow-sm hover:shadow-md"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Confirm &amp; Submit Case</span>
        </Button>
      </div>
    </div>
  );
}
