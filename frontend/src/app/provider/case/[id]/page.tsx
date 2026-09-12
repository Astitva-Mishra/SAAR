'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClinicalSummaryView } from '@/components/provider/ClinicalSummaryView';
import { NotesEditor } from '@/components/provider/NotesEditor';
import {
  ArrowLeft,
  User,
  Clock,
  Calendar,
  CheckCircle,
  Loader2,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PatientCase, User as UserType } from '@/types';

interface ProviderCaseDetailProps {
  params: {
    id: string;
  };
}

export default function ProviderCaseDetailPage({ params }: ProviderCaseDetailProps) {
  const caseId = params.id;
  const [caseData, setCaseData] = useState<PatientCase | null>(null);
  const [providerUser, setProviderUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  const fetchCaseDetail = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Authenticated user check
      const userRes = await api.auth.me().catch(() => null);
      if (userRes?.user) {
        setProviderUser(userRes.user);
      }

      // 2. Fetch live case from backend
      const res = await api.cases.get(caseId);
      if (res && res.case) {
        setCaseData(res.case);
      } else {
        setErrorMessage('Case record not found.');
      }
    } catch (err: any) {
      console.error('[ProviderCaseDetail] Error fetching case:', err);
      setErrorMessage(err.message || 'Failed to load case detail from server.');
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCaseDetail();
  }, [fetchCaseDetail]);

  // Action: Mark case IN_REVIEW
  const handleMarkInReview = async () => {
    if (!caseData || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setActionErrorMessage(null);
    try {
      const res = await api.cases.updateStatus(caseData.caseId, 'IN_REVIEW');
      if (res.case) {
        setCaseData(res.case);
        setActionSuccessMessage('Case status updated to IN_REVIEW.');
        setTimeout(() => setActionSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Error updating status.');
      setTimeout(() => setActionErrorMessage(null), 5000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Action: Save physician clinical notes
  const handleSaveNotes = async (notes: string) => {
    if (!caseData || isSavingNotes) return;
    setIsSavingNotes(true);
    setActionErrorMessage(null);
    try {
      const res = await api.cases.updateNotes(caseData.caseId, notes);
      if (res.case) {
        setCaseData(res.case);
        setActionSuccessMessage('Clinical assessment notes saved.');
        setTimeout(() => setActionSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Error saving clinical notes.');
      setTimeout(() => setActionErrorMessage(null), 5000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Action: Complete consultation
  const handleCompleteConsultation = async (notes: string) => {
    if (!caseData || isCompleting) return;
    setIsCompleting(true);
    setActionErrorMessage(null);
    try {
      const res = await api.cases.completeCase(caseData.caseId, notes);
      if (res.case) {
        setCaseData(res.case);
        setActionSuccessMessage('Consultation finalized. Case status marked as COMPLETED.');
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Error completing consultation.');
      setTimeout(() => setActionErrorMessage(null), 5000);
    } finally {
      setIsCompleting(false);
    }
  };

  const providerDisplayName = providerUser?.name || 'Dr. Priya Verma';
  const isCompleted = caseData?.status === 'COMPLETED';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="provider" userName={providerDisplayName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link href="/provider/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5 font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Case Queue</span>
            </Button>
          </Link>

          {caseData && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                Case ID: {caseData.caseId}
              </span>
              <Badge
                variant={
                  caseData.status === 'COMPLETED'
                    ? 'emerald'
                    : caseData.status === 'IN_REVIEW'
                    ? 'teal'
                    : 'amber'
                }
                size="md"
              >
                {caseData.status === 'COMPLETED'
                  ? 'Consultation Completed'
                  : caseData.status === 'IN_REVIEW'
                  ? 'In Review'
                  : 'Pending Review'}
              </Badge>

              {caseData.status === 'SUBMITTED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleMarkInReview}
                  disabled={isUpdatingStatus}
                  className="bg-teal-700 hover:bg-teal-800 gap-1.5 text-xs font-semibold"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Start Review</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Action feedback toast */}
        {actionSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {actionErrorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{actionErrorMessage}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading patient clinical dossier from database...</span>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !isLoading && (
          <div className="p-8 bg-white border border-rose-200 rounded-2xl text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-slate-800">Unable to load case</h2>
            <p className="text-xs text-slate-500">{errorMessage}</p>
            <Link href="/provider/dashboard" className="inline-block pt-1">
              <Button variant="outline" size="sm">
                Return to Queue
              </Button>
            </Link>
          </div>
        )}

        {/* Case Dossier View */}
        {caseData && !isLoading && (
          <>
            {/* Patient Demographics & Intake Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-lg border border-teal-100">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        {caseData.patientName}
                      </h1>
                      <Badge variant="slate" size="sm">
                        {caseData.patientAge}y • {caseData.patientGender}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Patient Reference ID: <span className="font-mono text-slate-700">{caseData.patientId}</span> • Department: <span className="font-semibold text-teal-700">{caseData.department}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {caseData.createdAt
                        ? new Date(caseData.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Today'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {caseData.createdAt
                        ? new Date(caseData.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '10:00 AM'}
                    </span>
                  </div>
                  <Badge variant="indigo">{caseData.department}</Badge>
                </div>
              </div>

              {/* Quick Intake Snapshot */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Patient Chief Complaint
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">{caseData.chiefComplaint}</p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Duration &amp; Severity
                  </span>
                  <p className="font-medium text-slate-700 mt-0.5">
                    {caseData.duration} • <span className="font-semibold">{caseData.severity}</span>
                  </p>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Deterministic Triage Risk
                  </span>
                  <div className="pt-0.5">
                    <Badge
                      variant={
                        caseData.riskLevel === 'EMERGENCY'
                          ? 'rose'
                          : caseData.riskLevel === 'POTENTIALLY_URGENT'
                          ? 'amber'
                          : 'emerald'
                      }
                    >
                      {caseData.riskLevel} Risk
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Grid: Clinical Dossier + Notes Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Clinical Summary View */}
              <div className="lg:col-span-2 space-y-6">
                <ClinicalSummaryView caseData={caseData} />
              </div>

              {/* Right Col: Physician Notes & Consultation Finalization */}
              <div className="space-y-6">
                <NotesEditor
                  initialNotes={caseData.clinicalNotes || ''}
                  isCompleted={isCompleted}
                  onSaveNotes={handleSaveNotes}
                  onCompleteConsultation={handleCompleteConsultation}
                />

                {/* Consultation Completed Confirmation Card */}
                {isCompleted && (
                  <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span>Consultation Completed</span>
                    </div>
                    <p className="text-xs text-emerald-700 leading-relaxed">
                      This clinical record has been completed by {providerDisplayName}.
                      The consultation summary and doctor notes are permanently archived in the patient&apos;s case history.
                    </p>
                    <Link href="/provider/dashboard" className="block pt-1">
                      <Button variant="outline" size="sm" className="w-full bg-white text-emerald-800 border-emerald-300">
                        Return to Case Queue
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
