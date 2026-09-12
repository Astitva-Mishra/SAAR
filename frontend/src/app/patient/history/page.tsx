'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  PlusCircle,
  Clock,
  ArrowUpRight,
  ArrowLeft,
  Calendar,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { api } from '@/lib/api';
import { PatientCase } from '@/types';
import { DEMO_PATIENT, DEMO_CASES } from '@/lib/mock/patient-data';

export default function PatientHistoryPage() {
  const [userName, setUserName] = useState<string>('Patient');
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchCases = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userRes = await api.auth.me().catch(() => null);
      if (userRes?.user?.name) {
        setUserName(userRes.user.name);
      }

      const response = await api.cases.list();
      if (response && Array.isArray(response.cases)) {
        setCases(response.cases);
      } else {
        setCases([]);
      }
    } catch (err: any) {
      console.error('[PatientHistory] Error fetching history:', err.message);
      setError(err.message || 'Failed to load case history from database.');
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesDept = filterDepartment === 'ALL' || c.department === filterDepartment;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      (c.chiefComplaint && c.chiefComplaint.toLowerCase().includes(q)) ||
      (c.caseId && c.caseId.toLowerCase().includes(q)) ||
      (c.department && c.department.toLowerCase().includes(q));
    return matchesDept && matchesQuery;
  });

  const uniqueDepartments = Array.from(new Set(cases.map((c) => c.department).filter(Boolean)));
  const departments = ['ALL', ...uniqueDepartments];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="patient" userName={userName} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/patient/dashboard"
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Health Case History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Review all prior intake records, structured clinical summaries, and completed consultations.
            </p>
          </div>

          <Link href="/patient/new-case">
            <Button variant="primary" size="md" className="gap-2 shadow-sm">
              <PlusCircle className="w-4 h-4" />
              <span>Start New Case</span>
            </Button>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by complaint or case ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:block" />
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setFilterDepartment(dept)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filterDepartment === dept
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dept === 'ALL' ? 'All Departments' : dept}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span>Loading case history from database...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-rose-800 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={fetchCases}>
              Retry
            </Button>
          </div>
        )}

        {/* Case List */}
        {!isLoading && (
          <div className="space-y-3.5">
            {filteredCases.length > 0 ? (
              filteredCases.map((item) => (
                <Card
                  key={item.caseId || (item as any)._id}
                  className="border-slate-200/90 shadow-sm hover:border-teal-300 transition-all group"
                >
                  <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {item.caseId}
                        </span>
                        <Badge variant="indigo" size="sm">
                          {item.department}
                        </Badge>
                        <Badge
                          variant={item.status === 'COMPLETED' ? 'emerald' : 'amber'}
                          size="sm"
                        >
                          {item.status === 'COMPLETED' ? 'Completed' : 'Submitted / In Review'}
                        </Badge>
                        <Badge
                          variant={
                            item.riskLevel === 'EMERGENCY'
                              ? 'rose'
                              : item.riskLevel === 'POTENTIALLY_URGENT'
                              ? 'amber'
                              : 'emerald'
                          }
                          size="sm"
                        >
                          {item.riskLevel} Risk
                        </Badge>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                        {item.chiefComplaint}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Today'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Duration: {item.duration}
                        </span>
                        <span>
                          Symptoms: {Array.isArray(item.symptoms) ? item.symptoms.join(', ') : item.chiefComplaint}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center">
                      <Link href={`/patient/case/${item.caseId}`}>
                        <Button variant="outline" size="sm" className="gap-1.5 font-medium group-hover:border-teal-400">
                          <span>View Case</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-2">
                <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No matching cases found</p>
                <p className="text-xs text-slate-400">
                  Try clearing your search query or selecting &ldquo;All Departments&rdquo;.
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
