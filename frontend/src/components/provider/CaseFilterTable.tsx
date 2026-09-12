'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowUpRight, Clock, AlertCircle } from 'lucide-react';
import { PatientCase, RiskLevel, CaseStatus } from '@/types';

interface CaseFilterTableProps {
  cases: PatientCase[];
}

export function CaseFilterTable({ cases }: CaseFilterTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'URGENT'
        ? c.riskLevel === 'EMERGENCY' || c.riskLevel === 'POTENTIALLY_URGENT'
        : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'EMERGENCY':
        return <Badge variant="rose">Emergency</Badge>;
      case 'POTENTIALLY_URGENT':
        return <Badge variant="amber">Potentially Urgent</Badge>;
      case 'MODERATE':
        return <Badge variant="amber">Moderate Risk</Badge>;
      default:
        return <Badge variant="emerald">Low Risk</Badge>;
    }
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="emerald">Completed</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="teal">In Review</Badge>;
      default:
        return <Badge variant="slate">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, case ID, complaint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:block" />
          {(['ALL', 'SUBMITTED', 'URGENT', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab === 'ALL'
                ? 'All Cases'
                : tab === 'SUBMITTED'
                ? 'Pending Review'
                : tab === 'URGENT'
                ? 'Urgent Priority'
                : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Patient / Case ID</th>
                <th className="py-3.5 px-4">Chief Complaint</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Safety Risk</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCases.length > 0 ? (
                filteredCases.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 group-hover:text-teal-700">
                        {item.patientName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {item.caseId} • {item.patientAge}y • {item.patientGender}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 line-clamp-1">
                        {item.chiefComplaint}
                      </span>
                      <span className="text-xs text-slate-400">
                        Duration: {item.duration}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        {item.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getRiskBadge(item.riskLevel)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/provider/case/${item.caseId}`}>
                        <Button variant="outline" size="sm" className="gap-1 hover:border-teal-400">
                          <span>Open</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    No cases match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
