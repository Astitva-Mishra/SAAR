'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Info,
  FileCheck,
} from 'lucide-react';
import { CaseDocument } from '@/types';
import { api } from '@/lib/api';

interface DocumentUploadStepProps {
  caseId: string;
  initialDocuments?: CaseDocument[];
  onProceed: (docs: CaseDocument[]) => void;
  onBack: () => void;
}

export const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_DOCUMENTS = 5;

export function DocumentUploadStep({
  caseId,
  initialDocuments = [],
  onProceed,
  onBack,
}: DocumentUploadStepProps) {
  const [documents, setDocuments] = useState<CaseDocument[]>(initialDocuments);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelection = async (file: File) => {
    setErrorMessage(null);

    // 1. File Count Check
    if (documents.length >= MAX_DOCUMENTS) {
      setErrorMessage(`Maximum limit of ${MAX_DOCUMENTS} documents reached.`);
      return;
    }

    // 2. Extension Check
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage(
        `Unsupported file type "${file.name}". Supported formats: PDF, PNG, JPG, JPEG, WEBP.`
      );
      return;
    }

    // 3. Size Check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File "${file.name}" (${formatFileSize(file.size)}) exceeds the maximum 10 MB limit.`
      );
      return;
    }

    // 4. Upload & Extract via Backend
    setIsUploading(true);

    try {
      const response = await api.cases.uploadDocument(caseId, file);
      if (response && response.document) {
        setDocuments((prev) => [...prev, response.document]);
      }
    } catch (err: any) {
      console.error('[DocumentUpload] Error:', err.message);
      setErrorMessage(
        err.message || 'Unable to upload and process document. You can continue without it.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await api.cases.deleteDocument(caseId, docId);
      setDocuments((prev) => prev.filter((d) => d.documentId !== docId));
    } catch (err: any) {
      console.error('[DocumentDelete] Error:', err.message);
      // Still remove locally if already absent on server
      setDocuments((prev) => prev.filter((d) => d.documentId !== docId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2 text-teal-700 font-semibold text-xs uppercase tracking-wider">
          <UploadCloud className="w-4 h-4" />
          <span>Step 5: Supporting Records (Optional)</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Upload Medical Documents
        </h2>
        <p className="text-sm text-slate-600">
          Upload prescriptions, reports, or previous medical records to help the provider understand your case.
        </p>
      </div>

      {/* Upload Drop Zone Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-teal-500 bg-teal-50/60 ring-4 ring-teal-100'
            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-400'
        }`}
        role="button"
        tabIndex={0}
        aria-label="Upload medical documents file drop zone"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={isUploading || documents.length >= MAX_DOCUMENTS}
          id="medical-document-input"
        />

        <div className="flex flex-col items-center space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              isUploading
                ? 'bg-teal-100 text-teal-700'
                : 'bg-white text-teal-600 shadow-sm border border-slate-200'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <p className="text-base font-semibold text-slate-800">
              {isUploading ? (
                'Extracting text & clinical findings...'
              ) : (
                <>
                  <span className="text-teal-700 underline underline-offset-2">
                    Click to select
                  </span>{' '}
                  or drag and drop
                </>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supported: PDF, PNG, JPG, JPEG, WEBP (up to 10 MB per file, max {MAX_DOCUMENTS} files)
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-rose-900">Upload Issue</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Clinical Provenance Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Safe Intake Protocol:</strong> Information extracted from documents is categorized
          strictly as previous documented records. Uploaded documents do not constitute an active diagnosis
          and are provided solely for provider reference.
        </span>
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Attached Documents ({documents.length}/{MAX_DOCUMENTS})
            </h3>
          </div>

          <div className="space-y-2.5">
            {documents.map((doc) => {
              const isPdf = doc.mimeType === 'application/pdf';
              const isExtracted = doc.extractionStatus === 'EXTRACTED';

              return (
                <div
                  key={doc.documentId}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center flex-shrink-0">
                        {isPdf ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <ImageIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {doc.originalName || doc.filename}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(doc.size)} • {doc.mimeType}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isExtracted ? (
                        <Badge variant="emerald" size="sm" className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Extracted
                        </Badge>
                      ) : (
                        <Badge variant="rose" size="sm" className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Unreadable
                        </Badge>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(doc.documentId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        aria-label={`Remove document ${doc.originalName || doc.filename}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Document Summary Preview if extracted */}
                  {isExtracted && doc.extractedSummary && (
                    <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-100 text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-semibold text-slate-800">
                          {doc.extractedSummary.documentType || 'Clinical Record'}
                        </span>
                      </div>

                      {doc.extractedSummary.previousDiagnoses &&
                        doc.extractedSummary.previousDiagnoses.length > 0 && (
                          <div>
                            <span className="text-slate-500 font-medium">Previous Diagnoses: </span>
                            <span className="text-slate-800">
                              {doc.extractedSummary.previousDiagnoses.join(', ')}
                            </span>
                          </div>
                        )}

                      {doc.extractedSummary.medications &&
                        doc.extractedSummary.medications.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-slate-500 font-medium">Meds: </span>
                            {doc.extractedSummary.medications.map((m, i) => (
                              <span
                                key={i}
                                className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[11px] text-slate-700"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        )}

                      {doc.extractedSummary.labValues &&
                        doc.extractedSummary.labValues.length > 0 && (
                          <div>
                            <span className="text-slate-500 font-medium">Lab Values: </span>
                            <span className="text-slate-800 font-mono text-[11px]">
                              {doc.extractedSummary.labValues.join(' | ')}
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Error if failed */}
                  {!isExtracted && doc.errorMessage && (
                    <p className="text-xs text-rose-600 italic">{doc.errorMessage}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Questions
        </Button>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => onProceed(documents)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
        >
          <span>{documents.length > 0 ? 'Continue to Summary' : 'Skip & Continue to Summary'}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
