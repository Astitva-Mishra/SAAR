'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { MetricsHeader } from '@/components/provider/MetricsHeader';
import { CaseFilterTable } from '@/components/provider/CaseFilterTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Stethoscope, Loader2, AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { api } from '@/lib/api';
import { PatientCase, User } from '@/types';

export default function ProviderDashboardPage() {
  const [providerUser, setProviderUser] = useState<User | null>(null);
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProviderData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Fetch authenticated provider details
      const userRes = await api.auth.me().catch(() => null);
      if (userRes && userRes.user) {
        setProviderUser(userRes.user);
      }

      // 2. Fetch live case queue from MongoDB
      const casesRes = await api.cases.list();
      if (casesRes && Array.isArray(casesRes.cases)) {
        setCases(casesRes.cases);
      } else {
        setCases([]);
      }
    } catch (err: any) {
      console.error('[ProviderDashboard] Error fetching cases:', err);
      setErrorMessage(err.message || 'Failed to load live case queue from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, []);

  const providerName = providerUser?.name || 'Dr. Priya Verma';
  const providerSpecialty = providerUser?.specialty || 'General Medicine & Triage';

  // Compute live triage metrics
  const totalCount = cases.length;
  const pendingCount = cases.filter((c) => c.status === 'SUBMITTED').length;
  const urgentCount = cases.filter(
    (c) => c.riskLevel === 'EMERGENCY' || c.riskLevel === 'POTENTIALLY_URGENT'
  ).length;
  const completedCount = cases.filter((c) => c.status === 'COMPLETED').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="provider" userName={providerName} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Console Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block animate-pulse" />
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Clinical Consultation Console
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {providerName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Specialty: <span className="font-semibold text-slate-700">{providerSpecialty}</span> • OPD Clinical Intake Queue
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProviderData}
              disabled={isLoading}
              className="gap-1.5 text-xs text-slate-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Refresh Queue</span>
            </Button>
            <Badge variant="indigo" size="md">
              Live Triage Active
            </Badge>
          </div>
        </div>

        {/* 4 Triage Metric Counters */}
        <MetricsHeader
          total={totalCount}
          pending={pendingCount}
          urgent={urgentCount}
          completed={completedCount}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="font-medium">Loading clinical case intake queue from database...</span>
          </div>
        )}

        {/* Error State */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProviderData}>
              Retry
            </Button>
          </div>
        )}

        {/* Case Queue Table */}
        {!isLoading && !errorMessage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Patient Case Intake Queue
                </h2>
                <p className="text-xs text-slate-500">
                  Sorted by arrival timestamp and deterministic triage priority level
                </p>
              </div>
            </div>

            {cases.length > 0 ? (
              <CaseFilterTable cases={cases} />
            ) : (
              <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-3">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800 text-sm">Your Consultation Queue is Clear</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are currently no patients waiting for review. When patients submit new consultation intakes, they will appear here sorted by triage priority.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
