'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  PlusCircle,
  FileText,
  UploadCloud,
  CalendarCheck,
  ArrowRight,
  Activity,
  User as UserIcon,
  Sparkles,
  Loader2,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PatientCase, User } from '@/types';
import { DEMO_PATIENT, DEMO_CASES } from '@/lib/mock/patient-data';

export default function PatientDashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch authenticated user profile
      const userRes = await api.auth.me().catch(() => null);
      if (userRes && userRes.user) {
        setCurrentUser(userRes.user);
      }

      // 2. Fetch real patient cases from MongoDB
      const casesRes = await api.cases.list();
      if (casesRes && Array.isArray(casesRes.cases)) {
        setCases(casesRes.cases);
      } else {
        setCases([]);
      }
    } catch (err: any) {
      console.error('[PatientDashboard] Error fetching cases:', err.message);
      setError(err.message || 'Failed to load your intake cases from database.');
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const displayName = currentUser?.name || DEMO_PATIENT.name;
  const recentCases = cases.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="patient" userName={displayName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Primary CTA Hero Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm">
              <UserIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Patient Health Portal
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {getGreeting()}, {displayName.split(' ')[0]}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Patient Account • Role: <span className="font-semibold text-teal-700">{currentUser?.role || 'PATIENT'}</span>
                {currentUser?.aadhaarMasked && (
                  <span className="ml-2 pl-2 border-l border-slate-200">
                    Aadhaar: <span className="font-mono text-slate-700">{currentUser.aadhaarMasked}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link href="/patient/new-case" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto gap-2.5 shadow-sm hover:shadow-md h-12 text-base px-6 font-semibold"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Start a New Case</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Grid: Recent Cases & Quick Services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Cases Section (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Cases</h2>
              </div>
              <Link
                href="/patient/history"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 group"
              >
                <span>View Complete History</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="p-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                <span>Loading your intake cases from database...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800 text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <Button variant="outline" size="sm" onClick={loadDashboardData}>
                  Retry
                </Button>
              </div>
            )}

            {/* Cases List */}
            {!isLoading && recentCases.length > 0 && (
              <div className="space-y-3.5">
                {recentCases.map((c) => (
                  <div
                    key={c.caseId || (c as any)._id}
                    className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {c.caseId}
                        </span>
                        <Badge variant="indigo" size="sm">
                          {c.department}
                        </Badge>
                        <Badge
                          variant={c.status === 'COMPLETED' ? 'emerald' : 'amber'}
                          size="sm"
                        >
                          {c.status === 'COMPLETED' ? 'Consultation Completed' : 'Submitted / In Review'}
                        </Badge>
                        <Badge
                          variant={
                            c.riskLevel === 'EMERGENCY'
                              ? 'rose'
                              : c.riskLevel === 'POTENTIALLY_URGENT'
                              ? 'amber'
                              : 'emerald'
                          }
                          size="sm"
                        >
                          {c.riskLevel} Risk
                        </Badge>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                        {c.chiefComplaint}
                      </h3>

                      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>Duration: {c.duration}</span>
                        <span>•</span>
                        <span>
                          Symptoms: {Array.isArray(c.symptoms) ? c.symptoms.slice(0, 3).join(', ') : c.chiefComplaint}
                        </span>
                        <span>•</span>
                        <span>
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Today'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center sm:self-center">
                      <Link href={`/patient/case/${c.caseId}`} className="w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="w-full sm:w-auto font-medium">
                          View Case Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && recentCases.length === 0 && (
              <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-3">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">No Intake Cases Recorded</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You have not submitted any medical cases yet. Start a new case to describe your symptoms and prepare your consultation summary.
                </p>
                <Link href="/patient/new-case" className="inline-block pt-1">
                  <Button variant="primary" size="sm" className="gap-2">
                    <PlusCircle className="w-4 h-4" />
                    <span>Start Your First Case</span>
                  </Button>
                </Link>
              </div>
            )}

            {/* Helper Banner */}
            <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
              <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <p>
                Cases submitted through CareKare are structured immediately and queued for
                physician evaluation. You can review past summaries and doctor recommendations at any time.
              </p>
            </div>
          </div>

          {/* Quick Actions & Health Services (1 Col) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Quick Services</h2>

            <div className="space-y-3">
              {/* Profile & Health Information */}
              <Link href="/patient/profile" className="block group">
                <Card className="group-hover:border-teal-300 transition-all border-slate-200 shadow-sm">
                  <CardContent className="p-4 flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                        My Health Profile
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Manage contact, vitals, and emergency information
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </CardContent>
                </Card>
              </Link>

              {/* My Health History */}
              <Link href="/patient/history" className="block group">
                <Card className="group-hover:border-teal-300 transition-all border-slate-200 shadow-sm">
                  <CardContent className="p-4 flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                        My Case History
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        View previous consultation summaries and doctor notes
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </CardContent>
                </Card>
              </Link>

              {/* Doctor Follow-ups */}
              <div className="block">
                <Card className="border-slate-200 bg-slate-50/70">
                  <CardContent className="p-4 flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-slate-700">Follow-ups</h4>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          Routine
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Scheduled OPD reviews &amp; medication follow-ups
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
