import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Edit3, ShieldAlert } from 'lucide-react';

interface ExtractedData {
  chiefComplaint: string;
  symptoms: string[];
  duration: string;
  severity: string;
  clarifications?: string;
}

interface ConfirmationBoxProps {
  data: ExtractedData;
  onConfirm: () => void;
  onEdit: () => void;
  isConfirming?: boolean;
}

export function ConfirmationBox({
  data,
  onConfirm,
  onEdit,
  isConfirming = false,
}: ConfirmationBoxProps) {
  return (
    <div className="space-y-6">
      <div className="border border-teal-200 bg-teal-50/40 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-teal-100 pb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <h4 className="font-semibold text-slate-900 text-sm">
              Here is what CareKare structured from your description:
            </h4>
          </div>
          <Badge variant="teal" size="sm">
            Structured Summary
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Primary Chief Complaint
            </span>
            <p className="font-medium text-slate-800 capitalize">
              {data.chiefComplaint || 'Not specified'}
            </p>
          </div>

          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Reported Duration
            </span>
            <p className="font-medium text-slate-800">{data.duration || 'Recently'}</p>
          </div>

          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Severity Indicator
            </span>
            <div>
              <Badge
                variant={
                  data.severity === 'SEVERE'
                    ? 'rose'
                    : data.severity === 'MODERATE'
                    ? 'amber'
                    : 'emerald'
                }
              >
                {data.severity || 'MODERATE'}
              </Badge>
            </div>
          </div>

          <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Associated Symptoms
            </span>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {data.symptoms && data.symptoms.length > 0 ? (
                data.symptoms.map((sym, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded"
                  >
                    {sym}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">None detected</span>
              )}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-white/70 p-3 rounded-lg border border-teal-100 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <span>
            Please review these details carefully. If any symptom or duration is incorrect, click
            <strong> Edit</strong> to update it before we continue to the clinical department questions.
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          disabled={isConfirming}
          className="gap-1.5"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Information</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onConfirm}
          isLoading={isConfirming}
          className="gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Yes, That&apos;s Correct</span>
        </Button>
      </div>
    </div>
  );
}
