import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  CheckCircle,
  AlertOctagon,
  FileText,
  Paperclip,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { PatientCase } from '@/types';

interface ClinicalSummaryViewProps {
  caseData: PatientCase;
}

export function ClinicalSummaryView({ caseData }: ClinicalSummaryViewProps) {
  const { aiSummary, riskLevel, safetyFlags, safetyMessage, department } = caseData;
  const [expandedRawDocs, setExpandedRawDocs] = useState<Record<string, boolean>>({});

  const toggleRawText = (docId: string) => {
    setExpandedRawDocs((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Prominent Clinical Disclaimer Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Clinical Decision Support Mode:</span> This structured
          summary is generated from patient intake responses. CareKare does not establish a diagnosis
          or prescribe treatment. Final clinical evaluation remains the responsibility of the attending
          physician.
        </div>
      </div>

      {/* Triage & Department Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Safety Engine Deterministic Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Deterministic Safety Screening
            </span>
            <Badge
              variant={
                riskLevel === 'EMERGENCY'
                  ? 'rose'
                  : riskLevel === 'POTENTIALLY_URGENT'
                  ? 'amber'
                  : 'emerald'
              }
            >
              {riskLevel}
            </Badge>
          </div>
          <div className="text-xs text-slate-600">
            {safetyMessage || 'No immediate critical red-flag triggers identified.'}
          </div>
          {safetyFlags && safetyFlags.length > 0 && (
            <div className="pt-1 flex flex-wrap gap-1">
              {safetyFlags.map((flag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[11px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-medium"
                >
                  <AlertOctagon className="w-3 h-3" />
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Clinical Department */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recommended Clinical Routing
            </span>
            <Badge variant="indigo">{department}</Badge>
          </div>
          <p className="text-xs text-slate-600">
            Based on symptom cluster mapping, consultation is routed to {department}.
          </p>
        </div>
      </div>

      {/* Patient-Uploaded Medical Documents (Provenance Preserved) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Paperclip className="w-4 h-4 text-teal-600" />
            <h4 className="font-bold text-slate-900 text-sm">
              Patient-Uploaded Medical Records &amp; Documents
            </h4>
          </div>
          <Badge variant="teal" size="sm">
            {caseData.documents?.length || 0} Attached
          </Badge>
        </div>

        {/* Provenance Alert */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2.5">
          <FileText className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Document Provenance:</strong> Information below is extracted from patient-uploaded
            records. CareKare does NOT convert previous documented conditions into active diagnoses.
            The attending physician should review original documents.
          </span>
        </div>

        {caseData.documents && caseData.documents.length > 0 ? (
          <div className="space-y-4 pt-1">
            {caseData.documents.map((doc) => {
              const isExpanded = !!expandedRawDocs[doc.documentId];
              const isExtracted = doc.extractionStatus === 'EXTRACTED';

              return (
                <div
                  key={doc.documentId}
                  className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm truncate">
                          {doc.originalName || doc.filename}
                        </span>
                        <Badge variant="indigo" size="sm">
                          {doc.extractedSummary?.documentType || 'Document'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {doc.mimeType} • {(doc.size / 1024).toFixed(1)} KB • Uploaded:{' '}
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isExtracted ? 'emerald' : 'amber'}
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        {isExtracted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Extracted
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Unreadable
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  {/* Structured Clinical Information from Document */}
                  {isExtracted && doc.extractedSummary && (
                    <div className="space-y-2.5 text-xs">
                      {/* Previous Diagnoses */}
                      {doc.extractedSummary.previousDiagnoses &&
                        doc.extractedSummary.previousDiagnoses.length > 0 && (
                          <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200/70">
                            <span className="font-bold text-amber-900 block mb-1">
                              Explicitly Documented Past Diagnoses (Historical):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {doc.extractedSummary.previousDiagnoses.map((diag, i) => (
                                <span
                                  key={i}
                                  className="bg-white border border-amber-200 text-amber-900 px-2 py-0.5 rounded font-medium text-[11px]"
                                >
                                  {diag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Medications Mentioned */}
                      {doc.extractedSummary.medications &&
                        doc.extractedSummary.medications.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-600 block mb-1">
                              Medications Mentioned in Record:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {doc.extractedSummary.medications.map((med, i) => (
                                <span
                                  key={i}
                                  className="bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded text-[11px]"
                                >
                                  {med}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Lab Values */}
                      {doc.extractedSummary.labValues &&
                        doc.extractedSummary.labValues.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-600 block mb-1">
                              Laboratory / Diagnostic Findings:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {doc.extractedSummary.labValues.map((lab, i) => (
                                <span
                                  key={i}
                                  className="bg-white border border-slate-200 text-slate-800 font-mono px-2 py-0.5 rounded text-[11px]"
                                >
                                  {lab}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Observations */}
                      {doc.extractedSummary.observations &&
                        doc.extractedSummary.observations.length > 0 && (
                          <div>
                            <span className="font-bold text-slate-600 block mb-1">
                              Key Clinical Observations:
                            </span>
                            <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                              {doc.extractedSummary.observations.map((obs, i) => (
                                <li key={i}>{obs}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Failure Message */}
                  {!isExtracted && doc.errorMessage && (
                    <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      {doc.errorMessage}
                    </div>
                  )}

                  {/* Expandable Raw Text Accordion */}
                  {doc.extractedText && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleRawText(doc.documentId)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            Hide Raw Extracted Text
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            View Raw Extracted Text ({doc.extractedText.length} chars)
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
                          {doc.extractedText}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2">
            No supporting medical documents were uploaded by the patient for this case.
          </p>
        )}
      </div>

      {/* Structured Case Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h4 className="font-bold text-slate-900 text-sm">
              Structured Clinical Presentation (AI-Assisted)
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Intake ID: {caseData.caseId}
          </span>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Chief Complaint &amp; Timeline
            </h5>
            <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
              {aiSummary.chiefComplaintStructured || caseData.chiefComplaint}
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Chronology &amp; Symptom Progression
            </h5>
            <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed text-xs sm:text-sm">
              {aiSummary.symptomChronology || `Reported duration of ${caseData.duration}.`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Associated Symptoms
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {aiSummary.associatedSymptoms && aiSummary.associatedSymptoms.length > 0 ? (
                  aiSummary.associatedSymptoms.map((sym, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 rounded-md font-medium"
                    >
                      {sym}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">None reported</span>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Pertinent Negatives (Patient Denied)
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {aiSummary.pertinentNegatives && aiSummary.pertinentNegatives.length > 0 ? (
                  aiSummary.pertinentNegatives.map((neg, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md"
                    >
                      No {neg}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Standard negatives recorded</span>
                )}
              </div>
            </div>
          </div>

          {/* Department Answers */}
          {caseData.answers && caseData.answers.length > 0 && (
            <div className="pt-2">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Department Questionnaire Responses ({department})
              </h5>
              <div className="space-y-2">
                {caseData.answers.map((ans, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80 text-xs"
                  >
                    <span className="font-semibold text-slate-800 block mb-0.5">
                      Q: {ans.questionText}
                    </span>
                    <span className="text-slate-600">A: {ans.answerText || 'Not specified'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
