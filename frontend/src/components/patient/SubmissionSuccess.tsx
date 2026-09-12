'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, LayoutDashboard, FileText, Clock, ShieldCheck } from 'lucide-react';

interface SubmissionSuccessProps {
  caseId: string;
  department: string;
  patientName: string;
}

export function SubmissionSuccess({
  caseId = 'ARG-2026-104',
  department = 'Gastroenterology',
  patientName = 'Rahul Sharma',
}: SubmissionSuccessProps) {
  return (
    <div className="py-8 px-4 max-w-lg mx-auto text-center space-y-6 animate-fade-in">
      {/* Success Badge Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle className="w-10 h-10 text-emerald-600" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Intake Protocol Complete</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Case Submitted Successfully
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Your case information has been prepared for review by a healthcare provider.
        </p>
      </div>

      {/* Case Details Card */}
      <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-5 shadow-sm text-left space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Case Identifier
          </span>
          <span className="font-mono font-bold text-base text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
            {caseId}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Patient:</span>
          <span className="font-bold text-slate-800">{patientName}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Assigned Clinical Department:</span>
          <Badge variant="indigo" size="sm">
            {department}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Triage Status:</span>
          <Badge variant="emerald" size="sm">
            Submitted
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Queued at:
          </span>
          <span className="text-slate-600 font-mono">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* What happens next */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 text-left space-y-1">
        <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
          What happens next?
        </span>
        <p>
          Your attending healthcare provider will access your structured summary directly from their
          clinical console, examine the intake questionnaire responses, and conduct your consultation.
        </p>
      </div>

      {/* Action Navigation Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href={`/patient/case/${caseId}`} className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto gap-2 h-12 px-6 font-semibold shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span>View Case</span>
          </Button>
        </Link>

        <Link href="/patient/dashboard" className="w-full sm:w-auto">
          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto gap-2 h-12 px-6 font-medium"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
