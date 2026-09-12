import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MetricsProps {
  total: number;
  pending: number;
  urgent: number;
  completed: number;
}

export function MetricsHeader({ total, pending, urgent, completed }: MetricsProps) {
  const cards = [
    {
      title: 'Total Intake Cases',
      value: total,
      label: 'All registered consultations',
      icon: Users,
      color: 'text-slate-700 bg-slate-100',
      badgeColor: 'text-slate-600',
    },
    {
      title: 'Pending Review',
      value: pending,
      label: 'Awaiting doctor consultation',
      icon: Clock,
      color: 'text-amber-700 bg-amber-50',
      badgeColor: 'text-amber-700 font-semibold',
    },
    {
      title: 'Urgent / Priority',
      value: urgent,
      label: 'Triaged with red-flag risk',
      icon: AlertTriangle,
      color: 'text-rose-700 bg-rose-50',
      badgeColor: 'text-rose-700 font-semibold',
    },
    {
      title: 'Completed',
      value: completed,
      label: 'Consultation finished',
      icon: CheckCircle2,
      color: 'text-emerald-700 bg-emerald-50',
      badgeColor: 'text-emerald-700 font-semibold',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((item, idx) => {
        const Icon = item.icon;
        return (
          <Card key={idx} className="border-slate-200/90 shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{item.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                  {item.value}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.label}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
