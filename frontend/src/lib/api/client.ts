/**
 * Centralized API client for CareKare Frontend
 * All backend HTTP communication routes through this module.
 */

import {
  User,
  PatientCase,
  CaseDocument,
  CreateCaseResponse,
  CasesListResponse,
  CaseDetailResponse,
  DepartmentQuestionAnswer,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface HealthCheckResponse {
  success: boolean;
  message?: string;
  service?: string;
  database?: string;
}

/**
 * Generic fetch wrapper handling JSON parsing, headers, credentials, and errors.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    credentials: 'include', // Automatically passes HTTP-only saar_token cookie
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`[CareKare API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

/**
 * Health check endpoint - calls GET /api/health
 */
export async function checkBackendHealth(): Promise<HealthCheckResponse> {
  return request<HealthCheckResponse>('/api/health');
}

/**
 * CareKare API Client
 * Cleanly categorized into health, auth, and cases modules
 */
export const api = {
  health: checkBackendHealth,

  auth: {
    login: (credentials: { identifier?: string; emailOrMobile?: string; password?: string }) =>
      request<{ success: boolean; message: string; user: User; token?: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData: {
      name: string;
      emailOrMobile?: string;
      email?: string;
      phone?: string;
      aadhaar?: string;
      password?: string;
      role?: string;
      specialty?: string;
      // Provider metadata
      qualification?: string;
      registrationNumber?: string;
      experienceYears?: number;
      hospitalOrClinic?: string;
      city?: string;
      languages?: string[] | string;
      bio?: string;
      // Patient metadata
      age?: number;
      gender?: string;
      height?: number;
      weight?: number;
      bloodGroup?: string;
      preferredLanguage?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      abhaPlaceholder?: string;
    }) =>
      request<{ success: boolean; message: string; user: User; token?: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    me: () =>
      request<{ success: boolean; user: User }>('/api/auth/me'),
    updateProfile: (profileData: Record<string, any>) =>
      request<{ success: boolean; message: string; user: User }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      }),
    logout: () =>
      request<{ success: boolean; message: string }>('/api/auth/logout', {
        method: 'POST',
      }),
  },

  cases: {
    create: (data: {
      chiefComplaint: string;
      patientClarifications?: string;
      age?: number;
      gender?: string;
    }) =>
      request<CreateCaseResponse>('/api/cases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (params?: { status?: string; riskLevel?: string; search?: string }) => {
      const queryParts: string[] = [];
      if (params?.status && params.status !== 'ALL') queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params?.riskLevel && params.riskLevel !== 'ALL') queryParts.push(`riskLevel=${encodeURIComponent(params.riskLevel)}`);
      if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      return request<CasesListResponse>(`/api/cases${qs}`);
    },
    get: (id: string) =>
      request<CaseDetailResponse>(`/api/cases/${id}`),
    submitAnswers: (id: string, answers: DepartmentQuestionAnswer[]) =>
      request<CaseDetailResponse>(`/api/cases/${id}/answers`, {
        method: 'PATCH',
        body: JSON.stringify({ answers }),
      }),
    updateStatus: (id: string, status: 'IN_REVIEW' | 'COMPLETED') =>
      request<{ success: boolean; message: string; case: PatientCase }>(`/api/cases/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    updateNotes: (id: string, clinicalNotes: string) =>
      request<{ success: boolean; message: string; case: PatientCase }>(`/api/cases/${id}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ clinicalNotes }),
      }),
    completeCase: (id: string, clinicalNotes?: string) =>
      request<{ success: boolean; message: string; case: PatientCase }>(`/api/cases/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ clinicalNotes }),
      }),
    uploadDocument: async (caseId: string, file: File) => {
      const url = `${API_BASE_URL}/api/cases/${caseId}/documents`;
      const formData = new FormData();
      formData.append('file', file);

      // Do NOT set Content-Type header - browser sets boundary automatically
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `Document upload failed with status ${res.status}`);
      }

      return await res.json() as {
        success: boolean;
        message: string;
        document: CaseDocument;
        case: PatientCase;
      };
    },
    getDocuments: (caseId: string) =>
      request<{ success: boolean; count: number; documents: CaseDocument[] }>(`/api/cases/${caseId}/documents`),
    deleteDocument: (caseId: string, docId: string) =>
      request<{ success: boolean; message: string; documents: CaseDocument[] }>(`/api/cases/${caseId}/documents/${docId}`, {
        method: 'DELETE',
      }),
  },
};

export default api;
