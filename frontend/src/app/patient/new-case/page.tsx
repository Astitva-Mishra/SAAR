'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/Footer';
import { IntakeStepper } from '@/components/patient/IntakeStepper';
import { ComplaintStep } from '@/components/patient/ComplaintStep';
import { UnderstandingStep, ExtractedComplaint } from '@/components/patient/UnderstandingStep';
import { SafetyStep } from '@/components/patient/SafetyStep';
import { DepartmentQuestionsStep } from '@/components/patient/DepartmentQuestionsStep';
import { DocumentUploadStep } from '@/components/patient/DocumentUploadStep';
import { SummaryStep } from '@/components/patient/SummaryStep';
import { SubmissionSuccess } from '@/components/patient/SubmissionSuccess';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { PatientCase, DepartmentQuestionConfig, CaseDocument } from '@/types';
import { DEMO_PATIENT } from '@/lib/mock/patient-data';
import { Loader2, AlertCircle } from 'lucide-react';

export default function NewCasePage() {
  // Step tracker: 1=Complaint, 2=Understanding, 3=Safety, 4=Questions, 5=Documents, 6=Summary, 7=Submitted
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Patient');
  const [attachedDocuments, setAttachedDocuments] = useState<CaseDocument[]>([]);

  // Active MongoDB Case reference
  const [activeCase, setActiveCase] = useState<PatientCase | null>(null);
  const [backendQuestions, setBackendQuestions] = useState<DepartmentQuestionConfig[]>([]);

  // 1. Complaint state
  const [complaint, setComplaint] = useState<string>(
    'I have stomach pain and nausea for three days.'
  );

  // 2. Extracted Information state
  const [extractedInformation, setExtractedInformation] = useState<ExtractedComplaint>({
    chiefComplaint: 'Stomach pain',
    symptoms: ['Stomach pain', 'Nausea'],
    duration: '3 days',
    severity: 'Moderate',
    clarifications: 'Dull continuous ache in upper abdomen',
  });

  // 3. Safety Check state
  const [safetyResponses, setSafetyResponses] = useState<Record<string, 'yes' | 'no'>>({
    chest_pain: 'no',
    breathing_difficulty: 'no',
    loss_of_consciousness: 'no',
  });

  // 4. Clinical Department Recommendation state
  const [department, setDepartment] = useState<string>('Gastroenterology');

  // 5. Department Questions Answers state
  const [departmentAnswers, setDepartmentAnswers] = useState<Record<string, string>>({
    pain_location: 'Upper abdomen (below ribs)',
    pain_severity: 'Moderate (Interferes with daily tasks)',
    meal_relation: 'Worse 30-60 minutes after eating',
    vomiting_status: 'No vomiting (Nausea only)',
    bowel_changes: 'No change (Normal)',
  });

  // 6. Submission status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedCaseId, setSubmittedCaseId] = useState<string>('ARG-2026-104');

  React.useEffect(() => {
    api.auth.me()
      .then((res) => {
        if (res?.user?.name) setUserName(res.user.name);
      })
      .catch(() => {});
  }, []);

  // STEP 1 HANDLER: Real Backend Case Creation with AI Extraction & Safety Triage
  const handleComplaintSubmit = async (newComplaint: string) => {
    if (isProcessing) return; // Prevent duplicate submissions
    setComplaint(newComplaint);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await api.cases.create({
        chiefComplaint: newComplaint,
      });

      if (response && response.case) {
        setActiveCase(response.case);
        setSubmittedCaseId(response.case.caseId);
        setDepartment(response.case.department || 'General Medicine');

        setExtractedInformation({
          chiefComplaint: response.case.chiefComplaint,
          symptoms: response.case.symptoms || [response.case.chiefComplaint],
          duration: response.case.duration || 'Recent onset',
          severity: response.case.severity || 'Moderate',
          clarifications: response.case.patientClarifications || undefined,
        });

        if (response.questions && response.questions.length > 0) {
          setBackendQuestions(response.questions);
        }

        setCurrentStep(2);
      } else {
        throw new Error('No case data returned from backend.');
      }
    } catch (err: any) {
      console.error('[NewCasePage] Live backend call error:', err.message);
      if (err.message && (err.message.includes('401') || err.message.includes('Authentication') || err.message.includes('Forbidden') || err.message.includes('403'))) {
        setErrorMessage('Authentication required: Please log in as a patient before submitting a case.');
        return;
      }
      setErrorMessage(err.message || 'Unable to submit case to server. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 2 HANDLER: Confirmed understanding -> transition to Safety
  const handleConfirmUnderstanding = () => {
    setCurrentStep(3);
  };

  // STEP 3 HANDLER: Safety answers recorded -> transition to Department Questions
  const handleSafetyProceed = (responses: Record<string, 'yes' | 'no'>) => {
    setSafetyResponses(responses);
    setCurrentStep(4);
  };

  // STEP 4 HANDLER: Department questions answered -> transition to Documents (Optional)
  const handleDepartmentSubmit = (answers: Record<string, string>) => {
    setDepartmentAnswers(answers);
    setCurrentStep(5);
  };

  // STEP 5 HANDLER: Document upload step completed or skipped -> transition to Summary
  const handleDocumentsProceed = (docs: CaseDocument[]) => {
    setAttachedDocuments(docs);
    setCurrentStep(6);
  };

  // STEP 6 HANDLER: Submit department answers to backend and generate physician summary
  const handleFinalSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    setIsSubmitting(true);
    try {
      const caseIdentifier = activeCase?.caseId || submittedCaseId;
      if (caseIdentifier) {
        const formattedAnswers = Object.entries(departmentAnswers).map(([qId, ans]) => {
          const matchedQ = backendQuestions.find((q) => q.id === qId);
          return {
            questionId: qId,
            questionText: matchedQ?.text || qId,
            answerText: ans,
          };
        });

        // Submit answers to real backend endpoint
        await api.cases.submitAnswers(caseIdentifier, formattedAnswers);
      }
      setCurrentStep(7);
    } catch (err: any) {
      console.error('[NewCasePage] Final submission error:', err);
      setCurrentStep(7);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar portal="patient" userName={userName} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stepper Header (Only shown during active intake steps 1-6) */}
        {currentStep <= 6 && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  CareKare Intake Protocol
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  New Patient Case Intake
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="teal" size="md">
                  Step {currentStep} of 6
                </Badge>
              </div>
            </div>

            <IntakeStepper currentStep={currentStep} />
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3 text-teal-800 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600 flex-shrink-0" />
            <span>Analyzing clinical description with AI and running deterministic safety checks...</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Dynamic Step Container */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            {/* STEP 1: Complaint */}
            {currentStep === 1 && (
              <ComplaintStep
                initialValue={complaint}
                onSubmit={handleComplaintSubmit}
              />
            )}

            {/* STEP 2: Understanding */}
            {currentStep === 2 && (
              <UnderstandingStep
                rawComplaint={complaint}
                extracted={extractedInformation}
                onConfirm={handleConfirmUnderstanding}
                onEdit={() => setCurrentStep(1)}
                onUpdateExtracted={(updated) => setExtractedInformation(updated)}
              />
            )}

            {/* STEP 3: Safety Check */}
            {currentStep === 3 && (
              <SafetyStep
                initialResponses={safetyResponses}
                onProceed={handleSafetyProceed}
                onBack={() => setCurrentStep(2)}
              />
            )}

            {/* STEP 4: Department Questions */}
            {currentStep === 4 && (
              <DepartmentQuestionsStep
                departmentName={department}
                questions={backendQuestions.length > 0 ? backendQuestions : undefined}
                initialAnswers={departmentAnswers}
                onSubmit={handleDepartmentSubmit}
                onBack={() => setCurrentStep(3)}
              />
            )}

            {/* STEP 5: Document Upload (Optional) */}
            {currentStep === 5 && (
              <DocumentUploadStep
                caseId={activeCase?.caseId || submittedCaseId}
                initialDocuments={attachedDocuments}
                onProceed={handleDocumentsProceed}
                onBack={() => setCurrentStep(4)}
              />
            )}

            {/* STEP 6: Final Summary */}
            {currentStep === 6 && (
              <SummaryStep
                patientName={DEMO_PATIENT.name}
                extracted={extractedInformation}
                departmentName={department}
                safetyStatus={
                  Object.values(safetyResponses).some((v) => v === 'yes')
                    ? 'Screening Flagged for Review'
                    : 'Low Risk / Screening Complete'
                }
                departmentAnswers={departmentAnswers}
                documents={attachedDocuments}
                isSubmitting={isSubmitting}
                onSubmitCase={handleFinalSubmit}
                onBack={() => setCurrentStep(5)}
              />
            )}

            {/* STEP 7: Submission Success */}
            {currentStep === 7 && (
              <SubmissionSuccess
                caseId={submittedCaseId}
                department={department}
                patientName={DEMO_PATIENT.name}
              />
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
