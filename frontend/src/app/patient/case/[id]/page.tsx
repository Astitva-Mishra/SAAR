'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Clock,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  User as UserIcon,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PatientCase } from '@/types';
import { DEMO_PATIENT, DEMO_CASES } from '@/lib/mock/patient-data';

interface PatientCaseViewProps {
  params: {
    id: string;
  };
}

export default function PatientCaseDetailPage({ params }: PatientCaseViewProps) {
  const caseId = params.id || 'ARG-2026-104';
  const [caseData, setCaseData] = useState<PatientCase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadCase() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.cases.get(caseId);
        if (isMounted) {
          if (res && res.case) {
            setCaseData(res.case);
          } else {
            setError('Case record not found.');
          }
        }
      } catch (err: any) {
        console.error('[CaseDetail] Error loading case:', caseId, err.message);
        if (isMounted) {
          setError(err.message || 'Case record not found or access is restricted.');
          setCaseData(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCase();
    return () => {
      isMounted = false;
    };
  }, [caseId]);

  const matchedCase = caseData;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar portal="patient" userName="Patient" />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <div className="p-8 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-600 text-sm shadow-sm">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span>Loading case details from database...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!matchedCase) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar portal="patient" userName="Patient" />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-4 max-w-md mx-auto shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Case Not Found or Restricted</h2>
            <p className="text-sm text-slate-500">
              {error || `The medical case "${caseId}" could not be located, or you do not have permission to access it.`}
            </p>
            <div className="pt-2">
              <Link href="/patient/dashboard">
                <Button variant="primary" size="md">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const timelineSteps = [
    { title: 'Case Started', desc: 'Patient initiated case taking on kiosk', status: 'done', time: '10:15 AM' },
    { title: 'Information Collected', desc: 'Symptoms and duration structured', status: 'done', time: '10:18 AM' },
    {
      title: 'Safety Screening',
      desc: matchedCase.riskLevel === 'EMERGENCY'
        ? 'Emergency flag detected - Priority Triage'
        : matchedCase.riskLevel === 'POTENTIALLY_URGENT'
        ? 'Urgent attention flagged'
        : 'Red-flag protocol completed (Low Risk)',
      status: 'done',
      time: '10:20 AM',
    },
    { title: 'Case Submitted', desc: `Forwarded to ${matchedCase.department} clinical queue`, status: 'done', time: '10:22 AM' },
    {
      title: 'Awaiting Provider Review',
      desc: matchedCase.status === 'COMPLETED' ? 'Consultation completed by physician' : 'Queued for OPD triage physician',
      status: matchedCase.status === 'COMPLETED' ? 'done' : 'active',
      time: matchedCase.status === 'COMPLETED' ? 'Completed' : 'Current',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="patient" userName={matchedCase.patientName || 'Patient'} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href="/patient/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              {matchedCase.caseId}
            </span>
            <Badge
              variant={matchedCase.status === 'COMPLETED' ? 'emerald' : 'amber'}
              size="md"
            >
              {matchedCase.status === 'COMPLETED' ? 'Consultation Completed' : 'Submitted / In Review'}
            </Badge>
          </div>
        </div>

        {/* Case Dossier Main Card */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider block">
                Clinical Case Record
              </span>
              <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {matchedCase.chiefComplaint}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  {matchedCase.patientName} ({matchedCase.patientAge}y • {matchedCase.patientGender})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Duration: {matchedCase.duration}
                </span>
                <span>•</span>
                <span>Severity: {matchedCase.severity}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="indigo" size="md">
                {matchedCase.department}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Read-Only Visual Case Timeline */}
            <div className="bg-slate-50/80 p-5 sm:p-6 rounded-2xl border border-slate-200/90 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Case Processing Timeline
                </h3>
                <span className="text-xs text-slate-400">Chronological Progression</span>
              </div>

              <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-200">
                {timelineSteps.map((step, idx) => {
                  const isDone = step.status === 'done';
                  return (
                    <div key={idx} className="relative flex items-start justify-between gap-4">
                      <div
                        className={`absolute -left-6 sm:-left-8 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isDone
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'bg-white border-amber-500 text-amber-600 animate-pulse'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </div>

                      <div>
                        <h4
                          className={`text-sm font-bold ${
                            isDone ? 'text-slate-900' : 'text-amber-900'
                          }`}
                        >
                          {step.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                      </div>

                      <span className="text-[11px] font-mono font-medium text-slate-400 flex-shrink-0">
                        {step.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Case Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Reported Symptoms */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Reported Symptoms
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Array.isArray(matchedCase.symptoms) && matchedCase.symptoms.length > 0 ? (
                    matchedCase.symptoms.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-medium"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">{matchedCase.chiefComplaint}</span>
                  )}
                </div>
              </div>

              {/* Safety Screening Status */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Safety Triage Screening
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <ShieldCheck
                    className={`w-4 h-4 flex-shrink-0 ${
                      matchedCase.riskLevel === 'EMERGENCY'
                        ? 'text-rose-600'
                        : matchedCase.riskLevel === 'POTENTIALLY_URGENT'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      matchedCase.riskLevel === 'EMERGENCY'
                        ? 'text-rose-800'
                        : matchedCase.riskLevel === 'POTENTIALLY_URGENT'
                        ? 'text-amber-800'
                        : 'text-emerald-800'
                    }`}
                  >
                    {matchedCase.riskLevel} Risk • Screening Completed
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {matchedCase.safetyMessage || 'Routine consultation screening completed.'}
                </p>
              </div>
            </div>

            {/* Department Responses */}
            {matchedCase.answers && matchedCase.answers.length > 0 && (
              <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Department Questionnaire ({matchedCase.department})
                  </span>
                  <Badge variant="indigo" size="sm">
                    {matchedCase.answers.length} Responses Recorded
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {matchedCase.answers.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1"
                    >
                      <span className="font-semibold text-slate-700 block">{item.questionText}</span>
                      <span className="text-slate-900 font-medium block">{item.answerText}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Medical Documents */}
            {matchedCase.documents && matchedCase.documents.length > 0 && (
              <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Attached Medical Records ({matchedCase.documents.length})
                  </span>
                  <Badge variant="teal" size="sm">
                    {matchedCase.documents.length} File{matchedCase.documents.length > 1 ? 's' : ''} Uploaded
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {matchedCase.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 block truncate">
                          {doc.originalName || doc.filename}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {doc.extractedSummary?.documentType || doc.mimeType} • {(doc.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <Badge
                        variant={doc.extractionStatus === 'EXTRACTED' ? 'emerald' : 'amber'}
                        size="sm"
                        className="text-[10px] flex-shrink-0"
                      >
                        {doc.extractionStatus === 'EXTRACTED' ? 'Processed' : 'Attached'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI-Structured Intake Summary */}
            {matchedCase.aiSummary && (
              <div className="p-5 bg-teal-50/50 rounded-xl border border-teal-200/90 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <h4 className="font-bold text-sm text-teal-950">Intake Case Summary</h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {matchedCase.aiSummary.chiefComplaintStructured || matchedCase.chiefComplaint}.{' '}
                  {matchedCase.aiSummary.symptomChronology || `Duration: ${matchedCase.duration}`}.
                </p>
                {matchedCase.aiSummary.suggestedReviewFocus && matchedCase.aiSummary.suggestedReviewFocus.length > 0 && (
                  <div className="pt-2 border-t border-teal-100 text-xs space-y-1">
                    <span className="font-bold text-teal-900 text-[11px] uppercase tracking-wider block">
                      Suggested Review Focus for Attending Physician:
                    </span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {matchedCase.aiSummary.suggestedReviewFocus.map((focus, idx) => (
                        <li key={idx}>{focus}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 pt-1">
                  Prepared by CareKare as clinical decision support. The attending physician will review this
                  summary during consultation.
                </p>
              </div>
            )}

            {/* Doctor Clinical Notes (if completed) */}
            {matchedCase.clinicalNotes && (
              <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Stethoscope className="w-4 h-4 text-amber-700" />
                  <span>Physician Consultation Notes</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {matchedCase.clinicalNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
